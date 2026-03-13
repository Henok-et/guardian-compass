import { motion } from "framer-motion";
import { LoadingSpinner } from "./LoadingSpinner";

export function PageLoader({ message = "Loading application..." }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50"
    >
      <LoadingSpinner size="lg" />
      <p className="mt-6 text-lg font-medium text-gray-700">{message}</p>
    </motion.div>
  );
}