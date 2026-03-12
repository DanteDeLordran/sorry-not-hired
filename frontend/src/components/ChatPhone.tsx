import { useCallback, useEffect, useRef, useState } from "react";
import type { RoastResponse } from "../models/roast";

interface Message {
	id: string;
	text: string;
	sender: "user" | "hr";
	timestamp: Date;
}

export function ChatPhone() {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "1",
			text: "Hey! 👋 Just got your CV for review. Give me a sec to look it over...",
			sender: "hr",
			timestamp: new Date(Date.now() - 60000),
		},
	]);
	const [isTyping, setIsTyping] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [scrollToBottom]);

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) setSelectedFile(file);
	};

	const handleSubmit = async () => {
		if (!selectedFile) return;
		const formData = new FormData();
		formData.append("file", selectedFile);

		setMessages((prev) => [
			...prev,
			{
				id: Date.now().toString(),
				text: `📄 ${selectedFile.name}`,
				sender: "user",
				timestamp: new Date(),
			},
		]);
		setIsTyping(true);
		setSelectedFile(null);

		try {
			const response = await fetch(
				`${import.meta.env.VITE_BASE_URL || ""}/chat/message`,
				{
					method: "POST",
					body: formData,
				},
			);
			const data: RoastResponse = await response.json();
			setIsTyping(false);
			const roastChunks = data.roast.split(/\n\n+/);
			for (const chunk of roastChunks) {
				if (chunk.trim()) {
					await new Promise((resolve) => setTimeout(resolve, 800));
					setMessages((prev) => [
						...prev,
						{
							id: Date.now().toString(),
							text: chunk.trim(),
							sender: "hr",
							timestamp: new Date(),
						},
					]);
				}
			}
		} catch {
			setIsTyping(false);
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					text: "Oops, something went wrong. Try again?",
					sender: "hr",
					timestamp: new Date(),
				},
			]);
		}
	};

	const formatTime = (date: Date) =>
		date.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});

	return (
		<div className="chatphone-scope">
			<div className="scene">
				<div className="desk" />

				<div className="watermark">
					SorryNotHired · Talent Acquisition Platform
				</div>

				<a
					href="https://github.com/DanteDeLordran"
					target="_blank"
					rel="noopener noreferrer"
					className="dev-badge"
					title="Built by DanteDeLordran"
				>
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
					>
						<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
					</svg>
					<span>Built by DanteDeLordran</span>
				</a>

				<div className="layout">
					{/* LEFT */}
					<div className="hr-panel">
						<div className="hr-id-card">
							<div className="hr-id-card-logo">Acme Corp HR</div>
							<div className="hr-id-card-avatar">S</div>
							<div className="hr-id-card-name">Sarah Chen</div>
							<div className="hr-id-card-title">
								<span className="hr-status-dot" />
								Senior Recruiter
							</div>
							<div className="hr-divider" />
							<div className="hr-stat">
								<span className="hr-stat-label">CVs reviewed</span>
								<span className="hr-stat-val">1,847</span>
							</div>
							<div className="hr-stat">
								<span className="hr-stat-label">Hired</span>
								<span className="hr-stat-val">12</span>
							</div>
							<div className="hr-stat">
								<span className="hr-stat-label">Response time</span>
								<span className="hr-stat-val">~3 weeks</span>
							</div>
						</div>
						<div className="hr-mood">
							<div className="hr-mood-label">Current patience level</div>
							<div className="hr-mood-track">
								<div className="hr-mood-fill" />
							</div>
							<div className="hr-mood-caption">Dangerously low</div>
						</div>
					</div>

					{/* CENTER — Phone */}
					<div className="phone-container">
						<div className="phone-shadow" />
						<div className="phone-frame">
							<div className="phone-notch" />
							<div className="phone-statusbar">
								<span>9:41</span>
								<div
									style={{ display: "flex", alignItems: "center", gap: "5px" }}
								>
									<svg
										width="13"
										height="10"
										viewBox="0 0 24 16"
										fill="currentColor"
										aria-hidden="true"
									>
										<path d="M12 0C7.31 0 3.07 1.86 0 4.88L2.12 7C4.6 4.55 7.98 3 12 3s7.4 1.55 9.88 4L24 4.88C20.93 1.86 16.69 0 12 0z" />
										<path d="M12 6c-3.42 0-6.5 1.39-8.74 3.63L5.4 11.75C7.09 10.04 9.42 9 12 9s4.91 1.04 6.6 2.75l2.14-2.12C18.5 7.39 15.42 6 12 6z" />
										<path d="M12 12c-1.73 0-3.28.7-4.42 1.84L12 18l4.42-4.16C15.28 12.7 13.73 12 12 12z" />
									</svg>
									<div className="phone-battery" />
								</div>
							</div>

							<div className="phone-inner">
								<div className="chat-header">
									<button
										type="button"
										className="chat-header-back"
										aria-label="Back"
									>
										<svg
											width="17"
											height="17"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M15 19l-7-7 7-7"
											/>
										</svg>
									</button>
									<div className="chat-header-avatar">
										S<div className="chat-header-online" />
									</div>
									<div className="chat-header-info">
										<div className="chat-header-name">Sarah from HR</div>
										<div className="chat-header-sub">Reviewing now</div>
									</div>
									<button
										type="button"
										className="chat-header-call"
										aria-label="Call"
									>
										<svg
											width="17"
											height="17"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
											/>
										</svg>
									</button>
								</div>

								<div className="chat-messages-wrapper">
									<div className="chat-messages">
										<div className="date-chip">Today</div>
										{messages.map((msg) => (
											<div key={msg.id} className={`bubble-row ${msg.sender}`}>
												<div className={`bubble ${msg.sender}`}>
													{msg.text}
													<span className="bubble-time">
														{formatTime(msg.timestamp)}
													</span>
												</div>
											</div>
										))}
										{isTyping && (
											<div className="bubble-row hr">
												<div className="typing-bubble">
													<div className="typing-dot" />
													<div className="typing-dot" />
													<div className="typing-dot" />
												</div>
											</div>
										)}
										<div ref={messagesEndRef} />
									</div>
								</div>

								<div className="chat-input-area">
									<div className="chat-input-row">
										<button
											type="button"
											className="chat-attach-btn"
											onClick={() => fileInputRef.current?.click()}
											aria-label="Attach"
										>
											<svg
												width="15"
												height="15"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
												/>
											</svg>
										</button>
										<input
											ref={fileInputRef}
											type="file"
											accept=".pdf,application/pdf"
											onChange={handleFileSelect}
											style={{ display: "none" }}
										/>
										<div className="chat-input-field">
											{selectedFile ? (
												<div className="chat-file-row">
													<svg
														width="12"
														height="12"
														fill="none"
														stroke="var(--accent)"
														viewBox="0 0 24 24"
														style={{ flexShrink: 0 }}
														aria-hidden="true"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
														/>
													</svg>
													<span className="chat-file-name">
														{selectedFile.name}
													</span>
													<button
														type="button"
														className="chat-file-clear"
														onClick={() => setSelectedFile(null)}
													>
														<svg
															width="11"
															height="11"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
															aria-hidden="true"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M6 18L18 6M6 6l12 12"
															/>
														</svg>
													</button>
												</div>
											) : (
												<span className="chat-placeholder">
													Attach your CV to proceed...
												</span>
											)}
										</div>
										<button
											type="button"
											className="chat-send-btn"
											onClick={handleSubmit}
											disabled={!selectedFile || isTyping}
											aria-label="Send"
										>
											<svg
												width="15"
												height="15"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												aria-hidden="true"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M5 12h14M12 5l7 7-7 7"
												/>
											</svg>
										</button>
									</div>
								</div>
							</div>
							<div className="phone-home-bar" />
						</div>
					</div>

					{/* RIGHT */}
					<div className="status-panel">
						<div className="stat-card">
							<div className="stat-label">CVs in queue</div>
							<div className="stat-value">247</div>
							<div className="stat-sub">+12 since yesterday</div>
						</div>
						<div className="reject-meter">
							<div className="reject-label">Rejection probability</div>
							<div className="reject-track">
								<div className="reject-fill" />
							</div>
							<div className="reject-labels">
								<span>Hired</span>
								<span>82%</span>
								<span>Rejected</span>
							</div>
						</div>
						<div className="activity">
							<div className="activity-label">Recent activity</div>
							<div className="activity-item">
								<div className="a-dot r" />
								<span>John D. — rejected after 2s</span>
							</div>
							<div className="activity-item">
								<div className="a-dot r" />
								<span>Maria K. — "not a culture fit"</span>
							</div>
							<div className="activity-item">
								<div className="a-dot g" />
								<span>Alex T. — advanced to ghost</span>
							</div>
							<div className="activity-item">
								<div className="a-dot r" />
								<span>Sam R. — overqualified</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
