# Space Syntax Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Mean Depth, Integration (1/RRA), and Intelligibility to the Network page — new Space Syntax tab + per-node Integration coloring on the existing Graph tab. Backed by a one-off Python script that writes results to MongoDB.

**Architecture:** A Python script computes Space Syntax metrics with `networkx` on the existing topologic graph and writes per-neighborhood aggregates to `network_neighborhoods.topologic.space_syntax` and per-node values to `network_nodes_topologic`. The Flask backend already returns these documents — only the graph route projection needs to add `integration`. The React frontend adds a new tab and a color-by toggle on the existing graph.

**Tech Stack:** Python 3.11, `networkx`, `numpy`, pymongo, Flask. React 19, TypeScript, Tailwind, Recharts, i18next.

**Spec:** `docs/superpowers/specs/2026-05-23-space-syntax-metrics-design.md`

**Testing approach:** This project has no test framework and the user has instructed no unit tests during dev. Verification is via (1) script console output + Mongo inspection, (2) browser smoke test. `npm run lint` and `tsc -b` run only before final push.

---

### Task 1: Compute script — add deps & scaffold

**Files:**
- Modify: `server/requirements.txt`
- Create: `server/scripts/__init__.py` (empty)
- Create: `server/scripts/compute_space_syntax.py`

- [ ] **Step 1: Add networkx and numpy to requirements**

Edit `server/requirements.txt`. Add at the end:
```
networkx==3.2.1
numpy==1.26.4
```

- [ ] **Step 2: Install new deps**

```bash
cd /Users/gfriedman/PycharmProjects/traffic-dashboard
.venv/bin/pip install networkx==3.2.1 numpy==1.26.4
```

Expected output: `Successfully installed networkx-3.2.1 numpy-1.26.4` (or "already satisfied").

- [ ] **Step 3: Create scripts package init file**

Create `server/scripts/__init__.py` with empty contents.

- [ ] **Step 4: Create the compute script skeleton**

Create `server/scripts/compute_space_syntax.py`:

```python
"""
One-off script: compute Space Syntax metrics (Mean Depth, Integration, Intelligibility)
on the topologic representation of each neighborhood and write them back to MongoDB.

Run from the repo root:
    python -m server.scripts.compute_space_syntax
"""
import math
import sys
from collections import defaultdict

import networkx as nx
import numpy as np
from pymongo import UpdateOne

from server.database import get_db


def diamond_reference(n: int) -> float:
    """Hillier's diamond-graph reference RA value for normalisation."""
    if n <= 2:
        raise ValueError(f"diamond_reference undefined for n={n}")
    return 2 * (n * (math.log2((n + 2) / 3) - 1) + 1) / ((n - 1) * (n - 2))


def build_node_id_map(nodes):
    """Return (id_to_index, index_to_id) — nodes use lat/lng as identity."""
    id_to_index = {}
    index_to_id = []
    for index, node in enumerate(nodes):
        key = (node["lat"], node["lng"])
        id_to_index[key] = index
        index_to_id.append(node)
    return id_to_index, index_to_id


def build_graph(nodes, edges):
    """Build an undirected networkx Graph keyed by node index."""
    id_to_index, index_to_id = build_node_id_map(nodes)
    graph = nx.Graph()
    graph.add_nodes_from(range(len(nodes)))
    for edge in edges:
        from_key = (edge["from_lat"], edge["from_lng"])
        to_key = (edge["to_lat"], edge["to_lng"])
        if from_key in id_to_index and to_key in id_to_index:
            graph.add_edge(id_to_index[from_key], id_to_index[to_key])
    return graph, index_to_id


def compute_space_syntax_for_component(component_graph):
    """
    Returns dict { node_index: {"mean_depth": float, "integration": float | None} }.
    Caller passes only the largest connected component.
    """
    n = component_graph.number_of_nodes()
    if n < 3:
        return {}

    diamond = diamond_reference(n)
    results = {}
    path_lengths = dict(nx.all_pairs_shortest_path_length(component_graph))

    for node_index, lengths in path_lengths.items():
        total_depth = sum(length for target, length in lengths.items() if target != node_index)
        mean_depth = total_depth / (n - 1)
        relative_asymmetry = 2 * (mean_depth - 1) / (n - 2)
        if relative_asymmetry <= 0:
            integration = None
        else:
            real_ra = relative_asymmetry / diamond
            integration = 1 / real_ra
        results[node_index] = {
            "mean_depth": mean_depth,
            "integration": integration,
        }
    return results


def compute_intelligibility(per_node_results, degrees):
    """
    R² of OLS: degree(v) ~ integration(v) across nodes that have both values.
    Returns float or None if degenerate.
    """
    integrations = []
    connectivities = []
    for node_index, metrics in per_node_results.items():
        if metrics["integration"] is None:
            continue
        integrations.append(metrics["integration"])
        connectivities.append(degrees[node_index])
    if len(integrations) < 3:
        return None
    correlation_matrix = np.corrcoef(integrations, connectivities)
    correlation = correlation_matrix[0, 1]
    if math.isnan(correlation):
        return None
    return float(correlation ** 2)


def process_neighborhood(db, neighborhood_doc):
    key = neighborhood_doc["neighborhood_key"]
    nodes = list(db["network_nodes_topologic"].find({"neighborhood_key": key}))
    edges = list(db["network_edges_topologic"].find({"neighborhood_key": key}))

    if not nodes:
        print(f"  [{key}] no topologic nodes — skipping")
        return None

    graph, index_to_node = build_graph(nodes, edges)
    components = list(nx.connected_components(graph))
    if not components:
        print(f"  [{key}] no connected components — skipping")
        return None

    largest_component_indices = max(components, key=len)
    component_graph = graph.subgraph(largest_component_indices).copy()

    per_node_results = compute_space_syntax_for_component(component_graph)
    if not per_node_results:
        print(f"  [{key}] largest component too small — skipping")
        return None

    degrees = {node_index: graph.degree[node_index] for node_index in largest_component_indices}
    intelligibility = compute_intelligibility(per_node_results, degrees)

    mean_depths = [metrics["mean_depth"] for metrics in per_node_results.values()]
    integrations = [
        metrics["integration"] for metrics in per_node_results.values()
        if metrics["integration"] is not None
    ]
    aggregate = {
        "mean_depth": float(np.mean(mean_depths)),
        "integration": float(np.mean(integrations)) if integrations else None,
        "intelligibility": intelligibility,
        "computed_on_node_count": len(largest_component_indices),
    }

    node_updates = []
    for node_index, metrics in per_node_results.items():
        node_doc = index_to_node[node_index]
        node_updates.append(UpdateOne(
            {"_id": node_doc["_id"]},
            {"$set": {
                "mean_depth": metrics["mean_depth"],
                "integration": metrics["integration"],
            }},
        ))
    if node_updates:
        db["network_nodes_topologic"].bulk_write(node_updates, ordered=False)

    db["network_neighborhoods"].update_one(
        {"neighborhood_key": key},
        {"$set": {"topologic.space_syntax": aggregate}},
    )

    print(
        f"  [{key}] n={len(largest_component_indices)}/{len(nodes)} "
        f"MD={aggregate['mean_depth']:.3f} "
        f"I={aggregate['integration']:.3f if aggregate['integration'] else 'N/A'} "
        f"R²={aggregate['intelligibility']:.3f if aggregate['intelligibility'] else 'N/A'}"
    )
    return aggregate


def main():
    db = get_db()
    neighborhoods = list(db["network_neighborhoods"].find({}, {"neighborhood_key": 1}))
    print(f"Computing Space Syntax for {len(neighborhoods)} neighborhoods…")
    for neighborhood_doc in neighborhoods:
        process_neighborhood(db, neighborhood_doc)
    print("Done.")


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 5: Commit (deps + scaffold)**

```bash
git add server/requirements.txt server/scripts/__init__.py server/scripts/compute_space_syntax.py
git commit -m "Add Space Syntax compute script (deps + skeleton)"
```

---

### Task 2: Compute script — run, verify, fix the f-string bug

**Files:**
- Modify: `server/scripts/compute_space_syntax.py`

- [ ] **Step 1: Fix the f-string nested-format bug**

The print statement in `process_neighborhood` has a bug — you can't put a conditional expression inside an f-string format spec. Replace the print block with:

```python
    integration_str = f"{aggregate['integration']:.3f}" if aggregate['integration'] is not None else "N/A"
    intelligibility_str = f"{aggregate['intelligibility']:.3f}" if aggregate['intelligibility'] is not None else "N/A"
    print(
        f"  [{key}] n={len(largest_component_indices)}/{len(nodes)} "
        f"MD={aggregate['mean_depth']:.3f} "
        f"I={integration_str} "
        f"R²={intelligibility_str}"
    )
```

- [ ] **Step 2: Run the script**

```bash
cd /Users/gfriedman/PycharmProjects/traffic-dashboard
.venv/bin/python -m server.scripts.compute_space_syntax
```

Expected output: one line per neighborhood with finite `MD`, `I`, and `R²` values. Should complete in under 10 seconds total.

If a neighborhood reports `n=0/0 ... skipping` — that neighborhood has no topologic nodes, which is fine.

- [ ] **Step 3: Spot-check MongoDB**

```bash
.venv/bin/python -c "
from server.database import get_db
db = get_db()
sample = db['network_neighborhoods'].find_one({}, {'neighborhood_key': 1, 'topologic.space_syntax': 1, '_id': 0})
print(sample)
node = db['network_nodes_topologic'].find_one({'integration': {'\$exists': True}}, {'_id': 0, 'neighborhood_key': 1, 'integration': 1, 'mean_depth': 1})
print(node)
"
```

Expected: aggregate dict with finite values and a node doc with `integration` and `mean_depth` populated.

- [ ] **Step 4: Commit**

```bash
git add server/scripts/compute_space_syntax.py
git commit -m "Fix f-string format spec in Space Syntax compute output"
```

---

### Task 3: Backend — extend graph projection with integration

**Files:**
- Modify: `server/services/network_service.py:294-333` (function `get_network_graph`)

- [ ] **Step 1: Add integration to topologic node projection**

In `get_network_graph`, the nodes projection currently is:
```python
nodes = list(db[nodes_collection].find(
    {"neighborhood_key": neighborhood_key},
    {"_id": 0, "lat": 1, "lng": 1, "classification": 1, "is_exit_node": 1},
))
```

Replace with:
```python
node_projection = {"_id": 0, "lat": 1, "lng": 1, "classification": 1, "is_exit_node": 1}
if is_topologic:
    node_projection["integration"] = 1
nodes = list(db[nodes_collection].find(
    {"neighborhood_key": neighborhood_key},
    node_projection,
))
```

- [ ] **Step 2: Smoke test the API**

```bash
cd /Users/gfriedman/PycharmProjects/traffic-dashboard
.venv/bin/python -m server.app &
sleep 2
curl -s "http://localhost:5001/api/network/graph?neighborhood=neve_zeev&representation=topologic" | python -c "
import json, sys
data = json.load(sys.stdin)
node_count = len(data['nodes'])
with_integration = sum(1 for node in data['nodes'] if node.get('integration') is not None)
print(f'topologic: {with_integration}/{node_count} nodes have integration')
"
curl -s "http://localhost:5001/api/network/graph?neighborhood=neve_zeev&representation=geometric" | python -c "
import json, sys
data = json.load(sys.stdin)
has_integration = any('integration' in node for node in data['nodes'])
print(f'geometric: integration field present = {has_integration} (should be False)')
"
kill %1 2>/dev/null
```

Expected: topologic ratio close to 1.0; geometric reports False.

- [ ] **Step 3: Commit**

```bash
git add server/services/network_service.py
git commit -m "Expose per-node Integration on topologic graph route"
```

---

### Task 4: Frontend — extend TypeScript types

**Files:**
- Modify: `client/src/lib/types.ts:128-150` (NetworkRepresentationSummary, NetworkNeighborhoodMetrics surroundings)
- Modify: `client/src/lib/types.ts:221-226` (NetworkGraphNode)

- [ ] **Step 1: Add SpaceSyntaxMetrics interface**

Insert before `NetworkRepresentationSummary` (around line 134):

```ts
export interface SpaceSyntaxMetrics {
  mean_depth: number;
  integration: number | null;
  intelligibility: number | null;
  computed_on_node_count: number;
}
```

- [ ] **Step 2: Add space_syntax to NetworkRepresentationSummary**

Modify the existing `NetworkRepresentationSummary`:

```ts
export interface NetworkRepresentationSummary {
  basic_stats: NetworkBasicStats;
  connectivity: NetworkConnectivity;
  centrality_summary: NetworkCentralitySummary;
  exit_count: number;
  exits: NetworkExitSummary[];
  space_syntax?: SpaceSyntaxMetrics | null;
}
```

- [ ] **Step 3: Add integration to NetworkGraphNode**

Modify the existing `NetworkGraphNode`:

```ts
export interface NetworkGraphNode {
  lat: number;
  lng: number;
  classification: 'interior' | 'perimeter' | 'exterior';
  is_exit_node: boolean;
  integration?: number | null;
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/types.ts
git commit -m "Add Space Syntax types to network client API"
```

---

### Task 5: i18n keys

**Files:**
- Modify: `client/src/i18n/en.json`
- Modify: `client/src/i18n/he.json`

- [ ] **Step 1: Add new keys to en.json**

Inside the `"network"` object (after `"graph": "Map"`), insert:
```json
"spaceSyntax": "Space Syntax",
```

Inside `"network.representation"`, add a sibling key:
```json
"tooltipSpaceSyntax": "Space Syntax is defined on the topologic representation only"
```

So the full `representation` object becomes:
```json
"representation": {
  "topologic": "Topologic",
  "geometric": "Geometric",
  "tooltipSpaceSyntax": "Space Syntax is defined on the topologic representation only"
}
```

Add a sibling object `"graphColorBy"` inside `"network"`:
```json
"graphColorBy": {
  "label": "Color by",
  "default": "Default",
  "integration": "Integration",
  "tooltipGeometric": "Available only in topologic representation"
}
```

After `"networkTable"` (find the closing brace and add as sibling at the same level), add:
```json
"spaceSyntaxTable": {
  "neighborhood": "Neighborhood",
  "meanDepth": "Mean Depth",
  "integration": "Integration",
  "intelligibility": "Intelligibility (R²)"
}
```

In the existing `"metrics"` object, add three entries:
```json
"mean_depth": {
  "description": "Average shortest-path length (in edges) from a node to all others in the topologic graph. Lower means more central."
},
"integration": {
  "description": "1 / RRA. High integration means low mean depth — the street is well-integrated and accessible."
},
"intelligibility": {
  "description": "R² of the linear relation between local Connectivity (degree) and global Integration. High intelligibility means a person can predict the global structure from local properties."
}
```

In the existing `"chartDescriptions"` object, add:
```json
"spaceSyntax": "Space Syntax (Hillier, 1984) treats the street network as a topologic graph and measures how 'deep' each street is from all others. Mean Depth is the average shortest-path distance from a street; Integration (1/RRA) is the normalised inverse — high values mean accessible streets; Intelligibility is the R² between local Connectivity and global Integration — high values mean the local structure correctly predicts the global one."
```

- [ ] **Step 2: Add the same keys (Hebrew) to he.json**

Mirror the same structure with Hebrew values:

`network.spaceSyntax` = `"ספייס סינטקס"`
`network.representation.tooltipSpaceSyntax` = `"ספייס סינטקס מוגדר רק על הייצוג הטופולוגי"`
`network.graphColorBy.label` = `"צביעה"`
`network.graphColorBy.default` = `"ברירת מחדל"`
`network.graphColorBy.integration` = `"אינטגרציה"`
`network.graphColorBy.tooltipGeometric` = `"זמין רק בייצוג טופולוגי"`

`spaceSyntaxTable.neighborhood` = `"שכונה"`
`spaceSyntaxTable.meanDepth` = `"עומק ממוצע"`
`spaceSyntaxTable.integration` = `"אינטגרציה"`
`spaceSyntaxTable.intelligibility` = `"מובנות (R²)"`

`metrics.mean_depth.description` = `"אורך המסלול הקצר ביותר הממוצע (בקשתות) מצומת לכל שאר הצמתים בגרף הטופולוגי. ערך נמוך = יותר מרכזי."`
`metrics.integration.description` = `"1/RRA. אינטגרציה גבוהה משמעה עומק ממוצע נמוך — רחוב משולב ונגיש."`
`metrics.intelligibility.description` = `"מקדם המתאם הריבועי (R²) בין Connectivity מקומית (degree) ל-Integration גלובלית. ערך גבוה משמעו שהמבנה המקומי מנבא נכון את המבנה הגלובלי."`

`chartDescriptions.spaceSyntax` = `"ספייס סינטקס (Hillier, 1984) מתייחס לרשת הרחובות כגרף טופולוגי ומודד עד כמה כל רחוב 'עמוק' מכל שאר הרחובות. עומק ממוצע הוא מרחק המסלול הקצר ביותר; אינטגרציה (1/RRA) היא ההופכי המנורמל — ערכים גבוהים מצביעים על רחובות נגישים; מובנות היא R² בין Connectivity מקומית לאינטגרציה גלובלית — ערך גבוה משמעו שהמבנה המקומי מנבא את הגלובלי."`

- [ ] **Step 3: Commit**

```bash
git add client/src/i18n/en.json client/src/i18n/he.json
git commit -m "Add i18n keys for Space Syntax tab and metrics"
```

---

### Task 6: Frontend — SpaceSyntaxTable component

**Files:**
- Create: `client/src/components/charts/SpaceSyntaxTable.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useTranslation } from 'react-i18next';
import { useChartData } from '../../hooks/useChartData';
import { getNetworkNeighborhoods, type GlobalOverrides } from '../../lib/api';
import { getNeighborhoodColor } from '../../lib/utils';
import { MetricTooltip } from '../MetricTooltip';

interface Props {
  overrides: GlobalOverrides;
}

export function SpaceSyntaxTable({ overrides }: Props) {
  const { data, loading, error } = useChartData(
    () => getNetworkNeighborhoods({ ...overrides, representation: 'topologic' }),
    [JSON.stringify(overrides)]
  );
  const { t } = useTranslation();

  if (loading) return <div className="h-80 flex items-center justify-center text-slate-400">{t('common.loading')}</div>;
  if (error) return <div className="h-80 flex items-center justify-center text-red-500">{error}</div>;
  if (!data?.length) return <div className="h-80 flex items-center justify-center text-slate-400">{t('common.noData')}</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-start text-slate-500">
            <th className="py-2 px-3 font-medium">{t('spaceSyntaxTable.neighborhood')}</th>
            <th className="py-2 px-3 font-medium text-end">
              {t('spaceSyntaxTable.meanDepth')}
              <MetricTooltip description={t('metrics.mean_depth.description')} />
            </th>
            <th className="py-2 px-3 font-medium text-end">
              {t('spaceSyntaxTable.integration')}
              <MetricTooltip description={t('metrics.integration.description')} />
            </th>
            <th className="py-2 px-3 font-medium text-end">
              {t('spaceSyntaxTable.intelligibility')}
              <MetricTooltip description={t('metrics.intelligibility.description')} />
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((neighborhood) => {
            const spaceSyntax = neighborhood.topologic?.space_syntax;
            if (!spaceSyntax) {
              return (
                <tr key={neighborhood.neighborhood_key} className="border-b border-slate-100 text-slate-400 italic">
                  <td className="py-2 px-3 font-medium">
                    <span className="inline-block w-2 h-2 rounded-full me-2" style={{ backgroundColor: getNeighborhoodColor(neighborhood.neighborhood_key) }} />
                    {neighborhood.neighborhood_display}
                  </td>
                  <td className="py-2 px-3 text-end" colSpan={3}>{t('common.noData')}</td>
                </tr>
              );
            }
            return (
              <tr key={neighborhood.neighborhood_key} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-2 px-3 font-medium">
                  <span className="inline-block w-2 h-2 rounded-full me-2" style={{ backgroundColor: getNeighborhoodColor(neighborhood.neighborhood_key) }} />
                  {neighborhood.neighborhood_display}
                </td>
                <td className="py-2 px-3 text-end">{spaceSyntax.mean_depth.toFixed(2)}</td>
                <td className="py-2 px-3 text-end">{spaceSyntax.integration?.toFixed(2) ?? 'N/A'}</td>
                <td className="py-2 px-3 text-end">{spaceSyntax.intelligibility?.toFixed(3) ?? 'N/A'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/charts/SpaceSyntaxTable.tsx
git commit -m "Add SpaceSyntaxTable component"
```

---

### Task 7: Frontend — wire tab into NetworkPage

**Files:**
- Modify: `client/src/pages/NetworkPage.tsx`

- [ ] **Step 1: Import SpaceSyntaxTable**

Add to the imports (after the existing `NetworkMetricsTable` import):
```ts
import { SpaceSyntaxTable } from '../components/charts/SpaceSyntaxTable';
```

- [ ] **Step 2: Add the tab key**

Replace the `TAB_KEYS` array:
```ts
const TAB_KEYS = ['overview', 'space-syntax', 'graph', 'congestion-structure', 'congestion-demographics', 'exit-analysis', 'bottlenecks', 'demographics'] as const;
```

- [ ] **Step 3: Add tab labels**

In `TAB_I18N_KEYS`, add the entry:
```ts
'space-syntax': 'network.spaceSyntax',
```

In `TAB_DESCRIPTION_KEYS`, add:
```ts
'space-syntax': 'chartDescriptions.spaceSyntax',
```

- [ ] **Step 4: Force topologic when on Space Syntax tab**

Just before the `const overrides: GlobalOverrides = {…}` block, add:
```ts
const isSpaceSyntaxTab = activeTab === 'space-syntax';
const effectiveRepresentation: NetworkRepresentation = isSpaceSyntaxTab ? 'topologic' : representation;
```

Replace the `overrides` object to use `effectiveRepresentation`:
```ts
const overrides: GlobalOverrides = {
  exclude_neighborhoods: globalOverrides.exclude_neighborhoods,
  exclude_hours: globalOverrides.exclude_hours,
  representation: effectiveRepresentation,
};
```

- [ ] **Step 5: Disable representation toggle on Space Syntax tab**

Replace the representation toggle block (the `<div className="flex gap-1 bg-slate-100 rounded-md p-1">`) so the buttons get disabled state when `isSpaceSyntaxTab`:

```tsx
<div
  className="flex gap-1 bg-slate-100 rounded-md p-1"
  title={isSpaceSyntaxTab ? t('network.representation.tooltipSpaceSyntax') : undefined}
>
  {REPRESENTATIONS.map((key) => (
    <button
      key={key}
      onClick={() => setRepresentation(key)}
      disabled={isSpaceSyntaxTab}
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded transition-colors',
        representation === key
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-600 hover:text-slate-900',
        isSpaceSyntaxTab && 'opacity-40 cursor-not-allowed'
      )}
    >
      {t(`network.representation.${key}`)}
    </button>
  ))}
</div>
```

- [ ] **Step 6: Render the Space Syntax tab content**

In the tab body block (the one with `{activeTab === 'overview' && …}` lines), add the new line near the top:
```tsx
{activeTab === 'space-syntax' && <SpaceSyntaxTable overrides={overrides} />}
```

- [ ] **Step 7: Browser smoke test**

```bash
cd /Users/gfriedman/PycharmProjects/traffic-dashboard
.venv/bin/python -m server.app &
SERVER_PID=$!
cd client && npm run dev &
DEV_PID=$!
sleep 4
echo "Open http://localhost:5173/network — verify Space Syntax tab renders 6 rows with MD, Integration, R² values. Tab order: Overview / Space Syntax / Graph / …. The representation toggle should be greyed out when on Space Syntax tab."
echo "Press Enter when done"
read
kill $SERVER_PID $DEV_PID 2>/dev/null
```

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/NetworkPage.tsx
git commit -m "Add Space Syntax tab to Network page"
```

---

### Task 8: Frontend — Graph color-by toggle

**Files:**
- Modify: `client/src/components/charts/NetworkGraph.tsx`
- Modify: `client/src/components/charts/NetworkGraphTab.tsx`

- [ ] **Step 1: Add a color ramp helper at the top of `NetworkGraph.tsx`**

Below the existing `NODE_COLORS` constant, add:

```ts
type ColorBy = 'default' | 'integration';

function integrationColor(value: number, min: number, max: number): string {
  if (max <= min) return '#FF6B6B';
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const hue = 240 - 240 * t;
  return `hsl(${hue}, 80%, 50%)`;
}
```

- [ ] **Step 2: Add `colorBy` prop and integration range to NetworkGraph props**

Modify the `Props` interface:
```ts
interface Props {
  data: NetworkGraphData;
  width?: number;
  height?: number;
  compact?: boolean;
  showAerial?: boolean;
  showStreetNames?: boolean;
  colorBy?: ColorBy;
}
```

And the signature:
```ts
export function NetworkGraph({ data, width = 500, height = 500, compact = false, showAerial = false, showStreetNames = false, colorBy = 'default' }: Props) {
```

- [ ] **Step 3: Compute integration min/max in the component**

After the existing `useMemo` block that computes `project`, add:
```ts
const integrationRange = useMemo(() => {
  const values: number[] = [];
  for (const node of data.nodes) {
    if (typeof node.integration === 'number') values.push(node.integration);
  }
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}, [data.nodes]);

const useIntegration = colorBy === 'integration' && integrationRange !== null;
```

- [ ] **Step 4: Replace the node-rendering loop to support integration coloring**

Replace the existing block:
```tsx
{data.nodes.map((node, index) => {
  const [cx, cy] = project(node.lng, node.lat);
  return (
    <circle
      key={`n-${index}`}
      cx={cx} cy={cy}
      r={nodeSize[node.classification]}
      fill={NODE_COLORS[node.classification]}
    />
  );
})}
```

With:
```tsx
{data.nodes.map((node, index) => {
  const [cx, cy] = project(node.lng, node.lat);
  const fill = useIntegration && typeof node.integration === 'number' && integrationRange
    ? integrationColor(node.integration, integrationRange.min, integrationRange.max)
    : NODE_COLORS[node.classification];
  return (
    <circle
      key={`n-${index}`}
      cx={cx} cy={cy}
      r={nodeSize[node.classification]}
      fill={fill}
    />
  );
})}
```

- [ ] **Step 5: Replace the legend block to show integration scale when active**

Inside the existing `{!compact && (...)}` block at the bottom, replace the `<g transform={`translate(${width - 55}, ${height - 42})`}>` legend with:

```tsx
{useIntegration && integrationRange ? (
  <g transform={`translate(${width - 110}, ${height - 22})`}>
    <rect x={-5} y={-12} width={108} height={20} rx={2} fill="white" fillOpacity={0.92} stroke="#e2e8f0" strokeWidth={0.4} />
    <text x={48} y={-4} textAnchor="middle" fontSize={5} fill="#475569">{t('network.graphColorBy.integration')}</text>
    {Array.from({ length: 20 }).map((_, index) => (
      <rect
        key={index}
        x={index * 5}
        y={1}
        width={5}
        height={5}
        fill={integrationColor(integrationRange.min + (integrationRange.max - integrationRange.min) * index / 19, integrationRange.min, integrationRange.max)}
      />
    ))}
    <text x={0} y={12} fontSize={4} fill="#475569">{integrationRange.min.toFixed(2)}</text>
    <text x={96} y={12} fontSize={4} fill="#475569" textAnchor="end">{integrationRange.max.toFixed(2)}</text>
  </g>
) : (
  <g transform={`translate(${width - 55}, ${height - 42})`}>
    <rect x={-5} y={-5} width={58} height={40} rx={2} fill="white" fillOpacity={0.92} stroke="#e2e8f0" strokeWidth={0.4} />
    {([
      ['interior', t('nodeClassification.interior.label'), NODE_COLORS.interior],
      ['perimeter', t('nodeClassification.perimeter.label'), NODE_COLORS.perimeter],
      ['exterior', t('nodeClassification.exterior.label'), NODE_COLORS.exterior],
      ['exits', t('network.exits'), EXIT_COLOR],
    ] as const).map(([key, label, color], index) => (
      <g key={key} transform={`translate(0, ${index * 8.5})`}>
        <circle cx={3} cy={3} r={1.8} fill={color} />
        <text x={8} y={4.5} textAnchor="start" direction="ltr" fontSize={5} fill="#475569">{label}</text>
      </g>
    ))}
  </g>
)}
```

- [ ] **Step 6: Add color-by toggle in NetworkGraphTab.tsx**

Add `useState` import if not already present (it is) and add state for `colorBy`:

After `const [showStreetNames, setShowStreetNames] = useState(false);` add:
```ts
const [colorBy, setColorBy] = useState<'default' | 'integration'>('default');
```

After the existing `useEffect` that resets `selectedGraph` on representation change, add another:
```ts
useEffect(() => {
  if (representation === 'geometric') setColorBy('default');
}, [representation]);
```

Inside the selected-graph view (the `if (selectedGraph)` block), in the controls row (`<div className="flex items-center gap-4">`), insert before the existing aerial/streetnames labels:

```tsx
<div
  className="flex items-center gap-2 text-sm text-slate-600"
  title={representation === 'geometric' ? t('network.graphColorBy.tooltipGeometric') : undefined}
>
  <span>{t('network.graphColorBy.label')}:</span>
  <div className="flex gap-1 bg-slate-100 rounded-md p-0.5">
    {(['default', 'integration'] as const).map((option) => (
      <button
        key={option}
        onClick={() => setColorBy(option)}
        disabled={option === 'integration' && representation === 'geometric'}
        className={`px-2 py-0.5 text-xs rounded transition-colors ${
          colorBy === option ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
        } ${option === 'integration' && representation === 'geometric' ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {t(`network.graphColorBy.${option}`)}
      </button>
    ))}
  </div>
</div>
```

Pass `colorBy` to the `<NetworkGraph>` instance:
```tsx
<NetworkGraph data={selectedGraph} width={700} height={700} showAerial={showAerial} showStreetNames={showStreetNames} colorBy={colorBy} />
```

- [ ] **Step 7: Browser smoke test**

```bash
cd /Users/gfriedman/PycharmProjects/traffic-dashboard
.venv/bin/python -m server.app &
SERVER_PID=$!
cd client && npm run dev &
DEV_PID=$!
sleep 4
echo "Open http://localhost:5173/network → Graph tab → click a neighborhood. Verify:"
echo "  1. Color-by toggle visible with [Default] [Integration] buttons"
echo "  2. Click Integration → nodes recolor blue→yellow→red, legend changes"
echo "  3. Switch representation to Geometric (back on tab list) → Integration button becomes greyed out and resets to Default"
echo "Press Enter when done"
read
kill $SERVER_PID $DEV_PID 2>/dev/null
```

- [ ] **Step 8: Commit**

```bash
git add client/src/components/charts/NetworkGraph.tsx client/src/components/charts/NetworkGraphTab.tsx
git commit -m "Add Integration color-by toggle to network graph"
```

---

### Task 9: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Type-check**

```bash
cd /Users/gfriedman/PycharmProjects/traffic-dashboard/client
npm run build
```

Expected: build succeeds, no TypeScript errors.

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: no new lint errors.

- [ ] **Step 3: End-to-end smoke test in browser**

```bash
cd /Users/gfriedman/PycharmProjects/traffic-dashboard
.venv/bin/python -m server.app &
SERVER_PID=$!
cd client && npm run dev &
DEV_PID=$!
sleep 4
echo "Verify the full flow:"
echo "  1. Network page loads"
echo "  2. All 8 tabs are reachable (Overview, Space Syntax, Graph, Congestion-Structure, Congestion-Demographics, Exit Analysis, Bottlenecks, Demographics)"
echo "  3. Space Syntax tab: 6 rows with MD, Integration, R² values, tooltips work"
echo "  4. Switch language to Hebrew — all labels translated, RTL works"
echo "  5. Graph tab: Integration coloring works in topologic, greyed in geometric"
echo "  6. ChartDescription text appears at the bottom of the Space Syntax tab"
echo "Press Enter when done"
read
kill $SERVER_PID $DEV_PID 2>/dev/null
```

- [ ] **Step 4: No final commit needed**

Final commit was already at the end of Task 8.

---

## File touch summary (estimated lines)

| File | Action | LOC |
|---|---|---|
| `server/requirements.txt` | edit | +2 |
| `server/scripts/__init__.py` | new | 0 |
| `server/scripts/compute_space_syntax.py` | new | ~145 |
| `server/services/network_service.py` | edit | +4, −2 |
| `client/src/lib/types.ts` | edit | +9, −0 |
| `client/src/i18n/en.json` | edit | +20 |
| `client/src/i18n/he.json` | edit | +20 |
| `client/src/components/charts/SpaceSyntaxTable.tsx` | new | ~75 |
| `client/src/pages/NetworkPage.tsx` | edit | +12, −4 |
| `client/src/components/charts/NetworkGraph.tsx` | edit | +50, −10 |
| `client/src/components/charts/NetworkGraphTab.tsx` | edit | +25, −1 |

**Total: ~387 lines added, ~17 modified, 3 new files.**

## Self-review

- ✅ Spec coverage: every spec section maps to a task (compute → Task 1+2; backend → Task 3; types → Task 4; i18n → Task 5; table → Task 6; tab wire-up → Task 7; graph coloring → Task 8; verification → Task 9).
- ✅ No TBD/TODO placeholders. Every step has actual code.
- ✅ Type consistency: `SpaceSyntaxMetrics` defined in Task 4 is referenced via `neighborhood.topologic?.space_syntax` in Task 6 — name matches. `colorBy` prop introduced in Task 8 step 2 and consumed in step 4. `integrationColor` defined once in step 1 and reused in step 5.
- ✅ Each task ends with a commit.
- ✅ Verification is browser+Mongo (no test framework needed, per user prefs).
