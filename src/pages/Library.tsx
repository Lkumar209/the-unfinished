import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BareButton } from "@/components/BareButton";
import { LeftRail } from "@/components/LeftRail";
import { Overline } from "@/components/Overline";
import { api } from "@/lib/api";

export default function Library() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.listProjects(),
  });

  const projects = data?.projects ?? [];

  return (
    <div className="min-h-screen bg-background fade-in">
      <div className="max-w-dash mx-auto px-6 md:px-20 lg:flex lg:gap-12">
        <LeftRail />

        <main className="flex-1 py-12 lg:py-20 min-w-0">
          <Overline className="mb-6">library</Overline>

          {isLoading ? (
            <p className="font-serif text-ink-secondary">reading the archive...</p>
          ) : isError ? (
            <p className="font-serif text-ink-secondary">could not reach the backend. is it running?</p>
          ) : projects.length === 0 ? (
            <>
              <h1 className="font-serif text-[36px] md:text-[40px] leading-[1.1] text-ink mb-6">
                nothing here yet.
              </h1>
              <p className="font-serif text-[17px] leading-[1.7] text-ink-secondary max-w-[620px]">
                upload your unfinished work to begin.
              </p>
              <div className="mt-10">
                <BareButton to="/upload">go to intake →</BareButton>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-serif text-[36px] md:text-[40px] leading-[1.1] text-ink mb-6">
                {projects.length === 1 ? "one unfinished work." : `${projects.length} unfinished works.`}
              </h1>
              <p className="font-serif text-[17px] leading-[1.7] text-ink-secondary max-w-[620px]">
                each one has been examined. click any project to read its autopsy, or skip to the pattern across all of them.
              </p>

              <div className="mt-10 flex justify-end">
                <BareButton to="/pattern">see the pattern across all {projects.length} →</BareButton>
              </div>

              <div className="mt-12">
                {projects.map((p) => (
                  <Link
                    to={`/autopsy/${p.id}`}
                    key={p.id}
                    className="flex items-center gap-6 py-6 border-t-hair hover:bg-surface-muted transition-colors duration-300 cursor-pointer px-2 -mx-2 rounded-md"
                  >
                    <div className="font-mono-ui text-[12px] text-ink-tertiary w-[100px] shrink-0">
                      {p.medium}
                    </div>
                    <div className="font-serif text-[18px] text-ink flex-1 min-w-0">
                      {p.title}
                    </div>
                    <div className="font-sans-ui text-[13px] text-ink-secondary lowercase w-[200px] shrink-0 hidden md:block">
                      {p.vitals[0]?.label ?? p.medium}
                    </div>
                    <div className="font-mono-ui text-[12px] text-accent w-[120px] shrink-0 text-right">
                      stopped at {p.dropout_percent}%
                    </div>
                  </Link>
                ))}
                <div className="border-t-hair" />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
