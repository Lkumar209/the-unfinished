import { Link } from "react-router-dom";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  to?: string;
  children: ReactNode;
};

/**
 * Bare button — transparent bg, 0.5px border, lowercase Inter, no weight > 500.
 * No shadcn defaults. Hover only darkens border.
 */
export const BareButton = forwardRef<HTMLButtonElement, Props>(
  ({ to, children, className, ...rest }, ref) => {
    const cls = cn(
      "inline-flex items-center justify-center",
      "font-sans-ui text-[14px] font-normal lowercase",
      "px-6 py-3 rounded-md",
      "bg-transparent text-ink",
      "transition-colors duration-300 ease-out",
      "cursor-pointer select-none",
      className
    );
    const style = { border: "0.5px solid rgba(0,0,0,0.16)" } as const;
    const hover = "hover:[border-color:rgba(0,0,0,0.32)]";

    if (to) {
      return (
        <Link to={to} className={cn(cls, hover)} style={style}>
          {children}
        </Link>
      );
    }
    return (
      <button ref={ref} className={cn(cls, hover)} style={style} {...rest}>
        {children}
      </button>
    );
  }
);
BareButton.displayName = "BareButton";
