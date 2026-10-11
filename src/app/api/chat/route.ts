import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchPubMed, PubMedArticle } from "@/lib/pubmed";
import { researchPapers } from "@/lib/papers";
import { ChatSource } from "@/types";

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
`.trim();

/**
 * Converts live PubMed articles into ChatSource items for the frontend citations box.
 */
function pubMedArticlesToChatSources(papers: PubMedArticle[]): ChatSource[] {
  return papers.map((paper) => {
    const firstAuthor = paper.authors[0]
      ? paper.authors[0].split(" ")[0].replace(/,/g, "")
      : "Researcher";
    const authorEtAl = paper.authors.length > 1 ? `${firstAuthor} et al.` : firstAuthor;
    const yearMatch = paper.pubDate.match(/\b(19\d\d|20\d\d)\b/);
    const pubYear = yearMatch ? yearMatch[0] : paper.pubDate || "n.d.";

    return {
      title: `${authorEtAl} (${pubYear}) — ${paper.title}`,
      url: paper.url,
      snippet: paper.journal
        ? `Published in ${paper.journal}. PubMed PMID: ${paper.pmid}`
        : `PubMed PMID: ${paper.pmid}`,
    };
  });
}

/**
 * Returns fallback curated sources from the local researchPapers database matching the query.
 */
function getFallbackCuratedSources(query: string): ChatSource[] {
  const queryLower = query.toLowerCase();
  const matched = researchPapers.filter((p) => {
    const titleMatch = p.title.toLowerCase().includes(queryLower);
    const catMatch = p.category.toLowerCase().includes(queryLower);
    const findingsMatch = p.keyFindings.some((f) => f.toLowerCase().includes(queryLower));
    return titleMatch || catMatch || findingsMatch;
  });

  const selected = matched.length > 0 ? matched.slice(0, 2) : researchPapers.slice(0, 2);
  return selected.map((p) => ({
    title: `${p.authors[0]} et al. (${p.year}) — ${p.title}`,
    url: p.url,
    snippet: p.keyFindings[0] || p.abstract.slice(0, 150),
  }));
}

/**
 * Formats live PubMed paper metadata into a clean text block for Gemini system instruction.
 */
function formatPubMedStudiesForSystemInstruction(papers: PubMedArticle[]): string {
  if (!papers || papers.length === 0) {
    return "No live PubMed papers retrieved for this query. Use landmark exercise science literature and core principles.";
  }

  return papers
    .map((paper, index) => {
      const authorsFormatted =
        paper.authors.length > 0
          ? paper.authors.length > 3
            ? `${paper.authors.slice(0, 3).join(", ")}, et al.`
            : paper.authors.join(", ")
          : "Authors unlisted";

      const yearMatch = paper.pubDate.match(/\b(19\d\d|20\d\d)\b/);
      const pubYear = yearMatch ? yearMatch[0] : paper.pubDate || "n.d.";

      return `[Live PubMed Study #${index + 1}]
- Title: "${paper.title}"
- Authors: ${authorsFormatted}
- Year: ${pubYear}
- Journal: ${paper.journal || "PubMed Indexed"}
- PMID: ${paper.pmid}
- URL: ${paper.url}
${paper.doi ? `- DOI: ${paper.doi}` : ""}`.trim();
    })
    .join("\n\n");
}

// Scientific fallback response generator if no Gemini API key is configured or API fails
function generateEvidenceBasedResponse(userQuery: string, livePapers: PubMedArticle[] = []) {
  const query = userQuery.toLowerCase();
  const liveSources = livePapers.length > 0 ? pubMedArticlesToChatSources(livePapers.slice(0, 2)) : [];

  if (query.includes("rest") || query.includes("timer") || query.includes("minute")) {
    return {
      content: `### Optimal Rest Periods for Hypertrophy\n\nAccording to seminal research by **Dr. Brad Schoenfeld (2016)** in the *Journal of Strength and Conditioning Research*, longer interset rest periods are significantly superior for muscle hypertrophy compared to short rest periods.\n\n#### Why Longer Rest Works Better:\n- **Volume Load Maintenance:** Resting **2 to 3 minutes** allows greater recovery of the phosphagen (ATP-CP) system and peripheral nervous system, letting you lift heavier loads for more repetitions on subsequent sets.\n- **Compound vs. Isolation:** For multi-joint movements (Squats, Bench Press, Deadlifts), take **2.5 to 3.5 minutes**. For single-joint isolation (Bicep Curls, Lateral Raises), **60 to 90 seconds** is sufficient.\n\n#### Practical Recommendation:\nUse the **Hypertrophy Lab Rest Timer** set to **120s – 180s** between your working sets on main compound lifts to optimize mechanical tension without compromising total volume.`,
      sources: liveSources.length > 0 ? liveSources : [
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
      sources: liveSources.length > 0 ? liveSources : [
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
      sources: liveSources.length > 0 ? liveSources : [
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
      sources: liveSources.length > 0 ? liveSources : [
        {
          title: "Morton et al. (2018) — Protein supplementation and resistance training-induced gains in muscle mass",
          url: "https://pubmed.ncbi.nlm.nih.gov/28698222/",
          snippet: "Protein supplementation significantly augments muscle size and strength, with benefits plateauing at ~1.6 g/kg/day.",
        },
      ],
    };
  }

  // General scientific fallback
  const fallbackSources = liveSources.length > 0 ? liveSources : getFallbackCuratedSources(userQuery);
  return {
    content: `### Evidence-Based Training Recommendation\n\nWhen optimizing hypertrophy for your question (*"${userQuery}"*), current sports science emphasizes prioritizing **mechanical tension** and **progressive overload**.\n\n#### Key Principles:\n1. **Progressive Overload:** Consistently track your working weights and repetitions in Hypertrophy Lab to ensure incremental progression.\n2. **Proximity to Failure:** Keep working sets within **1 to 3 Reps in Reserve (RIR)** for maximal motor unit recruitment without excessive systemic fatigue.\n3. **Sufficient Interset Rest:** Rest **2 to 3 minutes** on compound movements so every set produces high quality mechanical output.\n\nCheck out the relevant research in our Science Hub or ask for specific exercises, weekly volume, or rest period strategies!`,
    sources: fallbackSources,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = Array.isArray(messages) ? messages[messages.length - 1] : undefined;
    const userPrompt: string = typeof lastMessage?.content === "string" ? lastMessage.content : "";

    // 1. Fetch live PubMed papers relevant to the user's latest query
    let pubMedPapers: PubMedArticle[] = [];
    if (userPrompt.trim()) {
      try {
        pubMedPapers = await searchPubMed(userPrompt, 5);
      } catch (pubMedError) {
        console.warn("[PubMed Search Warning] Proceeding with curated literature:", pubMedError);
        pubMedPapers = [];
      }
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      try {
        const livePapersSection = formatPubMedStudiesForSystemInstruction(pubMedPapers);
        const landmarkPapersSection = researchPapers
          .map(
            (p) =>
              `- [${p.authors[0]} et al. (${p.year})] "${p.title}" | Journal: ${p.journal} | URL: ${p.url}`
          )
          .join("\n");

        const citationInstructions = `
Scientific Citation Rules:
1. Ground your advice in rigorous sports science and hypertrophy research.
2. Cite referenced studies directly using markdown links containing author names, publication year, and the PubMed URL (e.g. [Schoenfeld et al. (2021)](https://pubmed.ncbi.nlm.nih.gov/33248227/) or [Morton et al. (2018)](https://pubmed.ncbi.nlm.nih.gov/28698222/)).
3. Always use the exact URLs provided in the Live PubMed Literature and Curated Landmark Studies sections below.
4. If live PubMed papers returned 0 results or are not applicable, rely smoothly on core sports science consensus and the curated landmark literature without mentioning system limitations.
`.trim();

        const fullSystemInstruction = `
${SYSTEM_PROMPT}

${citationInstructions}

Curated Landmark Literature:
${landmarkPapersSection}

Live PubMed Literature Retrieved for this Query:
${livePapersSection}
`.trim();

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
          systemInstruction: fullSystemInstruction,
        });

        // Prepare multi-turn history if present
        const history: { role: "user" | "model"; parts: { text: string }[] }[] = [];
        if (Array.isArray(messages) && messages.length > 1) {
          const priorMessages = messages.slice(0, -1);
          for (const m of priorMessages) {
            if (!m || typeof m.content !== "string" || !m.content.trim()) continue;
            const role: "user" | "model" = m.role === "assistant" ? "model" : "user";
            if (history.length === 0 && role !== "user") continue;
            const lastEntry = history[history.length - 1];
            if (lastEntry && lastEntry.role === role) {
              lastEntry.parts[0].text += `\n\n${m.content}`;
            } else {
              history.push({ role, parts: [{ text: m.content }] });
            }
          }
        }

        let generatedText = "";
        if (history.length > 0) {
          const chat = model.startChat({ history });
          const result = await chat.sendMessage(userPrompt);
          generatedText = result.response.text();
        } else {
          const result = await model.generateContent(userPrompt);
          generatedText = result.response.text();
        }

        if (generatedText) {
          const sources: ChatSource[] =
            pubMedPapers.length > 0
              ? pubMedArticlesToChatSources(pubMedPapers.slice(0, 3))
              : getFallbackCuratedSources(userPrompt);

          return NextResponse.json({
            role: "assistant",
            content: generatedText,
            sources,
          });
        }
      } catch (geminiError) {
        console.warn("[Gemini API Error] Falling back to local scientific engine:", geminiError);
      }
    }

    // Built-in evidence-based response generator fallback
    const fallbackResponse = generateEvidenceBasedResponse(userPrompt, pubMedPapers);
    return NextResponse.json({
      role: "assistant",
      content: fallbackResponse.content,
      sources: fallbackResponse.sources,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate AI response", details: errorMessage },
      { status: 500 }
    );
  }
}
