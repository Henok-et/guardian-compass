import { motion } from "framer-motion";
import { LoadingSpinner } from "./LoadingSpinner";

export function ActionLoadingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl z-10"
    >
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="md" />
        <span className="text-gray-700 font-medium">Processing...</span>
      </div>
    </motion.div>
  );
}