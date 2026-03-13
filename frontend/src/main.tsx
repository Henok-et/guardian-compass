import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "react-hot-toast"; // ← Add this import

// Initialize theme based on user preference (persisted in localStorage) to keep
// the UI consistent on refresh (including the login page).
const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const useDark = savedTheme === "dark" || (!savedTheme && prefersDark);
document.documentElement.classList.toggle("dark", useDark);

createRoot(document.getElementById("root")!).render(
	<>
		<App />
		<Toaster
			position="top-center"
			toastOptions={{
				duration: 5000, // 5 seconds default
				style: {
					borderRadius: "8px",
					background: "hsl(var(--card))",
					color: "hsl(var(--card-foreground))",
					border: "1px solid rgba(var(--border), 0.5)",
				},
			}}
		/>
	</>,
);
