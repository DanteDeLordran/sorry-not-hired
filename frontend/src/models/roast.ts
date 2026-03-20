export interface RoastResponse {
	roast: string;
	filename: string;
	severity: "light" | "medium" | "harsh";
	error?: string;
}
