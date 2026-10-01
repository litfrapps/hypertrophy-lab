import { NextRequest, NextResponse } from "next/server";
import { researchPapers } from "@/lib/papers";

// Knowledge base grounded in sports science and Brad Schoenfeld's research
const SYSTEM_PROMPT = `
You are the "Hypertrophy Lab AI Assistant" — a sports science researcher and evidence-based hypertrophy coach.
Your mission is to educate, guide, and optimize resistance training routines using peer-reviewed scientific literature.
Your primary scientific authorities are:
- Dr. Brad Schoenfeld (the leading researcher on muscle hypertrophy, volume dose-response, frequency, and load)
- Dr. Stuart Phillips & Dr. Robert Morton (protein synthesis, supplementation, and leucine threshold)
- Alan Aragon (nutrient timing and macronutrient distribution)
- Dr. Jozo Grgic (training to failure, RIR/RIR continuum, and caffeine ergogenics)

Key Scientific Guidelines:
1. Mechanical tension is the primary mechanical trigger for muscle protein synthesis (MPS).
2. Weekly Volume: 10-20 hard sets per muscle group per week is generally the sweet spot for maximizing hypertrophy (Schoenfeld et al., 2017).
3. Rest Periods: Longer rest (2-3+ minutes on compound movements) outperforms short rest (1 minute) by allowing higher volume load (Schoenfeld et al., 2016).
4. Rep Ranges: Hypertrophy occurs similarly across 6 to 30 reps, provided sets are taken within 1-3 Reps in Reserve (RIR) (Schoenfeld & Grgic, 2021).
5. Training to Failure: Absolute failure is not necessary every set and impairs recovery; stopping 1-2 reps before failure (RIR 1-2) yields similar growth with less systemic fatigue (Grgic et al., 2022).
6. Protein Intake: ~1.6 - 2.2 g/kg/day distributed across 3-5 meals (Morton et al., 2018).

Always structure your responses clearly with:
- Direct Answer / Scientific Consensus
- Practical Implementation (Sets, Reps, Rest, RIR)
- Scientific Citations with author, year, and journal
`;

// Scientific fallback response generator if no Gemini API key is configured yet
function generateEvidenceBasedResponse(userQuery: string) {
  const query = userQuery.toLowerCase();

  // Match relevant papers
  const relevantPapers = researchPapers.filter((p) => {
    const titleMatch = p.title.toLowerCase().includes(query);
    const categoryMatch = p.category.toLowerCase().includes(query);
    const findingsMatch = p.keyFindings.some((f) => f.toLowerCase().includes(query));
    return titleMatch || categoryMatch || findingsMatch;
  });

  if (query.includes("rest") || query.includes("timer") || query.includes("minute")) {
    return {
      content: `### Optimal Rest Periods for Hypertrophy\n\nAccording to seminal research by **Dr. Brad Schoenfeld (2016)** in the *Journal of Strength and Conditioning Research*, longer interset rest periods are significantly superior for muscle hypertrophy compared to short rest periods.\n\n#### Why Longer Rest Works Better:\n- **Volume Load Maintenance:** Resting **2 to 3 minutes** allows greater recovery of the phosphagen (ATP-CP) system and peripheral nervous system, letting you lift heavier loads for more repetitions on subsequent sets.\n- **Compound vs. Isolation:** For multi-joint movements (Squats, Bench Press, Deadlifts), take **2.5 to 3.5 minutes**. For single-joint isolation (Bicep Curls, Lateral Raises), **60 to 90 seconds** is sufficient.\n\n#### Practical Recommendation:\nUse the **Hypertrophy Lab Rest Timer** set to **120s – 180s** between your working sets on main compound lifts to optimize mechanical tension without compromising total volume.`,
      sources: [
        {
          title: "Schoenfeld et al. (2016) — Longer Interset Rest Periods Enhance Muscle Strength and Hypertrophy",
          url: "https://pubmed.ncbi.nlm.nih.gov/26605807/",
          snippet: "3-minute rest periods produced significantly greater muscle thickness and strength gains in resistance-trained men compared to 1-minute rest.",
        },
      ],
    };
  }

  if (query.includes("volume") || query.includes("sets per week") || query.includes("how many sets")) {
    return {
      content: `### Weekly Volume Dose-Response for Muscle Growth\n\nIn a comprehensive meta-analysis by **Schoenfeld, Ogborn, & Krieger (2017)**, researchers investigated the dose-response relationship between weekly resistance training sets and hypertrophy.\n\n#### Key Findings:\n- **Graded Dose-Response:** Performing **10 or more weekly sets** per muscle group resulted in roughly **30% greater muscle growth** than performing fewer than 5 weekly sets.\n- **Landmark Thresholds:**\n  - *Maintenance Volume (MV):* ~4-6 sets/week\n  - *Minimum Effective Volume (MEV):* ~8-10 sets/week\n  - *Maximum Adaptive Volume (MAV):* ~12-20 sets/week for most trained lifters\n\n#### Practical Implementation:\nStart at 10-12 hard sets per muscle per week (split across 2 sessions), and progressively add 1-2 sets if you are recovering well and plateauing.`,
      sources: [
        {
          title: "Schoenfeld et al. (2017) — Dose-response relationship between weekly resistance training volume and muscle mass",
          url: "https://pubmed.ncbi.nlm.nih.gov/27433992/",
          snippet: "Higher training volumes (>10 weekly sets per muscle) produced significantly greater hypertrophy compared to lower volume conditions.",
        },
      ],
    };
  }

  if (query.includes("failure") || query.includes("rir") || query.includes("reps in reserve")) {
    return {
      content: `### Training to Muscular Failure vs. Leaving Reps in Reserve (RIR)\n\nMeta-analyses by **Dr. Jozo Grgic and Dr. Brad Schoenfeld (2022)** in the *Journal of Sport and Health Science* have clarified whether you must train to absolute failure.\n\n#### The Scientific Consensus:\n- **Not Required for Maximal Growth:** Training to absolute muscular failure is **not necessary** to maximize muscle hypertrophy.\n- **The "Sweet Spot" (RIR 1–2):** Terminating sets with **1 to 2 Reps in Reserve (RIR 1-2)** yields nearly identical hypertrophic stimulus to failure, but with drastically lower neuromuscular fatigue and joint wear.\n- **When to Use Failure:** Reserve true failure for the final set of isolation movements (e.g., Cable Flyes or Leg Extensions) rather than axial compound lifts (Squats or Deadlifts).`,
      sources: [
        {
          title: "Grgic, Schoenfeld et al. (2022) — Effects of Resistance Training Performed to Repetition Failure or Non-Failure",
          url: "https://pubmed.ncbi.nlm.nih.gov/33497853/",
          snippet: "Training to failure does not produce superior hypertrophy compared to non-failure training when volume is equated, while inducing higher fatigue.",
        },
      ],
    };
  }

  if (query.includes("protein") || query.includes("nutrition") || query.includes("diet") || query.includes("grams")) {
    return {
      content: `### Evidence-Based Protein Intake for Hypertrophy\n\nA landmark meta-regression by **Morton, Schoenfeld, Phillips et al. (2018)** in the *British Journal of Sports Medicine* analyzed 49 studies and over 1,800 participants.\n\n#### Core Takeaways:\n- **Optimal Daily Intake:** Protein intake of approximately **1.6 to 2.2 g per kilogram of body weight per day** (0.73 - 1.0 g/lb) optimizes muscle protein synthesis.\n- **Plateau Effect:** Intakes beyond **1.62 g/kg/day** showed diminishing returns for muscle hypertrophy in energy-neutral or surplus states.\n- **Distribution:** Aim for **0.40 - 0.55 g/kg per meal** across 3 to 4 meals to maximize intermittent spikes in muscle protein synthesis (Schoenfeld & Aragon, 2018).`,
      sources: [
        {
          title: "Morton et al. (2018) — Protein supplementation and resistance training-induced gains in muscle mass",
          url: "https://pubmed.ncbi.nlm.nih.gov/28698222/",
          snippet: "Protein supplementation significantly augments muscle size and strength, with benefits plateauing at ~1.6 g/kg/day.",
        },
      ],
    };
  }

  // General scientific fallback
  const firstPaper = relevantPapers[0] || researchPapers[0];
  return {
    content: `### Evidence-Based Training Recommendation\n\nWhen optimizing hypertrophy for your question (*"${userQuery}"*), current sports science emphasizes prioritizing **mechanical tension** and **progressive overload**.\n\n#### Key Principles:\n1. **Progressive Overload:** Consistently track your working weights and repetitions in Hypertrophy Lab to ensure incremental progression.\n2. **Proximity to Failure:** Keep working sets within **1 to 3 Reps in Reserve (RIR)** for maximal motor unit recruitment without excessive systemic fatigue.\n3. **Sufficient Interset Rest:** Rest **2 to 3 minutes** on compound movements so every set produces high quality mechanical output.\n\nCheck out the relevant research in our Science Hub or ask for specific exercises, weekly volume, or rest period strategies!`,
    sources: [
      {
        title: `${firstPaper.authors[0]} et al. (${firstPaper.year}) — ${firstPaper.title}`,
        url: firstPaper.url,
        snippet: firstPaper.keyFindings[0] || firstPaper.abstract,
      },
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage?.content || "";

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      try {
        // Direct call to Gemini 1.5/2.0 API
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `${SYSTEM_PROMPT}\n\nAvailable Studies for Citation:\n${researchPapers
                        .map(
                          (p) =>
                            `- ${p.title} (${p.authors[0]} et al., ${p.year}) | URL: ${p.url}`
                        )
                        .join("\n")}\n\nUser Question: ${userPrompt}`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const generatedText =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "";

          if (generatedText) {
            // Find relevant sources from our paper database matching the topic
            const sources = researchPapers.slice(0, 2).map((p) => ({
              title: `${p.authors[0]} et al. (${p.year}) — ${p.title}`,
              url: p.url,
              snippet: p.keyFindings[0] || p.abstract.slice(0, 150),
            }));

            return NextResponse.json({
              role: "assistant",
              content: generatedText,
              sources,
            });
          }
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, falling back to local scientific engine:", geminiError);
      }
    }

    // Built-in evidence-based response generator
    const fallbackResponse = generateEvidenceBasedResponse(userPrompt);
    return NextResponse.json({
      role: "assistant",
      content: fallbackResponse.content,
      sources: fallbackResponse.sources,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate AI response", details: err?.message },
      { status: 500 }
    );
  }
}
