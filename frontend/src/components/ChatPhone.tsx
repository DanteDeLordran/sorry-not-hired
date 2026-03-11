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
		if (file) {
			setSelectedFile(file);
		}
	};

	const handleSubmit = async () => {
		if (!selectedFile) return;

		const formData = new FormData();
		formData.append("file", selectedFile);

		// Add user message about uploading
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
			const response = await fetch(`${import.meta.env.VITE_BASE_URL || ""}/chat/message`, {
				method: "POST",
				body: formData,
			});

			const data: RoastResponse = await response.json();

			setIsTyping(false);

			// Split roast into chunks for more natural chat flow
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
		} catch (error) {
			console.error("Error:", error);
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

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	return (
		<div className="min-h-screen bg-linear-to-br from-[--bg-base] via-[--foam] to-[--sand] flex items-center justify-center p-4 relative overflow-hidden">
			{/* Animated Background Blobs */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-[--lagoon]/20 rounded-full blur-3xl animate-pulse" />
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[--palm]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
			</div>

			{/* Background Pattern - Subtle dot grid */}
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: `radial-gradient(circle at 1px 1px, rgba(23, 58, 64, 0.15) 1px, transparent 0)`,
					backgroundSize: "24px 24px"
				}}
			/>

			{/* Phone Frame */}
			<div className="relative z-10 w-full max-w-105 aspect-9/19.5 bg-[--foam] rounded-[3rem] shadow-2xl overflow-hidden border-8 border-[--sea-ink]">
				{/* Notch */}
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[--sea-ink] rounded-b-2xl z-20" />

				{/* Status Bar */}
				<div className="absolute top-2 left-0 right-0 flex justify-between items-center px-8 z-10 text-[--sea-ink-soft] text-xs font-medium">
					<span>9:41</span>
					<div className="flex items-center gap-1.5">
						<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
						</svg>
						<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
						</svg>
						<div className="w-6 h-3 border border-current rounded-sm relative">
							<div
								className="absolute inset-0.5 bg-current rounded-sm"
								style={{ width: "70%" }}
							/>
						</div>
					</div>
				</div>

				{/* Chat Container */}
				<div className="flex flex-col h-full pt-10">
					{/* Header */}
					<div className="bg-[--header-bg]/80 backdrop-blur-xl border-b border-[--line] px-4 py-3 flex items-center gap-3">
						<button type="button" className="text-[--lagoon-deep] hover:text-[--lagoon] transition-colors" aria-label="Go back">
							<svg
								className="w-6 h-6"
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
						<div className="relative">
							<div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
								S
							</div>
							<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[--header-bg] rounded-full" />
						</div>
						<div className="flex-1 min-w-0">
							<h2 className="font-semibold text-[--sea-ink] truncate">
								Sarah from HR
							</h2>
							<p className="text-xs text-[--sea-ink-soft]">
								Senior Recruiter · Online
							</p>
						</div>
						<button type="button" className="text-[--lagoon-deep] hover:text-[--lagoon] transition-colors" aria-label="Make a call">
							<svg
								className="w-6 h-6"
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

					{/* Messages */}
					<div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-linear-to-b from-transparent via-[--foam]/50 to-transparent">
						{messages.map((message) => (
							<div
								key={message.id}
								className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
							>
								<div
									className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-md ${
										message.sender === "user"
											? "bg-linear-to-br from-pink-500 to-pink-600 text-white rounded-br-sm"
											: "bg-[--surface] text-[--sea-ink] rounded-bl-sm border border-[--line]"
									}`}
								>
									<p className="text-sm leading-relaxed whitespace-pre-wrap">
										{message.text}
									</p>
									<p
										className={`text-[10px] mt-1 ${
											message.sender === "user"
												? "text-white/80"
												: "text-[--sea-ink-soft]"
										}`}
									>
										{formatTime(message.timestamp)}
									</p>
								</div>
							</div>
						))}

						{/* Typing Indicator */}
						{isTyping && (
							<div className="flex justify-start">
								<div className="bg-[--surface] px-4 py-3 rounded-2xl rounded-bl-sm border border-[--line] shadow-sm">
									<div className="flex gap-1">
										<div
											className="w-2 h-2 bg-[--lagoon] rounded-full animate-bounce"
											style={{ animationDelay: "0ms" }}
										/>
										<div
											className="w-2 h-2 bg-[--lagoon] rounded-full animate-bounce"
											style={{ animationDelay: "150ms" }}
										/>
										<div
											className="w-2 h-2 bg-[--lagoon] rounded-full animate-bounce"
											style={{ animationDelay: "300ms" }}
										/>
									</div>
								</div>
							</div>
						)}

						<div ref={messagesEndRef} />
					</div>

					{/* Input Area */}
					<div className="bg-[--header-bg]/80 backdrop-blur-xl border-t border-[--line] px-4 py-3 safe-area-bottom">
						<div className="flex items-end gap-2">
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								disabled={isTyping}
								className="shrink-0 w-10 h-10 rounded-full bg-[--surface] border border-[--line] flex items-center justify-center text-[--lagoon-deep] hover:bg-[--link-bg-hover] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
								aria-label="Attach file"
							>
								<svg
									className="w-5 h-5"
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
								accept="application/pdf,.pdf"
								onChange={handleFileSelect}
								className="hidden"
							/>

							<div className="flex-1 bg-[--surface] border border-[--line] rounded-2xl px-4 py-2.5 min-h-11 flex items-center">
								{selectedFile ? (
									<div className="flex items-center gap-2 text-sm text-[--sea-ink]">
										<svg
											className="w-5 h-5 text-[--lagoon-deep]"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
										<span className="truncate">{selectedFile.name}</span>
										<button
											type="button"
											onClick={() => setSelectedFile(null)}
											disabled={isTyping}
											className="text-[--sea-ink-soft] hover:text-[--sea-ink] disabled:opacity-50"
											aria-label="Remove file"
										>
											<svg
												className="w-4 h-4"
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
									<span className="text-[--sea-ink-soft] text-sm">
										Upload CV (PDF)...
									</span>
								)}
							</div>

							<button type="button"
								onClick={handleSubmit}
								disabled={!selectedFile || isTyping}
								className="shrink-0 w-10 h-10 rounded-full bg-linear-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
								aria-label="Send message"
							>
								<svg
									className="w-5 h-5"
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

				{/* Home Indicator */}
				<div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-[--sea-ink]/30 rounded-full z-20" />

				{/* Glossy Reflection */}
				<div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent pointer-events-none z-10" />

				{/* Subtle Shimmer Effect */}
				<div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent" style={{ animation: 'shimmer 3s infinite' }} />
			</div>
		</div>
	);
}
