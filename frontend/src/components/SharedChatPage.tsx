import { useEffect, useState } from "react";
import type { Message } from "../lib/chat";
import {
	ChatShareError,
	readSharedChat,
	sharedMessages,
} from "../lib/chatShare";
import { letterReplies } from "../lib/letter";
import { Icon } from "./Icon";
import { Letter } from "./Letter";
import { Colophon, Masthead } from "./SiteChrome";

type SharedState =
	| { status: "loading" }
	| { status: "ready"; letters: Message[] }
	| { status: "error"; message: string };

const EMPTY_LINK =
	"This link doesn’t contain a reply from Karen. Ask the sender for a new link.";

export function SharedChatPage() {
	const [state, setState] = useState<SharedState>({ status: "loading" });

	useEffect(() => {
		document.title = "Shared letter — SorryNotHired";
		let generation = 0;
		const load = () => {
			const current = ++generation;
			setState({ status: "loading" });
			readSharedChat(window.location.hash)
				.then((chat) => {
					if (current !== generation) return;
					const letters = letterReplies(sharedMessages(chat));
					setState(
						letters.length
							? { status: "ready", letters }
							: { status: "error", message: EMPTY_LINK },
					);
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
		<div className="page">
			<Masthead>
				<span className="masthead-label">Shared letter · Read-only</span>
			</Masthead>
			<main className="shared">
				{state.status === "loading" ? (
					<output className="letter-status">Opening the letter…</output>
				) : state.status === "error" ? (
					<div className="shared-error" role="alert">
						<h1>That link didn’t make the cut.</h1>
						<p>{state.message}</p>
					</div>
				) : (
					<>
						<h1 className="sr-only">A letter from Karen at Acme Corp.</h1>
						{state.letters.map((letter) => (
							<Letter
								key={letter.id}
								text={letter.text}
								timestamp={letter.timestamp}
							/>
						))}
						<p className="shared-note">
							Shared by its sender. The CV file isn’t included, and the letter
							is stored in the link itself, not on our server.
						</p>
					</>
				)}
				<a className="button-primary shared-cta" href="/">
					Apply to Acme Corp. <Icon name="arrow" />
				</a>
			</main>
			<Colophon />
		</div>
	);
}
