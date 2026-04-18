import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LeftRail } from "@/components/LeftRail";
import { Overline } from "@/components/Overline";
import { BareButton } from "@/components/BareButton";
import { api, type Project } from "@/lib/api";

const CW = 960;
const CH = 360;
const PAD_L = 110;
const PAD_R = 220;
const PAD_T = 64;
const PAD_B = 56;

const LOADING_MESSAGES = [
  "reading the autopsies...",
  "finding what these projects share...",
  "naming the pattern...",
  "writing the signature...",
];

function RotatingMessage() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LOADING_MESSAGES.length), 1500);
    return () => clearInterval(t);
  }, []);
  return (
    <p className="font-sans-ui text-[14px] lowercase text-ink-secondary animate-pulse">
      {LOADING_MESSAGES[idx]}
    </p>
  );
}

export default function Pattern() {
  const qc = useQueryClient();

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.listProjects(),
  });
  const projects: Project[] = projectsData?.projects ?? [];

  const { data: pattern, isLoading: patternLoading, isError: patternMissing } = useQuery({
    queryKey: ["pattern/latest"],
    queryFn: () => api.getLatestPattern(),
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: () => api.generatePattern(projects.map(p => p.id)),
    onSuccess: (data) => {
      qc.setQueryData(["pattern/latest"], data);
    },
  });

  const patternProjectIds = new Set(pattern?.per_project_dropouts.map(r => r.project_id) ?? []);
  const patternIsStale = pattern && projects.some(p => !patternProjectIds.has(p.id));

  const rows = projects.length > 0
    ? projects.map(p => {
        const stored = pattern?.per_project_dropouts.find(r => r.project_id === p.id);
        return { project_id: p.id, title: p.title, medium: p.medium, dropout_pct: stored?.dropout_pct ?? p.dropout_percent };
      })
    : [];

  const dropouts = rows.map(r => r.dropout_pct);
  const minD = dropouts.length ? Math.min(...dropouts) : 32;
  const maxD = dropouts.length ? Math.max(...dropouts) : 41;

  const innerW = CW - PAD_L - PAD_R;
  const rowH = rows.length ? (CH - PAD_T - PAD_B) / rows.length : 40;
  const bandStart = (minD / 100) * innerW + PAD_L;
  const bandEnd = (maxD / 100) * innerW + PAD_L;

  const signatureName = pattern?.signature_name ?? null;
  const signatureProse = pattern?.signature_prose ?? null;
  const spread = pattern?.dropout_spread_pts ?? (maxD - minD);
  const median = pattern?.dropout_median_pct ?? (dropouts.length ? Math.round(dropouts.reduce((a, b) => a + b, 0) / dropouts.length) : 36);
  const sharedSymptom = pattern?.shared_symptom ?? null;
  const sharedSymptomCount = pattern?.shared_symptom_count ?? `${projects.length}/${projects.length}`;
  const bestCandidate = pattern?.best_revival_candidate_id ?? projects[0]?.id ?? "";

  const isLoading = patternLoading || generateMutation.isPending;
  const hasPattern = !!pattern || generateMutation.isSuccess;

  return (
    <div className="min-h-screen bg-background fade-in">
      <div className="max-w-dash mx-auto px-6 md:px-20 lg:flex lg:gap-12">
        <LeftRail />

        <main className="flex-1 py-12 lg:py-20 min-w-0">
          <Overline className="mb-6">
            pattern map · {projects.length} project{projects.length !== 1 ? "s" : ""} · {new Set(projects.map(p => p.medium)).size} mediums
          </Overline>

          {isLoading ? (
            <div>
              <h1 className="font-serif text-[40px] md:text-[52px] leading-[1.05] text-ink animate-pulse">
                finding the pattern...
              </h1>
              <div className="mt-6"><RotatingMessage /></div>
            </div>
          ) : signatureName ? (
            <h1 className="font-serif text-[40px] md:text-[52px] leading-[1.05] text-ink">
              {signatureName}.
            </h1>
          ) : (
            <h1 className="font-serif text-[40px] md:text-[52px] leading-[1.05] text-ink">
              the pattern.
            </h1>
          )}

          {!hasPattern && !isLoading && projects.length > 0 && (
            <div className="mt-6">
              <p className="font-serif text-[17px] leading-[1.7] text-ink-secondary max-w-[620px] mb-6">
                {projects.length} projects in the archive. run the pattern analysis to find what they share.
              </p>
              <BareButton onClick={() => generateMutation.mutate()}>
                find the pattern →
              </BareButton>
            </div>
          )}

          {patternIsStale && !isLoading && (
            <div className="mt-6">
              <p className="font-serif text-[17px] leading-[1.7] text-ink-secondary max-w-[620px] mb-6">
                {projects.length - patternProjectIds.size} new project{projects.length - patternProjectIds.size !== 1 ? "s" : ""} added since the last analysis.
              </p>
              <BareButton onClick={() => generateMutation.mutate()}>
                regenerate pattern →
              </BareButton>
            </div>
          )}

          {projects.length === 0 && (
            <p className="mt-6 font-serif text-[17px] leading-[1.7] text-ink-secondary max-w-[620px]">
              no projects yet. upload your work first.
            </p>
          )}

          {/* overlay chart */}
          {rows.length > 0 && (
            <section className="mt-24">
              <div className="rounded-lg bg-surface" style={{ border: "0.5px solid rgba(0,0,0,0.08)", padding: 48 }}>
                <div className="overflow-x-auto">
                  <svg width={CW} height={CH} className="block max-w-full">
                    {/* danger band */}
                    <rect x={bandStart} y={PAD_T - 24}
                      width={Math.max(1, bandEnd - bandStart)} height={CH - PAD_T - PAD_B + 24}
                      fill="hsl(var(--accent))" fillOpacity="0.08" />
                    <text x={(bandStart + bandEnd) / 2} y={PAD_T - 28}
                      textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10"
                      fill="hsl(var(--accent))">
                      danger zone · {minD}–{maxD}%
                    </text>

                    {/* x axis */}
                    <line x1={PAD_L} y1={CH - PAD_B + 4} x2={CW - PAD_R} y2={CH - PAD_B + 4}
                      stroke="rgba(0,0,0,0.16)" strokeWidth="0.5" />
                    {[0, 25, 50, 75, 100].map(t => {
                      const x = (t / 100) * innerW + PAD_L;
                      return (
                        <text key={t} x={x} y={CH - PAD_B + 22} textAnchor="middle"
                          fontFamily="JetBrains Mono, monospace" fontSize="10" fill="hsl(var(--text-tertiary))">
                          {t}%
                        </text>
                      );
                    })}

                    {rows.map((p, i) => {
                      const y = PAD_T + i * rowH + rowH / 2;
                      const dropX = (p.dropout_pct / 100) * innerW + PAD_L;
                      const endX = innerW + PAD_L;
                      return (
                        <g key={p.project_id}>
                          <text x={PAD_L - 14} y={y + 4} textAnchor="end"
                            fontFamily="JetBrains Mono, monospace" fontSize="10" fill="hsl(var(--text-tertiary))">
                            {p.medium}
                          </text>
                          <line x1={PAD_L} y1={y} x2={dropX} y2={y}
                            stroke="hsl(var(--data))" strokeWidth="1.4" />
                          <line x1={dropX} y1={y} x2={endX} y2={y}
                            stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" strokeDasharray="2 4" />
                          <circle cx={dropX} cy={y} r="4.5" fill="hsl(var(--accent))" />
                          <text x={endX + 12} y={y - 1}
                            fontFamily="Inter, sans-serif" fontSize="12" fill="hsl(var(--text-primary))">
                            {p.title}
                          </text>
                          <text x={endX + 12} y={y + 13}
                            fontFamily="JetBrains Mono, monospace" fontSize="10" fill="hsl(var(--accent))">
                            {p.dropout_pct}%
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </section>
          )}

          {/* metric cards */}
          {rows.length > 0 && (
            <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "spread", num: `${spread} pts`, cap: spread <= 10 ? "tighter than 94% of writers" : "across your entire body of work" },
                { label: "median dropout", num: `${median}%`, cap: "right before the midpoint" },
                { label: "shared symptom", num: sharedSymptomCount, cap: sharedSymptom ?? "pattern pending" },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-surface-muted p-5">
                  <Overline>{m.label}</Overline>
                  <div className="mt-3 font-sans-ui text-[28px] font-medium text-ink">{m.num}</div>
                  <div className="mt-1 font-sans-ui text-[13px] lowercase text-ink-secondary">{m.cap}</div>
                </div>
              ))}
            </section>
          )}

          {/* signature */}
          {signatureProse && (
            <section className="mt-16 pl-8 py-2" style={{ borderLeft: "2px solid hsl(var(--accent))" }}>
              <Overline accent>the signature</Overline>
              <div className="mt-5 font-serif text-[20px] text-ink max-w-[620px]" style={{ lineHeight: 1.8 }}>
                {signatureProse.split("\n\n").filter(Boolean).map((para, i) => (
                  <p key={i} className={i > 0 ? "mt-6" : ""}>{para}</p>
                ))}
              </div>
            </section>
          )}

          {hasPattern && bestCandidate && (
            <div className="mt-12">
              <BareButton to={`/reentry/${bestCandidate}`}>pick a project to revive →</BareButton>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
