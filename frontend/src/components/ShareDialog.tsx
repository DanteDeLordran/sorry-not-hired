import { useEffect, useRef, useState } from "react";
import {
	ChatShareError,
	createShareUrl,
	type SharedChat,
	sharedMessages,
} from "../lib/chatShare";
import { Icon } from "./Icon";
import { MessageBubble } from "./MessageBubble";

export function ShareDialog({
	chat,
	onClose,
}: {
	chat: SharedChat;
	onClose: () => void;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const linkRef = useRef<HTMLTextAreaElement>(null);
	const [link, setLink] = useState("");
	const [error, setError] = useState("");
	const [copyState, setCopyState] = useState<"idle" | "copying" | "copied">(
		"idle",
	);
	const [copyHint, setCopyHint] = useState("");

	useEffect(() => {
		const dialog = dialogRef.current;
		dialog?.showModal();
		return () => dialog?.close();
	}, []);

	useEffect(() => {
		let cancelled = false;
		createShareUrl(chat, window.location.origin)
			.then((url) => {
				if (!cancelled) setLink(url);
			})
			.catch((reason: unknown) => {
				if (!cancelled) {
					setError(
						reason instanceof ChatShareError
							? reason.message
							: "Couldn’t create this link. Close this preview and try again.",
					);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [chat]);

	const copyLink = async () => {
		setCopyState("copying");
		setCopyHint("");
		try {
			await navigator.clipboard.writeText(link);
			setCopyState("copied");
		} catch {
			setCopyState("idle");
			setCopyHint("Select the link below and copy it to share this chat.");
			linkRef.current?.focus();
			linkRef.current?.select();
		}
	};

	return (
		<dialog
			ref={dialogRef}
			className="share-dialog"
			aria-labelledby="share-title"
			aria-describedby="share-description"
			onClose={onClose}
		>
			<div className="share-dialog-heading">
				<h2 id="share-title">Share your rejection.</h2>
				<button
					type="button"
					className="icon-button"
					aria-label="Close sharing preview"
					onClick={() => dialogRef.current?.close()}
				>
					<Icon name="close" />
				</button>
			</div>
			<p id="share-description" className="share-description">
				Anyone with the link can read this chat. Your PDF and filename stay out
				of it. Karen’s replies may still quote details from your CV.
			</p>
			<section className="share-preview" aria-label="Shared chat preview">
				{sharedMessages(chat).map((message) => (
					<MessageBubble key={message.id} message={message} />
				))}
			</section>
			{error ? (
				<p className="share-error" role="alert">
					{error}
				</p>
			) : link ? (
				<div className="share-link-controls">
					<label htmlFor="share-link">Share link</label>
					<textarea
						id="share-link"
						ref={linkRef}
						value={link}
						readOnly
						rows={2}
						spellCheck={false}
						onFocus={(event) => event.currentTarget.select()}
					/>
					<button
						type="button"
						className="primary-button share-copy-button"
						disabled={copyState === "copying"}
						onClick={copyLink}
					>
						{copyState === "copied" ? "Link copied" : "Copy link"}
						<Icon name={copyState === "copied" ? "check" : "share"} />
					</button>
					<output className="share-copy-status">
						{copyHint ||
							(copyState === "copied"
								? "Ready to send. Recipients will see this preview."
								: "A read-only copy. No chat is saved on our server.")}
					</output>
				</div>
			) : (
				<output className="share-copy-status">Preparing your link…</output>
			)}
		</dialog>
	);
}
