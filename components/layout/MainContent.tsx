"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * Fades main content on route change (200ms ease-out) for smooth page transitions.
 */
export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      className="min-h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
