from server.database import get_db, get_collection
from server.services.query_service import build_filter
from server.utils.neighborhoods import NEIGHBORHOOD_DISPLAY_NAMES, get_display_name


def _traffic_match_stage(args):
    query = build_filter(args)
    return {"$match": query} if query else None


def _excluded_neighborhood_keys(args):
    return set(args.getlist("exclude_neighborhoods"))


def get_neighborhood_metrics(args):
    db = get_db()
    excluded = _excluded_neighborhood_keys(args)
    docs = list(db["network_neighborhoods"].find({}, {"_id": 0}))
    results = []
    for doc in docs:
        if doc["neighborhood_key"] in excluded:
            continue
        doc["neighborhood_display"] = get_display_name(doc["neighborhood_key"])
        results.append(doc)
    return results


def congestion_vs_structure(args):
    db = get_db()
    collection = get_collection()
    excluded = _excluded_neighborhood_keys(args)

    pipeline = []
    match = _traffic_match_stage(args)
    if match:
        pipeline.append(match)

    pipeline.extend([
        {"$addFields": {"neighborhood": _neighborhood_field()}},
        {"$group": {
            "_id": "$neighborhood",
            "avg_congestion": {"$avg": "$congestion_ratio"},
            "max_congestion": {"$max": "$congestion_ratio"},
            "sample_count": {"$sum": 1},
        }},
    ])
    congestion_by_neighborhood = {
        row["_id"]: row
        for row in collection.aggregate(pipeline)
    }

    network_docs = list(db["network_neighborhoods"].find({}, {"_id": 0}))

    results = []
    for doc in network_docs:
        key = doc["neighborhood_key"]
        if key in excluded:
            continue
        congestion = congestion_by_neighborhood.get(key, {})
        results.append({
            "neighborhood_key": key,
            "neighborhood_display": get_display_name(key),
            "avg_congestion": round(congestion.get("avg_congestion", 0), 3),
            "max_congestion": round(congestion.get("max_congestion", 0), 3),
            "sample_count": congestion.get("sample_count", 0),
            "node_count": doc["basic_stats"]["node_count"],
            "edge_count": doc["basic_stats"]["edge_count"],
            "street_density": doc["basic_stats"]["street_density_m_per_km2"],
            "intersection_density": doc["basic_stats"]["intersection_density_per_km2"],
            "avg_node_degree": doc["basic_stats"]["avg_node_degree"],
            "circuity": doc["basic_stats"]["circuity"],
            "avg_street_length": doc["basic_stats"]["avg_street_length_m"],
            "connectivity": doc["connectivity"]["avg_node_connectivity"],
            "exit_count": doc["exit_count"],
            "area_km2": doc["area_km2"],
            "avg_betweenness": doc["centrality_summary"]["avg_betweenness"],
            "max_betweenness": doc["centrality_summary"]["max_betweenness"],
        })

    return results


def exit_congestion(args):
    db = get_db()
    collection = get_collection()
    neighborhood = args.get("neighborhood")
    excluded = _excluded_neighborhood_keys(args)

    cross_ref_filter = {"type": "exit_route_match"}
    if neighborhood:
        cross_ref_filter["neighborhood_key"] = neighborhood

    cross_refs = list(db["cross_references"].find(cross_ref_filter, {"_id": 0}))
    if not cross_refs:
        return []

    cross_refs = [ref for ref in cross_refs if ref["neighborhood_key"] not in excluded]
    if not cross_refs:
        return []

    route_ids = list({ref["matched_route_id"] for ref in cross_refs})

    pipeline = []
    match = _traffic_match_stage(args)
    if match:
        pipeline.append(match)

    pipeline.extend([
        {"$match": {"route_id": {"$in": route_ids}}},
        {"$group": {
            "_id": "$route_id",
            "avg_congestion": {"$avg": "$congestion_ratio"},
            "max_congestion": {"$max": "$congestion_ratio"},
            "sample_count": {"$sum": 1},
        }},
    ])
    congestion_by_route = {
        row["_id"]: row
        for row in collection.aggregate(pipeline)
    }

    unnamed_counter = {}
    results = []
    for ref in cross_refs:
        route_id = ref["matched_route_id"]
        congestion = congestion_by_route.get(route_id, {})
        street_name = ref["exit_street_name"]
        if not street_name or street_name == "unnamed":
            key = ref["neighborhood_key"]
            unnamed_counter[key] = unnamed_counter.get(key, 0) + 1
            street_name = f"unnamed #{unnamed_counter[key]}"
        results.append({
            "neighborhood_key": ref["neighborhood_key"],
            "neighborhood_display": get_display_name(ref["neighborhood_key"]),
            "exit_street_name": street_name,
            "matched_route_id": route_id,
            "matched_route_name": ref["matched_route_name"],
            "distance_meters": ref["distance_meters"],
            "avg_congestion": round(congestion.get("avg_congestion", 0), 3),
            "max_congestion": round(congestion.get("max_congestion", 0), 3),
            "sample_count": congestion.get("sample_count", 0),
        })

    results.sort(key=lambda row: row["avg_congestion"], reverse=True)
    return results


def bottleneck_nodes(args):
    db = get_db()
    collection = get_collection()
    neighborhood = args.get("neighborhood")

    if not neighborhood:
        return []

    pipeline = []
    match = _traffic_match_stage(args)
    if match:
        pipeline.append(match)

    pipeline.extend([
        {"$match": {"route_id": {"$regex": f"^{neighborhood}"}}},
        {"$group": {
            "_id": "$route_id",
            "route_name": {"$first": "$route_name"},
            "origin": {"$first": "$origin"},
            "destination": {"$first": "$destination"},
            "avg_congestion": {"$avg": "$congestion_ratio"},
        }},
    ])
    routes = list(collection.aggregate(pipeline))

    high_centrality_nodes = list(db["network_nodes"].find(
        {"neighborhood_key": neighborhood, "betweenness_centrality": {"$gt": 0.05}},
        {"_id": 0, "osm_node_id": 1, "lat": 1, "lng": 1,
         "betweenness_centrality": 1, "closeness_centrality": 1, "degree": 1, "is_exit_node": 1},
    ))

    if not high_centrality_nodes:
        return []

    results = []
    for node in high_centrality_nodes:
        nearby_congestions = []
        for route in routes:
            for point_key in ["origin", "destination"]:
                point = route[point_key]
                distance_deg = ((node["lat"] - point["lat"]) ** 2 + (node["lng"] - point["lng"]) ** 2) ** 0.5
                distance_m_approx = distance_deg * 111000
                if distance_m_approx < 150:
                    nearby_congestions.append(route["avg_congestion"])
                    break

        if not nearby_congestions:
            continue

        avg_nearby_congestion = sum(nearby_congestions) / len(nearby_congestions)
        bottleneck_score = node["betweenness_centrality"] * avg_nearby_congestion

        results.append({
            "osm_node_id": node["osm_node_id"],
            "neighborhood_key": neighborhood,
            "neighborhood_display": get_display_name(neighborhood),
            "lat": node["lat"],
            "lng": node["lng"],
            "betweenness_centrality": node["betweenness_centrality"],
            "closeness_centrality": node["closeness_centrality"],
            "degree": node["degree"],
            "is_exit_node": node["is_exit_node"],
            "nearby_avg_congestion": round(avg_nearby_congestion, 3),
            "nearby_route_count": len(nearby_congestions),
            "bottleneck_score": round(bottleneck_score, 6),
        })

    results.sort(key=lambda row: row["bottleneck_score"], reverse=True)
    return results


def get_network_graph(neighborhood_key):
    db = get_db()

    neighborhood_doc = db["network_neighborhoods"].find_one(
        {"neighborhood_key": neighborhood_key},
        {"_id": 0, "name_en": 1, "name_he": 1, "exit_count": 1, "boundary": 1, "exits": 1},
    )
    if not neighborhood_doc:
        return {"error": "neighborhood not found"}

    nodes = list(db["network_nodes"].find(
        {"neighborhood_key": neighborhood_key},
        {"_id": 0, "lat": 1, "lng": 1, "classification": 1, "is_exit_node": 1},
    ))

    edges = list(db["network_edges"].find(
        {"neighborhood_key": neighborhood_key},
        {"_id": 0, "from_lat": 1, "from_lng": 1, "to_lat": 1, "to_lng": 1, "is_exit_edge": 1},
    ))

    return {
        "neighborhood_key": neighborhood_key,
        "name_en": neighborhood_doc["name_en"],
        "name_he": neighborhood_doc["name_he"],
        "exit_count": neighborhood_doc["exit_count"],
        "boundary": neighborhood_doc.get("boundary", []),
        "nodes": nodes,
        "edges": edges,
        "exits": neighborhood_doc.get("exits", []),
    }


def get_neighborhood_demographics(args):
    db = get_db()
    excluded = _excluded_neighborhood_keys(args)
    docs = list(db["neighborhood_demographics"].find({}, {"_id": 0}))
    results = []
    for doc in docs:
        if doc["neighborhood_key"] in excluded:
            continue
        doc["neighborhood_display"] = get_display_name(doc["neighborhood_key"])
        results.append(doc)
    return results


def _neighborhood_field():
    branches = [
        {"case": {"$eq": [{"$indexOfCP": ["$route_id", prefix]}, 0]}, "then": prefix}
        for prefix in sorted(NEIGHBORHOOD_DISPLAY_NAMES.keys(), key=len, reverse=True)
    ]
    return {"$switch": {"branches": branches, "default": "$route_id"}}
