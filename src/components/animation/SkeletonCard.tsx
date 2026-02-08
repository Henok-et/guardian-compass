import { motion } from "framer-motion";

export function SkeletonCard() {
  return (
    <motion.div
      className="bg-gray-100 rounded-xl p-6 shadow-sm border border-gray-200"
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 1.8, repeat: Infinity, repeatType: "reverse" }}
    >
      <div className="h-7 w-3/4 bg-gray-300 rounded mb-4" />
      <div className="h-5 w-1/2 bg-gray-300 rounded mb-3" />
      <div className="h-5 w-2/3 bg-gray-300 rounded" />
    </motion.div>
  );
}