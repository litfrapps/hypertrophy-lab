// ============================================
// Hypertrophy Lab — Research Papers Database
// ============================================
// Curated, peer-reviewed research on hypertrophy training

import { ResearchPaper } from "@/types";

export const researchPapers: ResearchPaper[] = [
  // ─── VOLUME ───
  {
    id: "schoenfeld-2017-volume",
    title: "Dose-response relationship between weekly resistance training volume and increases in muscle mass",
    authors: ["Brad J. Schoenfeld", "Dan Ogborn", "James W. Krieger"],
    year: 2017,
    journal: "Journal of Sports Sciences",
    doi: "10.1080/02640414.2016.1210197",
    url: "https://pubmed.ncbi.nlm.nih.gov/27433992/",
    abstract: "A systematic review and meta-analysis examining the dose-response relationship between weekly resistance training volume and muscle hypertrophy. Results indicate that higher training volumes are associated with greater gains in muscle mass.",
    category: "Volume",
    keyFindings: [
      "Higher weekly sets per muscle group are associated with greater hypertrophy",
      "10+ sets per muscle group per week produced significantly greater gains than lower volumes",
      "A graded dose-response relationship exists between volume and muscle growth",
    ],
  },
  {
    id: "schoenfeld-2019-volume-limit",
    title: "Resistance Training Volume Enhances Muscle Hypertrophy but Not Strength in Trained Men",
    authors: ["Brad J. Schoenfeld", "Bret Contreras", "James Krieger", "Jozo Grgic", "Kenneth Delcastillo", "Ramon Belliard", "Andrew Alto"],
    year: 2019,
    journal: "Medicine & Science in Sports & Exercise",
    doi: "10.1249/MSS.0000000000001764",
    url: "https://pubmed.ncbi.nlm.nih.gov/30153194/",
    abstract: "This study compared the effects of 1, 3, and 5 sets per exercise on muscular adaptations in resistance-trained men over 8 weeks.",
    category: "Volume",
    keyFindings: [
      "5 sets produced greater hypertrophy than 1 or 3 sets",
      "Strength gains were similar across all volume conditions",
      "Higher volumes may be needed for continued muscle growth in trained individuals",
    ],
  },

  // ─── FREQUENCY ───
  {
    id: "schoenfeld-2016-frequency",
    title: "Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis",
    authors: ["Brad J. Schoenfeld", "Dan Ogborn", "James W. Krieger"],
    year: 2016,
    journal: "Sports Medicine",
    doi: "10.1007/s40279-016-0543-8",
    url: "https://pubmed.ncbi.nlm.nih.gov/27102172/",
    abstract: "A systematic review and meta-analysis investigating the effects of resistance training frequency on hypertrophic outcomes.",
    category: "Frequency",
    keyFindings: [
      "Training a muscle group 2× per week is superior to 1× per week for hypertrophy",
      "Volume-equated higher frequencies may provide a small additional benefit",
      "Training frequency should be at least 2× per week per muscle group",
    ],
  },

  // ─── INTENSITY ───
  {
    id: "schoenfeld-2017-load",
    title: "Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training: A Systematic Review and Meta-analysis",
    authors: ["Brad J. Schoenfeld", "Jozo Grgic", "Dan Ogborn", "James W. Krieger"],
    year: 2017,
    journal: "Journal of Strength and Conditioning Research",
    doi: "10.1519/JSC.0000000000002200",
    url: "https://pubmed.ncbi.nlm.nih.gov/28834797/",
    abstract: "A meta-analysis comparing low-load vs high-load resistance training for muscle hypertrophy and strength gains.",
    category: "Intensity",
    keyFindings: [
      "Both low-load and high-load training produce similar hypertrophy when taken to failure",
      "High-load training is superior for maximal strength gains",
      "Low-load training (>15 reps) can be effective for hypertrophy if sets are taken close to failure",
    ],
  },

  // ─── REST PERIODS ───
  {
    id: "schoenfeld-2016-rest",
    title: "Longer Interset Rest Periods Enhance Muscle Strength and Hypertrophy in Resistance-Trained Men",
    authors: ["Brad J. Schoenfeld", "Menno Henselmans", "Jozo Grgic"],
    year: 2016,
    journal: "Journal of Strength and Conditioning Research",
    doi: "10.1519/JSC.0000000000001272",
    url: "https://pubmed.ncbi.nlm.nih.gov/26605807/",
    abstract: "This study investigated the effects of short (1 min) vs long (3 min) rest intervals on muscular adaptations.",
    category: "Rest Periods",
    keyFindings: [
      "3-minute rest periods produced greater hypertrophy than 1-minute rest periods",
      "Longer rest periods allow for greater volume load which drives hypertrophy",
      "Short rest periods may impair muscle growth due to reduced performance in subsequent sets",
    ],
  },

  // ─── REP RANGES ───
  {
    id: "schoenfeld-2021-rep-ranges",
    title: "Loading Recommendations for Muscle Strength, Hypertrophy, and Local Endurance: A Re-Examination of the Repetition Continuum",
    authors: ["Brad J. Schoenfeld", "Jozo Grgic"],
    year: 2021,
    journal: "Sports",
    doi: "10.3390/sports9020032",
    url: "https://pubmed.ncbi.nlm.nih.gov/33671664/",
    abstract: "A comprehensive re-examination of the traditional repetition continuum and its implications for hypertrophy training.",
    category: "Rep Ranges",
    keyFindings: [
      "Hypertrophy can occur across a wide range of repetition ranges (6-30+ reps)",
      "The traditional 'hypertrophy zone' of 8-12 reps is not exclusively optimal",
      "Training across multiple rep ranges may optimize hypertrophy through varied stimuli",
    ],
  },

  // ─── TRAINING TO FAILURE ───
  {
    id: "grgic-2022-failure",
    title: "Effects of Resistance Training Performed to Repetition Failure or Non-Failure on Muscular Strength and Hypertrophy: A Systematic Review and Meta-Analysis",
    authors: ["Jozo Grgic", "Brad J. Schoenfeld", "John Orazem", "Filip Sabol"],
    year: 2022,
    journal: "Journal of Sport and Health Science",
    doi: "10.1016/j.jshs.2021.01.007",
    url: "https://pubmed.ncbi.nlm.nih.gov/33497853/",
    abstract: "A systematic review examining whether training to muscular failure is necessary for maximizing hypertrophy.",
    category: "Training to Failure",
    keyFindings: [
      "Training to failure is not necessary for maximizing hypertrophy",
      "Stopping 1-3 reps short of failure (RIR 1-3) appears sufficient",
      "Consistent failure training may increase fatigue and injury risk without proportional benefit",
    ],
  },

  // ─── EXERCISE SELECTION ───
  {
    id: "schoenfeld-2020-exercise-selection",
    title: "Resistance Training Recommendations to Maximize Muscle Hypertrophy in an Athletic Population: Position Stand of the IUSCA",
    authors: ["Brad J. Schoenfeld", "Jozo Grgic", "Derrick W. Van Every", "Daniel L. Plotkin"],
    year: 2021,
    journal: "International Journal of Strength and Conditioning",
    doi: "10.47206/ijsc.v1i1.81",
    url: "https://journals.lww.com/nsca-jscr/abstract/9900/resistance_training_recommendations_to_maximize.507.aspx",
    abstract: "A position stand providing evidence-based recommendations for exercise selection to maximize muscle hypertrophy.",
    category: "Exercise Selection",
    keyFindings: [
      "Multi-joint exercises should form the foundation of hypertrophy programs",
      "Single-joint exercises provide additional stimulus for specific muscles",
      "Exercise variety across training cycles may enhance overall development",
    ],
  },

  // ─── PERIODIZATION ───
  {
    id: "harries-2015-periodization",
    title: "Systematic Review and Meta-analysis of Linear and Undulating Periodized Resistance Training Programs on Muscular Strength",
    authors: ["Simon K. Harries", "David R. Lubans", "Robin Callister"],
    year: 2015,
    journal: "Journal of Strength and Conditioning Research",
    doi: "10.1519/JSC.0000000000000712",
    url: "https://pubmed.ncbi.nlm.nih.gov/25268290/",
    abstract: "A meta-analysis comparing linear and undulating periodization models for strength and hypertrophy.",
    category: "Periodization",
    keyFindings: [
      "Undulating periodization may offer a slight advantage for strength gains",
      "Both linear and undulating models are effective for hypertrophy",
      "Periodized programs outperform non-periodized approaches",
    ],
  },

  // ─── MUSCLE GROWTH MECHANISMS ───
  {
    id: "schoenfeld-2010-mechanisms",
    title: "The Mechanisms of Muscle Hypertrophy and Their Application to Resistance Training",
    authors: ["Brad J. Schoenfeld"],
    year: 2010,
    journal: "Journal of Strength and Conditioning Research",
    doi: "10.1519/JSC.0b013e3181e840f3",
    url: "https://pubmed.ncbi.nlm.nih.gov/20847704/",
    abstract: "A comprehensive review of the three primary mechanisms of muscle hypertrophy: mechanical tension, metabolic stress, and muscle damage.",
    category: "Muscle Growth",
    keyFindings: [
      "Mechanical tension is the primary driver of muscle hypertrophy",
      "Metabolic stress provides an additive hypertrophic effect",
      "Muscle damage may contribute to growth but is not essential",
    ],
  },

  // ─── NUTRITION ───
  {
    id: "morton-2018-protein",
    title: "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults",
    authors: ["Robert W. Morton", "Kevin T. Murphy", "Sean R. McKellar", "Brad J. Schoenfeld", "Menno Henselmans", "Eric Helms", "Alan A. Aragon", "Michaela C. Devries", "Laura Banfield", "James W. Krieger", "Stuart M. Phillips"],
    year: 2018,
    journal: "British Journal of Sports Medicine",
    doi: "10.1136/bjsports-2017-097608",
    url: "https://pubmed.ncbi.nlm.nih.gov/28698222/",
    abstract: "A comprehensive meta-analysis examining the effects of protein supplementation on resistance training outcomes.",
    category: "Nutrition",
    keyFindings: [
      "Protein supplementation significantly enhances muscle mass gains during resistance training",
      "Total daily protein intake of 1.6g/kg/day is sufficient for most individuals",
      "Benefits of protein supplementation plateau at approximately 1.6g/kg/day",
    ],
  },
  {
    id: "schoenfeld-2018-protein-timing",
    title: "How much protein can the body use in a single meal for muscle-building? Implications for daily protein distribution",
    authors: ["Brad J. Schoenfeld", "Alan Albert Aragon"],
    year: 2018,
    journal: "Journal of the International Society of Sports Nutrition",
    doi: "10.1186/s12970-018-0215-1",
    url: "https://pubmed.ncbi.nlm.nih.gov/29497353/",
    abstract: "A review examining optimal per-meal protein intake for maximizing muscle protein synthesis.",
    category: "Nutrition",
    keyFindings: [
      "0.4-0.55g/kg per meal across 4 meals optimizes muscle protein synthesis",
      "The anabolic window is wider than previously thought",
      "Even distribution of protein across meals may optimize muscle growth",
    ],
  },
];

export const paperCategories = [
  "All",
  "Volume",
  "Frequency",
  "Intensity",
  "Rest Periods",
  "Rep Ranges",
  "Training to Failure",
  "Exercise Selection",
  "Periodization",
  "Muscle Growth",
  "Nutrition",
] as const;
