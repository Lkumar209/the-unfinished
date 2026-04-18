import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Overline({ children, className, accent = false }: { children: ReactNode; className?: string; accent?: boolean }) {
  return (
    <div
      className={cn(
        "font-mono-ui text-[11px] uppercase tracking-[0.12em]",
        accent ? "text-accent" : "text-ink-tertiary",
        className
      )}
      style={{ textTransform: "lowercase", letterSpacing: "0.08em" }}
    >
      {children}
    </div>
  );
}
