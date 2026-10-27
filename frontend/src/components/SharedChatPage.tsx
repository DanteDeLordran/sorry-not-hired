import { useEffect, useState } from "react";
import {
	ChatShareError,
	readSharedChat,
	type SharedChat,
	sharedMessages,
} from "../lib/chatShare";
import { Icon } from "./Icon";
import { MessageBubble } from "./MessageBubble";

type SharedState =
	| { status: "loading" }
	| { status: "ready"; chat: SharedChat }
	| { status: "error"; message: string };

export function SharedChatPage() {
	const [state, setState] = useState<SharedState>({ status: "loading" });

	useEffect(() => {
		document.title = "Shared chat — SorryNotHired";
		let generation = 0;
		const load = () => {
			const current = ++generation;
			setState({ status: "loading" });
			readSharedChat(window.location.hash)
				.then((chat) => {
					if (current === generation) setState({ status: "ready", chat });
				})
				.catch((error: unknown) => {
					if (current === generation) {
						setState({
							status: "error",
							message:
								error instanceof ChatShareError
									? error.message
									: "This share link could not be opened. Ask the sender for a new link.",
						});
					}
				});
		};
		load();
		window.addEventListener("hashchange", load);
		return () => {
			generation++;
			window.removeEventListener("hashchange", load);
		};
	}, []);

	return (
		<div className="app-shell shared-page">
			<header className="site-header">
				<a className="wordmark" href="/" aria-label="Sorry, not hired. Home">
					<img src="/favicon.svg" alt="" width="38" height="38" />
					<span>
						sorry, not hired<span className="brand-period">.</span>
					</span>
				</a>
				<span className="shared-label">Shared chat · Read-only</span>
			</header>
			<main className="shared-main">
				{state.status === "loading" ? (
					<output className="shared-status">Opening your rejection…</output>
				) : state.status === "error" ? (
					<div className="shared-error" role="alert">
						<h1>That link didn’t make the cut.</h1>
						<p>{state.message}</p>
					</div>
				) : (
					<>
						<div className="shared-intro">
							<div className="eyebrow">
								An application. An unfortunate reply.
							</div>
							<h1>A rejection worth sharing.</h1>
							<p>Someone met Karen. Here’s how it went.</p>
						</div>
						<section
							className="shared-conversation"
							aria-label="Shared conversation with Karen"
						>
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
									<p>A shared copy. The verdict stands.</p>
								</div>
								<Icon name="share" />
							</div>
							<div className="shared-messages">
								{sharedMessages(state.chat).map((message) => (
									<MessageBubble key={message.id} message={message} />
								))}
							</div>
						</section>
						<p className="shared-note">
							Shared by its sender. No PDF attached. The link contains the
							conversation; no chat is saved on our server.
						</p>
					</>
				)}
				<a className="primary-button shared-start" href="/">
					Get my CV roasted <Icon name="arrow" />
				</a>
			</main>
		</div>
	);
}
