"""
One-off script: compute Space Syntax metrics (Mean Depth, Integration, Intelligibility)
on the topologic representation of each neighborhood and write them back to MongoDB.

Run from the repo root:
    python -m server.scripts.compute_space_syntax
"""
import math
import sys

import networkx as nx
import numpy as np
from pymongo import UpdateOne

from server.database import get_db


def diamond_reference(n: int) -> float:
    if n <= 2:
        raise ValueError(f"diamond_reference undefined for n={n}")
    return 2 * (n * (math.log2((n + 2) / 3) - 1) + 1) / ((n - 1) * (n - 2))


def build_node_id_map(nodes):
    id_to_index = {}
    index_to_id = []
    for index, node in enumerate(nodes):
        key = (node["lat"], node["lng"])
        id_to_index[key] = index
        index_to_id.append(node)
    return id_to_index, index_to_id


def build_graph(nodes, edges):
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

    integration_str = f"{aggregate['integration']:.3f}" if aggregate['integration'] is not None else "N/A"
    intelligibility_str = f"{aggregate['intelligibility']:.3f}" if aggregate['intelligibility'] is not None else "N/A"
    print(
        f"  [{key}] n={len(largest_component_indices)}/{len(nodes)} "
        f"MD={aggregate['mean_depth']:.3f} "
        f"I={integration_str} "
        f"R²={intelligibility_str}"
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
