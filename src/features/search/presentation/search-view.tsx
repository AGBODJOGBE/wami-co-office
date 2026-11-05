"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useResource } from "@/shared/hooks/use-resource";
import { Card, CardHeader, EmptyState, PageHeader } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { searchUseCases } from "../application/search.use-cases";
import { SEARCH_KIND_LABELS, groupByKind } from "../domain/search";

/** Résultats de la recherche globale (`/search?q=`). */
export function SearchView() {
  const q = useSearchParams().get("q") ?? "";
  const hits = useResource(() => searchUseCases.search(q), q);

  return (
    <>
      <PageHeader title={q ? `Résultats pour « ${q} »` : "Recherche"} />
      <ResourceView state={hits} onRetry={hits.reload}>
        {(list) =>
          list.length === 0 ? (
            <Card>
              <EmptyState>Aucun résultat. Essayez un numéro de mission (WMI-…), un téléphone ou un nom.</EmptyState>
            </Card>
          ) : (
            <div className="grid gap-3.5 lg:grid-cols-2">
              {groupByKind(list).map(([kind, items]) => (
                <Card key={kind}>
                  <CardHeader title={`${SEARCH_KIND_LABELS[kind]} · ${items.length}`} />
                  <ul>
                    {items.map((h) => (
                      <li key={h.id} className="border-t border-[#E3E6EB]">
                        <Link href={h.href} className="flex flex-col gap-0.5 px-4 py-2.5 hover:bg-canvas">
                          <b className="text-[13px]">{h.title}</b>
                          <span className="text-xs text-muted">{h.subtitle}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          )
        }
      </ResourceView>
    </>
  );
}
