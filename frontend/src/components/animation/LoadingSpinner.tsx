import { motion } from "framer-motion";

type Size = "sm" | "md" | "lg";

interface LoadingSpinnerProps {
	size?: Size;
	color?: string;
}

export function LoadingSpinner({
	size = "md",
	color = "primary",
}: LoadingSpinnerProps) {
	const sizes: Record<Size, string> = {
		sm: "h-5 w-5 border-2",
		md: "h-8 w-8 border-4",
		lg: "h-12 w-12 border-4",
	};

	return (
		<motion.div
			className={`rounded-full border-t-transparent border-${color} animate-spin ${sizes[size]}`}
			animate={{ rotate: 360 }}
			transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
		/>
	);
}
