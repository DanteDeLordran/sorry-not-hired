import type { Message } from "./chat";

// The backend ends every finished roast with exactly this line.
export const VERDICT = "sorry, not hired";

export function splitVerdict(text: string) {
	const trimmed = text.trimEnd();
	if (!trimmed.endsWith(VERDICT)) return { body: text, verdict: false };
	return {
		body: trimmed.slice(0, -VERDICT.length).trimEnd(),
		verdict: true,
	};
}

export function paragraphs(text: string) {
	return text
		.split(/\n\s*\n/)
		.map((part) => part.trim())
		.filter(Boolean);
}

// Derived from the timestamp so a shared letter keeps the same reference.
export function referenceNumber(timestamp: Date) {
	const digits = Math.abs(timestamp.getTime()) % 1_000_000;
	return `SNH-${String(digits).padStart(6, "0")}`;
}

export function letterDate(timestamp: Date) {
	return timestamp.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export function stampDate(timestamp: Date) {
	return timestamp
		.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		})
		.toUpperCase();
}

// Karen's replies to uploads. A greeting before the first upload is not a letter.
export function letterReplies(messages: readonly Message[]) {
	const firstUpload = messages.findIndex(
		(message) => message.sender === "user",
	);
	if (firstUpload === -1) return [];
	return messages
		.slice(firstUpload)
		.filter((message) => message.sender === "hr");
}
