import { createClient } from "@/lib/supabase/server";

export type ArticleSummary = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  level: string | null;
  readingMinutes: number | null;
  evidenceLevel: string | null;
};

export type ArticleDetail = ArticleSummary & {
  body: string;
  keyPoints: string[];
  reviewedAt: string | null;
  references: { id: string; citation: string; url: string | null }[];
  related: ArticleSummary[];
};

const SUMMARY_SELECT =
  "id, title, slug, summary, category, level, reading_minutes, evidence_level";

type SummaryRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  category: string;
  level: string | null;
  reading_minutes: number | null;
  evidence_level: string | null;
};

function mapSummary(row: SummaryRow): ArticleSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    category: row.category,
    level: row.level,
    readingMinutes: row.reading_minutes,
    evidenceLevel: row.evidence_level,
  };
}

export async function getArticles(
  category?: string,
): Promise<{ articles: ArticleSummary[]; categories: string[] }> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("articles")
    .select(SUMMARY_SELECT)
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(100);

  const all = (data ?? []).map(mapSummary);
  const categories = [...new Set(all.map((article) => article.category))];
  return {
    articles: category
      ? all.filter((article) => article.category === category)
      : all,
    categories,
  };
}

export async function getArticleBySlug(
  slug: string,
): Promise<ArticleDetail | null> {
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select(
      `${SUMMARY_SELECT}, body, key_points, reviewed_at, article_references(id, citation, url)`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (!article) return null;

  const { data: related } = await supabase
    .from("articles")
    .select(SUMMARY_SELECT)
    .eq("status", "published")
    .eq("category", article.category)
    .neq("id", article.id)
    .is("deleted_at", null)
    .limit(3);

  return {
    ...mapSummary(article),
    body: article.body,
    keyPoints: article.key_points ?? [],
    reviewedAt: article.reviewed_at,
    references: (article.article_references ?? []).map((reference) => ({
      id: reference.id,
      citation: reference.citation,
      url: reference.url,
    })),
    related: (related ?? []).map(mapSummary),
  };
}
