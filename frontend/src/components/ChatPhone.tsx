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
		<>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

				*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
				html, body, #root { width: 100%; height: 100%; }

				:root {
					--slate-950: #0b1221;
					--slate-900: #0f1e30;
					--slate-800: #162438;
					--slate-700: #1e3347;
					--slate-600: #2a4560;
					--slate-400: #6b8cad;
					--slate-300: #94aec6;
					--slate-200: #c4d4e3;
					--accent: #c8a96e;
					--accent-light: #e8d5a8;
					--danger: #e05555;
					--success: #4caf7d;
					--white: #f4f8fc;
					--font-display: 'Playfair Display', Georgia, serif;
					--font-body: 'DM Sans', sans-serif;
				}

				.scene {
					font-family: var(--font-body);
					width: 100%;
					min-height: 100vh;
					background: var(--slate-950);
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 2rem 1rem;
					position: relative;
					overflow: hidden;
				}

				.scene::before {
					content: '';
					position: absolute;
					inset: 0;
					background-image:
						linear-gradient(rgba(100,160,220,0.025) 1px, transparent 1px),
						linear-gradient(90deg, rgba(100,160,220,0.025) 1px, transparent 1px);
					background-size: 32px 32px;
					pointer-events: none;
				}



				.desk {
					position: absolute;
					bottom: 0; left: 0; right: 0;
					height: 33%;
					background: linear-gradient(180deg, var(--slate-900) 0%, #091525 100%);
					border-top: 1px solid rgba(200,169,110,0.1);
					pointer-events: none;
				}
				.desk::before {
					content: '';
					position: absolute;
					top: 0; left: 0; right: 0;
					height: 1px;
					background: linear-gradient(90deg, transparent, rgba(200,169,110,0.25), transparent);
				}

				/* Props */
				.prop-monitor { position: absolute; left: 4%; bottom: 29%; opacity: 0.15; pointer-events: none; }
				.prop-monitor-screen {
					width: 170px; height: 105px;
					background: linear-gradient(135deg, var(--slate-800), var(--slate-700));
					border: 2px solid var(--slate-600);
					border-radius: 4px;
					overflow: hidden;
				}
				.prop-monitor-screen::after {
					content: '';
					display: block;
					width: 100%; height: 100%;
					background: repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(100,160,220,0.12) 6px, rgba(100,160,220,0.12) 7px);
				}
				.prop-monitor-stand { width: 22px; height: 18px; background: var(--slate-700); margin: 0 auto; clip-path: polygon(20% 0%,80% 0%,100% 100%,0% 100%); }
				.prop-monitor-base { width: 65px; height: 5px; background: var(--slate-700); margin: 0 auto; border-radius: 2px; }

				.prop-papers { position: absolute; left: 7%; bottom: 25%; opacity: 0.12; pointer-events: none; }
				.prop-paper {
					width: 48px; height: 62px;
					background: var(--slate-200); border-radius: 1px;
					position: absolute;
					overflow: hidden;
				}
				.prop-paper::after { content: ''; position: absolute; inset: 5px; background: repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(0,0,0,0.12) 5px, rgba(0,0,0,0.12) 6px); }
				.prop-paper:nth-child(1) { transform: rotate(-7deg); }
				.prop-paper:nth-child(2) { transform: rotate(4deg); left: 8px; top: 3px; }
				.prop-paper:nth-child(3) { transform: rotate(11deg); left: 13px; top: 1px; }

				.prop-coffee { position: absolute; right: 6%; bottom: 27%; opacity: 0.18; pointer-events: none; }
				.prop-coffee-steam { display: flex; gap: 5px; justify-content: center; margin-bottom: 3px; }
				.prop-coffee-steam span { display: block; width: 2px; height: 10px; background: rgba(200,169,110,0.5); border-radius: 1px; animation: steam 2s ease-in-out infinite; }
				.prop-coffee-steam span:nth-child(2) { animation-delay: 0.3s; height: 14px; }
				.prop-coffee-steam span:nth-child(3) { animation-delay: 0.6s; }
				@keyframes steam { 0%,100%{transform:translateY(0) scaleX(1);opacity:.4} 50%{transform:translateY(-6px) scaleX(1.3);opacity:.7} }
				.prop-coffee-cup {
					width: 30px; height: 35px;
					background: linear-gradient(180deg, var(--slate-600), var(--slate-700));
					border-radius: 2px 2px 5px 5px;
					border: 1px solid var(--slate-500);
					position: relative;
				}
				.prop-coffee-cup::after { content: ''; position: absolute; top: 8px; right: -9px; width: 9px; height: 13px; border: 2px solid var(--slate-500); border-left: none; border-radius: 0 5px 5px 0; }

				.prop-nameplate { position: absolute; right: 7%; bottom: 25.5%; opacity: 0.22; pointer-events: none; }
				.prop-nameplate-plate { background: linear-gradient(135deg, #b8860b, #8b6914); color: rgba(255,255,255,0.9); font-family: var(--font-display); font-size: 7px; letter-spacing: 0.1em; padding: 4px 10px; border-radius: 2px 2px 0 0; white-space: nowrap; text-align: center; }
				.prop-nameplate-base { width: 100%; height: 5px; background: linear-gradient(135deg, #8b6914, #6b5010); border-radius: 0 0 2px 2px; }

				.watermark { position: absolute; bottom: 0.75rem; left: 50%; transform: translateX(-50%); font-family: var(--font-display); font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(200,169,110,0.12); white-space: nowrap; z-index: 5; user-select: none; }

				/* Layout */
				.layout { position: relative; z-index: 10; display: flex; gap: 2rem; align-items: flex-end; width: 100%; max-width: 1020px; }

				/* HR Panel */
				.hr-panel { flex-shrink: 0; width: 190px; display: flex; flex-direction: column; gap: 0.875rem; padding-bottom: 0.5rem; }

				.hr-id-card {
					background: linear-gradient(160deg, var(--slate-800) 0%, var(--slate-900) 100%);
					border: 1px solid rgba(200,169,110,0.18);
					border-radius: 8px;
					padding: 1.125rem 1rem;
					position: relative;
					overflow: hidden;
				}
				.hr-id-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--accent), transparent); }
				.hr-id-card-logo { font-family: var(--font-display); font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); margin-bottom: 1rem; }
				.hr-id-card-avatar { width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #e8a4c0, #c2507a); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 18px; color: white; font-weight: 600; margin-bottom: 0.7rem; border: 2px solid rgba(200,169,110,0.25); }
				.hr-id-card-name { font-family: var(--font-display); font-size: 14px; color: var(--white); margin-bottom: 2px; }
				.hr-id-card-title { font-size: 9px; color: var(--slate-400); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.875rem; }
				.hr-status-dot { display: inline-block; width: 6px; height: 6px; background: var(--success); border-radius: 50%; margin-right: 5px; box-shadow: 0 0 6px var(--success); animation: pdot 2s ease-in-out infinite; }
				@keyframes pdot { 0%,100%{box-shadow:0 0 6px var(--success)} 50%{box-shadow:0 0 12px var(--success)} }
				.hr-divider { height: 1px; background: linear-gradient(90deg, rgba(200,169,110,0.18), transparent); margin-bottom: 0.875rem; }
				.hr-stat { display: flex; justify-content: space-between; margin-bottom: 0.375rem; }
				.hr-stat-label { font-size: 9px; color: var(--slate-400); letter-spacing: 0.08em; text-transform: uppercase; }
				.hr-stat-val { font-size: 10px; color: var(--accent-light); font-weight: 500; }

				.hr-mood { background: linear-gradient(160deg, var(--slate-800), var(--slate-900)); border: 1px solid rgba(200,169,110,0.1); border-radius: 8px; padding: 0.875rem 1rem; }
				.hr-mood-label { font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--slate-400); margin-bottom: 0.5rem; }
				.hr-mood-track { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; margin-bottom: 4px; }
				.hr-mood-fill { height: 100%; width: 72%; background: linear-gradient(90deg, var(--danger), var(--accent)); border-radius: 2px; }
				.hr-mood-caption { font-size: 9px; color: var(--accent); text-align: right; }

				/* Phone */
				.phone-container { flex-shrink: 0; position: relative; width: 100%; max-width: 400px; }
				.phone-shadow { position: absolute; bottom: -18px; left: 50%; transform: translateX(-50%); width: 80%; height: 25px; background: radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%); filter: blur(8px); }

				.phone-frame {
					position: relative;
					width: 100%;
					aspect-ratio: 9 / 19.5;
					background: linear-gradient(170deg, #1c2a3a 0%, #0f1e2e 60%, #091525 100%);
					border-radius: 42px;
					overflow: hidden;
					box-shadow:
						inset 0 0 0 1px rgba(255,255,255,0.06),
						inset 0 1px 0 rgba(255,255,255,0.09),
						0 0 0 9px #080f18,
						0 0 0 10px rgba(200,169,110,0.08),
						0 28px 55px rgba(0,0,0,0.75);
				}
				.phone-frame::before { content: ''; position: absolute; right: -11px; top: 25%; width: 3px; height: 48px; background: #080f18; border-radius: 0 2px 2px 0; box-shadow: 0 58px 0 #080f18; }
				.phone-frame::after { content: ''; position: absolute; left: -11px; top: 20%; width: 3px; height: 33px; background: #080f18; border-radius: 2px 0 0 2px; box-shadow: 0 48px 0 #080f18, 0 96px 0 #080f18; }

				.phone-notch { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 105px; height: 27px; background: #080f18; border-radius: 0 0 17px 17px; z-index: 20; }
				.phone-statusbar { position: absolute; top: 7px; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding: 0 22px; z-index: 10; font-family: var(--font-body); font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.5); }
				.phone-battery { width: 19px; height: 9px; border: 1px solid currentColor; border-radius: 2px; position: relative; opacity: 0.7; }
				.phone-battery::before { content: ''; position: absolute; inset: 2px; background: currentColor; border-radius: 1px; width: 60%; }
				.phone-battery::after { content: ''; position: absolute; right: -3px; top: 50%; transform: translateY(-50%); width: 2px; height: 4px; background: currentColor; border-radius: 0 1px 1px 0; }

				.phone-inner { display: flex; flex-direction: column; height: 100%; padding-top: 34px; }

				.chat-header { background: rgba(9,21,37,0.95); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(200,169,110,0.1); padding: 9px 13px; display: flex; align-items: center; gap: 9px; flex-shrink: 0; }
				.chat-header-back { background: none; border: none; cursor: pointer; color: var(--accent); padding: 0; display: flex; align-items: center; }
				.chat-header-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #e8a4c0, #c2507a); display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 13px; color: white; font-weight: 600; flex-shrink: 0; border: 1.5px solid rgba(200,169,110,0.22); position: relative; }
				.chat-header-online { position: absolute; bottom: -1px; right: -1px; width: 8px; height: 8px; background: var(--success); border: 1.5px solid #091525; border-radius: 50%; }
				.chat-header-info { flex: 1; min-width: 0; }
				.chat-header-name { font-family: var(--font-display); font-size: 12px; color: var(--white); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
				.chat-header-sub { font-size: 9px; color: var(--accent); letter-spacing: 0.07em; text-transform: uppercase; }
				.chat-header-call { background: none; border: none; cursor: pointer; color: var(--slate-400); padding: 0; display: flex; }

				.chat-messages-wrapper { flex: 1; overflow: hidden; position: relative; min-height: 0; }
				.chat-messages-wrapper::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 28px; background: linear-gradient(to bottom, transparent, rgba(15,30,48,0.97)); pointer-events: none; z-index: 2; }

				.chat-messages { height: 100%; overflow-y: auto; padding: 10px 9px; display: flex; flex-direction: column; gap: 7px; scrollbar-width: none; background: linear-gradient(180deg, rgba(11,18,33,0.95) 0%, rgba(15,30,48,0.92) 100%); }
				.chat-messages::-webkit-scrollbar { display: none; }

				.date-chip { text-align: center; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--slate-400); position: relative; margin: 3px 0; }
				.date-chip::before, .date-chip::after { content: ''; position: absolute; top: 50%; width: 28%; height: 1px; background: rgba(200,169,110,0.08); }
				.date-chip::before { left: 0; }
				.date-chip::after { right: 0; }

				.bubble-row { display: flex; }
				.bubble-row.user { justify-content: flex-end; }
				.bubble-row.hr { justify-content: flex-start; }

				.bubble { max-width: 78%; padding: 7px 10px; font-size: 11.5px; line-height: 1.5; color: var(--white); white-space: pre-wrap; word-break: break-word; }
				.bubble.hr { background: rgba(30,51,71,0.8); border: 1px solid rgba(200,169,110,0.09); border-radius: 2px 11px 11px 11px; backdrop-filter: blur(8px); }
				.bubble.user { background: linear-gradient(135deg, #c8a96e 0%, #a07a3a 100%); color: #0b1221; border-radius: 11px 2px 11px 11px; font-weight: 500; }
				.bubble-time { font-size: 9px; margin-top: 3px; display: block; letter-spacing: 0.04em; }
				.bubble.hr .bubble-time { color: var(--slate-400); }
				.bubble.user .bubble-time { color: rgba(11,18,33,0.45); text-align: right; }

				.typing-bubble { background: rgba(30,51,71,0.8); border: 1px solid rgba(200,169,110,0.09); border-radius: 2px 11px 11px 11px; padding: 9px 13px; display: flex; gap: 4px; align-items: center; }
				.typing-dot { width: 5px; height: 5px; background: var(--accent); border-radius: 50%; animation: tdot 1.4s ease-in-out infinite; }
				.typing-dot:nth-child(2) { animation-delay: 0.2s; }
				.typing-dot:nth-child(3) { animation-delay: 0.4s; }
				@keyframes tdot { 0%,60%,100%{transform:scale(0.8);opacity:.4} 30%{transform:scale(1.2);opacity:1} }

				.chat-input-area { background: rgba(9,21,37,0.97); border-top: 1px solid rgba(200,169,110,0.09); padding: 9px 11px 13px; flex-shrink: 0; }
				.chat-input-row { display: flex; align-items: center; gap: 7px; }
				.chat-attach-btn { width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(200,169,110,0.2); background: rgba(200,169,110,0.06); color: var(--accent); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
				.chat-input-field { flex: 1; background: rgba(255,255,255,0.035); border: 1px solid rgba(200,169,110,0.1); border-radius: 17px; padding: 7px 13px; min-height: 34px; display: flex; align-items: center; }
				.chat-placeholder { color: rgba(255,255,255,0.18); font-style: italic; font-size: 11px; }
				.chat-file-row { display: flex; align-items: center; gap: 6px; width: 100%; }
				.chat-file-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; color: var(--accent-light); }
				.chat-file-clear { background: none; border: none; cursor: pointer; color: var(--slate-400); padding: 0; display: flex; flex-shrink: 0; }
				.chat-send-btn { width: 34px; height: 34px; border-radius: 50%; border: none; background: linear-gradient(135deg, var(--accent), #a07a3a); color: var(--slate-950); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 3px 10px rgba(200,169,110,0.28); }
				.chat-send-btn:disabled { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.18); cursor: not-allowed; box-shadow: none; }

				.phone-home-bar { position: absolute; bottom: 7px; left: 50%; transform: translateX(-50%); width: 95px; height: 3px; background: rgba(255,255,255,0.16); border-radius: 99px; z-index: 20; }

				/* Right panel */
				.status-panel { flex-shrink: 0; width: 172px; display: flex; flex-direction: column; gap: 0.875rem; padding-bottom: 0.5rem; }

				.stat-card { background: linear-gradient(160deg, var(--slate-800), var(--slate-900)); border: 1px solid rgba(200,169,110,0.12); border-radius: 8px; padding: 0.875rem 1rem; position: relative; overflow: hidden; }
				.stat-card::before { content: ''; position: absolute; top: 0; right: 0; width: 55px; height: 55px; background: radial-gradient(circle at top right, rgba(200,169,110,0.05), transparent); }
				.stat-label { font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--slate-400); margin-bottom: 0.5rem; }
				.stat-value { font-family: var(--font-display); font-size: 22px; color: var(--white); font-weight: 400; line-height: 1; margin-bottom: 2px; }
				.stat-sub { font-size: 10px; color: var(--accent); }

				.reject-meter { background: linear-gradient(160deg, var(--slate-800), var(--slate-900)); border: 1px solid rgba(200,169,110,0.12); border-radius: 8px; padding: 0.875rem 1rem; }
				.reject-label { font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--slate-400); margin-bottom: 0.625rem; }
				.reject-track { height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
				.reject-fill { height: 100%; width: 82%; background: linear-gradient(90deg, var(--success), var(--accent) 40%, var(--danger)); border-radius: 3px; }
				.reject-labels { display: flex; justify-content: space-between; font-size: 8px; color: var(--slate-400); }

				.activity { background: linear-gradient(160deg, var(--slate-800), var(--slate-900)); border: 1px solid rgba(200,169,110,0.12); border-radius: 8px; padding: 0.875rem 1rem; }
				.activity-label { font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--slate-400); margin-bottom: 0.625rem; }
				.activity-item { display: flex; align-items: flex-start; gap: 6px; margin-bottom: 7px; font-size: 10px; color: var(--slate-300); line-height: 1.4; }
				.activity-item:last-child { margin-bottom: 0; }
				.a-dot { width: 5px; height: 5px; border-radius: 50%; margin-top: 3.5px; flex-shrink: 0; }
				.a-dot.r { background: var(--danger); }
				.a-dot.g { background: var(--success); }
			`}</style>

			<div className="scene">
				<div className="desk" />

				<div className="watermark">SorryNotHired · Talent Acquisition Platform</div>

				<div className="layout">
					{/* LEFT */}
					<div className="hr-panel">
						<div className="hr-id-card">
							<div className="hr-id-card-logo">Acme Corp HR</div>
							<div className="hr-id-card-avatar">S</div>
							<div className="hr-id-card-name">Sarah Chen</div>
							<div className="hr-id-card-title"><span className="hr-status-dot" />Senior Recruiter</div>
							<div className="hr-divider" />
							<div className="hr-stat"><span className="hr-stat-label">CVs reviewed</span><span className="hr-stat-val">1,847</span></div>
							<div className="hr-stat"><span className="hr-stat-label">Hired</span><span className="hr-stat-val">12</span></div>
							<div className="hr-stat"><span className="hr-stat-label">Response time</span><span className="hr-stat-val">~3 weeks</span></div>
						</div>
						<div className="hr-mood">
							<div className="hr-mood-label">Current patience level</div>
							<div className="hr-mood-track"><div className="hr-mood-fill" /></div>
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
							<div className="reject-track"><div className="reject-fill" /></div>
							<div className="reject-labels"><span>Hired</span><span>82%</span><span>Rejected</span></div>
						</div>
						<div className="activity">
							<div className="activity-label">Recent activity</div>
							<div className="activity-item"><div className="a-dot r" /><span>John D. — rejected after 2s</span></div>
							<div className="activity-item"><div className="a-dot r" /><span>Maria K. — "not a culture fit"</span></div>
							<div className="activity-item"><div className="a-dot g" /><span>Alex T. — advanced to ghost</span></div>
							<div className="activity-item"><div className="a-dot r" /><span>Sam R. — overqualified</span></div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
