"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type OriginButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>,
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onAnimationStart"
  | "onDrag"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragExit"
  | "onDragLeave"
  | "onDragOver"
  | "onDragStart"
  | "onDrop"
> & {
  loading?: boolean;
};

function coverDiameter(width: number, height: number, x: number, y: number) {
  return Math.ceil(2 * Math.max(
    Math.hypot(x, y),
    Math.hypot(width - x, y),
    Math.hypot(x, height - y),
    Math.hypot(width - x, height - y),
  ));
}

export const OriginButton = React.forwardRef<HTMLButtonElement, OriginButtonProps>(function OriginButton(
  { children, className, disabled, loading = false, onPointerEnter, onPointerLeave, onPointerDown, onPointerUp, ...props },
  forwardedRef,
) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [origin, setOrigin] = React.useState({ x: 0, y: 0 });
  const [diameter, setDiameter] = React.useState(0);
  const [active, setActive] = React.useState(false);
  const isDisabled = Boolean(disabled || loading);

  const setRef = (node: HTMLButtonElement | null) => {
    ref.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  function setPointerOrigin(event: React.PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setOrigin({ x, y });
    setDiameter(coverDiameter(rect.width, rect.height, x, y));
  }

  function setCenterOrigin() {
    const node = ref.current;
    if (!node) return;
    setOrigin({ x: node.offsetWidth / 2, y: node.offsetHeight / 2 });
    setDiameter(coverDiameter(node.offsetWidth, node.offsetHeight, node.offsetWidth / 2, node.offsetHeight / 2));
  }

  return (
    <motion.button
      {...props}
      ref={setRef}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex h-11 cursor-pointer touch-manipulation select-none items-center justify-center overflow-hidden rounded-xl px-5 font-medium text-sm tracking-[-0.02em]",
        "border border-[#1c2434] bg-white text-[#1c2434] shadow-[0_12px_28px_-18px_rgba(28,36,52,0.8)]",
        "transition-colors duration-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bb8a78] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        active && "text-white",
        className,
      )}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (!isDisabled) { setPointerOrigin(event); setActive(true); }
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        setActive(false);
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!isDisabled && event.button === 0) { setPointerOrigin(event); setActive(true); }
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        setActive(false);
      }}
      onFocus={(event) => {
        props.onFocus?.(event);
        if (!isDisabled && event.currentTarget.matches(":focus-visible")) { setCenterOrigin(); setActive(true); }
      }}
      onBlur={(event) => {
        props.onBlur?.(event);
        setActive(false);
      }}
      whileTap={isDisabled ? undefined : { scale: 0.985 }}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1c2434]"
        style={{ left: origin.x, top: origin.y, width: diameter, height: diameter }}
        initial={false}
        animate={{ scale: active ? 1 : 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
});

OriginButton.displayName = "OriginButton";
