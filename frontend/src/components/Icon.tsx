type IconName =
	| "arrow"
	| "upload"
	| "file"
	| "close"
	| "reset"
	| "check"
	| "spark"
	| "share"
	| "plus";

const paths: Record<IconName, string> = {
	arrow: "M5 12h14m-6-6 6 6-6 6",
	upload: "M12 16V4m-5 5 5-5 5 5M4 16v4h16v-4",
	file: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Zm0 0v5h5M9 12h6m-6 4h4",
	close: "m6 6 12 12M6 18 18 6",
	reset: "M3 10a9 9 0 1 1 2 8M3 4v6h6",
	check: "m4 12 5 5L20 6",
	spark: "M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7",
	share:
		"M10 13a5 5 0 0 0 7 .1l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7M14 11a5 5 0 0 0-7-.1l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7",
	plus: "M12 5v14M5 12h14",
};

export function Icon({
	name,
	className = "",
}: {
	name: IconName;
	className?: string;
}) {
	return (
		<svg
			className={className}
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.7"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d={paths[name]} />
		</svg>
	);
}
