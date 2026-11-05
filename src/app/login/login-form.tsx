"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ROLES, ROLE_LABELS, type Role } from "@/shared/auth/permissions";
import { Button, Field, fieldClass, Note } from "@/shared/ui/primitives";

/**
 * Avec le backend WAMI : téléphone + mot de passe de l'agent.
 * En démonstration (sans backend) : e-mail + code, et choix du rôle pour tester les accès.
 */
export function LoginForm({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("superAdmin");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(demo ? { email, code, role } : { phone, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        setError(data.message ?? "Connexion impossible.");
        return;
      }
      router.replace("/");
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-line bg-white p-6">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="size-7 rounded-lg bg-brand" />
        <span className="font-display text-lg font-bold">WAMI</span>
        <span className="rounded-full bg-night-soft px-2 py-0.5 text-[10px] font-bold tracking-widest">ADMIN</span>
      </div>
      <h1 className="font-display text-xl font-bold">Connexion</h1>
      {demo ? (
        <>
          <Field label="E-mail professionnel">
            <input className={fieldClass} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Code reçu" hint="Démonstration : 123456">
            <input className={fieldClass} inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          </Field>
        </>
      ) : (
        <>
          <Field label="Téléphone">
            <input className={fieldClass} type="tel" autoComplete="username" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field label="Mot de passe">
            <input className={fieldClass} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
        </>
      )}
      {demo ? (
        <Field label="Rôle (démonstration)">
          <select className={fieldClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      ) : null}
      <Button type="submit" tone="primary" busy={busy}>
        Se connecter
      </Button>
      {demo ? <Note>Mode démonstration : aucune donnée réelle. Définissez WAMI_API_URL pour brancher le backend WAMI.</Note> : null}
    </form>
  );
}
