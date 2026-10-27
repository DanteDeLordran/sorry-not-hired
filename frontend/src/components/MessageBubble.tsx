import { fileSize, type Message } from "../lib/chat";
import { Icon } from "./Icon";

export function MessageBubble({ message }: { message: Message }) {
	return (
		<div className={`bubble-row ${message.sender}`}>
			<div className={`bubble ${message.sender}`}>
				{message.attachment ? (
					<div className="attachment-message">
						<span className="document-icon">
							<Icon name="file" />
						</span>
						<div>
							<strong>{message.attachment.name}</strong>
							<span>PDF document · {fileSize(message.attachment.size)}</span>
						</div>
					</div>
				) : (
					<p className="bubble-text">{message.text}</p>
				)}
				<div className="bubble-meta">
					<time dateTime={message.timestamp.toISOString()}>
						{message.timestamp.toLocaleTimeString("en-US", {
							hour: "numeric",
							minute: "2-digit",
							hour12: false,
						})}
					</time>
					{message.sender === "user" && <Icon name="check" />}
				</div>
			</div>
		</div>
	);
}
