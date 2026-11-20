import type { ReactNode } from "react";
import { Icon } from "./Icon";

export const REPO_URL = "https://github.com/DanteDeLordran/sorry-not-hired";
const AUTHOR_URL = "https://github.com/DanteDeLordran";

export function Masthead({ children }: { children?: ReactNode }) {
	return (
		<header className="masthead">
			<a className="wordmark" href="/" aria-label="Sorry, not hired. Home">
				<img src="/favicon.svg" alt="" width="32" height="32" />
				<span>
					sorry, not hired<span className="wordmark-period">.</span>
				</span>
			</a>
			{children}
		</header>
	);
}

export function Colophon() {
	return (
		<footer className="colophon">
			<span>Acme Corp. and Karen are fictional.</span>
			<a
				className="external-link"
				href={AUTHOR_URL}
				target="_blank"
				rel="noopener noreferrer"
			>
				Made by DanteDeLordran <Icon name="arrow" />
			</a>
		</footer>
	);
}
