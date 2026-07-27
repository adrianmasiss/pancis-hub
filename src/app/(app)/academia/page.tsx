import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { getArticles } from "@/features/academy/queries";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.academy;

export const metadata: Metadata = { title: t.title };

export default async function AcademyPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { categoria } = await searchParams;
  const { articles, categories } = await getArticles(categoria);

  return (
    <>
      <PageHeader icon={GraduationCap} title={t.title} description={t.subtitle} />

      <nav aria-label={t.title} className="flex flex-wrap gap-1.5">
        <Link
          href="/academia"
          aria-current={!categoria ? "page" : undefined}
          className={cn(
            "rounded-full border px-3 py-1 text-sm capitalize",
            !categoria
              ? "bg-primary text-primary-foreground border-primary"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          {t.allCategories}
        </Link>
        {categories.map((category) => (
          <Link
            key={category}
            href={`/academia?categoria=${encodeURIComponent(category)}`}
            aria-current={categoria === category ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm capitalize",
              categoria === category
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {category}
          </Link>
        ))}
      </nav>

      {articles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {articles.map((article) => (
            <Link key={article.id} href={`/academia/${article.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{article.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    {article.summary}
                  </p>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                      variant="secondary"
                      className="font-normal capitalize"
                    >
                      {article.category}
                    </Badge>
                    {article.level ? (
                      <span>
                        {t.levels[article.level as keyof typeof t.levels]}
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
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t.empty}
          description={messages.emptyStates.academy.description}
          icon={GraduationCap}
        />
      )}
    </>
  );
}
