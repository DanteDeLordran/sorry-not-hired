import {
	letterDate,
	paragraphs,
	referenceNumber,
	splitVerdict,
	stampDate,
} from "../lib/letter";

export type LetterState = "reading" | "typing" | "done";

export function Letter({
	text,
	timestamp,
	state = "done",
	showReference = true,
	compact = false,
}: {
	text: string;
	timestamp: Date;
	state?: LetterState;
	showReference?: boolean;
	compact?: boolean;
}) {
	const { body, verdict } = splitVerdict(text);
	const parts = paragraphs(body);
	const writing = state !== "done";
	const stamped = verdict && !writing;
	const caret = <span className="caret" aria-hidden="true" />;
	const className = ["letter", compact && "is-compact", stamped && "is-stamped"]
		.filter(Boolean)
		.join(" ");

	return (
		<article
			className={className}
			aria-label="Letter from Karen, Acme Corp. Human Resources"
			aria-busy={writing}
		>
			<header className="letterhead">
				<span className="letterhead-name">ACME CORP.</span>
				<span className="letterhead-address">
					Office of Human Resources
					<br />1 Acme Plaza, Floor 88
				</span>
			</header>
			<p className="letter-meta">
				<time dateTime={timestamp.toISOString()}>{letterDate(timestamp)}</time>
				{showReference && (
					<span>
						Re: Your application, ref.{" "}
						<span className="nowrap">{referenceNumber(timestamp)}</span>
					</span>
				)}
			</p>
			<div className="letter-body">
				<p>Dear Applicant,</p>
				{parts.map((part, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Paragraphs only grow at the end and never reorder.
					<p key={index}>
						{part}
						{writing && index === parts.length - 1 && caret}
					</p>
				))}
				{writing && parts.length === 0 && <p>{caret}</p>}
			</div>
			{!writing && (
				<footer className="letter-signoff">
					<span className="signature" aria-hidden="true">
						Karen
					</span>
					<p className="signatory">
						Karen M.
						<br />
						Head of Human Resources
					</p>
					{verdict && <p className="enclosure">Encl. 1 CV, returned</p>}
				</footer>
			)}
			{stamped && (
				<div
					className="stamp"
					role="img"
					aria-label="Stamped: sorry, not hired"
				>
					<span className="stamp-line">Acme Corp. · H.R.</span>
					<span className="stamp-verdict">Sorry, not hired</span>
					<span className="stamp-line">{stampDate(timestamp)}</span>
				</div>
			)}
		</article>
	);
}
