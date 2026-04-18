import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LeftRail } from "@/components/LeftRail";
import { Overline } from "@/components/Overline";
import { BareButton } from "@/components/BareButton";
import { api, type ArcPoint } from "@/lib/api";

const W = 640;
const H = 200;
const PAD_L = 36;
const PAD_R = 24;
const PAD_T = 16;
const PAD_B = 30;

function arcToPath(pts: ArcPoint[]): string {
  if (!pts.length) return "";
  const xs = pts.map(p => (p.x / 100) * (W - PAD_L - PAD_R) + PAD_L);
  const ys = pts.map(p => {
    const t = (p.y + 1) / 2;
    return PAD_T + (1 - t) * (H - PAD_T - PAD_B);
  });
  let d = `M ${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
  for (let i = 1; i < xs.length; i++) {
    const cx = (xs[i - 1] + xs[i]) / 2;
    d += ` Q ${cx.toFixed(1)} ${ys[i - 1].toFixed(1)} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`;
  }
  return d;
}

function canonicalManInHole(): string {
  const pts: ArcPoint[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = (i / 40) * 100;
    const t = x / 100;
    const y = 0.5 - 1.2 * Math.sin(Math.PI * t);
    pts.push({ x, y: y * 0.9 });
  }
  return arcToPath(pts);
}

function Sparkline({ data, accent }: { data: number[]; accent: boolean }) {
  const w = 80, h = 24;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${(i * step).toFixed(1)},${(h - v * h).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} className="block">
      <polyline points={pts} fill="none"
        stroke={accent ? "hsl(var(--accent))" : "hsl(var(--data))"}
        strokeWidth="1" />
    </svg>
  );
}

const LOADING_MESSAGES = [
  "reading the work...",
  "laying it against the six canonical arcs...",
  "measuring where the voice thins...",
  "writing the diagnosis...",
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

export default function Autopsy() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data: project, isLoading: projLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.getProject(id!),
    enabled: !!id,
  });

  const { data: autopsy, isLoading: autopsyLoading, isError: autopsyMissing } = useQuery({
    queryKey: ["autopsy", id],
    queryFn: () => api.getAutopsy(id!),
    enabled: !!id,
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: () => api.generateAutopsy(id!),
    onSuccess: (data) => {
      qc.setQueryData(["autopsy", id], data);
    },
  });

  // trigger generation if not found
  useEffect(() => {
    if (autopsyMissing && !generateMutation.isPending && !generateMutation.isSuccess) {
      generateMutation.mutate();
    }
  }, [autopsyMissing]);

  if (projLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-serif text-ink-secondary">opening the file...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-ink-secondary mb-6">no such project.</p>
          <BareButton to="/library">return to library</BareButton>
        </div>
      </div>
    );
  }

  const arc = project.emotional_arc_data;
  const dropout = project.dropout_percent;
  const dropoutPx = (dropout / 100) * (W - PAD_L - PAD_R) + PAD_L;
  const lastPoint = arc[arc.length - 1] ?? { x: 0, y: 0 };
  const dropY = PAD_T + (1 - ((lastPoint.y + 1) / 2)) * (H - PAD_T - PAD_B);

  const diagnosisShort = autopsy?.cause_of_death ?? "...";
  const diagnosisProse = autopsy?.diagnosis_prose ?? "";
  const fitNote = `against ${project.closest_arc} — closest fit, r=${project.arc_correlation}`;

  const diagnosisLoading = autopsyLoading || generateMutation.isPending;

  return (
    <div className="min-h-screen bg-background fade-in">
      <div className="max-w-dash mx-auto px-6 md:px-20 lg:flex lg:gap-12">
        <LeftRail />

        <main className="flex-1 py-12 lg:py-20 min-w-0">
          <div className="flex items-start justify-between gap-8 mb-2">
            <div className="min-w-0">
              <Overline className="mb-6">autopsy · {project.medium}</Overline>
              <h1 className="font-serif text-[36px] md:text-[40px] leading-[1.1] text-ink">
                {project.title}
              </h1>
              <p className="mt-3 font-sans-ui text-[13px] lowercase text-ink-secondary">
                {project.medium} · {project.word_count.toLocaleString()} words
                {project.last_touched ? ` · last touched ${project.last_touched}` : ""}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <Overline>cause of death</Overline>
              <div className="mt-2 font-sans-ui text-[15px] font-medium lowercase text-accent">
                {diagnosisLoading ? (
                  <span className="animate-pulse">diagnosing...</span>
                ) : diagnosisShort}
              </div>
            </div>
          </div>

          {/* arc chart */}
          <section className="mt-24">
            <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
              <Overline>emotional arc</Overline>
              <div className="font-mono-ui text-[11px] text-ink-tertiary">{fitNote}</div>
            </div>

            <div className="overflow-x-auto">
              <svg width={W} height={H} className="block max-w-full">
                <path d={canonicalManInHole()} fill="none"
                  stroke="rgba(0,0,0,0.18)" strokeWidth="1" strokeDasharray="3 4" />
                {arc.length > 1 && (
                  <path d={arcToPath(arc)} fill="none"
                    stroke="hsl(var(--accent))" strokeWidth="1.6" />
                )}
                <circle cx={dropoutPx} cy={dropY} r="4" fill="hsl(var(--accent))" />
                <line x1={dropoutPx} y1={dropY} x2={dropoutPx} y2={PAD_T - 4}
                  stroke="hsl(var(--accent))" strokeWidth="0.5" strokeDasharray="2 3" />
                <text x={dropoutPx + 8} y={PAD_T + 6}
                  fontFamily="JetBrains Mono, monospace" fontSize="10" fill="hsl(var(--accent))">
                  stopped here · {dropout}%
                </text>
                {[0, 50, 100].map(t => {
                  const x = (t / 100) * (W - PAD_L - PAD_R) + PAD_L;
                  return (
                    <text key={t} x={x} y={H - 8} textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace" fontSize="10" fill="hsl(var(--text-tertiary))">
                      {t}%
                    </text>
                  );
                })}
                <line x1={PAD_L} y1={H - PAD_B + 2} x2={W - PAD_R} y2={H - PAD_B + 2}
                  stroke="rgba(0,0,0,0.16)" strokeWidth="0.5" />
              </svg>
            </div>
          </section>

          {/* vital signs */}
          <section className="mt-16">
            <Overline className="mb-6">vital signs</Overline>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {project.vitals.map((v) => (
                <div key={v.label} className="rounded-lg p-4 bg-surface-muted">
                  <div className="font-sans-ui text-[12px] lowercase text-ink-secondary">{v.label}</div>
                  <div className="my-3"><Sparkline data={v.spark} accent={v.decline} /></div>
                  <div className={"font-mono-ui text-[24px] font-medium " + (v.decline ? "text-accent" : "text-ink")}>
                    {v.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* diagnosis */}
          <section className="mt-16">
            <Overline className="mb-6">diagnosis</Overline>

            {diagnosisLoading ? (
              <div className="max-w-[620px]">
                <RotatingMessage />
                <div className="mt-4 space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-4 bg-surface-muted rounded animate-pulse" style={{ width: `${90 - i * 8}%` }} />
                  ))}
                </div>
              </div>
            ) : generateMutation.isError ? (
              <p className="font-sans-ui text-[13px] text-accent">
                diagnosis failed: {generateMutation.error?.message}
              </p>
            ) : diagnosisProse ? (
              <div className="font-serif text-[18px] text-ink max-w-[620px]" style={{ lineHeight: 1.8 }}>
                {diagnosisProse.split("\n\n").filter(Boolean).map((para, i) => (
                  <p key={i} className={i > 0 ? "mt-6" : ""}>{para}</p>
                ))}
              </div>
            ) : null}

            {!diagnosisLoading && (
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  to={`/reentry/${project.id}`}
                  className="inline-flex items-center justify-center font-sans-ui text-[14px] lowercase px-6 py-3 rounded-md transition-colors duration-300"
                  style={{ border: "0.5px solid rgba(0,0,0,0.16)" }}
                >
                  draft a reentry plan →
                </Link>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
