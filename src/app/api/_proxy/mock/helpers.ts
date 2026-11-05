import "server-only";
import { invalid, notFound } from "./router";

/** Lecture typée du corps JSON d'une requête du faux backend. */
export const str = (body: Record<string, unknown>, key: string): string => (typeof body[key] === "string" ? (body[key] as string) : "");
export const num = (body: Record<string, unknown>, key: string): number => (typeof body[key] === "number" ? (body[key] as number) : NaN);

export function find<T>(list: T[], pred: (x: T) => boolean, what?: string): T {
  const item = list.find(pred);
  if (!item) throw notFound(what);
  return item;
}

export function replace<T>(list: T[], pred: (x: T) => boolean, next: T): T {
  const i = list.findIndex(pred);
  if (i < 0) throw notFound();
  list[i] = next;
  return next;
}

export function requireText(value: string, min: number, message: string) {
  if (value.trim().length < min) throw invalid(message);
}

export const matches = (q: string, ...fields: string[]) => !q || fields.some((f) => f.toLowerCase().includes(q.toLowerCase()));
