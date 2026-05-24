import { cn } from "@/lib/utils";

export function BookLeafWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="grid h-11 w-11 place-items-center bg-primary text-2xl font-light text-primary-foreground shadow-sm">
        /
      </div>
      <div className="leading-none">
        <div className="text-2xl font-light tracking-normal text-brand-ink">BookLeaf</div>
        <div className="text-2xl font-light tracking-normal text-brand-ink">Publishing</div>
        <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.32em] text-brand-ink">
          www.bookleafpub.in
        </div>
      </div>
    </div>
  );
}
