import ReactDOM from "react-dom/client";
import { ChatPhone } from "./components/ChatPhone";
import "./styles.css";

// biome-ignore lint/style/noNonNullAssertion: #app is in index.html
ReactDOM.createRoot(document.getElementById("app")!).render(<ChatPhone />);
