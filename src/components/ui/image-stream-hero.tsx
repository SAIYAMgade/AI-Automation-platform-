"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CorridorPath = {
  perspective?: number;
  cardWidth?: number;
  cardHeight?: number;
  cardRadius?: number;
  birthHeight?: number;
  exitHeight?: number;
  railBirth?: number;
  railExit?: number;
  fan?: number;
  turnBirth?: number;
  turnExit?: number;
  stops?: number;
};

const DEFAULT_PATH: Required<CorridorPath> = {
  perspective: 30,
  cardWidth: 18,
  cardHeight: 25,
  cardRadius: 0.8,
  birthHeight: 2.6,
  exitHeight: 46,
  railBirth: -11,
  railExit: 44,
  fan: 3.3,
  turnBirth: 6,
  turnExit: 28,
  stops: 24,
};

function keyframes(dir: 1 | -1, name: string, path: Required<CorridorPath>) {
  const steps: string[] = [];
  for (let step = 0; step <= path.stops; step += 1) {
    const progress = step / path.stops;
    const scale = (path.birthHeight / path.cardHeight) * Math.pow(path.exitHeight / path.birthHeight, progress);
    const z = path.perspective * (1 - 1 / scale);
    const rail = path.railExit - (path.railExit - path.railBirth) * Math.pow(1 - progress, path.fan);
    const turn = path.turnBirth + (path.turnExit - path.turnBirth) * progress;
    steps.push(`${(progress * 100).toFixed(2)}%{transform:translate3d(${(dir * rail).toFixed(2)}cqw,0,${z.toFixed(2)}cqw) rotateY(${(-dir * turn).toFixed(2)}deg)}`);
  }
  return `@keyframes ${name}{${steps.join("")}}`;
}

export type StreamImage = { src: string; alt?: string };

export type ImageStreamHeroProps = React.ComponentProps<"div"> & {
  images: StreamImage[];
  cards?: number;
  speed?: number;
  axis?: number;
  path?: CorridorPath;
  children?: React.ReactNode;
};

export function ImageStreamHero({ images, cards = 9, speed = 18, axis = 55, path, children, className, style, ...props }: ImageStreamHeroProps) {
  const id = React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const right = `bookleaf-stream-right-${id}`;
  const left = `bookleaf-stream-left-${id}`;
  const card = `bookleaf-stream-card-${id}`;
  const resolvedPath = React.useMemo(() => ({ ...DEFAULT_PATH, ...path }), [path]);
  const css = React.useMemo(() => `${keyframes(1, right, resolvedPath)}${keyframes(-1, left, resolvedPath)}@media(prefers-reduced-motion:reduce){.${card}{animation-play-state:paused}}`, [card, left, resolvedPath, right]);

  return (
    <div className={cn("relative isolate overflow-hidden", className)} style={{ containerType: "inline-size", ...style }} {...props}>
      <style>{css}</style>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ perspective: `${resolvedPath.perspective}cqw`, perspectiveOrigin: `50% ${axis}%` }}>
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {[right, left].map((animationName) => Array.from({ length: cards }, (_, index) => {
            const image = images[index % Math.max(images.length, 1)];
            return <div key={`${animationName}-${index}`} className={cn(card, "absolute overflow-hidden border border-white/20 bg-white/10 shadow-2xl")} style={{ left: "50%", top: `${axis}%`, width: `${resolvedPath.cardWidth}cqw`, height: `${resolvedPath.cardHeight}cqw`, marginLeft: `${-resolvedPath.cardWidth / 2}cqw`, marginTop: `${-resolvedPath.cardHeight / 2}cqw`, borderRadius: `${resolvedPath.cardRadius}cqw`, animation: `${animationName} ${speed}s linear infinite`, animationDelay: `${-(index * speed) / cards}s`, backfaceVisibility: "hidden" }}>
              {image ? <img src={image.src} alt={image.alt ?? ""} loading="lazy" decoding="async" className="h-full w-full object-cover" draggable={false} /> : null}
            </div>;
          }))}
        </div>
      </div>
      {children}
    </div>
  );
}

export default ImageStreamHero;
