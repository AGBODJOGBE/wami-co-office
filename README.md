# WAMI Admin — back-office

Back-office interne de WAMI : opérations en direct, partenaires (WAMI Pro), établissements
(WAMI Business), clients, finances et réglages de la plateforme.

**Stack** : TypeScript · React 19 · Next.js 16 (App Router) · Tailwind CSS 4 · Zustand · Leaflet.

```bash
npm install
npm run dev          # http://localhost:3000 — faux backend intégré, aucune configuration
```

Connexion de démonstration : n'importe quel e-mail, code **123456**, et le rôle de votre choix
(pour tester ce que chaque rôle voit). Les données affichées sont fictives.

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build et serveur de production |
| `npm run typecheck` | Vérification TypeScript |
| `npm run lint` | ESLint (règles Next.js) |
| `npm test` | Tests des règles métier (Vitest) |

---

## Brancher le backend WAMI

Copiez `.env.example` en `.env.local` :

```bash
WAMI_API_URL=https://api.wami.example   # vide = faux backend
SESSION_SECRET=une-chaine-aleatoire-de-32-caracteres-minimum
```

- Le navigateur n'appelle **jamais** le backend directement. Il appelle `/api/v1/...` ;
  `src/app/api/v1/[...path]/route.ts` relaie vers `WAMI_API_URL` avec le jeton de l'agent
  (cookie httpOnly signé), via `src/app/api/_proxy/forward.ts`.
- Sans `WAMI_API_URL`, la même route répond avec le faux backend `src/app/api/_proxy/mock`
  (données en mémoire, remises à zéro au redémarrage). Il applique les mêmes droits par rôle
  que le vrai backend devra appliquer.
- Tous les endpoints consommés sont centralisés dans `src/shared/config/api-routes.ts`.
  **Chemins et formats JSON : à valider avec l'équipe backend.**
- Connexion réelle attendue : `POST /v1/admin/auth/login` `{ email, code }` → `{ token, user }` (à valider).

> `_proxy` est un dossier privé de l'App Router (préfixe `_`) : il regroupe le code du proxy sans
> créer de route. L'URL publique est `/api/v1/...`.

---

## Architecture

Organisation **par feature**, et à l'intérieur de chaque feature le même découpage en couches
(Clean Architecture côté front) :

```
src/
├── app/                         Routes Next.js (pages minces) — couche de composition
│   ├── (back-office)/<feature>/page.tsx   affiche la vue de la feature
│   ├── login/
│   └── api/
│       ├── auth/{login,logout,session}/   session de l'agent (cookie httpOnly signé)
│       ├── v1/[...path]/route.ts          point d'entrée unique des appels
│       └── _proxy/                         relais backend + faux backend
├── features/<feature>/
│   ├── domain/        entités, règles métier pures, contrat du repository (interface)
│   ├── application/   cas d'usage, repository HTTP, store Zustand si utile
│   ├── presentation/  composants React de la feature
│   └── index.ts       API publique de la feature (vue + types)
├── shared/
│   ├── config/        api-routes.ts, navigation.ts
│   ├── auth/          rôles, matrice d'accès, session (Zustand)
│   ├── hooks/         useResource (chargement), useAction (actions + messages)
│   ├── lib/           client HTTP, Result, formatage
│   └── ui/            composants génériques, coque, carte Leaflet
└── proxy.ts           redirection vers /login sans session (ex-middleware)
```

**Règles de dépendance**
- `domain` n'importe rien d'autre que `shared` (types) ; aucune dépendance à React ni au réseau.
- `application` dépend de `domain` et de `shared/lib` ; chaque cas d'usage valide les règles
  du domaine **avant** d'appeler le backend et renvoie un `Result` (jamais d'exception vers l'UI).
- `presentation` dépend de `application` et `domain`.
- Une feature n'importe **jamais** une autre feature. Seule la couche `app/` les assemble.
- État : pas de store global lourd. Zustand seulement pour la session et quelques filtres
  d'écran (`live-ops`, `rides`) ; le reste vit dans des hooks par feature.

### Les 24 features

| Feature | Écran | Règles métier testées ou appliquées |
|---|---|---|
| `live-ops` | Tableau de bord, opérations en direct (carte Leaflet), incidents | priorité SOS > retard > recherche ; réassignation avant prise en charge |
| `rides` | Courses | annulation d'une course en cours avec motif |
| `delivery` | Livraisons (colis, repas) | retard vs heure promise ; pas d'annulation d'un colis en route |
| `delivery-b2b` | Comptes entreprises | plafond de crédit ≥ encours, par tranches de 10 000 F |
| `rounds` | Tournées | livreur en ligne, libre, véhicule assez grand |
| `vtc` | Offres VTC | au moins une offre active |
| `parcel-types` | Types de colis | code, poids, véhicules, multiplicateur |
| `documents` | Vérifications | refus motivé ; pièce expirée refusée ; activation si tout est validé |
| `drivers` | Chauffeurs et livreurs | suspension motivée ; blocage automatique non manuel |
| `vehicles` | Véhicules (flotte WAMI-CO et partenaires) | assurance expirée = pas d'affectation |
| `contracts` | Location-vente WAMI-CO | impayés, retard critique à 3 échéances, versement ≤ reste dû |
| `driver-bonus` | Primes chauffeurs | période, objectif, prime minimum |
| `establishments` | Établissements | commission 0 à 30 % ; suspension motivée |
| `support` | Support et litiges | délai de réponse ; remboursement ≤ payé ; plafond Support 5 000 F |
| `wallet` | Portefeuilles | ajustement motivé ; client jamais négatif ; gros montant = super admin |
| `finance` | Lot de versement | lignes négatives ou en échec exclues ; **double validation** |
| `promo-codes` | Codes promo | plafond obligatoire pour un pourcentage ; remise ≤ commande |
| `affiliate` | Affiliation | versement ≤ dû, minimum 5 000 F |
| `referrals` | Parrainage | récompenses bornées ; blocage des parrainages suspects |
| `notifications` | Campagnes push / SMS | SMS ≤ 160 caractères ; pas de SMS à tout le monde |
| `pricing-zones` | Tarifs et zones (carte Leaflet) | calcul du prix, minimum ≥ prise en charge |
| `rbac` | Rôles et journal | toujours un super admin ; pas de modification de son propre accès |
| `settings` | Paramètres | bornes des délais, format du numéro SOS |
| `search` | Recherche globale | 2 caractères minimum, résultats groupés |

### Rôles

Matrice par défaut dans `src/shared/auth/permissions.ts` : **Super admin**, **Opérations**,
**Support et vérification**, **Finance**. Le menu n'affiche que les modules autorisés ; les
boutons d'action sont désactivés en lecture seule ; le backend reste seul juge (403).

Pour essayer la double validation des versements : préparez le lot en Super admin, puis
reconnectez-vous en Finance pour l'approuver.

---

## Points d'attention

- **Next.js 16** : `middleware.ts` s'appelle désormais `proxy.ts` ; *Cache Components* est activé
  (`next.config.ts`). Lisez `AGENTS.md` et `node_modules/next/dist/docs/` avant de changer ces conventions.
- **Carte** : fond OpenStreetMap, adapté au développement. En production, un fournisseur de tuiles
  sous contrat (Mapbox, MapTiler…) — à valider.
- **Temps réel** : l'écran « En direct » se rafraîchit toutes les 10 s ; WebSocket ou SSE à prévoir côté backend.
- **Page de connexion** : le mode démonstration est déterminé au build (`WAMI_API_URL` présent ou non).
- **Sécurité** : cookie de session signé (HMAC) et httpOnly ; `SESSION_SECRET` obligatoire en production.
  Double authentification des agents : à valider.

## À valider

Tous les montants, taux et délais affichés sont des propositions (tarifs, commissions 15 / 12 / 8 %,
plafond de remboursement Support, seuil de retard critique en location-vente, prix plancher,
fréquence des versements, durée de conservation du journal), ainsi que le contrat d'API complet.
