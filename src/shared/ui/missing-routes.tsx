import { MISSING_ROUTES, type MissingArea } from "@/shared/config/missing-routes";

/**
 * Encart « routes backend manquantes » : liste ce que le backend doit exposer pour que
 * cet écran (ou cette partie d'écran) quitte les données fictives.
 */
export function MissingRoutes({ area, className }: { area: MissingArea | MissingArea[]; className?: string }) {
  const areas = Array.isArray(area) ? area : [area];
  const routes = areas.flatMap((a) => MISSING_ROUTES[a]);
  return (
    <details className={`rounded-[10px] border border-dashed border-warn bg-canvas px-3 py-2 text-[12px] ${className ?? ""}`}>
      <summary className="cursor-pointer font-bold text-warn">
        Données fictives : {routes.length} route{routes.length > 1 ? "s" : ""} à implémenter côté backend
      </summary>
      <ul className="mt-2 flex flex-col gap-1 text-muted">
        {routes.map((x) => (
          <li key={`${x.method} ${x.path}`}>
            <code className="font-mono text-[11.5px] text-ink">
              {x.method} {x.path}
            </code>{" "}
            — {x.purpose}
          </li>
        ))}
      </ul>
    </details>
  );
}
