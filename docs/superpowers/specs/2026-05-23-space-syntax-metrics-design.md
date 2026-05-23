# Space Syntax Metrics on the Network Page — Design

**Date:** 2026-05-23
**Status:** Approved, ready for implementation planning

## Goal

Add the three core Space Syntax metrics — **Mean Depth**, **Integration** (1/RRA), and **Intelligibility** — to the existing Network page. These metrics measure how spatially "deep", "accessible", and "legible" a street network is, based on Hillier's Space Syntax framework. The dashboard already has the topologic graph in MongoDB; this work computes Space Syntax on top of it and surfaces the results in the UI.

Out of scope (deferred): Local Integration (R3, R5), Cyclomatic Number, Space-Link Ratio, Isovists.

## Background

Space Syntax (Hillier, 1984) treats streets as nodes and intersections as edges (the "topologic" or "dual" graph). On that graph:

- **Depth** d(v, u) — shortest-path length in edges between two nodes.
- **Mean Depth** MD(v) — average depth from v to all other nodes.
- **Relative Asymmetry** RA(v) — MD normalised to [0, 1] for graphs of any size.
- **Real RA** RRA(v) — RA divided by a "diamond" reference value to allow comparisons across graphs of different node counts.
- **Integration** I(v) = 1 / RRA(v) — high integration ⇒ low mean depth ⇒ accessible.
- **Intelligibility** — R² of a linear regression of `degree` (local) on `Integration` (global) across all nodes in a sub-area. High R² ⇒ a person standing on a well-connected street can correctly infer it is also globally integrated.

The project already stores the topologic graph in `network_nodes_topologic` and `network_edges_topologic`, and the per-neighborhood summary in `network_neighborhoods.topologic`. These metrics are computable directly with `networkx`.

## Architecture

Three layers, matching the existing pattern in the repo:

```
Script (server/scripts/compute_space_syntax.py)
  → networkx on topologic graph per neighborhood
  → writes back to MongoDB

MongoDB
  network_neighborhoods.topologic.space_syntax  (per-neighborhood aggregates)
  network_nodes_topologic.integration           (per-node, for graph coloring)
  network_nodes_topologic.mean_depth            (per-node)

Backend (server/services/network_service.py)
  - get_neighborhood_metrics — pass through new fields
  - get_network_graph — add integration to node projection

Frontend
  - NetworkPage.tsx — new tab 'space-syntax', tab order: overview, space-syntax, graph, ...
  - SpaceSyntaxTable.tsx — new component
  - NetworkGraph.tsx — "Color by" toggle (default / integration)
  - i18n: en + he keys
```

Compatibility: no breaking changes. New fields are additive under existing documents. Frontend uses `dict.get()`-style fallbacks (the pattern established in commit `7206a84`).

## Data Schema

### `network_neighborhoods` — new sub-object under `topologic`

```js
topologic: {
  // ...existing fields (basic_stats, connectivity, centrality_summary, exit_count, exits)
  space_syntax: {
    mean_depth: 4.213,            // mean of per-node MD
    integration: 1.847,           // mean of per-node Integration
    intelligibility: 0.612,       // R² (degree vs Integration) across nodes
    computed_on_node_count: 247   // size of largest connected component used
  }
}
```

`space_syntax` may be `null` for neighborhoods where the topologic graph has < 3 nodes or no data.

### `network_nodes_topologic` — two new fields per node

```js
{
  // ...existing fields: lat, lng, degree, betweenness_centrality, classification, ...
  mean_depth: 3.84,
  integration: 2.13     // null if RA(v) = 0 (degenerate, not expected in practice)
}
```

## Formulas

For each connected component of the topologic graph (we use only the **largest connected component** — its size is recorded in `computed_on_node_count`):

| Metric | Formula |
|---|---|
| Depth d(v, u) | `nx.shortest_path_length(G, v, u)` |
| Mean Depth MD(v) | `Σ_u d(v, u) / (n − 1)` |
| Relative Asymmetry RA(v) | `2·(MD(v) − 1) / (n − 2)` |
| Diamond reference D_n | `2·{ n·[log₂((n + 2) / 3) − 1] + 1 } / ((n − 1)·(n − 2))` |
| Real RA RRA(v) | `RA(v) / D_n` |
| Integration I(v) | `1 / RRA(v)` |
| Intelligibility (per neighborhood) | `R²` of OLS regression `degree(v) ~ I(v)` |

`n` is the number of nodes in the largest connected component.

### Edge cases

- **Disconnected graph** — use largest connected component; nodes outside it get `mean_depth = null`, `integration = null`.
- **n ≤ 2** — skip the neighborhood entirely; `space_syntax = null`.
- **Connectivity used for Intelligibility** — `degree` from the existing per-node field (Hillier's classical Connectivity).
- **No `network_nodes_topologic` doc** — skip neighborhood; existing UI already handles `null` via the pattern from commit `7206a84`.

## Compute Script

`server/scripts/compute_space_syntax.py` — one-off, idempotent.

- Connects to MongoDB using the existing `server.database` module (re-uses `MONGODB_URI` from `.env`).
- For each neighborhood in `network_neighborhoods`:
  1. Load nodes from `network_nodes_topologic` (filter by `neighborhood_key`).
  2. Load edges from `network_edges_topologic` (filter by `neighborhood_key`).
  3. Build undirected `networkx.Graph`.
  4. Pick the largest connected component.
  5. Compute MD(v), RA(v), RRA(v), I(v) for each node in that component.
  6. Compute per-neighborhood aggregates and Intelligibility R².
  7. Write per-node fields via `updateMany`/`bulkWrite` to `network_nodes_topologic`.
  8. Write `space_syntax` sub-object via `updateOne` to `network_neighborhoods` (`$set: { "topologic.space_syntax": {...} }`).
- Idempotent: re-running the script overwrites existing values.
- Prints a per-neighborhood summary to stdout.

For ~6 neighborhoods with a few hundred topologic nodes each, expected runtime is single-digit seconds.

## Backend Changes

`server/services/network_service.py`:

- `congestion_vs_structure` — already pulls the full `representation_doc`. The new `space_syntax` sub-object piggybacks for free; no change required if scatter doesn't need it. (We are NOT adding Space Syntax metrics to the scatter axes in this iteration.)
- `get_neighborhood_metrics` — already returns the full doc without `_id`. New fields flow through automatically. No change.
- `get_network_graph` — extend the nodes projection to include `integration` (only in topologic branch). Keep geometric projection unchanged.

No new routes. The existing `/api/network/neighborhoods` and `/api/network/graph` endpoints carry the new fields.

## Frontend Changes

### `NetworkPage.tsx`

- Add `'space-syntax'` to `TAB_KEYS`, inserted between `'overview'` and `'graph'`:
  ```ts
  const TAB_KEYS = ['overview', 'space-syntax', 'graph', 'congestion-structure', ...]
  ```
- Add to `TAB_I18N_KEYS`: `'space-syntax': 'network.spaceSyntax'`.
- Add to `TAB_DESCRIPTION_KEYS`: `'space-syntax': 'chartDescriptions.spaceSyntax'`.
- Render `<SpaceSyntaxTable overrides={overrides} />` when active.
- When `activeTab === 'space-syntax'`, force `representation = 'topologic'` for the rendered table, and visually disable the page-level representation toggle with a tooltip "Space Syntax is defined on the topologic representation only" (i18n key `network.representation.tooltipSpaceSyntax`).

### New component `client/src/components/charts/SpaceSyntaxTable.tsx`

- Same shape as `NetworkMetricsTable.tsx`: loading / error / empty states, neighborhood color dot, `MetricTooltip` per column.
- Reads `neighborhood.topologic.space_syntax`. Fallback to italic "No data" row when absent.
- Columns: Neighborhood, Mean Depth, Integration, Intelligibility (R²).
- Numeric formatting: Mean Depth `.toFixed(2)`, Integration `.toFixed(2)`, Intelligibility `R² = .toFixed(3)`.

### `NetworkGraph.tsx`

- Add a "Color by" toggle above the SVG: two pill buttons — **Default** and **Integration**.
- Default = existing behavior (color by `classification` or whatever exists today).
- Integration = node fill scaled across the visible neighborhood's min/max integration. Color ramp follows the Hillier convention: blue (low) → yellow → red (high). Use a simple linear interpolation in HSL.
- When `representation === 'geometric'`, the Integration button is disabled with tooltip `network.graph.colorBy.tooltipGeometric` ("Available only in topologic representation").
- Show a compact horizontal legend (min value — gradient bar — max value) only when Integration mode is active.

### i18n keys

`client/src/i18n/locales/en.json` and `he.json`:

- `network.spaceSyntax` — "Space Syntax" / "ספייס סינטקס"
- `network.representation.tooltipSpaceSyntax` — "Space Syntax is defined on the topologic representation only" / "ספייס סינטקס מוגדר רק על הייצוג הטופולוגי"
- `network.graph.colorBy.label` — "Color by" / "צביעה"
- `network.graph.colorBy.default` — "Default" / "ברירת מחדל"
- `network.graph.colorBy.integration` — "Integration" / "אינטגרציה"
- `network.graph.colorBy.tooltipGeometric` — "Available only in topologic representation" / "זמין רק בייצוג הטופולוגי"
- `spaceSyntaxTable.neighborhood`, `.meanDepth`, `.integration`, `.intelligibility`
- `metrics.mean_depth.description` — explains MD
- `metrics.integration.description` — explains Integration (1/RRA, low MD ⇒ accessible)
- `metrics.intelligibility.description` — explains R² between Connectivity and Integration
- `chartDescriptions.spaceSyntax` — paragraph-level description of the tab

## Testing

- After running the compute script, confirm in Mongo that `network_neighborhoods.topologic.space_syntax` is populated for all 6 neighborhoods.
- Confirm that `network_nodes_topologic` documents have `integration` for nodes inside the largest connected component and `null`/missing for nodes outside.
- UI smoke test: switch between all 7 tabs; verify Space Syntax tab renders the table and chart description; verify representation toggle disables visibly; verify Graph tab Color-by toggle works in topologic and is disabled in geometric.

## File Touch List (estimated lines)

| File | Action | LOC (approx) |
|---|---|---|
| `server/scripts/compute_space_syntax.py` | NEW | ~150 |
| `server/services/network_service.py` | edit `get_network_graph` projection | ~3 added |
| `client/src/components/charts/SpaceSyntaxTable.tsx` | NEW | ~90 |
| `client/src/components/charts/NetworkGraph.tsx` | add color-by toggle, gradient, legend | ~50 added |
| `client/src/pages/NetworkPage.tsx` | add tab, disable toggle on tab | ~15 added |
| `client/src/lib/api.ts` | add Space Syntax fields to types | ~10 added |
| `client/src/i18n/locales/en.json` | new keys | ~15 added |
| `client/src/i18n/locales/he.json` | new keys | ~15 added |
| `docs/superpowers/specs/2026-05-23-space-syntax-metrics-design.md` | this doc | — |

**Total approx: ~350 LOC added, ~5 LOC modified, 1 new doc.**
