import type { Grid, GridDraft } from "./grid";

export interface GridRepository {
  /** Grille active, ou null si aucune n'a encore été publiée. */
  active(): Promise<Grid | null>;
  publish(d: GridDraft): Promise<void>;
}
