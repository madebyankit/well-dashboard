# Well Production Monitoring Dashboard

A multi-page analytics dashboard for oil & gas well production data — production
trends at well and field level, actual output against analyst-set targets, and
top / under-performing wells at a glance.

Built with **Next.js (App Router, JavaScript only)**, **Tailwind CSS**,
**shadcn/ui** on Radix primitives, and **ECharts + Highcharts + AG Grid**.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

Sign in with any demo account below — the sign-in screen lists them and one
click signs you in.

Production build:

```bash
npm run build
npm start            # honours $PORT, defaults to 3000
```

Requires Node.js 20 or newer (developed on Node 22).

`next dev` and `next build` write different, incompatible things into the same
`.next` directory, so running a build and then the dev server would otherwise
leave the dev server loading chunks that no longer exist (`Cannot find module
'./611.js'`). `npm run dev` detects a leftover production build and clears it
automatically; `npm run clean` removes `.next` by hand if you ever need it.

Lint with `npm run lint` (ESLint, `next/core-web-vitals`).

---

## Sign-in credentials

Every demo account uses the password **`demo1234`**.

| Email | Role | Field entitlement | What it demonstrates |
| --- | --- | --- | --- |
| `ava.admin@enfinite.demo` | Administrator | All fields | Full access: user management, role changes, task assignment, export |
| `liam.analyst@enfinite.demo` | Production Analyst | All fields | Sees everything and assigns tasks, but cannot manage users |
| `priya.operator@enfinite.demo` | Field Operator | North Ridge (ESP) | Scoped data — dashboard shows only their field; no directory access |
| `tom.operator@enfinite.demo` | Field Operator | Cedar Flats, Saltbush | Scoped to two fields; can close tasks assigned to them |
| `noor.viewer@enfinite.demo` | Viewer | Blue Mesa (PCP) | Read-only, single field, no Users & Tasks navigation at all |

**To see RBAC working**, sign in as `ava.admin`, then sign out and sign in as
`noor.viewer`: the navigation loses the Users & Tasks entry, the KPIs and charts
narrow to one field, and opening a link to a well in another field (for example
`/wells/CF-005`) returns a clear refusal instead of data.

There is no backend. The user directory, tasks and appearance preferences are
seeded in code and persisted to `localStorage`, so each browser has its own
copy. "Reset demo data" on the Users page restores the seeded accounts.

---

## Pages and why they are split this way

The brief asks for at least two pages and for the reasoning behind the
information architecture. The split follows the question a user is asking:

| Route | Question it answers |
| --- | --- |
| `/dashboard` | *How is the asset performing, and where should I look?* Whole-asset KPIs, production against target over time, field comparison, best/worst wells, anomalies, and the full well table. |
| `/wells` | *Which well do I want?* A directory: the performance spread plus a searchable, sortable table of every well in scope. |
| `/wells/[wellName]` | *What is happening to this well, and what should be done?* Full history with anomalies marked, cycle time against production, the raw readings behind every figure, and the tasks raised against it. |
| `/users` | *Who can do what, and who owns the follow-up?* Task assignment, the user directory, and the live RBAC permission matrix. |
| `/settings` | *Make it readable on my screen.* Theme, font family and text size. |

The dividing line is **overview → selection → detail**. The dashboard is for
scanning and never requires a page change to answer "which field is dragging";
the well page is for investigation and carries everything needed to raise work
against that well. `/users` and `/settings` are administration, deliberately
kept out of the analytical flow.

Filters are shared between `/dashboard` and `/wells` through the URL, so moving
between them preserves your selection.

---

## Which library is used where, and why

The brief asks for all three visualisation libraries, each where it best suits
the visualisation.

| Library | Used for | Why it, and not the others |
| --- | --- | --- |
| **ECharts** | Production against target (`/dashboard`), single-well history (`/wells/[wellName]`), field/well comparison | The charts that need heavy interaction over a long series: scroll-to-zoom plus a range slider across 180 days, and a crosshair tooltip comparing every series on a given day. |
| **Highcharts** | Best/worst against target, attainment solid gauge, cycle time vs production | Ranking bars with per-point colouring and a plot line at the target, and the solid-gauge module — a single "am I hitting target?" number readable from across a room. The dual-axis cycle time chart is also a Highcharts strength. |
| **AG Grid** | Well performance table, daily readings, user directory | The dense, sortable, filterable, exportable tables. Column pinning, quick filter, pagination and CSV export come for free, and the same component is reused for the user directory. |

All three read the same design tokens (`src/hooks/use-chart-theme.js`), so a
theme change restyles the charts and the grid along with the rest of the UI.

---

## Features

### Analytical value
- Production trends over time at **field and well level**, with `Production_1D`,
  the `Production_7D` rolling average and the analyst target on one axis.
- **Top and bottom performers** ranked by variance from target, so "are we
  hitting target?" is answered by direction rather than by reading two lines
  against each other; click a bar to open the well.
- Per-field roll-up cards that double as filters.
- Attainment is computed over the **whole selected window**, not the latest day,
  so one good day cannot make a chronic under-performer look healthy.

### Responsive layout
Phone → tablet → desktop → control room. The sidebar is a drawer under `md`, an
icon rail to `xl`, and a full rail beyond. Content reflows from one column to
three. A `3xl` (1920px) breakpoint relaxes the content width so wall displays
are filled rather than letterboxed, and the **Projector** text scale in Settings
lifts the root font size — every dimension is rem-based, so the grid, chart
labels and KPI figures all scale together.

### User management and RBAC
- Four roles (Administrator, Analyst, Operator, Viewer) defined by a single
  permission matrix in `src/lib/rbac.js`.
- RBAC governs both **what a role can do** (permissions) and **what data it can
  see** (field entitlement). Readings are scoped to a user's entitled fields in
  `src/context/data-context.js` *before* any metric is computed, so a scoped
  user's KPIs, charts and tables are all consistently narrowed.
- Add, edit, deactivate and remove users; change roles and entitlements.
  A guard rail prevents removing the last active administrator.
- **Task assignment**: work raised against a specific well and owned by a named
  person, with priority, due date and status. The assignee list is filtered to
  people actually entitled to that well's field. Analysts assign; operators
  close their own tasks.
- The `/users` → Permissions tab renders the matrix the application enforces, so
  it cannot drift out of date.

### Also implemented (the "good to have" list)
- **Shareable links** — every filter lives in the query string. "Share view"
  copies the current URL; opening it reproduces the exact view.
- **User-managed appearance** — theme (light / dark / high-contrast / system),
  font family and text size, applied consistently across UI, charts and grid,
  and persisted per browser.
- **Filtering and comparison** — by field, by well, by date range and by
  performance band. The comparison chart switches from comparing fields to
  comparing wells once a single field is selected.
- **Anomaly handling** — outliers are flagged per well with a median/MAD robust
  z-score (a plain standard deviation is skewed by the very spikes being looked
  for). Downtime days and spikes/dips are marked on the chart, listed in a feed
  and filterable in the readings table.
- **Graceful states** — loading, error (with retry), empty and forbidden states
  are centralised in `src/components/dashboard/states.jsx`.

---

## Docker

Build:

```bash
docker build -t well-dashboard .
```

Run:

```bash
docker run --rm -p 3000:3000 well-dashboard
```

Then open <http://localhost:3000>.

To serve on a different host port, remap it — the container always listens on
3000:

```bash
docker run --rm -p 8080:3000 well-dashboard    # http://localhost:8080
```

The image is multi-stage and runs the Next.js **standalone** bundle as a
non-root user. `data/frontend_sample_data.csv` is copied into the image
explicitly, because the standalone output only traces JavaScript and the CSV is
read from disk at request time. A `HEALTHCHECK` polls `/api/readings`.

To point the container at your own CSV without rebuilding, mount over the data
directory (the file must keep the same name and columns):

```bash
docker run --rm -p 3000:3000 -v "$(pwd)/data:/app/data:ro" well-dashboard
```

---

## The dataset

`data/frontend_sample_data.csv` — 4,320 rows: 24 wells across 4 fields, daily
readings from 2026-03-20 to 2026-09-15.

| Column | Description | Unit |
| --- | --- | --- |
| `Well Name` | Unique name for each well | — |
| `Field Name` | Wells grouped by location and pump type | — |
| `Timestamp` | When the reading was collected | — |
| `Production_1D` | Oil production over 24 hours | m³/d |
| `Production_7D` | Seven-day rolling average | m³/d |
| `Production Target` | Analyst-set target | m³/d |
| `Average Cycle Time` | Time to complete one production cycle | seconds |

**The brief's `frontend_sample_data.csv` was not attached to this copy of the
assignment**, so the file is generated by `scripts/generate-data.mjs` against
the exact column set specified. It is seeded, so `npm run generate:data`
reproduces it byte for byte. The generator deliberately includes what the
dashboard needs to surface: natural decline, day-to-day noise, monthly target
revisions, wells that consistently beat and miss target, downtime days and
sensor spikes.

To use the real CSV, drop it in at `data/frontend_sample_data.csv` — no code
changes are needed as long as the column headers match the table above.

---

## Project structure

```
src/
  app/
    api/readings/route.js      serves the parsed dataset as JSON
    dashboard/                 asset overview
    wells/                     well directory + [wellName] detail
    users/                     tasks, directory, permission matrix
    settings/                  appearance
    layout.js                  providers, app shell, pre-paint theme script
  components/
    ui/                        shadcn/ui primitives (Radix)
    shell/                     sidebar, top bar, auth gate, login
    charts/                    ECharts + Highcharts wrappers and charts
    grid/                      AG Grid wrapper, tables, cell renderers
    dashboard/                 KPI cards, filter bar, anomaly feed, states
    users/                     user and task dialogs, task board
  context/                     appearance, auth, tasks, data providers
  hooks/                       URL filters, analytics, chart theming
  lib/
    metrics.js                 all analytics — filtering, aggregation, anomalies
    rbac.js                    roles, permissions, seed users and tasks
    filters.js                 filter state <-> query string
    server-data.js             CSV loading (server only)
```

`src/lib/metrics.js` is the analytical core: plain functions over readings, with
no React or DOM involvement. Every number on every page is derived there, so the
charts, KPI cards and grids cannot disagree with each other.

---

## Assumptions

The brief asked for any unclear point to be documented rather than left
unanswered.

1. **The sample CSV was not attached**, so an equivalent dataset is generated
   with the exact columns from the brief (see *The dataset* above).
2. **No backend was specified**, so this is a front-end-only application.
   Authentication is a password comparison against a seeded directory, and
   users, tasks and preferences are persisted to `localStorage`. The RBAC
   permission matrix is enforced in the client; in a real deployment the same
   matrix would be re-enforced server-side, and the client copy would only drive
   the UI.
3. **"On target" is defined as within ±5% of the analyst target.** Outside that
   band a well is out- or under-performing. The threshold is a single constant,
   `TARGET_BAND` in `src/lib/metrics.js`.
4. **Attainment is measured across the selected date window**, not on the latest
   reading, so the figure is not hostage to one noisy day.
5. **Anomalies are statistical, not physical.** A reading is flagged when it sits
   more than 3.5 robust-z (median/MAD) from that well's own normal range, or
   when production is zero (treated as downtime). There is no well-physics model
   behind it.
6. **A `Production Target` of zero** is treated as "no target set"; attainment is
   reported as `—` rather than as a division by zero.
7. **Readings are daily.** The timestamp carries a time, but one reading per well
   per day is assumed, so the date alone is used as the grouping key.
8. **Field entitlement is per field, not per well**, which matches how the brief
   describes fields as the grouping of wells.
