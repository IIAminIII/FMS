import { CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_24px_oklch(0.54_0.17_148/0.28)]", className)}>
      <div className="absolute inset-[5px] rounded-full border border-white/45" />
      <CircleDot className="size-5" strokeWidth={2.5} />
    </div>
  );
}
