import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "react-hot-toast"; // ← Add this import

createRoot(document.getElementById("root")!).render(
	<>
		<App />
		<Toaster
			position="top-center" // or "top-right", "bottom-center", etc.
			toastOptions={{
				duration: 5000, // 5 seconds default
				style: {
					borderRadius: "8px",
					background: "#333",
					color: "#fff",
				},
			}}
		/>
	</>,
);
