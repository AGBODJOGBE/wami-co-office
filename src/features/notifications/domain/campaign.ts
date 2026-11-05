/** Campagnes de notifications (push ou SMS) vers clients, partenaires ou établissements. */

export type Audience = "clients" | "pros" | "establishments" | "all";

export const AUDIENCE_LABELS: Record<Audience, string> = {
  clients: "Clients",
  pros: "Chauffeurs et livreurs",
  establishments: "Établissements",
  all: "Tout le monde",
};

export interface Campaign {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  channel: "push" | "sms";
  zone: string;
  scheduledAt: string | null;
  status: "draft" | "scheduled" | "sent";
  recipients: number;
  createdBy: string;
}

export type CampaignDraft = Pick<Campaign, "title" | "body" | "audience" | "channel" | "zone" | "scheduledAt">;

/** Un SMS au-delà de 160 caractères est facturé comme plusieurs SMS. */
export const SMS_MAX = 160;
export const PUSH_TITLE_MAX = 60;

export function draftBlocker(d: CampaignDraft, now: Date): string | null {
  if (d.channel === "push" && (d.title.trim().length < 3 || d.title.length > PUSH_TITLE_MAX)) return `Titre de 3 à ${PUSH_TITLE_MAX} caractères.`;
  if (d.body.trim().length < 5) return "Message trop court.";
  if (d.channel === "sms" && d.body.length > SMS_MAX) return `Un SMS fait ${SMS_MAX} caractères maximum.`;
  if (d.channel === "push" && d.body.length > 240) return "Message push : 240 caractères maximum.";
  if (d.scheduledAt && new Date(d.scheduledAt) <= now) return "L’envoi programmé doit être dans le futur.";
  if (d.channel === "sms" && d.audience === "all") return "SMS à tout le monde : coût élevé, choisissez une audience précise.";
  return null;
}
