import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MessageBubble } from "../src/components/MessageBubble";
import {
	createSharedChat,
	createShareUrl,
	MAX_SHARE_BYTES,
	MAX_SHARE_MESSAGES,
	MAX_SHARE_URL_LENGTH,
	readSharedChat,
	sharedMessages,
} from "../src/lib/chatShare";

const timestamp = new Date("2026-10-26T12:34:00Z");
function messages() {
	return [
		{ id: "welcome", sender: "hr", text: "Welcome to Acme.", timestamp },
		{
			id: "upload",
			sender: "user",
			text: "PRIVATE_Jane_Doe_CV.pdf",
			timestamp,
			attachment: { name: "PRIVATE_Jane_Doe_CV.pdf", size: 123456 },
			extractedText: "PRIVATE full CV contents",
			file: new Blob(["PRIVATE PDF bytes"]),
		},
		{
			id: "roast",
			sender: "hr",
			text: "Educación, ambition, and résumé gymnastics 😂\n\nsorry, not hired",
			timestamp: new Date(timestamp.getTime() + 60_000),
		},
	];
}

async function fragmentFor(json) {
	const input = new Blob([typeof json === "string" ? json : JSON.stringify(json)]);
	const buffer = await new Response(
		input.stream().pipeThrough(new CompressionStream("gzip")),
	).arrayBuffer();
	return `#v1.${Buffer.from(buffer).toString("base64url")}`;
}

describe("chat sharing", () => {
	test("round-trips Unicode, paragraphs, senders, ordering, and timestamps", async () => {
		const snapshot = createSharedChat(messages());
		const link = new URL(await createShareUrl(snapshot, "https://example.com"));
		expect(link.pathname).toBe("/share");
		expect(link.search).toBe("");
		expect(link.hash).toMatch(/^#v1\.[A-Za-z0-9_-]+$/);
		expect(link.href.length).toBeLessThanOrEqual(MAX_SHARE_URL_LENGTH);
		expect(await readSharedChat(link.hash)).toEqual(snapshot);
		expect(sharedMessages(await readSharedChat(link.hash))[2].timestamp).toEqual(
			messages()[2].timestamp,
		);
	});

	test("copies only allowed fields and replaces uploaded filenames", async () => {
		const source = messages();
		const snapshot = createSharedChat(source);
		source[1].text = "CHANGED.pdf";
		const link = new URL(await createShareUrl(snapshot, "https://example.com"));
		const restored = await readSharedChat(link.hash);
		expect(restored.messages[1]).toEqual({
			sender: "user",
			text: "CV uploaded",
			timestamp: timestamp.getTime(),
		});
		expect(JSON.stringify(restored)).not.toContain("PRIVATE");
		expect(JSON.stringify(restored)).not.toContain("attachment");
		expect(JSON.stringify(restored)).not.toContain("extractedText");
		expect(JSON.stringify(restored)).not.toContain("CHANGED");
	});

	test("keeps the roast as plain text, including quoted CV details", async () => {
		const source = messages();
		source[2].text = '<img src=x onerror="alert(1)"> Your claim: “10 years.”';
		const link = new URL(await createShareUrl(createSharedChat(source), "https://example.com"));
		const restored = sharedMessages(await readSharedChat(link.hash));
		const markup = renderToStaticMarkup(createElement(MessageBubble, { message: restored[2] }));
		expect(restored[2].text).toBe(source[2].text);
		expect(markup).toContain("&lt;img");
		expect(markup).not.toContain("<img");
		expect(markup).not.toContain("<script");
	});

	test("rejects empty, invalid, and unsupported fragments", async () => {
		for (const fragment of ["", "#hello", "#v1.", "#v1.%20", "#v1.A", "#v1.!!!!"]) {
			await expect(readSharedChat(fragment)).rejects.toMatchObject({ code: "invalid" });
		}
		await expect(readSharedChat("#v2.AAAA")).rejects.toMatchObject({ code: "version" });
	});

	test("rejects malformed gzip, truncated data, and invalid JSON", async () => {
		await expect(readSharedChat("#v1.aGVsbG8")).rejects.toMatchObject({ code: "invalid" });
		const valid = await fragmentFor(createSharedChat(messages()));
		await expect(readSharedChat(valid.slice(0, -8))).rejects.toMatchObject({ code: "invalid" });
		await expect(readSharedChat(await fragmentFor("not JSON"))).rejects.toMatchObject({ code: "invalid" });
	});

	test("validates externally supplied message shapes and versions", async () => {
		const good = createSharedChat(messages());
		const invalid = [
			null,
			{ version: 1, messages: [] },
			{ ...good, attachment: "PRIVATE.pdf" },
			{ version: 1, messages: [{ ...good.messages[0], sender: "admin" }] },
			{ version: 1, messages: [{ ...good.messages[0], timestamp: "yesterday" }] },
			{ version: 1, messages: [{ ...good.messages[0], timestamp: 9e15 }] },
			{ version: 1, messages: [{ ...good.messages[0], text: "" }] },
			{ version: 1, messages: [{ ...good.messages[0], attachment: { name: "PRIVATE.pdf" } }] },
			{ version: 1, messages: [{ ...good.messages[1], text: "PRIVATE.pdf" }] },
		];
		for (const snapshot of invalid) {
			await expect(readSharedChat(await fragmentFor(snapshot))).rejects.toMatchObject({ code: "invalid" });
		}
		await expect(readSharedChat(await fragmentFor({ ...good, version: 2 })))
			.rejects.toMatchObject({ code: "version" });
	});

	test("bounds message count and individual text before encoding", () => {
		const source = messages();
		expect(() => createSharedChat(Array(MAX_SHARE_MESSAGES + 1).fill(source[0])))
			.toThrow("too large");
		expect(() => createSharedChat([{ ...source[0], text: "x".repeat(16_001) }]))
			.toThrow("too large");
	});

	test("bounds uncompressed UTF-8 bytes before encoding", async () => {
		const snapshot = createSharedChat(Array(5).fill({ ...messages()[0], text: "é".repeat(8_000) }));
		await expect(createShareUrl(snapshot, "https://example.com"))
			.rejects.toMatchObject({ code: "large" });
	});

	test("stops decompression of a small payload that expands past the limit", async () => {
		const bomb = await fragmentFor("x".repeat(MAX_SHARE_BYTES * 8));
		expect(bomb.length).toBeLessThan(MAX_SHARE_URL_LENGTH);
		await expect(readSharedChat(bomb)).rejects.toMatchObject({ code: "large" });
	});

	test("rejects oversized incoming links and incompressible outgoing chats", async () => {
		await expect(readSharedChat(`#v1.${"A".repeat(MAX_SHARE_URL_LENGTH)}`))
			.rejects.toMatchObject({ code: "large" });
		let seed = 42;
		const text = Array.from({ length: 12_000 }, () => {
			seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
			return String.fromCharCode(33 + (seed >>> 16) % 90);
		}).join("");
		const snapshot = createSharedChat([{ ...messages()[0], text }]);
		await expect(createShareUrl(snapshot, "https://example.com"))
			.rejects.toMatchObject({ code: "large" });
	});
});
