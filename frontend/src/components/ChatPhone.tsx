import { useEffect, useRef, useState } from "react";
import { fileSize, type Message } from "../lib/chat";
import {
	ChatShareError,
	createSharedChat,
	type SharedChat,
} from "../lib/chatShare";
import { readRoastStream } from "../lib/roastStream";
import { Icon } from "./Icon";
import { MessageBubble } from "./MessageBubble";
import { PhoneClock } from "./PhoneClock";
import { ShareDialog } from "./ShareDialog";

const greeting = (): Message => ({
	id: "welcome",
	text: "I'm Karen, head of HR at Acme Corp. Yes, THAT Acme Corp.\n\nSend your CV. Let's see what made you think you belong here.",
	sender: "hr",
	timestamp: new Date(),
});

let nextId = 1;
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

export function ChatPhone() {
	const [messages, setMessages] = useState<Message[]>(() => [greeting()]);
	const [isTyping, setIsTyping] = useState(false);
	const [isReceiving, setIsReceiving] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [fileError, setFileError] = useState("");
	const [isDragging, setIsDragging] = useState(false);
	const [sharePreview, setSharePreview] = useState<SharedChat | null>(null);
	const [shareError, setShareError] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const chatRef = useRef<HTMLDivElement>(null);
	const phoneRef = useRef<HTMLElement>(null);
	const sendRef = useRef<HTMLButtonElement>(null);
	const requestRef = useRef<AbortController | null>(null);
	const followChatRef = useRef(true);
	const dragDepthRef = useRef(0);

	useEffect(() => () => requestRef.current?.abort(), []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Follow new content unless the reader has scrolled up.
	useEffect(() => {
		const chat = chatRef.current;
		if (chat && followChatRef.current) chat.scrollTop = chat.scrollHeight;
	}, [messages, isTyping]);

	const selectFile = (file?: File) => {
		if (!file || requestRef.current) return;
		phoneRef.current?.scrollIntoView({
			behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
				? "auto"
				: "smooth",
			block: "nearest",
		});
		setFileError("");
		if (!file.name.toLowerCase().endsWith(".pdf")) {
			setSelectedFile(null);
			setFileError("PDFs only. Karen has standards. Allegedly.");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			setSelectedFile(null);
			setFileError("Keep it under 5 MB. The ego can stay unlimited.");
			return;
		}
		setSelectedFile(file);
	};

	useEffect(() => {
		if (selectedFile) sendRef.current?.focus({ preventScroll: true });
	}, [selectedFile]);

	const handleSubmit = async () => {
		if (!selectedFile || isTyping || requestRef.current) return;
		setShareError("");
		const formData = new FormData();
		formData.append("file", selectedFile);
		setMessages((current) => [
			...current,
			{
				id: String(nextId++),
				text: selectedFile.name,
				sender: "user",
				timestamp: new Date(),
				attachment: { name: selectedFile.name, size: selectedFile.size },
			},
		]);
		followChatRef.current = true;
		setIsTyping(true);
		setFileError("");
		setSelectedFile(null);
		const controller = new AbortController();
		requestRef.current = controller;
		const replyId = String(nextId++);
		const timestamp = new Date();
		const updateReply = (text: string) => {
			const reply: Message = { id: replyId, text, sender: "hr", timestamp };
			setMessages((current) =>
				current.some((message) => message.id === replyId)
					? current.map((message) => (message.id === replyId ? reply : message))
					: [...current, reply],
			);
		};
		let text = "";
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
			for await (const event of readRoastStream(response)) {
				if (event.type === "error") {
					updateReply(ERROR_REPLIES[event.status] ?? BUSY_REPLY);
				} else if (event.type === "delta") {
					text += event.text;
					setIsReceiving(true);
					updateReply(text);
				}
			}
		} catch {
			if (!controller.signal.aborted) updateReply(BUSY_REPLY);
		} finally {
			requestRef.current = null;
			setIsTyping(false);
			setIsReceiving(false);
		}
	};

	const resetChat = () => {
		if (requestRef.current) return;
		setMessages([greeting()]);
		setSelectedFile(null);
		setFileError("");
		followChatRef.current = true;
		setShareError("");
	};
	const hasRoast = messages.some(
		(message) =>
			message.sender === "hr" && message.text.endsWith("sorry, not hired"),
	);
	const openShare = () => {
		if (isTyping || !hasRoast) return;
		try {
			setShareError("");
			setSharePreview(createSharedChat(messages));
		} catch (error) {
			setShareError(
				error instanceof ChatShareError
					? error.message
					: "Couldn’t prepare this chat for sharing. Please try again.",
			);
		}
	};

	return (
		<div className="app-shell">
			<header className="site-header">
				<a className="wordmark" href="/" aria-label="Sorry, not hired. Home">
					<img src="/favicon.svg" alt="" width="38" height="38" />
					<span>
						sorry, not hired<span className="brand-period">.</span>
					</span>
				</a>
				<div className="header-note">
					<span className="status-dot" /> Open for rejections
				</div>
				<a
					className="text-link header-link"
					href="https://github.com/DanteDeLordran"
					target="_blank"
					rel="noopener noreferrer"
				>
					Meet the culprit <Icon name="arrow" />
				</a>
			</header>
			<main className="hero">
				<section className="hero-copy" aria-labelledby="hero-title">
					<div className="eyebrow">
						<Icon name="spark" /> Roasting as a service
					</div>
					<h1 id="hero-title">
						Great résumé.
						<br />
						<em>Terrible odds.</em>
					</h1>
					<p className="hero-description">
						Your dream company. Your carefully crafted CV.
						<br className="desktop-break" /> An HR manager with absolutely no
						filter.
					</p>
					<p className="hero-aside">Meet Karen. She’ll take it from here.</p>
					<button
						type="button"
						className="primary-button"
						onClick={() =>
							selectedFile ? handleSubmit() : fileInputRef.current?.click()
						}
						disabled={isTyping}
					>
						{isTyping
							? "Karen is judging…"
							: selectedFile
								? "Send to Karen"
								: "Get my CV roasted"}
						<Icon name="arrow" />
					</button>
					<p className="upload-note">
						One PDF. One brutal reply. Zero job offers.
					</p>
					<ol className="how-it-works" aria-label="How it works">
						<li>
							<span>01</span> Send your CV
						</li>
						<li>
							<span>02</span> Question everything
						</li>
						<li>
							<span>03</span> Don’t get hired
						</li>
					</ol>
					<div className="fine-print">
						<Icon name="spark" />
						<p>
							Even the perfect CV gets roasted.
							<br />
							<strong>Especially the perfect CV.</strong>
						</p>
					</div>
				</section>
				<div className="phone-stage">
					<div className="stage-orbit" aria-hidden="true" />
					<div className="stage-note" aria-hidden="true">
						HR is online.
						<br />
						<em>Empathy is offline.</em>
						<svg viewBox="0 0 80 50" fill="none" aria-hidden="true">
							<path d="M5 6c38-10 60 2 53 31m-8-7 8 9 10-8" />
						</svg>
					</div>
					<section
						className={`phone-frame${isDragging ? " is-dragging" : ""}`}
						aria-label="CV roast simulator"
						ref={phoneRef}
						onDragEnter={(event) => {
							event.preventDefault();
							if (!event.dataTransfer.types.includes("Files") || isTyping)
								return;
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
						<div className="phone-hardware" aria-hidden="true">
							<span />
							<span />
							<span />
						</div>
						<div className="phone-screen">
							<div className="phone-statusbar" aria-hidden="true">
								<PhoneClock />
								<div className="dynamic-island" />
								<div className="phone-status-icons">
									<svg
										width="15"
										height="12"
										viewBox="0 0 18 14"
										fill="currentColor"
										aria-hidden="true"
									>
										<path d="M0 10h3v4H0zm5-3h3v7H5zm5-3h3v10h-3zm5-4h3v14h-3z" />
									</svg>
									<span className="phone-battery" />
								</div>
							</div>
							<div className="chat-header">
								<img
									className="chat-avatar"
									src="/karen.svg"
									alt=""
									width="43"
									height="43"
								/>
								<div className="chat-header-info">
									<h2>Karen from HR</h2>
									<p>
										<span className="status-dot" />{" "}
										{isTyping
											? "Typing something brutal…"
											: "Online. Unfortunately."}
									</p>
								</div>
								{hasRoast && (
									<button
										className="icon-button share-button"
										type="button"
										onClick={openShare}
										disabled={isTyping}
										title="Share chat"
										aria-label="Share chat"
									>
										<Icon name="share" />
									</button>
								)}
								<button
									className="icon-button reset-button"
									type="button"
									onClick={resetChat}
									disabled={isTyping}
									title="Start a new application"
									aria-label="Start a new application"
								>
									<Icon name="reset" />
								</button>
							</div>
							<div
								className="chat-messages"
								role="log"
								aria-label="Conversation with Karen"
								aria-live="polite"
								aria-busy={isTyping}
								ref={chatRef}
								onScroll={() => {
									const chat = chatRef.current;
									if (chat)
										followChatRef.current =
											chat.scrollHeight - chat.scrollTop - chat.clientHeight <
											60;
								}}
							>
								<div className="contact-intro">
									<span className="company-label">ACME CORP.</span>
									<p>
										Your next chapter.
										<br />
										<em>Probably a short one.</em>
									</p>
								</div>
								<div className="date-chip">
									Today · A fresh start. Allegedly.
								</div>
								{messages.map((message) => (
									<MessageBubble key={message.id} message={message} />
								))}
								{isTyping && !isReceiving && (
									<div className="typing-bubble" aria-hidden="true">
										<span />
										<span />
										<span />
									</div>
								)}
								{messages.length === 1 && !selectedFile && (
									<button
										type="button"
										className="drop-prompt"
										onClick={() => fileInputRef.current?.click()}
									>
										<span className="drop-icon">
											<Icon name="file" />
											<span>+</span>
										</span>
										<strong>Your career, in one PDF.</strong>
										<span>Drop it here or click to attach</span>
									</button>
								)}
							</div>
							<div className="chat-composer">
								{fileError && (
									<p className="file-error" role="alert">
										{fileError}
									</p>
								)}
								{selectedFile && (
									<div className="selected-file">
										<span className="document-icon">
											<Icon name="file" />
										</span>
										<div>
											<strong>{selectedFile.name}</strong>
											<span>
												PDF · {fileSize(selectedFile.size)} · Ready to roast
											</span>
										</div>
										<button
											type="button"
											className="icon-button"
											onClick={() => setSelectedFile(null)}
											aria-label="Remove selected PDF"
										>
											<Icon name="close" />
										</button>
									</div>
								)}
								<input
									ref={fileInputRef}
									type="file"
									accept=".pdf,application/pdf"
									className="sr-only"
									tabIndex={-1}
									aria-label="Choose your CV PDF"
									onChange={(event) => {
										selectFile(event.target.files?.[0]);
										event.target.value = "";
									}}
								/>
								<div className="composer-row">
									<button
										type="button"
										className="icon-button attach-button"
										onClick={() => fileInputRef.current?.click()}
										disabled={isTyping}
										aria-label="Attach CV"
									>
										<Icon name="plus" />
									</button>
									<button
										type="button"
										className="composer-placeholder"
										onClick={() => fileInputRef.current?.click()}
										disabled={isTyping}
									>
										{isTyping
											? "Karen is reviewing…"
											: selectedFile
												? "Ready when you are…"
												: "Attach your CV…"}
									</button>
									<button
										type="button"
										className="send-button"
										ref={sendRef}
										onClick={handleSubmit}
										disabled={!selectedFile || isTyping}
										aria-label="Send CV to Karen"
									>
										<Icon name="arrow" />
									</button>
								</div>
								<output className="composer-hint">
									{isTyping
										? "Preparing your character development."
										: "PDF only · 5 MB max · Ego not included"}
								</output>
							</div>
							<div className="phone-home-bar" aria-hidden="true" />
							{isDragging && (
								<div className="drop-overlay">
									<Icon name="upload" />
									<strong>Drop it like it’s hot.</strong>
									<span>Karen will take it from here.</span>
								</div>
							)}
						</div>
					</section>
					<div className="rejection-stamp">
						<Icon name="spark" />
						<strong>100%</strong>
						<span>rejection rate</span>
					</div>
					<p className="phone-caption">
						<span className="status-dot" />{" "}
						{isTyping
							? "Your qualifications are being questioned."
							: hasRoast
								? "Application reviewed. Ego, pending recovery."
								: "A very real phone. A very fake opportunity."}
					</p>
					{shareError && (
						<p className="share-error" role="alert">
							{shareError}
						</p>
					)}
				</div>
			</main>
			<footer className="site-footer">
				<span>A little less corporate. A lot more personal.</span>
				<a
					href="https://github.com/DanteDeLordran"
					target="_blank"
					rel="noopener noreferrer"
				>
					An unfortunate idea by <strong>DanteDeLordran</strong>{" "}
					<Icon name="arrow" />
				</a>
			</footer>
			{sharePreview && (
				<ShareDialog
					chat={sharePreview}
					onClose={() => setSharePreview(null)}
				/>
			)}
		</div>
	);
}
