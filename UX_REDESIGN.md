# Dployr UX/UI Redesign – Claude Code Instruction (Bootstrap + EJS)

## Kontext
Dieses Repo (Dployr) nutzt:
- Server-side Rendering mit **EJS**
- Styling mit **Bootstrap**
- JS/Node Backend (Express o.ä.)

Ziel: UI soll weniger nach Default-Bootstrap aussehen und "professioneller" wie ein modernes Hosting/Control-Panel wirken.

Wir ändern **kein** Kern-Backend-Verhalten (Deploy, DB, Auth, etc.). Fokus ist Layout, Komponenten, CSS, EJS Partials.

---

## High-level Ziele (Design/UX)
1) **Konsistente Page Header**: Titel links, Primary CTA rechts, optional Subtitle/Filterbar.
2) **KPI Cards neutralisieren**: keine vollflächigen “Regenbogen”-Cards; stattdessen neutrale Cards mit dezenter Akzentleiste.
3) **Listen statt leere Flächen**: Projekte/Datenbanken sollen auch bei 0 Einträgen nach “Liste” aussehen (Container+Header+Filterbar), Empty-State ist Teil der Liste.
4) **Bootstrap “de-defaulten”**: kleines Theme mit Design Tokens (CSS Variables) + Card/Button/Badge Polish.
5) **Help-Seite strukturieren**: Docs-Layout, bessere Typohierarchie (optional: Search box).

---

## Non-goals (nicht tun)
- Kein Wechsel zu React/Vue
- Keine Änderung von API-Routen/Deploy-Logik
- Kein Redesign jedes einzelnen Admin-Dialogs, nur Kernseiten:
  - Dashboard
  - Projekte
  - Datenbanken
  - Hilfe (optisch)

---

## Akzeptanzkriterien
- Dashboard zeigt KPI-Cards im neuen Stil (neutral + accent stripe)
- Projekte/Datenbanken Seiten haben:
  - PageHeader (Titel/CTA)
  - Table-Shell Container (auch wenn leer)
  - Empty State innerhalb des Containers (nicht riesig zentriert ohne Rahmen)
- Theme CSS wird nach Bootstrap geladen und beeinflusst Card/Buttons/Typography sichtbar
- Dark/Light Mode bleibt funktionsfähig (falls vorhanden); mindestens Light muss sauber aussehen
- Keine Layout-Brüche auf mobilen Breakpoints (Bootstrap responsive)

---

## Vorgehen (Claude Code: Schritt-für-Schritt)

### Step 0 – Repo Analyse (nur lesen)
1. Prüfe `package.json` (Scripts, Dependencies, Bootstrap Version)
2. Identifiziere Express Entry (`app.js`, `server.js`, etc.)
3. Finde EJS Views Ordner (`views/`)
4. Finde Static Assets (`public/` oder `static/`)
5. Identifiziere aktuelles Layout:
   - Gibt es `layout.ejs` / `partials`?
   - Wie wird die Navigation gerendert?

Output: Kurzer Report in Kommentarform (Dateien + Pfade), dann mit Step 1 fortfahren.

---

### Step 1 – Theme CSS hinzufügen (Bootstrap overrides + Tokens)
Erstelle Datei:
- `public/css/theme.css` (oder passender static path)

Inhalt:
- CSS Variables Tokens (bg, surface, text, muted, border, primary, success, warning, danger, radius, shadow)
- Bootstrap overrides:
  - `body` background
  - `.container-xxl` max-width (1280px)
  - `.card` radius/border/shadow optional `.d-elevated`
  - `.btn` radius/padding + `.btn-primary` brand color
  - `.badge` (optional) minimal polish
  - `.d-page-title` typohierarchie
  - `.d-stat` KPI card style mit `::before` accent stripe

Wichtig:
- Theme muss **nach Bootstrap** geladen werden.
- Nutze keine wilden !important, nur wo nötig.

---

### Step 2 – EJS Partials/Komponenten einführen
Erstelle Ordner:
- `views/partials/`
- `views/components/` (falls nicht existiert)

Erstelle Partial:
1) `views/partials/pageHeader.ejs`
   - Props: `title`, `subtitle?`, `primaryAction?` (label+href+icon optional), `secondaryAction?`

Markup (Bootstrap):
- Row align center
- left: title + subtitle
- right: action buttons

2) `views/components/statCard.ejs`
   - Props: `label`, `value`, `variant` (primary/success/warning/danger), `icon?`
   - Uses `.card.d-elevated.d-stat` plus variant class

3) `views/components/emptyState.ejs`
   - Props: `title`, `description?`, `primaryAction`, `secondaryAction?`, `icon?`
   - Bootstrap card body centered but in a contained shell (not huge empty page)

Optional:
4) `views/components/tableShell.ejs`
   - Props: `title`, `actions?` (right side), `content` (table/empty)
   - Card with header + body

---

### Step 3 – Layout: Theme einbinden
In das globale Layout / head (z.B. `layout.ejs`):
- Stelle sicher:
  - Bootstrap CSS wird geladen
  - Danach `theme.css`
  - Optional: `theme-dark.css` falls getrennt, sonst über `[data-theme="dark"]`

Wenn es kein globales Layout gibt:
- Führe minimal-invasiv ein `layout.ejs` ein und passe Views so an, dass sie es nutzen.
- Oder: In existing header partial ergänzen.

---

### Step 4 – Dashboard Seite umbauen
Ziel: Deine bisherigen KPI-Kacheln ersetzen durch `statCard` Komponenten.

Neues Dashboard Layout:
- PageHeader: "Dashboard" + Button "+ Neues Projekt"
- KPI Row: 4 Cards (Meine Projekte, Laufend, Gestoppt, Geteilt)
- Danach zwei TableShell Bereiche:
  1) "Meine Projekte" (letzte 5) + Link "Alle anzeigen"
  2) "Meine Datenbanken" (letzte 5) + Link "Alle anzeigen"

Wenn keine Einträge:
- Zeige `emptyState` innerhalb der jeweiligen Shell:
  - Projekte: “Noch keine Projekte vorhanden” + CTA “Erstes Projekt erstellen”
  - Datenbanken: “Noch keine Datenbanken vorhanden” + CTA “Datenbank erstellen”

---

### Step 5 – Projekte Liste umbauen
Ziel: Auch ohne Projekte wirkt es wie eine “Liste”.

Auf `/projekte`:
- PageHeader: "Projekte" + CTA "+ Neues Projekt"
- Optional Filterbar (kann zunächst nur UI sein):
  - Search input (no functional requirement)
  - Status dropdown (optional)
- TableShell: Header "Alle Projekte"
- Wenn leer: EmptyState (in Shell)
- Wenn nicht leer: Table mit Spalten:
  - Name, Status Badge, Typ Badge, URL/Port (falls vorhanden), Last Deploy (falls vorhanden), Actions

Actions: vorerst nur vorhandene Buttons sauber stylen (Bootstrap btn-sm, icons optional).

---

### Step 6 – Datenbanken Liste umbauen
Analog zu Projekte:
- PageHeader: "Datenbanken" + CTA "+ Neue Datenbank"
- TableShell: "Alle Datenbanken"
- EmptyState in Shell
- Table Spalten (falls Daten vorhanden):
  - Name, Typ, Used by (optional), Admin UI Link (phpMyAdmin/pgAdmin), Actions

---

### Step 7 – Hilfe Seite polish
Minimal:
- PageHeader: "Hilfe"
- Links: bestehende Sidebar bleibt
- Content:
  - Typohierarchie verbessern (H2/H3 spacing)
  - Blaue “Headerbar” in Cards entfernen oder an theme angleichen (neutral card header)
Optional:
- Search input (UI only)

---

### Step 8 – Cleanup & Consistency
- Alle großen Icon-Header reduzieren (keine 48px Icons links vom Titel)
- Einheitliche Spacing: `mt-4`, `mb-3`, etc.
- Buttons:
  - Primary CTA: `.btn.btn-primary`
  - Secondary: `.btn.btn-outline-primary` oder `.btn.btn-light`
- Replace “Alle anzeigen” Buttons durch Link-style:
  - `.btn btn-sm btn-outline-primary` oder `.link-primary`

---

## Definition of Done – Checklist
- [ ] `theme.css` existiert und wird nach Bootstrap geladen
- [ ] PageHeader Partial ist auf Dashboard/Projekte/DB/Hilfe eingesetzt
- [ ] KPI Cards auf Dashboard sind neutral + Accent stripe (keine Vollflächen)
- [ ] Projekte & Datenbanken zeigen TableShell + EmptyState in Shell
- [ ] Keine offensichtlichen Layout-Brüche auf mobile (Bootstrap grid)
- [ ] Keine Backend-Routen/Controller kaputt gemacht
- [ ] Build/Start läuft weiterhin

---

## Claude Code – Master Prompt (kopieren & verwenden)

Du bist Claude Code und arbeitest direkt im Repo. Folge exakt der Datei `Dployr UX/UI Redesign – Claude Code Instruction (Bootstrap + EJS)`.

Regeln:
- Minimal-invasive Änderungen: nichts am Backend-Verhalten ändern.
- Fokus: EJS Templates/Partials, Bootstrap Markup, theme.css.
- Erstelle neue Partials/Components wie beschrieben und refactore die betroffenen Seiten, sie zu nutzen.
- Halte Änderungen klein und konsistent. Wiederverwende Komponenten statt duplizieren.
- Nach jeder größeren Änderung: kurz prüfen, dass Templates keine Syntaxfehler haben.

Aufgaben:
1) Repo Analyse (Step 0) kurz reporten.
2) Step 1–8 implementieren.
3) Am Ende: Liste der geänderten/neu erstellten Dateien + kurze Beschreibung.

---

## Notes / UI Guidelines
- KPI Cards: neutral, value groß, label klein, icon optional monochrom.
- Empty states: immer 1 Primary CTA + optional docs link.
- Keine grellen Vollflächenfarben auf Cards.
- Max width: container-xxl 1280px.
- Weniger oversized typography: H1 24–28.

