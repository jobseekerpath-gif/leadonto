/**\n * /api/news/feed — personalized live career/news feed.\n *\n * POST body: { interested_sectors?: string[] }\n *\n * Current items are fetched from Google News RSS at request time. No fabricated\n * or hardcoded articles are returned.\n */\nimport { Router, type Request, type Response } from "express";\n\nconst router = Router();\n\n// Sample dataset — replace with a real news source or the rozgar RSS feed
const MOCK_NEWS: NewsArticle[] = [
  { id: "n1", title: "SBI PO 2026 notification released — apply before July 31",        sector: "banking",    days_old: 0 },
  { id: "n2", title: "UP Police constable recruitment exam date announced",              sector: "government", days_old: 1 },
  { id: "n3", title: "IT hiring rebounds in Q2 2026 as start-ups resume growth",        sector: "technology", days_old: 2 },
  { id: "n4", title: "Retail sector adds 50,000 jobs this festive season",              sector: "retail",     days_old: 4 },
  { id: "n5", title: "Telecom companies expand rural hiring drives in Tier-3 cities",   sector: "telecom",    days_old: 1 },
  { id: "n6", title: "UPSC Civil Services notification 2026 out — 1000+ vacancies",     sector: "government", days_old: 0 },
  { id: "n7", title: "AI-related jobs grow 40% in India — top skills employers want",   sector: "technology", days_old: 3 },
  { id: "n8", title: "RBI Grade B officer recruitment 2026 — eligibility & syllabus",   sector: "banking",    days_old: 2 },
  { id: "n9", title: "Skill India Digital scheme: free online certifications for youth", sector: "government", days_old: 5 },
  { id: "n10",title: "English-fluent candidates get 25% salary premium in metros",       sector: "education",  days_old: 1 },
];

type NewsArticle = {
  id: string;
  title: string;
  sector: string;
  days_old: number;
  url?: string;
  source: string;
  published_at?: string | null;
};

type NewsProfile = {
  interested_sectors?: string[];
};

const SECTOR_QUERIES: Record<string, string> = {
  banking: "India banking finance jobs RBI SBI recruitment careers",
  government: "India government recruitment employment scheme jobs",
  technology: "India technology AI software jobs hiring",
  retail: "India retail ecommerce hiring jobs",
  telecom: "India telecom hiring jobs",
  education: "India education hiring jobs skills",
};

const DEFAULT_QUERIES = ["India jobs hiring careers", "India employment skills recruitment"];

function stableId(value: string): string {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `n${(h >>> 0).toString(36)}`;
}

function cleanXml(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "i"));
  return m ? cleanXml(m[1] ?? "") : "";
}

async function fetchRss(query: string): Promise<Array<{ title: string; link: string; source: string; publishedAt: string | null }>> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const response = await fetch(url, {
    headers: { "User-Agent": "LeadOnto/1.0 (+career-feed)" },
    signal: AbortSignal.timeout(7_000),
  });
  if (!response.ok) throw new Error(`News source returned ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<item>([\\s\\S]*?)<\\/item>/gi)]
    .map((m) => {
      const block = m[1] ?? "";
      const title = tag(block, "title");
      const link = tag(block, "link") || (block.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? "");
      const source = tag(block, "source") || "Google News";
      const publishedAt = tag(block, "pubDate") || null;
      return title && link ? { title, link, source, publishedAt } : null;
    })
    .filter((item): item is { title: string; link: string; source: string; publishedAt: string | null } => item !== null);
}

function daysOld(publishedAt: string | null): number {
  if (!publishedAt) return 0;
  const time = Date.parse(publishedAt);
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
}

function sectorForTitle(title: string, fallbackSector: string): string {
  const lower = title.toLowerCase();
  const exact = Object.keys(SECTOR_QUERIES).find((sector) => lower.includes(sector));
  return exact ?? fallbackSector;
}

async function loadNews(profile: NewsProfile): Promise<NewsArticle[]> {
  const requested = (profile.interested_sectors ?? [])
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 4);
  const selectedSectors = requested.length ? requested : Object.keys(SECTOR_QUERIES).slice(0, 4);
  const queries = selectedSectors.map((sector) => ({
    sector,
    query: SECTOR_QUERIES[sector] ?? `India ${sector} jobs hiring careers`,
  }));
  if (!requested.length) {
    queries.push(...DEFAULT_QUERIES.map((query, i) => ({ sector: i === 0 ? "employment" : "careers", query })));
  }

  const settled = await Promise.allSettled(queries.map(({ query }) => fetchRss(query)));
  const seen = new Set<string>();
  const articles: NewsArticle[] = [];
  settled.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const sector = queries[index]!.sector;
    for (const item of result.value) {
      const key = item.link.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      articles.push({
        id: stableId(key),
        title: item.title,
        sector: sectorForTitle(item.title, sector),
        days_old: daysOld(item.publishedAt),
        url: item.link,
        source: item.source,
        published_at: item.publishedAt,
      });
      if (articles.length >= 40) return;
    }
  });
  return articles.sort((a, b) => a.days_old - b.days_old).slice(0, 30);
}

function scoreArticle(profile: NewsProfile, article: NewsArticle): number {
  let score = 0;
  const sectors = (profile.interested_sectors ?? []).map(s => s.toLowerCase());
  if (sectors.includes(article.sector.toLowerCase())) {
    score += 40;
  }
  score += Math.max(0, 10 - article.days_old); // recency decay
  return score;
}

router.post("/news/feed", (req: Request, res: Response) => {
  const profile = (req.body ?? {}) as NewsProfile;

  const scored = MOCK_NEWS.map(article => ({
    ...article,
    score: scoreArticle(profile, article),
  })).sort((a, b) => b.score - a.score);

  res.json({ results: scored });
});

export default router;
