export type RoastEvent =
	| { type: "delta"; text: string }
	| { type: "done" }
	| { type: "error"; status: number; message: string };

export async function* readRoastStream(
	response: Response,
): AsyncGenerator<RoastEvent> {
	if (!response.body) throw new Error("Missing response stream");
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	try {
		while (true) {
			const { value, done } = await reader.read();
			buffer += decoder.decode(value, { stream: !done });
			buffer = buffer.replace(/\r\n/g, "\n");
			let boundary = buffer.indexOf("\n\n");
			while (boundary !== -1) {
				const frame = buffer.slice(0, boundary);
				buffer = buffer.slice(boundary + 2);
				const data = frame
					.split("\n")
					.filter((line) => line.startsWith("data:"))
					.map((line) => line.slice(5).trimStart())
					.join("\n");
				if (data) {
					const event: RoastEvent = JSON.parse(data);
					if (event.type === "delta" && typeof event.text === "string") {
						yield event;
					} else if (event.type === "done" || event.type === "error") {
						yield event;
						return;
					} else {
						throw new Error("Invalid stream event");
					}
				}
				boundary = buffer.indexOf("\n\n");
			}
			if (buffer.length > 64 * 1024) throw new Error("Stream event too large");
			if (done) throw new Error("Response stream ended before completion");
		}
	} finally {
		try {
			await reader.cancel();
		} finally {
			reader.releaseLock();
		}
	}
}
