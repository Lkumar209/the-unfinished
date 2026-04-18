import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BareButton } from "@/components/BareButton";
import { Overline } from "@/components/Overline";
import { Wordmark } from "@/components/Wordmark";
import { api } from "@/lib/api";

export default function Upload() {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverDrop, setHoverDrop] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.listProjects(),
  });
  const projects = data?.projects ?? [];

  const upload = useMutation({
    mutationFn: (files: File[]) => api.uploadProjects(files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    upload.mutate(Array.from(files));
  };

  return (
    <div className="min-h-screen bg-background fade-in">
      <header className="border-b-hair">
        <div className="max-w-dash mx-auto flex items-center justify-between px-6 md:px-20 py-6">
          <Wordmark />
        </div>
      </header>

      <main className="px-6 md:px-20">
        <div className="max-w-[640px] mx-auto pt-[12vh] pb-24">
          <Overline className="mb-6">step 01 · intake</Overline>
          <h1 className="font-serif text-[40px] md:text-[48px] leading-[1.08] text-ink mb-6">
            bring your dead.
          </h1>
          <p className="font-serif text-[17px] leading-[1.7] text-ink-secondary">
            drop any combination of .docx, .pdf, .fdx, .mp3, .wav, .jpg, .png. we'll handle the rest. the more projects you upload, the sharper the pattern.
          </p>

          {/* drop zone */}
          <div
            onMouseEnter={() => setHoverDrop(true)}
            onMouseLeave={() => setHoverDrop(false)}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="mt-12 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-300"
            style={{
              height: 240,
              border: (hoverDrop || dragOver) ? "1px dashed rgba(0,0,0,0.32)" : "1px dashed rgba(0,0,0,0.16)",
              background: dragOver ? "hsl(43 22% 92%)" : "hsl(43 22% 95%)",
            }}
          >
            <div className="text-center">
              {upload.isPending ? (
                <div className="font-sans-ui text-[14px] lowercase text-ink-secondary animate-pulse">
                  reading your work...
                </div>
              ) : (
                <>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 text-ink-tertiary">
                    <path d="M12 16V4M12 4l-4 4M12 4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                  </svg>
                  <div className="font-sans-ui text-[14px] lowercase text-ink-secondary">
                    drag files here, or click to browse
                  </div>
                </>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.docx,.pdf,.fdx,.mp3,.wav,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {upload.isError && (
            <p className="mt-4 font-sans-ui text-[13px] text-accent">
              upload failed: {upload.error?.message}
            </p>
          )}

          {/* project list */}
          {projects.length > 0 && (
            <div className="mt-16">
              <Overline className="mb-4">already in intake</Overline>
              <div>
                {projects.map((p, i) => (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(null)}
                    className="flex items-center gap-4 py-4 border-b-hair transition-colors duration-300 group"
                  >
                    <div className="w-4 flex justify-center">
                      {hoverIdx === i ? (
                        <div className="w-3 h-3 rounded-full" style={{ border: "0.5px solid rgba(0,0,0,0.32)" }} />
                      ) : null}
                    </div>
                    <div className="font-mono-ui text-[12px] text-ink-tertiary w-[90px] shrink-0">
                      {p.medium}
                    </div>
                    <div className="font-serif text-[17px] text-ink flex-1">{p.title}</div>
                    <div className="font-mono-ui text-[12px] text-ink-tertiary">
                      {p.last_touched || p.word_count.toLocaleString() + " words"}
                    </div>
                    <button
                      onClick={() => remove.mutate(p.id)}
                      disabled={remove.isPending}
                      className="w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-ink-tertiary hover:text-ink"
                      aria-label="remove"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                        <line x1="1" y1="1" x2="9" y2="9" />
                        <line x1="9" y1="1" x2="1" y2="9" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 flex items-center justify-between border-t-hair pt-6">
            <div className="font-mono-ui text-[12px] text-ink-tertiary">
              {projects.length} project{projects.length !== 1 ? "s" : ""} ready
            </div>
            {projects.length > 0 && (
              <BareButton to="/library">begin diagnosis →</BareButton>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
