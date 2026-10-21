import { useEffect, useState } from "react";

export function PhoneClock() {
	const [time, setTime] = useState(() => new Date());

	useEffect(() => {
		let timeoutId: number;
		const tick = () => {
			const now = new Date();
			setTime(now);
			timeoutId = window.setTimeout(tick, 60_000 - (now.getTime() % 60_000));
		};
		const sync = () => {
			window.clearTimeout(timeoutId);
			tick();
		};

		sync();
		document.addEventListener("visibilitychange", sync);
		window.addEventListener("focus", sync);
		return () => {
			window.clearTimeout(timeoutId);
			document.removeEventListener("visibilitychange", sync);
			window.removeEventListener("focus", sync);
		};
	}, []);

	return (
		<time dateTime={time.toISOString()}>
			{time.toLocaleTimeString(undefined, {
				hour: "2-digit",
				minute: "2-digit",
				hourCycle: "h23",
			})}
		</time>
	);
}
