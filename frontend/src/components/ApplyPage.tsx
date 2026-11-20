import { type FormEvent, useEffect, useRef, useState } from "react";
import { fileSize, type Message } from "../lib/chat";
import {
	ChatShareError,
	createSharedChat,
	type SharedChat,
} from "../lib/chatShare";
import { splitVerdict } from "../lib/letter";
import { readRoastStream } from "../lib/roastStream";
import { Icon } from "./Icon";
import { Letter } from "./Letter";
import { ShareDialog } from "./ShareDialog";
import { Colophon, Masthead, REPO_URL } from "./SiteChrome";

const GREETING =
	"Thank you for your interest in Acme Corp. Yes, THAT Acme Corp.\n\nSend your CV. Let's see what made you think you belong here.";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const BUSY_REPLY =
	"Even my inbox needs a break. Something went wrong — send your CV again in a moment.";
const ERROR_REPLIES: Record<number, string> = {
	400: "That file's not gonna work. Send a PDF, max 5 MB.",
	413: "Even your file is overqualified. Send a shorter PDF, max 5 MB.",
	422: "I couldn't read that as a CV. Try a text-based résumé PDF.",
	429: "Too many CVs, too little patience. Give me a minute and try again.",
	503: "My brain is offline. Try again in a moment.",
	504: "Even I need a coffee break. Try sending that again.",
};

type Status = "idle" | "reading" | "typing";

let nextId = 1;

const scrollBehavior = (): ScrollBehavior =>
	window.matchMedia("(prefers-reduced-motion: reduce)").matches
		? "auto"
		: "smooth";

export function ApplyPage() {
	const [greetingDate] = useState(() => new Date());
	const [upload, setUpload] = useState<Message | null>(null);
	const [reply, setReply] = useState<Message | null>(null);
	const [status, setStatus] = useState<Status>("idle");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [fileError, setFileError] = useState("");
	const [isDragging, setIsDragging] = useState(false);
	const [sharePreview, setSharePreview] = useState<SharedChat | null>(null);
	const [shareError, setShareError] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const pickRef = useRef<HTMLButtonElement>(null);
	const submitRef = useRef<HTMLButtonElement>(null);
	const letterRef = useRef<HTMLElement>(null);
	const requestRef = useRef<AbortController | null>(null);
	const dragDepthRef = useRef(0);
	const busy = status !== "idle";

	useEffect(() => () => requestRef.current?.abort(), []);

	useEffect(() => {
		if (selectedFile) submitRef.current?.focus({ preventScroll: true });
	}, [selectedFile]);

	const openPicker = () => fileInputRef.current?.click();

	const selectFile = (file?: File) => {
		if (!file || requestRef.current) return;
		setFileError("");
		if (!file.name.toLowerCase().endsWith(".pdf")) {
			setSelectedFile(null);
			setFileError("PDFs only. Karen has standards. Allegedly.");
			return;
		}
		if (file.size > MAX_UPLOAD_BYTES) {
			setSelectedFile(null);
			setFileError("Keep it under 5 MB. The ego can stay unlimited.");
			return;
		}
		setSelectedFile(file);
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (requestRef.current) return;
		if (!selectedFile) {
			openPicker();
			return;
		}
		const file = selectedFile;
		const formData = new FormData();
		formData.append("file", file);
		// One timestamp for both sides keeps the letter's reference number stable.
		const timestamp = new Date();
		const replyId = String(nextId++);
		setUpload({
			id: String(nextId++),
			text: file.name,
			sender: "user",
			timestamp,
			attachment: { name: file.name, size: file.size },
		});
		setReply(null);
		setShareError("");
		setFileError("");
		setSelectedFile(null);
		setStatus("reading");
		const controller = new AbortController();
		requestRef.current = controller;
		if (window.matchMedia("(max-width: 900px)").matches) {
			letterRef.current?.scrollIntoView({
				behavior: scrollBehavior(),
				block: "start",
			});
		}

		let text = "";
		let replied = false;
		const updateReply = (next: string) => {
			replied = true;
			setReply({ id: replyId, text: next, sender: "hr", timestamp });
		};
		try {
			const response = await fetch("/api/v1/chat/message", {
				method: "POST",
				headers: { Accept: "text/event-stream" },
				body: formData,
				signal: controller.signal,
			});
			if (!response.ok) {
				updateReply(ERROR_REPLIES[response.status] ?? BUSY_REPLY);
				return;
			}
			for await (const chunk of readRoastStream(response)) {
				if (chunk.type === "error") {
					updateReply(ERROR_REPLIES[chunk.status] ?? BUSY_REPLY);
				} else if (chunk.type === "delta") {
					text += chunk.text;
					setStatus("typing");
					updateReply(text);
				}
			}
			if (!replied) updateReply(BUSY_REPLY);
		} catch {
			if (!controller.signal.aborted) updateReply(BUSY_REPLY);
		} finally {
			requestRef.current = null;
			setStatus("idle");
		}
	};

	const resetApplication = () => {
		if (requestRef.current) return;
		setUpload(null);
		setReply(null);
		setSelectedFile(null);
		setFileError("");
		setShareError("");
		requestAnimationFrame(() => pickRef.current?.focus());
	};

	const hasVerdict =
		!busy && reply !== null && splitVerdict(reply.text).verdict;

	const openShare = () => {
		if (!hasVerdict || !upload || !reply) return;
		try {
			setShareError("");
			setSharePreview(createSharedChat([upload, reply]));
		} catch (error) {
			setShareError(
				error instanceof ChatShareError
					? error.message
					: "Couldn’t prepare this letter for sharing. Try again.",
			);
		}
	};

	const statusText =
		status === "reading"
			? "Karen is reading your CV…"
			: status === "typing"
				? "Karen is typing…"
				: reply
					? "Reply received."
					: "";

	return (
		<div className="page">
			<Masthead>
				<a
					className="external-link"
					href={REPO_URL}
					target="_blank"
					rel="noopener noreferrer"
				>
					<span>
						<span className="wide-only">Source on </span>GitHub
					</span>
					<Icon name="arrow" />
				</a>
			</Masthead>
			<main
				className="desk"
				onDragEnter={(event) => {
					event.preventDefault();
					if (!event.dataTransfer.types.includes("Files") || busy) return;
					dragDepthRef.current += 1;
					setIsDragging(true);
				}}
				onDragOver={(event) => event.preventDefault()}
				onDragLeave={(event) => {
					event.preventDefault();
					dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
					if (!dragDepthRef.current) setIsDragging(false);
				}}
				onDrop={(event) => {
					event.preventDefault();
					dragDepthRef.current = 0;
					setIsDragging(false);
					selectFile(event.dataTransfer.files[0]);
				}}
			>
				<div className="form-column">
					<form
						className="hr-form"
						onSubmit={handleSubmit}
						noValidate
						aria-labelledby="apply-title"
					>
						<p className="form-number">
							Form HR-7 · Application for employment
						</p>
						<h1 id="apply-title">Apply to Acme Corp.</h1>
						<p className="form-lede">
							Upload your CV as a PDF. Karen, head of Human Resources, reads
							every one personally and writes back with a roast built from what
							you wrote.
						</p>
						<div className="field">
							<span className="field-label" id="cv-label">
								Curriculum vitae
							</span>
							{selectedFile ? (
								<div className="file-chip">
									<Icon name="file" />
									<div className="file-chip-text">
										<strong>{selectedFile.name}</strong>
										<span>PDF · {fileSize(selectedFile.size)}</span>
									</div>
									<button
										type="button"
										className="icon-button"
										onClick={() => setSelectedFile(null)}
										aria-label={`Remove ${selectedFile.name}`}
									>
										<Icon name="close" />
									</button>
								</div>
							) : (
								<button
									type="button"
									ref={pickRef}
									className="file-pick"
									onClick={openPicker}
									disabled={busy}
									aria-describedby="cv-hint"
								>
									<Icon name="file" />
									<span>
										<strong>Choose a PDF</strong> or drop it here
									</span>
								</button>
							)}
							<input
								ref={fileInputRef}
								type="file"
								accept=".pdf,application/pdf"
								className="sr-only"
								tabIndex={-1}
								aria-labelledby="cv-label"
								onChange={(event) => {
									selectFile(event.target.files?.[0]);
									event.target.value = "";
								}}
							/>
							{fileError && (
								<p className="notice-error" role="alert">
									{fileError}
								</p>
							)}
						</div>
						<button
							ref={submitRef}
							type="submit"
							className="button-primary"
							disabled={busy}
						>
							{status === "reading"
								? "Karen is reading…"
								: status === "typing"
									? "Karen is writing…"
									: "Submit to Human Resources"}
							{!busy && <Icon name="arrow" />}
						</button>
						<p className="form-fine" id="cv-hint">
							PDF up to 5 MB. Deleted once Karen has read it.
						</p>
						{isDragging && (
							<div className="drop-overlay" aria-hidden="true">
								<Icon name="upload" />
								<strong>Drop it like it’s hot.</strong>
								<span>Karen will take it from here.</span>
							</div>
						)}
					</form>
				</div>
				<section
					className="letter-column"
					ref={letterRef}
					aria-label="Karen's reply"
				>
					<output className="letter-status">{statusText}</output>
					{upload ? (
						<Letter
							text={reply?.text ?? ""}
							timestamp={upload.timestamp}
							state={status === "idle" ? "done" : status}
						/>
					) : (
						<Letter
							text={GREETING}
							timestamp={greetingDate}
							showReference={false}
						/>
					)}
					{upload && !busy && (
						<div className="letter-actions">
							{hasVerdict && (
								<button
									type="button"
									className="button-secondary"
									onClick={openShare}
								>
									<Icon name="share" />
									Share this letter
								</button>
							)}
							<button
								type="button"
								className="button-secondary"
								onClick={resetApplication}
							>
								<Icon name="reset" />
								Apply again
							</button>
						</div>
					)}
					{shareError && (
						<p className="notice-error" role="alert">
							{shareError}
						</p>
					)}
				</section>
			</main>
			<Colophon />
			{sharePreview && (
				<ShareDialog
					chat={sharePreview}
					onClose={() => setSharePreview(null)}
				/>
			)}
		</div>
	);
}
