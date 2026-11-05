import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-display text-xl font-bold">Page introuvable</h1>
      <Link href="/" className="text-sm font-semibold text-brand-strong underline">
        Retour au tableau de bord
      </Link>
    </main>
  );
}
