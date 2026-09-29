import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [viteReact()],
	server: {
		proxy: { "/api": "http://localhost:8000" },
	},
});
