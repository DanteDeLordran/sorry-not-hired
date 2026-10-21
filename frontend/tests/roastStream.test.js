import { describe, expect, test } from "bun:test";
import { readRoastStream } from "../src/lib/roastStream";

function responseFrom(text, chunkSize = 1) {
	const bytes = new TextEncoder().encode(text);
	let offset = 0;
	return new Response(new ReadableStream({
		pull(controller) {
			if (offset === bytes.length) return controller.close();
			controller.enqueue(bytes.slice(offset, offset + chunkSize));
			offset = Math.min(offset + chunkSize, bytes.length);
		},
	}));
}

async function collect(response) {
	const events = [];
	for await (const event of readRoastStream(response)) events.push(event);
	return events;
}

describe("roast stream", () => {
	test("decodes split UTF-8, CRLF, comments, and multiple frames", async () => {
		const events = await collect(responseFrom(
			': heartbeat\r\n\r\ndata: {"type":"delta","text":"Educación 😂"}\r\n\r\ndata: {"type":"done"}\r\n\r\n',
		));
		expect(events).toEqual([{ type: "delta", text: "Educación 😂" }, { type: "done" }]);
	});

	test("preserves partial output before a provider error", async () => {
		const events = await collect(responseFrom(
			'data: {"type":"delta","text":"Partial"}\n\ndata: {"type":"error","status":504,"message":"Timeout"}\n\n', 128,
		));
		expect(events[0].text).toBe("Partial");
		expect(events[1].status).toBe(504);
	});

	test("rejects truncated streams rather than treating them as success", async () => {
		await expect(collect(responseFrom('data: {"type":"delta","text":"Partial"}\n\n')))
			.rejects.toThrow("before completion");
	});

	test("bounds incomplete event buffering", async () => {
		await expect(collect(responseFrom("data: " + "x".repeat(65536), 8192)))
			.rejects.toThrow("too large");
	});

	test("cancels the reader when its consumer stops", async () => {
		let cancelled = false;
		const response = new Response(new ReadableStream({
			start(controller) {
				controller.enqueue(new TextEncoder().encode('data: {"type":"delta","text":"hello"}\n\n'));
			},
			cancel() { cancelled = true; },
		}));
		for await (const event of readRoastStream(response)) {
			expect(event.type).toBe("delta");
			break;
		}
		expect(cancelled).toBe(true);
	});
});
