import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Letter } from "../src/components/Letter";
import {
	letterReplies,
	paragraphs,
	referenceNumber,
	splitVerdict,
} from "../src/lib/letter";

const timestamp = new Date("2026-11-19T18:42:07.123Z");

describe("letter helpers", () => {
	test("splits the backend's final verdict line from the body", () => {
		expect(splitVerdict("You listed Word as a skill.\n\nsorry, not hired")).toEqual({
			body: "You listed Word as a skill.",
			verdict: true,
		});
		expect(splitVerdict("Send a PDF, max 5 MB.")).toEqual({
			body: "Send a PDF, max 5 MB.",
			verdict: false,
		});
	});

	test("splits paragraphs on blank lines and keeps single line breaks", () => {
		expect(paragraphs("One.\nStill one.\n\n  \nTwo.\n")).toEqual([
			"One.\nStill one.",
			"Two.",
		]);
		expect(paragraphs("")).toEqual([]);
	});

	test("derives a stable six-digit reference from the timestamp", () => {
		expect(referenceNumber(timestamp)).toBe(referenceNumber(new Date(timestamp)));
		expect(referenceNumber(new Date(1_000_042))).toBe("SNH-000042");
	});

	test("treats only replies after an upload as letters", () => {
		const messages = [
			{ id: "welcome", sender: "hr", text: "Hello", timestamp },
			{ id: "upload", sender: "user", text: "CV uploaded", timestamp },
			{ id: "roast", sender: "hr", text: "Roast\n\nsorry, not hired", timestamp },
		];
		expect(letterReplies(messages).map((message) => message.id)).toEqual(["roast"]);
		expect(letterReplies(messages.slice(0, 1))).toEqual([]);
	});
});

describe("Letter", () => {
	const render = (props) =>
		renderToStaticMarkup(createElement(Letter, { timestamp, ...props }));

	test("stamps a finished roast and drops the verdict from the body", () => {
		const markup = render({ text: "Bold claim.\n\nsorry, not hired" });
		expect(markup).toContain('class="stamp"');
		expect(markup).toContain("Encl. 1 CV, returned");
		expect(markup).not.toContain("sorry, not hired</p>");
	});

	test("holds the stamp and signature while Karen is still typing", () => {
		const markup = render({ text: "Bold claim.\n\nsorry, not hired", state: "typing" });
		expect(markup).not.toContain('class="stamp"');
		expect(markup).not.toContain("Head of Human Resources");
		expect(markup).toContain('class="caret"');
	});

	test("signs error replies without stamping them", () => {
		const markup = render({ text: "Send a shorter PDF, max 5 MB." });
		expect(markup).toContain("Head of Human Resources");
		expect(markup).not.toContain('class="stamp"');
		expect(markup).not.toContain("Encl.");
	});
});
