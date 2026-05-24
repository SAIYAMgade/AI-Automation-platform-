import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number) {
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : 0;
  return `${Math.round(safeValue * 100)}%`;
}

export function redact(value?: string | null) {
  if (!value) return undefined;
  if (value.includes("@")) {
    const [name, domain] = value.split("@");
    return `${name.slice(0, 2)}***@${domain}`;
  }
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}
