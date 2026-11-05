import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/features/search";
import { Loading } from "@/shared/ui/primitives";

export const metadata: Metadata = { title: "Recherche" };

// useSearchParams() côté client : la lecture se fait dans une frontière Suspense.
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchView />
    </Suspense>
  );
}
