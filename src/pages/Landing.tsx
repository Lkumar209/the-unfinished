import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Overline } from "@/components/Overline";
import { Wordmark } from "@/components/Wordmark";
import { api } from "@/lib/api";

export default function Landing() {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.listProjects(),
    enabled: open,
  });
  const projects = data?.projects ?? [];

  const upload = useMutation({
    mutationFn: (files: File[]) => api.uploadProjects(files),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const belowFoldRef = useRef<HTMLDivElement>(null);
  const [scrolledDown, setScrolledDown] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolledDown(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScrollToggle = () => {
    if (scrolledDown) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      belowFoldRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const ACCEPTED_EXTS = new Set([".txt",".docx",".pdf",".fdx",".mp3",".wav",".jpg",".jpeg",".png"]);
  const [fileTypeError, setFileTypeError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const invalid = Array.from(files).filter(f => {
      const ext = "." + f.name.split(".").pop()?.toLowerCase();
      return !ACCEPTED_EXTS.has(ext);
    });
    if (invalid.length > 0) {
      setFileTypeError(`unsupported file type: ${invalid.map(f => f.name).join(", ")} — accepted formats: .docx · .pdf · .fdx · .txt · .mp3 · .wav · .jpg · .png`);
      return;
    }
    setFileTypeError(null);
    upload.mutate(Array.from(files));
  };

  return (
    <div className="min-h-screen bg-background fade-in overflow-hidden">
      {/* nav */}
      <header className="border-b-hair">
        <div className="max-w-dash mx-auto flex items-center justify-between px-6 md:px-20 py-6">
          <Wordmark />
          {open && (
            <button
              onClick={() => setOpen(false)}
              className="font-sans-ui text-[14px] lowercase text-ink-secondary hover:text-ink transition-colors duration-300"
            >
              close
            </button>
          )}
        </div>
      </header>

      {/* split hero */}
      <div className="relative flex min-h-[calc(100vh-65px)]">

        {/* left — hero copy */}
        <div
          className="flex flex-col justify-center px-6 md:px-20 transition-all duration-500 ease-in-out"
          style={{ width: open ? "52%" : "100%", paddingTop: "12vh", paddingBottom: "12vh" }}
        >
          <div className="max-w-[680px]">

            <h1 className="font-serif text-[48px] md:text-[64px] lg:text-[72px] leading-[1.06] text-ink">
              you don't have a writer's block problem.
            </h1>
            <h1 className="font-serif text-[48px] md:text-[64px] lg:text-[72px] leading-[1.06] mt-2">
              <span className="text-accent">you have a pattern.</span>
            </h1>

            <p
              className="mt-10 text-[18px] leading-[1.7] text-ink-secondary font-serif transition-all duration-500"
              style={{ maxWidth: open ? "420px" : "560px" }}
            >
              upload the novels, screenplays, songs, and paintings you never finished. we'll tell you — with evidence — exactly where and why you keep quitting.
            </p>

            {!open && (
              <div className="mt-12">
                <button
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center justify-center font-sans-ui text-[14px] lowercase px-6 py-3 rounded-md transition-colors duration-300"
                  style={{ border: "0.5px solid rgba(0,0,0,0.24)" }}
                >
                  upload your graveyard →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* scroll hint */}
        {!open && (
          <button
            onClick={handleScrollToggle}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer group transition-opacity duration-300 hover:opacity-100"
            style={{ opacity: 0.55 }}
            aria-label={scrolledDown ? "scroll to top" : "scroll down"}
          >
            <span className="font-mono-ui text-[11px] lowercase tracking-widest text-ink-secondary group-hover:text-ink transition-colors duration-200">
              {scrolledDown ? "back to top" : "how it works ↓"}
            </span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{ border: "0.5px solid rgba(0,0,0,0.2)", background: "rgba(255,255,255,0.6)" }}
            >
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                className={`text-ink-secondary transition-transform duration-300 ${scrolledDown ? "rotate-180" : "animate-bounce"}`}
                style={{ animationDuration: "1.6s" }}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        )}

        {/* right — upload panel */}
        <div
          className="absolute right-0 top-0 h-full flex flex-col justify-center px-12 transition-all duration-500 ease-in-out overflow-y-auto"
          style={{
            width: "48%",
            opacity: open ? 1 : 0,
            transform: open ? "translateX(0)" : "translateX(40px)",
            pointerEvents: open ? "auto" : "none",
            borderLeft: "0.5px solid rgba(0,0,0,0.08)",
          }}
        >
          <div className="w-full max-w-[480px] py-12">
            <Overline className="mb-6">intake</Overline>
            <p className="font-sans-ui text-[13px] lowercase text-ink-tertiary mb-8">
              .docx · .pdf · .fdx · .txt · .mp3 · .wav · .jpg · .png
            </p>

            {/* drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200"
              style={{
                height: 200,
                border: dragOver ? "1px dashed rgba(0,0,0,0.36)" : "1px dashed rgba(0,0,0,0.16)",
                background: dragOver ? "hsl(43 22% 92%)" : "hsl(43 22% 95%)",
              }}
            >
              {upload.isPending ? (
                <p className="font-sans-ui text-[13px] lowercase text-ink-secondary animate-pulse">
                  reading your work...
                </p>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 text-ink-tertiary">
                    <path d="M12 16V4M12 4l-4 4M12 4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  </svg>
                  <p className="font-sans-ui text-[13px] lowercase text-ink-secondary">
                    drag files here, or click to browse
                  </p>
                  <p className="font-sans-ui text-[11px] lowercase text-ink-tertiary mt-2">
                    the more you bring, the sharper the pattern
                  </p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.docx,.pdf,.fdx,.mp3,.wav,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {(fileTypeError || upload.isError) && (
              <p className="mt-3 font-sans-ui text-[12px] text-accent">
                {fileTypeError ?? "upload failed — please try again"}
              </p>
            )}

            {/* uploaded files list */}
            {projects.length > 0 && (
              <div className="mt-8">
                <Overline className="mb-3">in intake</Overline>
                <div>
                  {projects.map((p, i) => (
                    <div
                      key={p.id}
                      onMouseEnter={() => setHoverIdx(i)}
                      onMouseLeave={() => setHoverIdx(null)}
                      className="flex items-center gap-3 py-3 border-b-hair group"
                    >
                      <div className="font-mono-ui text-[11px] text-ink-tertiary w-[72px] shrink-0">
                        {p.medium}
                      </div>
                      <div className="font-serif text-[15px] text-ink flex-1 min-w-0 truncate">
                        {p.title}
                      </div>
                      <div className="font-mono-ui text-[11px] text-ink-tertiary shrink-0">
                        {p.word_count > 0 ? p.word_count.toLocaleString() + " w" : "—"}
                      </div>
                      <button
                        onClick={() => remove.mutate(p.id)}
                        disabled={remove.isPending}
                        className="w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-ink-tertiary hover:text-ink shrink-0"
                        aria-label="remove"
                      >
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                          <line x1="1" y1="1" x2="9" y2="9" />
                          <line x1="9" y1="1" x2="1" y2="9" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <p className="font-mono-ui text-[11px] text-ink-tertiary">
                    {projects.length} project{projects.length !== 1 ? "s" : ""} ready
                  </p>
                  <button
                    onClick={() => navigate("/library")}
                    className="font-sans-ui text-[13px] lowercase text-ink-secondary hover:text-ink transition-colors duration-200"
                  >
                    begin diagnosis →
                  </button>
                </div>
              </div>
            )}

            {projects.length === 0 && (
              <div className="mt-8 pt-6 border-t-hair">
                <p className="font-mono-ui text-[11px] text-ink-tertiary">
                  no account required · files stay local
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* below-fold — collapses when panel opens */}
      <div
        ref={belowFoldRef}
        className="transition-all duration-500 overflow-hidden"
        style={{ maxHeight: open ? "0px" : "800px", opacity: open ? 0 : 1 }}
      >
        <section className="px-6 md:px-20 pt-[80px]">
          <div className="max-w-dash mx-auto">
            <h2 className="font-serif text-[24px] text-ink mb-12">how the autopsy works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-[860px]">
              {[
                { k: "01 · intake", v: "you upload the work. we read every word and time-stamp every project to its abandonment." },
                { k: "02 · diagnosis", v: "we measure where each project's emotional arc breaks. then we find the place you keep stopping." },
                { k: "03 · prescription", v: "one assignment, scoped to a single weekend, designed to break the exact pattern we found." },
              ].map((s) => (
                <div key={s.k}>
                  <Overline className="mb-3">{s.k}</Overline>
                  <p className="font-serif text-[16px] leading-[1.7] text-ink">{s.v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 md:px-20 py-[100px]">
          <div className="max-w-dash mx-auto">
            <p className="font-serif italic text-[22px] leading-[1.5] text-ink-secondary max-w-[640px]">
              the goal is not to finish everything. the goal is to understand yourself well enough to finish one thing.
            </p>
          </div>
        </section>

        <footer className="border-t-hair">
          <div className="max-w-dash mx-auto px-6 md:px-20 py-10 font-mono-ui text-[12px] text-ink-tertiary leading-[1.9]">
            <div>the unfinished — a creative diagnostics project</div>
            <div>built at cmu · 2026</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
