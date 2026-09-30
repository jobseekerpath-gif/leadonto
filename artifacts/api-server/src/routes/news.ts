/**
 * /api/news/feed — personalized live career/news feed.
 *
 * POST body: { interested_sectors?: string[] }
 *
 * Current items are fetched from Google News RSS at request time. No fabricated
 * or hardcoded articles are returned.
 */
import { Router, type Request, type Response } from "express";

const router = Router();

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

function decodeXml(text: string): string {
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
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decodeXml(match[1] ?? "") : "";
}

async function fetchRss(query: string): Promise<Array<{
  title: string;
  link: string;
  source: string;
  publishedAt: string | null;
}>> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  const response = await fetch(url, {
    headers: { "User-Agent": "LeadOnto/1.0 (+career-feed)" },
    signal: AbortSignal.timeout(7_000),
  });
  if (!response.ok) throw new Error(`News source returned ${response.status}`);
  const xml = await response.text();

  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .map((match) => {
      const block = match[1] ?? "";
      const title = tag(block, "title");
      const link =
        tag(block, "link")
        || (block.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? "");
      const source = tag(block, "source") || "Google News";
      const publishedAt = tag(block, "pubDate") || null;
      return title && link ? { title, link, source, publishedAt } : null;
    })
    .filter((item): item is {
      title: string;
      link: string;
      source: string;
      publishedAt: string | null;
    } => item !== null);
}

function daysOld(publishedAt: string | null): number {
  if (!publishedAt) return 0;
  const time = Date.parse(publishedAt);
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
}

function sectorForTitle(title: string, fallbackSector: string): string {
  const lower = title.toLowerCase();
  const detected = Object.keys(SECTOR_QUERIES).find((sector) => lower.includes(sector));
  return detected ?? fallbackSector;
}

async function loadNews(profile: NewsProfile): Promise<NewsArticle[]> {
  const requested = (profile.interested_sectors ?? [])
    .map((sector) => sector.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 4);

  const selected = requested.length
    ? requested
    : Object.keys(SECTOR_QUERIES).slice(0, 4);

  const queries = selected.map((sector) => ({
    sector,
    query: SECTOR_QUERIES[sector] ?? `India ${sector} jobs hiring careers`,
  }));

  if (!requested.length) {
    queries.push(
      ...DEFAULT_QUERIES.map((query, index) => ({
        sector: index === 0 ? "employment" : "careers",
        query,
      })),
    );
  }

  const settled = await Promise.allSettled(
    queries.map(({ query }) => fetchRss(query)),
  );

  const seen = new Set<string>();
  const articles: NewsArticle[] = [];

  settled.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const fallbackSector = queries[index]!.sector;

    for (const item of result.value) {
      const key = item.link.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);

      articles.push({
        id: stableId(key),
        title: item.title,
        sector: sectorForTitle(item.title, fallbackSector),
        days_old: daysOld(item.publishedAt),
        url: item.link,
        source: item.source,
        published_at: item.publishedAt,
      });

      if (articles.length >= 40) return;
    }
  });

  return articles
    .sort((a, b) => a.days_old - b.days_old)
    .slice(0, 30);
}

function scoreArticle(profile: NewsProfile, article: NewsArticle): number {
  const sectors = (profile.interested_sectors ?? []).map((s) => s.toLowerCase());
  const sectorBoost = sectors.includes(article.sector.toLowerCase()) ? 40 : 0;
  return sectorBoost + Math.max(0, 10 - article.days_old);
}

router.post("/news/feed", async (req: Request, res: Response) => {
  const profile = (req.body ?? {}) as NewsProfile;

  try {
    const live = await loadNews(profile);
    const results = live
      .map((article) => ({
        ...article,
        score: scoreArticle(profile, article),
      }))
      .sort((a, b) => b.score - a.score);

    res.json({ results, fetched_at: new Date().toISOString() });
  } catch (error) {
    req.log.warn({ error }, "Live news feed unavailable");
    res.status(503).json({
      results: [],
      fetched_at: new Date().toISOString(),
      error: "Fresh news is temporarily unavailable. No synthetic articles are shown.",
    });
  }
});

export default router;
