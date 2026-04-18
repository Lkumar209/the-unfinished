export type Medium = "novel" | "screenplay" | "song";

export interface ArcPoint { x: number; y: number }

export interface VitalSign {
  label: string;
  value: string;       // e.g. "−41%"
  decline: boolean;    // accent color when true
  spark: number[];     // small series for sparkline (0..1)
}

export interface Project {
  id: string;
  title: string;
  medium: Medium;
  wordCount: number;
  lastTouched: string;        // pretty: "feb 2024"
  intendedArcPercent: number; // 32..41 — the dropout
  emotionalArcData: ArcPoint[];
  diagnosisShort: string;     // e.g. "midpoint collapse"
  diagnosis: string;          // full prose, used in /autopsy
  fitNote: string;            // e.g. "against man in a hole — closest fit, r=0.81"
  vitals: VitalSign[];
}

/**
 * Build an emotional arc that trails off at `dropoutPercent` (0..100).
 * Roughly follows a "man in a hole" shape until the dropout, then thins.
 */
function buildArc(dropoutPercent: number, seed: number): ArcPoint[] {
  const pts: ArcPoint[] = [];
  const N = 40;
  // pseudo-random
  const rand = (i: number) => {
    const s = Math.sin(seed * 9301 + i * 49297) * 233280;
    return s - Math.floor(s);
  };
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * 100;
    if (x > dropoutPercent) break;
    // man in a hole: start ~0.6, dip to ~-0.6 around 35%, climb back
    const t = x / 100;
    let y = 0.6 - 1.4 * Math.sin(Math.PI * Math.min(t / 0.6, 1));
    // soften and add tiny noise
    y = y * 0.85 + (rand(i) - 0.5) * 0.08;
    // taper amplitude as we approach the dropout — voice thins
    const proximity = Math.max(0, 1 - (dropoutPercent - x) / 8);
    y = y * (1 - proximity * 0.35);
    pts.push({ x, y });
  }
  return pts;
}

function spark(seed: number, declining = true): number[] {
  const out: number[] = [];
  for (let i = 0; i < 16; i++) {
    const s = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    const r = s - Math.floor(s);
    const trend = declining ? 1 - i / 18 : 0.5 + i / 32;
    out.push(Math.max(0.05, Math.min(0.95, trend * 0.85 + r * 0.18)));
  }
  return out;
}

export const PROJECTS: Project[] = [
  {
    id: "1",
    title: "the cartographer's wife",
    medium: "novel",
    wordCount: 22480,
    lastTouched: "aug 2023",
    intendedArcPercent: 34,
    emotionalArcData: buildArc(34, 11),
    diagnosisShort: "interiority gap",
    fitNote: "against man in a hole — closest fit, r=0.78",
    diagnosis:
      "the prose grows precise as the feeling grows vague. you are mapping the room while the marriage ends in it.",
    vitals: [
      { label: "vocabulary richness", value: "−28%", decline: true, spark: spark(1, true) },
      { label: "sentence length", value: "−19%", decline: true, spark: spark(2, true) },
      { label: "dialogue ratio", value: "+62%", decline: false, spark: spark(3, false) },
      { label: "paragraph length", value: "−44%", decline: true, spark: spark(4, true) },
    ],
  },
  {
    id: "2",
    title: "the weight of august",
    medium: "novel",
    wordCount: 14203,
    lastTouched: "feb 2024",
    intendedArcPercent: 38,
    emotionalArcData: buildArc(38, 22),
    diagnosisShort: "midpoint collapse",
    fitNote: "against man in a hole — closest fit, r=0.81",
    diagnosis:
      "the novel dies in the descent. you stopped writing the page before she decides anything about it.",
    vitals: [
      { label: "vocabulary richness", value: "−41%", decline: true, spark: spark(5, true) },
      { label: "sentence length", value: "−33%", decline: true, spark: spark(6, true) },
      { label: "dialogue ratio", value: "+58%", decline: false, spark: spark(7, false) },
      { label: "paragraph length", value: "−37%", decline: true, spark: spark(8, true) },
    ],
  },
  {
    id: "3",
    title: "lateral movement",
    medium: "screenplay",
    wordCount: 9120,
    lastTouched: "may 2024",
    intendedArcPercent: 36,
    emotionalArcData: buildArc(36, 33),
    diagnosisShort: "bridge avoidance",
    fitNote: "against man in a hole — closest fit, r=0.74",
    diagnosis:
      "the second act is a hallway your protagonist refuses to enter. you wrote her to the threshold and stopped.",
    vitals: [
      { label: "scene count", value: "−22%", decline: true, spark: spark(9, true) },
      { label: "scene length", value: "−31%", decline: true, spark: spark(10, true) },
      { label: "dialogue density", value: "+44%", decline: false, spark: spark(11, false) },
      { label: "action lines", value: "−39%", decline: true, spark: spark(12, true) },
    ],
  },
  {
    id: "4",
    title: "the lost weekend, revised",
    medium: "screenplay",
    wordCount: 11540,
    lastTouched: "nov 2022",
    intendedArcPercent: 41,
    emotionalArcData: buildArc(41, 44),
    diagnosisShort: "midpoint collapse",
    fitNote: "against man in a hole — closest fit, r=0.69",
    diagnosis:
      "you set up a confession and walked away from the scene where it would have to land.",
    vitals: [
      { label: "scene count", value: "−18%", decline: true, spark: spark(13, true) },
      { label: "scene length", value: "−26%", decline: true, spark: spark(14, true) },
      { label: "dialogue density", value: "+51%", decline: false, spark: spark(15, false) },
      { label: "action lines", value: "−34%", decline: true, spark: spark(16, true) },
    ],
  },
  {
    id: "5",
    title: "song for a flooded basement",
    medium: "song",
    wordCount: 612,
    lastTouched: "jan 2025",
    intendedArcPercent: 33,
    emotionalArcData: buildArc(33, 55),
    diagnosisShort: "bridge avoidance",
    fitNote: "against man in a hole — closest fit, r=0.71",
    diagnosis:
      "two verses, no bridge. the song wants to mean something and you stopped before it had to.",
    vitals: [
      { label: "lexical density", value: "−24%", decline: true, spark: spark(17, true) },
      { label: "line length", value: "−15%", decline: true, spark: spark(18, true) },
      { label: "rhyme regularity", value: "+38%", decline: false, spark: spark(19, false) },
      { label: "image specificity", value: "−42%", decline: true, spark: spark(20, true) },
    ],
  },
  {
    id: "6",
    title: "untitled (for r.)",
    medium: "song",
    wordCount: 384,
    lastTouched: "jul 2024",
    intendedArcPercent: 35,
    emotionalArcData: buildArc(35, 66),
    diagnosisShort: "interiority gap",
    fitNote: "against man in a hole — closest fit, r=0.66",
    diagnosis:
      "you described what she did. you never said how it landed in you.",
    vitals: [
      { label: "lexical density", value: "−31%", decline: true, spark: spark(21, true) },
      { label: "line length", value: "−12%", decline: true, spark: spark(22, true) },
      { label: "rhyme regularity", value: "+47%", decline: false, spark: spark(23, false) },
      { label: "image specificity", value: "−36%", decline: true, spark: spark(24, true) },
    ],
  },
  {
    id: "7",
    title: "small hours",
    medium: "song",
    wordCount: 498,
    lastTouched: "mar 2024",
    intendedArcPercent: 39,
    emotionalArcData: buildArc(39, 77),
    diagnosisShort: "midpoint collapse",
    fitNote: "against man in a hole — closest fit, r=0.73",
    diagnosis:
      "the chorus arrives twice and never deepens. the song asked a question it didn't sit with.",
    vitals: [
      { label: "lexical density", value: "−19%", decline: true, spark: spark(25, true) },
      { label: "line length", value: "−21%", decline: true, spark: spark(26, true) },
      { label: "rhyme regularity", value: "+33%", decline: false, spark: spark(27, false) },
      { label: "image specificity", value: "−29%", decline: true, spark: spark(28, true) },
    ],
  },
];

export const STATS = {
  projects: PROJECTS.length,
  mediums: new Set(PROJECTS.map(p => p.medium)).size,
  medianDropout: 36,
  spread: Math.max(...PROJECTS.map(p => p.intendedArcPercent)) - Math.min(...PROJECTS.map(p => p.intendedArcPercent)),
};

export function getProject(id: string | undefined): Project | undefined {
  return PROJECTS.find(p => p.id === id);
}
