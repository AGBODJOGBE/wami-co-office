"use client";

import { useState } from "react";
import { useSession } from "@/shared/auth/session.store";
import { useAction } from "@/shared/hooks/use-action";
import { useResource } from "@/shared/hooks/use-resource";
import { cn } from "@/shared/lib/cn";
import { ago, fcfa, hhmm } from "@/shared/lib/format";
import { useCanWrite } from "@/shared/ui/app-shell";
import { Button, Card, Chip, Field, fieldClass, InfoRow, Note, PageHeader, Tag } from "@/shared/ui/primitives";
import { ResourceView } from "@/shared/ui/resource-view";
import { supportUseCases } from "../application/support.use-cases";
import { REFUND_CAP, isOverdue, refundable, type Ticket } from "../domain/ticket";

export function SupportView() {
  const tickets = useResource(() => supportUseCases.list(), "tickets");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [now] = useState(() => new Date());

  return (
    <>
      <PageHeader title="Support et litiges">
        <Chip on={onlyOverdue} onClick={() => setOnlyOverdue(!onlyOverdue)}>
          Délai dépassé
        </Chip>
      </PageHeader>
      <ResourceView state={tickets} onRetry={tickets.reload}>
        {(list) => {
          const visible = list.filter((t) => t.status !== "closed" && (!onlyOverdue || isOverdue(t, now)));
          const selected = list.find((t) => t.id === selectedId) ?? visible[0] ?? null;
          return (
            <div className="grid gap-3.5 xl:grid-cols-[320px_minmax(0,1fr)]">
              <Card className="overflow-hidden">
                {visible.length === 0 ? <p className="p-6 text-center text-sm text-muted">Aucun ticket.</p> : null}
                <ul>
                  {visible.map((t) => (
                    <li key={t.id} className="border-b border-[#E3E6EB] last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setSelectedId(t.id)}
                        aria-pressed={selected?.id === t.id}
                        className={cn("flex w-full flex-col gap-1 px-4 py-3 text-left", selected?.id === t.id ? "bg-brand-soft" : "hover:bg-canvas")}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <b className="text-[13px]">{t.subject}</b>
                          <Tag tone={isOverdue(t, now) ? "bad" : t.priority === "high" ? "warn" : "neutral"}>{ago(t.openedAt, now)}</Tag>
                        </span>
                        <span className="truncate text-xs text-muted">
                          {t.requesterName} · {t.messages[0]?.text}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
              {selected ? (
                <TicketPanel key={selected.id} ticket={selected} onChange={(t) => tickets.mutate((l) => l.map((x) => (x.id === t.id ? t : x)))} />
              ) : (
                <Card className="flex items-center justify-center p-6 text-sm text-muted">Aucun ticket sélectionné.</Card>
              )}
            </div>
          );
        }}
      </ResourceView>
    </>
  );
}

function TicketPanel({ ticket: t, onChange }: { ticket: Ticket; onChange: (t: Ticket) => void }) {
  const role = useSession((s) => s.user?.role ?? "support");
  const canWrite = useCanWrite("support");
  const { busy, run } = useAction();
  const [text, setText] = useState("");
  const [amount, setAmount] = useState(t.payment ? String(Math.max(0, t.payment.paid - t.payment.estimated)) : "");
  const cap = REFUND_CAP[role];

  return (
    <div className="grid gap-3.5 2xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <span className="flex flex-col">
            <b className="text-[15px]">{t.subject}</b>
            <span className="text-xs text-muted">
              {t.id} · {t.requesterKind === "client" ? "Client" : "Partenaire"} {t.requesterName} · attribué à {t.assignee ?? "personne"}
            </span>
          </span>
          {t.status === "closed" ? <Tag tone="ok">Clos</Tag> : <Tag tone={t.priority === "high" ? "warn" : "neutral"}>{t.priority === "high" ? "Priorité haute" : "Normale"}</Tag>}
        </div>
        <ol className="flex flex-col gap-2.5 border-y border-[#E3E6EB] px-4 py-3">
          {t.messages.map((m) => (
            <li
              key={m.id}
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-[13px]",
                m.from === "requester" && "self-start rounded-bl-sm bg-field",
                m.from === "agent" && "self-end rounded-br-sm bg-night text-white",
                m.from === "note" && "max-w-full self-stretch border border-dashed border-[#C9CCD3] bg-canvas text-muted",
              )}
            >
              {m.from === "note" ? <b>Note interne · </b> : null}
              {m.text}
              <span className={cn("mt-1 block text-[10.5px]", m.from === "agent" ? "text-white/70" : "text-muted")}>
                {m.author} · {hhmm(m.at)}
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-2 px-4 py-3">
          <label className="sr-only" htmlFor={`reply-${t.id}`}>
            Réponse
          </label>
          <textarea id={`reply-${t.id}`} className={`${fieldClass} h-20 py-2`} placeholder="Écrire au demandeur…" value={text} onChange={(e) => setText(e.target.value)} disabled={t.status === "closed"} />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              disabled={!canWrite || busy || t.status === "closed"}
              onClick={async () => {
                const r = await run(() => supportUseCases.reply(t, text, true), "Note interne ajoutée.");
                if (r) {
                  onChange(r);
                  setText("");
                }
              }}
            >
              Note interne
            </Button>
            <Button
              disabled={!canWrite || busy || t.status === "closed"}
              onClick={async () => {
                const r = await run(() => supportUseCases.close(t), "Ticket clos.");
                if (r) onChange(r);
              }}
            >
              Clore
            </Button>
            <Button
              tone="primary"
              disabled={!canWrite || t.status === "closed"}
              busy={busy}
              onClick={async () => {
                const r = await run(() => supportUseCases.reply(t, text, false), "Réponse envoyée.");
                if (r) {
                  onChange(r);
                  setText("");
                }
              }}
            >
              Envoyer
            </Button>
          </div>
        </div>
      </Card>
      <Card className="flex flex-col gap-1 px-4 py-3.5">
        <b className="text-sm">Paiement lié</b>
        {t.payment ? (
          <>
            <InfoRow label="Référence">{t.payment.reference}</InfoRow>
            <InfoRow label="Prix estimé">{fcfa(t.payment.estimated)}</InfoRow>
            <InfoRow label="Payé">
              {fcfa(t.payment.paid)} · {t.payment.method}
            </InfoRow>
            <InfoRow label="Déjà remboursé">{fcfa(t.payment.alreadyRefunded)}</InfoRow>
            <InfoRow label="Remboursable">{fcfa(refundable(t.payment))}</InfoRow>
            <div className="mt-2 flex items-end gap-2">
              <Field label="Montant (F)" hint={cap !== undefined ? `Votre plafond : ${fcfa(cap)}` : undefined}>
                <input className={fieldClass} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
              </Field>
              <Button
                tone="primary"
                disabled={!canWrite || t.status === "closed"}
                busy={busy}
                onClick={async () => {
                  const r = await run(() => supportUseCases.refund(t, Number(amount), role), "Remboursement effectué.");
                  if (r) onChange(r);
                }}
              >
                Rembourser
              </Button>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted">Aucun paiement lié.</p>
        )}
        <Note className="mt-2">Remboursement sur le portefeuille WAMI ou en Mobile Money, et plafonds par rôle : à valider.</Note>
      </Card>
    </div>
  );
}
