const BASE = "/api";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${text}`);
  }
  return res.json();
}

// ---- shared types ----

export interface ArcPoint { x: number; y: number }

export interface VitalSign {
  label: string;
  value: string;
  decline: boolean;
  spark: number[];
}

export interface Project {
  id: string;
  title: string;
  medium: string;
  word_count: number;
  last_touched: string;
  uploaded_at: string;
  source_filename: string;
  dropout_percent: number;
  emotional_arc_data: ArcPoint[];
  closest_arc: string;
  arc_correlation: number;
  vitals: VitalSign[];
  pre_computed_autopsy?: Autopsy | null;
}

export interface Autopsy {
  project_id: string;
  cause_of_death: string;
  diagnosis_prose: string;
  generated_at: string;
}

export interface PerProjectDropout {
  project_id: string;
  title: string;
  medium: string;
  dropout_pct: number;
}

export interface Pattern {
  id: string;
  project_ids: string[];
  signature_name: string;
  signature_prose: string;
  dropout_spread_pts: number;
  dropout_median_pct: number;
  shared_symptom: string;
  shared_symptom_count: string;
  best_revival_candidate_id: string;
  per_project_dropouts: PerProjectDropout[];
  generated_at: string;
}

export interface LiteraryPrecedent {
  author: string;
  work: string;
  chapter: string;
  passage: string;
  adaptation_note: string;
}

export interface LocalPlace {
  name: string;
  details: string;
}

export interface Reentry {
  id: string;
  project_id: string;
  pattern_id: string;
  obstacle_prose: string;
  scope: string;
  due: string;
  the_ask: string;
  three_angles: string[];
  why_breaks_pattern: string;
  why_succeeds_even_if: string;
  literary_precedent?: LiteraryPrecedent | null;
  local_places: LocalPlace[];
  generated_at: string;
}

// ---- API client ----

export const api = {
  uploadProjects: async (files: File[]): Promise<Project[]> => {
    const form = new FormData();
    files.forEach(f => form.append("files", f));
    const res = await fetch(`${BASE}/projects/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.projects;
  },

  listProjects: (): Promise<{ projects: Project[] }> =>
    req("/projects"),

  getProject: (id: string): Promise<Project> =>
    req(`/projects/${id}`),

  deleteProject: (id: string): Promise<void> =>
    req(`/projects/${id}`, { method: "DELETE" }),

  generateAutopsy: (projectId: string, refresh = false): Promise<Autopsy> =>
    req(`/projects/${projectId}/autopsy${refresh ? "?refresh=true" : ""}`, { method: "POST" }),

  getAutopsy: (projectId: string): Promise<Autopsy> =>
    req(`/projects/${projectId}/autopsy`),

  generatePattern: (projectIds: string[]): Promise<Pattern> =>
    req("/pattern", { method: "POST", body: JSON.stringify({ project_ids: projectIds }) }),

  getLatestPattern: (): Promise<Pattern> =>
    req("/pattern/latest"),

  generateReentry: (params: {
    project_id: string;
    pattern_id: string;
    enable_gutendex?: boolean;
    enable_places?: boolean;
  }): Promise<Reentry> =>
    req("/reentry", { method: "POST", body: JSON.stringify({ enable_gutendex: true, enable_places: false, ...params }) }),
};
