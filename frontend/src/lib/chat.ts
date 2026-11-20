export interface Message {
	id: string;
	text: string;
	sender: "user" | "hr";
	timestamp: Date;
	attachment?: { name: string; size: number };
}

export function fileSize(bytes: number) {
	return bytes < 1024 * 1024
		? `${Math.max(1, Math.round(bytes / 1024))} KB`
		: `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
