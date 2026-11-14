/**
 * Field observations. Each one is stored as a class or flag and carries the
 * exact v5 instruction about what must NOT be inferred from it.
 */
export interface ObservationOption {
  value: string;
  label: string;
  note?: string;
}

export interface ObservationDef {
  key: string;
  section: number;
  question: string;
  glyph: "layers" | "drop" | "sprout" | "flask";
  hint: string;
  options: ObservationOption[];
  /** The inference the engine deliberately leaves to the measurement. */
  removedInference: string;
  /** What a lab test replaces this with. */
  replacesWith: string;
}

export const OBSERVATIONS: ObservationDef[] = [
  {
    key: "textureRibbon",
    section: 2,
    question: "How does the soil ribbon behave when you wet and squeeze it?",
    glyph: "layers",
    hint: "A feel test, not a lab analysis. It maps to the nearest texture class.",
    options: [
      { value: "sandy", label: "Gritty, will not hold a ribbon" },
      { value: "loamy", label: "Smooth-ish, short ribbon" },
      { value: "clay", label: "Sticky, long flexible ribbon" },
      { value: "silty", label: "Slick and floury, weak ribbon" },
      { value: "unknown", label: "Not sure" },
    ],
    removedInference: "maps the feel class to a USDA texture class and its centroid fractions; it does not claim a measured percentage",
    replacesWith: "Laboratory particle-size analysis (sand, silt and clay)",
  },
  {
    key: "compaction",
    section: 3,
    question: "How hard is the subsoil when you push a knife or auger in?",
    glyph: "layers",
    hint: "A field clue, not a density measurement. It adjusts the texture baseline.",
    options: [
      { value: "loose", label: "Loose, easy all the way" },
      { value: "friable", label: "Friable, slight resistance" },
      { value: "firm", label: "Firm, noticeable resistance" },
      { value: "hardpan", label: "Hard layer, refuses the knife" },
      { value: "unknown", label: "Not checked" },
    ],
    removedInference: "applies a fixed bulk-density offset (−0.08, 0, +0.12 or +0.22 g/cm³) on the texture baseline",
    replacesWith: "Intact-core bulk density or a penetrometer profile",
  },
  {
    key: "mottling",
    section: 6,
    question: "Do you see grey or rust mottling in the subsoil?",
    glyph: "layers",
    hint: "A drainage clue, not a water-table measurement.",
    options: [
      { value: "none", label: "No mottling" },
      { value: "few", label: "A few patches" },
      { value: "common", label: "Common, strong colours" },
      { value: "unknown", label: "Not checked" },
    ],
    removedInference: "maps visible mottling to a drainage class; it does not set a measured water-table depth",
    replacesWith: "Soil profile description plus seasonal water-table records",
  },
  {
    key: "surfaceSalt",
    section: 9,
    question: "Is there a white salt crust or salt-tolerant weed cover?",
    glyph: "flask",
    hint: "A visible crust is an EST salinity proxy. The formal check needs a saturated-paste ECe.",
    options: [
      { value: "none", label: "Nothing visible" },
      { value: "patches", label: "Occasional white patches" },
      { value: "crust", label: "Clear crust or bare saline patches" },
      { value: "unknown", label: "Not sure" },
    ],
    removedInference: "maps a visible crust to an estimated ECe range; only a saturated-paste ECe is a measurement",
    replacesWith: "Saturated-paste extract ECe with a stated root-zone depth",
  },
  {
    key: "reactionClue",
    section: 8,
    question: "What do the weeds and leaf colour suggest about soil reaction?",
    glyph: "sprout",
    hint: "A visual clue, not a pH test. It maps to an estimated pH class.",
    options: [
      { value: "acid", label: "Acid-loving weeds / stunted legumes" },
      { value: "neutral", label: "Mixed, healthy stand" },
      { value: "alkaline", label: "Alkaline weeds, yellowing on iron-sensitive crops" },
      { value: "unknown", label: "No clear signal" },
    ],
    removedInference: "maps a weed or leaf symptom to an estimated pH class; it is not a pass/fail diagnosis",
    replacesWith: "Laboratory pH (H₂O) with sample depth and method",
  },
  {
    key: "colour",
    section: 12,
    question: "How dark is the moist topsoil?",
    glyph: "layers",
    hint: "A colour clue, not an organic-matter measurement. It maps to an EST class.",
    options: [
      { value: "dark", label: "Dark brown / blackish" },
      { value: "medium", label: "Medium brown" },
      { value: "pale", label: "Pale / reddish / grey" },
      { value: "unknown", label: "Hard to judge" },
    ],
    removedInference: "maps colour to an estimated organic-matter class; it does not read exact SOM, SOC or CEC",
    replacesWith: "Laboratory organic carbon (SOC); a laboratory CEC also replaces the derived CEC",
  },
];

export const OBSERVATION_BY_KEY: Record<string, ObservationDef> =
  Object.fromEntries(OBSERVATIONS.map((o) => [o.key, o]));
