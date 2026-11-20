import ReactDOM from "react-dom/client";
import { ApplyPage } from "./components/ApplyPage";
import { SharedChatPage } from "./components/SharedChatPage";
import "./styles.css";

// biome-ignore lint/style/noNonNullAssertion: #app is in index.html
ReactDOM.createRoot(document.getElementById("app")!).render(
	/^\/share\/?$/.test(window.location.pathname) ? (
		<SharedChatPage />
	) : (
		<ApplyPage />
	),
);
