import type { Message } from "./chat";

export const MAX_SHARE_URL_LENGTH = 8_000;
export const MAX_SHARE_BYTES = 64 * 1024;
export const MAX_SHARE_MESSAGES = 100;
export const MAX_SHARE_MESSAGE_LENGTH = 16_000;
export const SHARED_UPLOAD_TEXT = "CV uploaded";
const PREFIX = "#v1.";

interface SharedMessage {
	sender: "user" | "hr";
	text: string;
	timestamp: number;
}

export interface SharedChat {
	version: 1;
	messages: SharedMessage[];
}

const errors = {
	invalid:
		"This share link is incomplete or damaged. Ask the sender for a new link.",
	large:
		"This chat is too large for a share link. Try sharing a shorter conversation.",
	version: "This share link uses a format this version of the app cannot open.",
	browser:
		"This browser cannot open or create compressed chat links. Try a current version of Chrome, Firefox, Edge, or Safari.",
};

export class ChatShareError extends Error {
	constructor(public readonly code: keyof typeof errors) {
		super(errors[code]);
		this.name = "ChatShareError";
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateChat(value: unknown): SharedChat {
	if (!isRecord(value)) throw new ChatShareError("invalid");
	if (value.version !== 1) throw new ChatShareError("version");
	if (
		Object.keys(value).length !== 2 ||
		!Array.isArray(value.messages) ||
		value.messages.length === 0
	) {
		throw new ChatShareError("invalid");
	}
	if (value.messages.length > MAX_SHARE_MESSAGES) {
		throw new ChatShareError("large");
	}
	for (const message of value.messages) {
		if (
			!isRecord(message) ||
			Object.keys(message).length !== 3 ||
			(message.sender !== "user" && message.sender !== "hr") ||
			typeof message.text !== "string" ||
			message.text.length === 0 ||
			(message.sender === "user" && message.text !== SHARED_UPLOAD_TEXT) ||
			typeof message.timestamp !== "number" ||
			!Number.isSafeInteger(message.timestamp) ||
			Math.abs(message.timestamp) > 8_640_000_000_000_000
		) {
			throw new ChatShareError("invalid");
		}
		if (message.text.length > MAX_SHARE_MESSAGE_LENGTH) {
			throw new ChatShareError("large");
		}
	}
	return value as unknown as SharedChat;
}

export function createSharedChat(messages: readonly Message[]): SharedChat {
	// Copy an explicit allowlist. Upload messages contain the original filename.
	return validateChat({
		version: 1,
		messages: messages.map((message) => ({
			sender: message.sender,
			text:
				message.sender === "user" || message.attachment
					? SHARED_UPLOAD_TEXT
					: message.text,
			timestamp: message.timestamp.getTime(),
		})),
	});
}

export function sharedMessages(chat: SharedChat): Message[] {
	return chat.messages.map((message, index) => ({
		...message,
		id: `shared-${index}`,
		timestamp: new Date(message.timestamp),
	}));
}

function base64url(bytes: Uint8Array) {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

async function readBounded(
	stream: ReadableStream<Uint8Array>,
	limit: number,
): Promise<Uint8Array> {
	const reader = stream.getReader();
	const chunks: Uint8Array[] = [];
	let length = 0;
	let complete = false;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				complete = true;
				break;
			}
			length += value.byteLength;
			if (length > limit) throw new ChatShareError("large");
			chunks.push(value);
		}
	} finally {
		if (!complete) await reader.cancel().catch(() => {});
		reader.releaseLock();
	}
	const bytes = new Uint8Array(length);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return bytes;
}

export async function createShareUrl(chat: SharedChat, origin: string) {
	if (typeof CompressionStream === "undefined") {
		throw new ChatShareError("browser");
	}
	const json = JSON.stringify(validateChat(chat));
	const input = new Blob([json]);
	if (input.size > MAX_SHARE_BYTES) throw new ChatShareError("large");
	const compressed = await readBounded(
		input.stream().pipeThrough(new CompressionStream("gzip")),
		MAX_SHARE_BYTES,
	);
	const url = new URL("/share", origin);
	url.hash = `${PREFIX.slice(1)}${base64url(compressed)}`;
	if (url.href.length > MAX_SHARE_URL_LENGTH) {
		throw new ChatShareError("large");
	}
	return url.href;
}

export async function readSharedChat(fragment: string): Promise<SharedChat> {
	if (!fragment) throw new ChatShareError("invalid");
	if (fragment.length > MAX_SHARE_URL_LENGTH) throw new ChatShareError("large");
	if (!fragment.startsWith(PREFIX)) {
		throw new ChatShareError(/^#v\d+\./.test(fragment) ? "version" : "invalid");
	}
	if (typeof DecompressionStream === "undefined") {
		throw new ChatShareError("browser");
	}
	try {
		const encoded = fragment.slice(PREFIX.length);
		if (!/^[A-Za-z0-9_-]+$/.test(encoded) || encoded.length % 4 === 1) {
			throw new ChatShareError("invalid");
		}
		const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
		const compressed = Uint8Array.from(binary, (char) => char.charCodeAt(0));
		if (base64url(compressed) !== encoded) throw new ChatShareError("invalid");
		const bytes = await readBounded(
			new Blob([compressed.buffer])
				.stream()
				.pipeThrough(new DecompressionStream("gzip")),
			MAX_SHARE_BYTES,
		);
		const json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
		return validateChat(JSON.parse(json));
	} catch (error) {
		if (error instanceof ChatShareError) throw error;
		throw new ChatShareError("invalid");
	}
}
