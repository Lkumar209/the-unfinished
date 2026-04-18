import { Link } from "react-router-dom";

export function Wordmark({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="font-serif-ui text-[18px] tracking-tight text-ink hover:text-ink/80 transition-opacity duration-300">
      the unfinished
    </Link>
  );
}
