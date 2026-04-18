import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LeftRail } from "@/components/LeftRail";
import { Overline } from "@/components/Overline";
import { BareButton } from "@/components/BareButton";
import { api } from "@/lib/api";

export default function Reentry() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => api.getProject(id!),
    enabled: !!id,
  });

  const { data: pattern } = useQuery({
    queryKey: ["pattern/latest"],
    queryFn: () => api.getLatestPattern(),
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: () => api.generateReentry({
      project_id: id!,
      pattern_id: pattern!.id,
      enable_gutendex: true,
    }),
    onSuccess: (data) => {
      qc.setQueryData(["reentry", id], data);
    },
  });

  const reentry = generateMutation.data ?? qc.getQueryData<ReturnType<typeof generateMutation.mutate>>(["reentry", id]);

  // auto-trigger if pattern is available
  useEffect(() => {
    if (pattern && id && !generateMutation.isPending && !generateMutation.isSuccess && !generateMutation.isError) {
      generateMutation.mutate();
    }
  }, [pattern, id]);

  const title = project?.title ?? "untitled";

  return (
    <div className="min-h-screen bg-background fade-in">
      <div className="max-w-dash mx-auto px-6 md:px-20 lg:flex lg:gap-12">
        <LeftRail />

        <main className="flex-1 py-12 lg:py-20 min-w-0">
          <div className="max-w-[680px]">
            <Overline className="mb-6">reentry plan · {title}</Overline>
            <h1 className="font-serif text-[36px] md:text-[42px] leading-[1.1] text-ink">
              one scene. this sunday.
            </h1>
            <p className="mt-4 font-serif text-[17px] leading-[1.7] text-ink-secondary">
              not a revival plan. not an outline. the smallest possible thing that breaks the pattern.
            </p>

            {!pattern && (
              <div className="mt-12">
                <p className="font-serif text-[17px] text-ink-secondary">
                  run the pattern analysis first — reentry plans require the cross-project diagnosis.
                </p>
                <div className="mt-4">
                  <BareButton to="/pattern">go to pattern →</BareButton>
                </div>
              </div>
            )}

            {generateMutation.isPending && (
              <div className="mt-12 space-y-3">
                {["naming the obstacle...", "sizing the assignment...", "writing the prescription..."].map((msg, i) => (
                  <p key={i} className="font-sans-ui text-[14px] lowercase text-ink-secondary animate-pulse"
                    style={{ opacity: 1 - i * 0.25 }}>
                    {msg}
                  </p>
                ))}
              </div>
            )}

            {generateMutation.isError && (
              <div className="mt-12">
                <p className="font-sans-ui text-[13px] text-accent">
                  generation failed: {generateMutation.error?.message}
                </p>
                <div className="mt-4">
                  <BareButton onClick={() => generateMutation.mutate()}>try again</BareButton>
                </div>
              </div>
            )}

            {generateMutation.isSuccess && generateMutation.data && (() => {
              const r = generateMutation.data;
              return (
                <>
                  {/* the obstacle */}
                  <section className="mt-12">
                    <Overline className="mb-4">the obstacle, named</Overline>
                    <div className="rounded-lg bg-surface-muted p-6">
                      <p className="font-serif text-[18px] text-ink" style={{ lineHeight: 1.8 }}>
                        {r.obstacle_prose}
                      </p>
                    </div>
                  </section>

                  {/* assignment */}
                  <section className="mt-12">
                    <Overline className="mb-4">the assignment</Overline>
                    <div className="rounded-lg bg-surface p-8" style={{ border: "0.5px solid rgba(0,0,0,0.16)" }}>
                      {[
                        { k: "scope", v: r.scope },
                        { k: "due", v: r.due },
                        { k: "the ask", v: r.the_ask },
                      ].map((row, i) => (
                        <div key={row.k} className="grid grid-cols-[80px_1fr] gap-6"
                          style={{ paddingTop: i === 0 ? 0 : 20, paddingBottom: 20 }}>
                          <div className="font-mono-ui text-[11px] tracking-[0.08em] lowercase text-ink-tertiary pt-1">
                            {row.k}
                          </div>
                          <div className="font-sans-ui text-[16px] font-medium text-ink leading-[1.6]">
                            {row.v}
                          </div>
                        </div>
                      ))}

                      {r.three_angles.length > 0 && (
                        <div className="border-t-hair pt-6 mt-2">
                          <Overline className="mb-4">three angles, pick one</Overline>
                          {r.three_angles.map((line, i, arr) => (
                            <div key={i}
                              className={"grid grid-cols-[40px_1fr] gap-4 py-4 " + (i < arr.length - 1 ? "border-b-hair" : "")}>
                              <div className="font-mono-ui text-[11px] text-ink-tertiary pt-1">
                                0{i + 1}
                              </div>
                              <div className="font-serif italic text-[17px] text-ink leading-[1.6]">
                                {line}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  {/* why this works */}
                  <section className="mt-12">
                    <Overline className="mb-4">why this works</Overline>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { t: "breaks the pattern because", b: r.why_breaks_pattern },
                        { t: "succeeds even if the scene is bad", b: r.why_succeeds_even_if },
                      ].map((c) => (
                        <div key={c.t} className="rounded-lg bg-surface-muted p-5">
                          <div className="font-sans-ui text-[13px] lowercase text-ink-secondary mb-2">{c.t}</div>
                          <div className="font-serif text-[16px] text-ink leading-[1.6]">{c.b}</div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* literary precedent */}
                  {r.literary_precedent && (
                    <section className="mt-12">
                      <Overline className="mb-4">how another writer handled this exact transition</Overline>
                      <blockquote className="font-serif italic text-[18px] text-ink-secondary pl-6"
                        style={{ borderLeft: "0.5px solid rgba(0,0,0,0.16)", lineHeight: 1.7 }}>
                        "{r.literary_precedent.passage}"
                      </blockquote>
                      <div className="mt-3 font-sans-ui text-[13px] text-ink-tertiary lowercase">
                        — {r.literary_precedent.author}, {r.literary_precedent.work}, {r.literary_precedent.chapter}
                      </div>
                      {r.literary_precedent.adaptation_note && (
                        <p className="mt-6 font-serif text-[16px] text-ink leading-[1.7]">
                          {r.literary_precedent.adaptation_note}
                        </p>
                      )}
                    </section>
                  )}

                  {/* local places */}
                  {r.local_places.length > 0 && (
                    <section className="mt-12">
                      <Overline className="mb-4">three places near you, this week</Overline>
                      <div>
                        {r.local_places.map((p, i, arr) => (
                          <div key={p.name}
                            className={"flex items-center justify-between gap-6 py-5 " + (i < arr.length ? "border-t-hair" : "")}>
                            <div className="min-w-0">
                              <div className="font-sans-ui text-[15px] font-medium lowercase text-ink">{p.name}</div>
                              <div className="font-sans-ui text-[13px] lowercase text-ink-secondary mt-1">{p.details}</div>
                            </div>
                            <div className="font-mono-ui text-[14px] text-ink-tertiary shrink-0">→</div>
                          </div>
                        ))}
                        <div className="border-t-hair" />
                      </div>
                    </section>
                  )}

                  {/* footer cta */}
                  <section className="mt-12">
                    <div className="rounded-lg bg-surface-muted p-6 flex items-center justify-between gap-6 flex-wrap">
                      <div className="font-serif text-[16px] text-ink-secondary leading-[1.6] max-w-[420px]">
                        upload the two pages by {r.due.split("·")[1]?.trim() ?? "sunday"}. we'll read them and tell you what just changed.
                      </div>
                      <BareButton>i'll do it →</BareButton>
                    </div>
                  </section>
                </>
              );
            })()}
          </div>
        </main>
      </div>
    </div>
  );
}
