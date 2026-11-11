/* =========================================
   DIHCORD ANIMATION PRESETS
   Reusable Framer Motion animations for consistent motion design
   ========================================= */

import { type Variants, type Transition } from "framer-motion";

export const REDUCED_MOTION = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --- Page transitions --- */
export const pageVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const pageTransition: Transition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
};

/* --- Sidebar item --- */
export const sidebarItemVariants: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

/* --- Modal --- */
export const modalOverlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContentVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
};

/* --- Message arrival --- */
export const messageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/* --- Reaction pulse --- */
export const reactionPulseVariants: Variants = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.2, 1] },
  hover: { scale: 1.05 },
};

/* --- Badge pulse --- */
export const badgePulseVariants: Variants = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.15, 1] },
};

/* --- Presence dot --- */
export const presenceDotVariants: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.3, 1],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
};

/* --- Tooltip --- */
export const tooltipVariants: Variants = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 5 },
};

/* --- Dropdown --- */
export const dropdownVariants: Variants = {
  initial: { opacity: 0, y: -5, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -5, scale: 0.98 },
};

/* --- Stagger children --- */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { ease: "easeOut", duration: 0.2 } },
};

/* --- Button hover --- */
export const buttonHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 400, damping: 17 },
};

/* --- Toggle switch --- */
export const toggleVariants: Variants = {
  checked: { x: 24 },
  unchecked: { x: 0 },
};

/* --- List item --- */
export const listItemVariants: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -10 },
  hover: { background: "rgba(255,255,255,0.05)" },
};

/* --- Loader --- */
export const loaderVariants: Variants = {
  animate: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: "linear" },
  },
};