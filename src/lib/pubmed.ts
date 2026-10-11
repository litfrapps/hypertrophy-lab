// ============================================
// Hypertrophy Lab — PubMed NCBI E-utilities Client
// ============================================
// Live retrieval of peer-reviewed biomedical literature via NCBI Entrez API

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  pubDate: string;
  url: string;
  doi?: string;
}

export type PubMedPaper = PubMedArticle;

const EUTILS_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const REQUEST_TIMEOUT_MS = 7000;

const STOP_WORDS = new Set([
  "a", "about", "an", "and", "are", "as", "at", "be", "best", "by", "can",
  "could", "do", "does", "for", "from", "hello", "help", "hey", "hi", "how",
  "i", "in", "is", "it", "me", "my", "of", "on", "optimal", "or", "our",
  "please", "recommend", "should", "tell", "the", "to", "what", "which",
  "who", "why", "with", "would", "you", "your", "coach"
]);

/**
 * Extracts high-value scientific search keywords from a conversational lifter prompt.
 */
function extractSearchKeywords(query: string): string {
  const sanitized = query
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word.toLowerCase()));

  return sanitized.join(" ").trim();
}

/**
 * Executes a single NCBI ESearch query and returns an array of PubMed IDs (PMIDs).
 */
async function fetchPMIDs(term: string, retmax: number): Promise<string[]> {
  const searchUrl = new URL(`${EUTILS_BASE_URL}/esearch.fcgi`);
  searchUrl.searchParams.set("db", "pubmed");
  searchUrl.searchParams.set("retmode", "json");
  searchUrl.searchParams.set("retmax", String(retmax));
  searchUrl.searchParams.set("sort", "relevance");
  searchUrl.searchParams.set("term", term);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(searchUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[PubMed ESearch] HTTP Error ${res.status}: ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const idList = data?.esearchresult?.idlist;

    if (Array.isArray(idList) && idList.length > 0) {
      return idList.map((id: unknown) => String(id).trim()).filter(Boolean);
    }

    return [];
  } catch (error) {
    console.warn("[PubMed ESearch] Network or parsing exception:", error);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetches article summaries for a list of PMIDs via NCBI ESummary endpoint.
 */
async function fetchSummaries(pmids: string[]): Promise<PubMedArticle[]> {
  if (!pmids.length) return [];

  const summaryUrl = new URL(`${EUTILS_BASE_URL}/esummary.fcgi`);
  summaryUrl.searchParams.set("db", "pubmed");
  summaryUrl.searchParams.set("retmode", "json");
  summaryUrl.searchParams.set("id", pmids.join(","));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(summaryUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[PubMed ESummary] HTTP Error ${res.status}: ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const resultObj = data?.result;

    if (!resultObj || typeof resultObj !== "object") {
      return [];
    }

    const articles: PubMedArticle[] = [];

    for (const pmid of pmids) {
      const doc = resultObj[pmid];
      if (!doc || typeof doc !== "object") continue;

      const safePmid = String(doc.uid || pmid || "").trim();
      const rawTitle = typeof doc.title === "string" ? doc.title : "";
      const safeTitle = rawTitle.trim().replace(/\.$/, "");

      // Extract author list safely
      const authors: string[] = Array.isArray(doc.authors)
        ? doc.authors
            .map((author: { name?: unknown }) =>
              typeof author === "object" && author !== null && typeof author.name === "string"
                ? author.name.trim()
                : ""
            )
            .filter((name: string) => name.length > 0)
        : [];

      // Extract journal source
      const journal: string =
        (typeof doc.fulljournalname === "string" && doc.fulljournalname.trim()) ||
        (typeof doc.source === "string" && doc.source.trim()) ||
        "";

      // Extract publication date
      const pubDate: string =
        (typeof doc.pubdate === "string" && doc.pubdate.trim()) ||
        (typeof doc.epubdate === "string" && doc.epubdate.trim()) ||
        (typeof doc.sortpubdate === "string" && doc.sortpubdate.trim().split(" ")[0]) ||
        "";

      // Extract DOI if available
      let doi: string | undefined = undefined;
      if (Array.isArray(doc.articleids)) {
        const doiItem = doc.articleids.find(
          (item: { idtype?: unknown; value?: unknown }) =>
            typeof item === "object" && item !== null && item.idtype === "doi" && typeof item.value === "string"
        );
        if (doiItem && typeof doiItem.value === "string") {
          doi = doiItem.value.trim();
        }
      }

      if (!doi && typeof doc.elocationid === "string") {
        const doiMatch = doc.elocationid.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
        if (doiMatch) {
          doi = doiMatch[0];
        }
      }

      articles.push({
        pmid: safePmid,
        title: safeTitle,
        authors,
        journal,
        pubDate,
        url: `https://pubmed.ncbi.nlm.nih.gov/${safePmid}/`,
        doi,
      });
    }

    return articles;
  } catch (error) {
    console.warn("[PubMed ESummary] Network or parsing exception:", error);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Searches PubMed for relevant peer-reviewed scientific papers.
 * Performs defensive error handling, query fallback, and returns structured paper metadata.
 *
 * @param query The natural language search term or topic
 * @param maxResults Maximum number of papers to retrieve (default 5, clamped 1-10)
 * @returns Array of formatted PubMed articles
 */
export async function searchPubMed(
  query: string,
  maxResults: number = 5
): Promise<PubMedArticle[]> {
  try {
    if (!query || typeof query !== "string") {
      return [];
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    const clampedLimit = Math.max(1, Math.min(maxResults || 5, 10));

    // 1. Try search with cleaned query first
    const sanitizedQuery = trimmedQuery.replace(/[^\w\s-]/g, " ").replace(/\s+/g, " ").trim();
    let pmids = await fetchPMIDs(sanitizedQuery, clampedLimit);

    // 2. If 0 results returned, retry with extracted key terms
    if (pmids.length === 0) {
      const keywords = extractSearchKeywords(trimmedQuery);
      if (keywords && keywords !== sanitizedQuery) {
        pmids = await fetchPMIDs(keywords, clampedLimit);
      }
    }

    // 3. If still empty and not explicitly about resistance training, try appending context
    if (pmids.length === 0) {
      const keywords = extractSearchKeywords(trimmedQuery);
      const isExerciseQuery = /hypertrophy|muscle|training|exercise|resistance|sets|reps|volume|protein|creatine/i.test(
        trimmedQuery
      );
      if (keywords && !isExerciseQuery) {
        const enriched = `${keywords} hypertrophy resistance training`;
        pmids = await fetchPMIDs(enriched, clampedLimit);
      }
    }

    if (!pmids.length) {
      return [];
    }

    // 4. Fetch details via ESummary
    return await fetchSummaries(pmids);
  } catch (error) {
    console.warn("[searchPubMed] Unexpected search failure:", error);
    return [];
  }
}
