import { NavLink, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Wordmark } from "./Wordmark";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const NAV = [
  { to: "/library", label: "library" },
  { to: "/pattern", label: "pattern" },
  { to: "/reentry", label: "reentry" },
];

export function LeftRail() {
  const loc = useLocation();

  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.listProjects(),
  });

  const { data: patternData } = useQuery({
    queryKey: ["pattern/latest"],
    queryFn: () => api.getLatestPattern(),
    retry: false,
  });

  const projects = data?.projects ?? [];
  const mediums = new Set(projects.map(p => p.medium)).size;
  const dropouts = projects.map(p => p.dropout_percent);
  const medianDropout = dropouts.length
    ? Math.round(dropouts.sort((a, b) => a - b)[Math.floor(dropouts.length / 2)])
    : null;

  // best revival candidate from pattern, otherwise first project
  const reentryId = patternData?.best_revival_candidate_id ?? projects[0]?.id ?? "";
  const reentryTo = reentryId ? `/reentry/${reentryId}` : "/reentry";

  return (
    <aside className="lg:w-[220px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen lg:py-12 lg:pr-8 py-8">
      <div className="mb-12">
        <Wordmark />
      </div>

      <nav className="mb-12">
        {NAV.map((item) => {
          const to = item.to === "/reentry" ? reentryTo : item.to;
          const active =
            loc.pathname === to ||
            (item.to === "/reentry" && loc.pathname.startsWith("/reentry")) ||
            (item.to === "/library" && loc.pathname.startsWith("/autopsy"));
          return (
            <NavLink
              key={item.to}
              to={to}
              className={cn(
                "block font-sans-ui text-[14px] lowercase py-3 pl-3",
                "transition-colors duration-300",
                "border-b-hair",
                active ? "text-ink font-medium" : "text-ink-secondary hover:text-ink"
              )}
              style={active ? { borderLeft: "2px solid hsl(var(--accent))", marginLeft: "-2px" } : undefined}
            >
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {projects.length > 0 && (
        <div className="font-mono-ui text-[12px] text-ink-tertiary leading-[1.9]">
          <div>{projects.length} project{projects.length !== 1 ? "s" : ""}</div>
          <div>{mediums} medium{mediums !== 1 ? "s" : ""}</div>
          {medianDropout !== null && <div>median dropout · {medianDropout}%</div>}
        </div>
      )}
    </aside>
  );
}
