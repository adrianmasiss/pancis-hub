import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { getArticleBySlug } from "@/features/academy/queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.academy;

export const metadata: Metadata = { title: t.title };

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-419", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <>
      <PageHeader
        title={article.title}
        description={article.summary}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/academia">
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t.backToList}
            </Link>
          </Button>
        }
      />

      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary" className="font-normal capitalize">
          {article.category}
        </Badge>
        {article.level ? (
          <span>
            {t.level}: {t.levels[article.level as keyof typeof t.levels]}
          </span>
        ) : null}
        {article.readingMinutes ? (
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {article.readingMinutes} {t.readingTime}
          </span>
        ) : null}
        {article.evidenceLevel ? (
          <Badge variant="outline" className="font-normal">
            {
              t.evidenceLevels[
                article.evidenceLevel as keyof typeof t.evidenceLevels
              ]
            }
          </Badge>
        ) : null}
        {article.reviewedAt ? (
          <span>
            {t.reviewedAt}: {formatDate(article.reviewedAt)}
          </span>
        ) : null}
      </div>

      {article.evidenceLevel === "demostrativo" ? (
        <p className="bg-muted text-muted-foreground flex items-start gap-2 rounded-lg p-3 text-xs text-balance">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t.demoNotice}
        </p>
      ) : null}

      <article className="max-w-2xl space-y-4 text-sm leading-relaxed whitespace-pre-line">
        {article.body}
      </article>

      {article.keyPoints.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.keyPointsTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {article.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {article.references.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t.referencesTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm">
              {article.references.map((reference) => (
                <li key={reference.id}>
                  {reference.url ? (
                    <a
                      href={reference.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground underline underline-offset-4"
                    >
                      {reference.citation}
                    </a>
                  ) : (
                    reference.citation
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {article.related.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">{t.relatedTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {article.related.map((relatedArticle) => (
              <Link
                key={relatedArticle.id}
                href={`/academia/${relatedArticle.slug}`}
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      {relatedArticle.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-xs">
                      {relatedArticle.summary}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
