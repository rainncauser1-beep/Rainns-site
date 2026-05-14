import { motion } from "framer-motion";

export default function RaindropMark({ size = 28 }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <defs>
        <linearGradient id="dropGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4A7BB0" />
          <stop offset="100%" stopColor="#0F2444" />
        </linearGradient>
      </defs>
      <motion.path
        d="M16 3 C16 3, 5 15, 5 21 a11 11 0 0 0 22 0 C27 15, 16 3, 16 3 Z"
        fill="url(#dropGrad)"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "16px 22px" }}
      />
      <motion.ellipse
        cx="12"
        cy="17"
        rx="2"
        ry="3"
        fill="#F5F5F3"
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}
