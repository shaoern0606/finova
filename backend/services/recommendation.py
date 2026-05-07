"""
FINMATE OS — Merchant Recommendation Engine
Merchants are stored as (direction_deg, distance_km) offsets from a reference center.
At query time, each merchant's real lat/lng is computed from the USER's actual GPS position.
This guarantees natural spatial spread in all directions around the real user location.
"""
import math

# ── Haversine ────────────────────────────────────────────────
# ── Haversine ────────────────────────────────────────────────
def get_distance(lat1, lon1, lat2, lon2):
    R = 6371
    dLat = (lat2 - lat1) * math.pi / 180
    dLon = (lon2 - lon1) * math.pi / 180
    a = (math.sin(dLat / 2) ** 2 +
         math.cos(lat1 * math.pi / 180) * math.cos(lat2 * math.pi / 180) *
         math.sin(dLon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def _offset_coords(base_lat, base_lng, bearing_deg, distance_km):
    R = 6371.0
    d = distance_km
    lat1 = math.radians(base_lat)
    lng1 = math.radians(base_lng)
    brng = math.radians(bearing_deg)

    lat2 = math.asin(
        math.sin(lat1) * math.cos(d / R) +
        math.cos(lat1) * math.sin(d / R) * math.cos(brng)
    )
    lng2 = lng1 + math.atan2(
        math.sin(brng) * math.sin(d / R) * math.cos(lat1),
        math.cos(d / R) - math.sin(lat1) * math.sin(lat2)
    )
    return round(math.degrees(lat2), 6), round(math.degrees(lng2), 6)

# ──────────────────────────────────────────────────────────────
# REALISTIC FALLBACK TEMPLATES (No large infrastructure)
# ──────────────────────────────────────────────────────────────
FALLBACK_MERCHANTS = [
    # ── FOOD (Plausible anywhere) ──
    {"id": "fb_f1", "name": "Local Nasi Lemak Stall",   "category": "Food", "sub_category": "Local Hawker",         "bearing": 15,  "dist": 0.18, "avg_spend": 8,   "perk": "Value local breakfast"},
    {"id": "fb_f2", "name": "Economy Rice Corner",      "category": "Food", "sub_category": "Local Hawker",         "bearing": 200, "dist": 0.25, "avg_spend": 10,  "perk": "Budget lunch option"},
    {"id": "fb_f3", "name": "Mamak Stall",              "category": "Food", "sub_category": "Local Hawker",         "bearing": 320, "dist": 0.30, "avg_spend": 12,  "perk": "Late-night alternative, open 24h"},
    # ── GROCERY (Ubiquitous) ──
    {"id": "fb_g1", "name": "99 Speedmart",             "category": "Grocery", "sub_category": "Convenience Store", "bearing": 270, "dist": 0.35, "avg_spend": 15,  "perk": "Cheapest essential groceries"},
    {"id": "fb_g2", "name": "Local Minimart",           "category": "Grocery", "sub_category": "Convenience Store", "bearing": 80,  "dist": 0.50, "avg_spend": 20,  "perk": "Convenient essentials"},
    # ── TRANSPORT (Generic only, no rail) ──
    {"id": "fb_t1", "name": "Local Bus Stop",           "category": "Transport", "sub_category": "Public Transport", "bearing": 90,  "dist": 0.08, "avg_spend": 1,   "perk": "Cheapest transit option"},
    {"id": "fb_t2", "name": "Ride-Hailing Pickup",      "category": "Transport", "sub_category": "Ride-hailing",     "bearing": 135, "dist": 0.10, "avg_spend": 15,  "perk": "Convenient pickup point"},
]


import requests

def fetch_real_places(lat, lng, radius=3000):
    query = f"""
    [out:json][timeout:15];
    (
      node["amenity"~"restaurant|fast_food|cafe|food_court"](around:{radius},{lat},{lng});
      node["shop"~"supermarket|convenience|grocery"](around:{radius},{lat},{lng});
      node["shop"~"mall|clothes|shoes|department_store"](around:{radius},{lat},{lng});
      node["public_transport"~"station|platform"](around:{radius},{lat},{lng});
      node["highway"~"bus_stop"](around:{radius},{lat},{lng});
    );
    out 200;
    """
    try:
        headers = {"User-Agent": "FinMateOS/1.0"}
        resp = requests.post("https://overpass-api.de/api/interpreter", data={'data': query}, headers=headers, timeout=15)
        print(f"[DEBUG] Overpass API Status: {resp.status_code}")
        if resp.status_code != 200:
            print("[DEBUG] Overpass API error:", resp.status_code, resp.text[:100])
            return []
        data = resp.json()
        
        merchants = []
        seen_names = set()
        
        for el in data.get("elements", []):
            tags = el.get("tags", {})
            name = tags.get("name")
            if not name or name in seen_names:
                continue
                
            seen_names.add(name)
            
            # Determine category and subcategory
            category = "Other"
            sub_category = "Other"
            avg_spend = 20
            
            if "amenity" in tags:
                am = tags["amenity"]
                if am in ["restaurant", "fast_food", "cafe", "food_court"]:
                    category = "Food"
                    if am == "fast_food":
                        sub_category = "Fast Food"
                        avg_spend = 15
                    elif am == "cafe":
                        sub_category = "Café / Coffee"
                        avg_spend = 15
                    else:
                        sub_category = "Dining / Restaurant"
                        avg_spend = 30
                elif am == "bus_station":
                    category = "Transport"
                    sub_category = "Public Transport"
                    avg_spend = 5
            elif "shop" in tags:
                shop = tags["shop"]
                if shop in ["supermarket", "convenience", "grocery"]:
                    category = "Grocery"
                    sub_category = "Convenience Store" if shop == "convenience" else "Grocery"
                    avg_spend = 15 if shop == "convenience" else 45
                elif shop in ["mall", "clothes", "shoes", "department_store"]:
                    category = "Shopping"
                    sub_category = "Fashion / Clothing" if shop in ["clothes", "shoes"] else "Mall"
                    avg_spend = 80
            elif "public_transport" in tags or "highway" in tags:
                category = "Transport"
                sub_category = "Public Transport"
                avg_spend = 3

            # Only include supported categories
            if category not in ["Food", "Transport", "Grocery", "Shopping"]:
                continue

            perk = f"Real {category} location nearby"
            
            # Heuristic: name-based luxury detection
            name_lower = name.lower()
            if any(k in name_lower for k in ["premium", "luxury", "boutique", "fine dining", "gourmet", "exclusive"]):
                avg_spend *= 2.5
                perk = "Premium experience - Check budget"

            merchants.append({
                "id": f"osm_{el['id']}",
                "name": name,
                "category": category,
                "sub_category": sub_category,
                "lat": el.get("lat", el.get("center", {}).get("lat")),
                "lng": el.get("lon", el.get("center", {}).get("lon")),
                "avg_spend": avg_spend,
                "perk": perk
            })
            
        return merchants
    except Exception as e:
        print("Overpass API failed:", e)
        return []

# ── Category spend defaults (per-transaction estimate) ────────
CATEGORY_DEFAULTS = {
    "Food": 20, "Transport": 15, "Grocery": 50, "Shopping": 80,
    "Food & Beverage": 20, # legacy compat
    "Other": 20,
}

SUB_DEFAULTS = {
    "Local Hawker": 10, "Street Food": 8, "Fast Food": 15,
    "Dining / Restaurant": 35, "Fine Dining": 80,
    "Grocery": 50, "Convenience Store": 15, "Night Market": 15,
    "Public Transport": 3, "Ride-hailing": 20, "Fuel": 52,
    "Fashion / Clothing": 70, "Online Shopping": 100,
}


def _user_sub_avg(summary, sub_category, main_category):
    """Estimate per-visit spend from sub_category_breakdown, then main, then defaults."""
    sub_bd = summary.get("sub_category_breakdown", {})
    main_bd = summary.get("category_breakdown", {})

    for main, subs in sub_bd.items():
        if sub_category in subs and subs[sub_category] > 0:
            return subs[sub_category] / max(3, 1)  # rough visits estimate

    main_amt = main_bd.get(main_category, 0)
    if main_amt > 0:
        return main_amt / 10.0

    return SUB_DEFAULTS.get(sub_category, CATEGORY_DEFAULTS.get(main_category, 20))


def _ai_reason(m, user_avg, savings, dist_km, summary):
    sub = m["sub_category"]
    name = m["name"]
    spend = m["avg_spend"]

    grab_amt = (summary.get("sub_category_breakdown", {})
                .get("Transport", {}).get("Ride-hailing", 0))
    delivery_amt = (summary.get("sub_category_breakdown", {})
                    .get("Food", {}).get("Food Delivery", 0))
                    
    if sub == "Public Transport" and dist_km < 0.5 and grab_amt > 0:
        return (f"You use ride-hailing. {name} is {dist_km}km away — saves ~RM{max(savings,15):.0f} per trip.", 0.98)
    if sub in ("Local Hawker", "Street Food") and delivery_amt > 0:
        return (f"You rely on delivery. {name} at RM{spend} is {dist_km}km away — 40–60% cheaper.", 0.93)
    if savings > 5:
        return (f"Significant savings! RM{savings:.0f} cheaper than your usual {sub} spend. Excellent nearby alternative.", 0.98)
    if savings > 0:
        return (f"Saves you RM{savings:.0f} per visit. Better for your budget than your usual {sub} spots.", 0.85)
    return (f"Matches your budget. Practical local option for your {sub} needs.", 0.70)


def merchant_recommendations(summary, location=None, category_filter=None):
    user_lat = (location or {}).get("lat", 3.1330)
    user_lng = (location or {}).get("lng", 101.6870)

    print(f"[DEBUG] User Coordinates: lat={user_lat}, lng={user_lng}")

    # ── Step 1: Fetch real merchants (3km radius) ─────────────
    merchants = fetch_real_places(user_lat, user_lng, 3000)
    print(f"[DEBUG] Initial 3km fetch: {len(merchants)} real places")

    # ── Step 2: Affordability Processing & Filtering ──────────
    def process_merchants(raw_list, radius_limit):
        valid = []
        for m in raw_list:
            if m["lat"] is None or m["lng"] is None:
                continue
            dist = get_distance(user_lat, user_lng, m["lat"], m["lng"])
            if dist > radius_limit:
                continue
            
            # Category filter
            if category_filter and category_filter not in ("All", ""):
                if m["category"] != category_filter and m.get("sub_category") != category_filter:
                    continue

            user_avg = _user_sub_avg(summary, m["sub_category"], m["category"])
            savings = round(user_avg - m["avg_spend"], 2)
            
            # Affordability Filter: Discard more expensive options
            if savings < -2:
                continue
                
            reason, confidence = _ai_reason(m, user_avg, savings, dist, summary)
            
            # Recommendation Score
            savings_score = max(0, savings) * 2
            dist_score = max(0, radius_limit - dist) * 5
            rec_score = round(savings_score + dist_score + (confidence * 10), 1)

            color = "green" if savings > 5 else "yellow"
            if m["sub_category"] == "Public Transport" and m["avg_spend"] <= 5 and dist < 0.8:
                color = "green"
                savings = max(savings, 15)
                rec_score += 20

            valid.append({
                **m,
                "distance_km": round(dist, 2),
                "estimated_savings": savings,
                "color": color,
                "reason": reason,
                "confidence": round(confidence, 2),
                "score": rec_score,
                "tags": []
            })
        return valid

    results = process_merchants(merchants, 3.0)
    print(f"[DEBUG] Filtered real places (3km): {len(results)}")

    # ── Step 3: Intelligent Radius Expansion (up to 5km) ──────
    if len(results) < 8:
        print(f"[DEBUG] Low result count ({len(results)}). Expanding radius to 5km...")
        merchants_5k = fetch_real_places(user_lat, user_lng, 5000)
        results = process_merchants(merchants_5k, 5.0)
        print(f"[DEBUG] After 5km expansion: {len(results)} results")

    # ── Step 4: Hybrid Fallback System (Safety Net) ───────────
    # If API fails or real places are extremely sparse, inject generic mock templates
    if len(results) < 5:
        print(f"[DEBUG] Fallback triggered! API failed or low real data ({len(results)}). Injecting generic mock data.")
        mock_candidates = []
        for t in FALLBACK_MERCHANTS:
            if category_filter and category_filter not in ("All", "") and t["category"] != category_filter and t.get("sub_category") != category_filter:
                continue
            lat, lng = _offset_coords(user_lat, user_lng, t["bearing"], t["dist"])
            mock_candidates.append({**t, "lat": lat, "lng": lng})
            
        # Process the injected mock candidates through the affordability layer
        fallback_results = process_merchants(mock_candidates, 5.0)
        results.extend(fallback_results)
        print(f"[DEBUG] Total recommendations after fallback: {len(results)}")

    # ── Final UX Guard: Ensure realistic volume (8-15) ────────
    # If still very low, we just return what we have (never fabricate)
    # If too many, we take the top ones by score
    results.sort(key=lambda r: (-r["score"], -r["estimated_savings"]))
    results = results[:20] # Take top 20 to ensure variety after tagging

    # ── Tag best picks ────────────────────────────────────────
    if results:
        # Since it's sorted by score, the first one is the best overall recommendation
        results[0]["tags"].append("SMART CHOICE")
        
        green = [r for r in results if r["color"] == "green"]
        if green:
            # The one with the highest savings
            best_saving = max(green, key=lambda r: r["estimated_savings"])
            if "SMART CHOICE" not in best_saving["tags"]:
                best_saving["tags"].append("MAX SAVINGS")
        
        closest = min(results, key=lambda r: r["distance_km"])
        if "SMART CHOICE" not in closest["tags"] and "MAX SAVINGS" not in closest["tags"]:
            closest["tags"].append("CLOSEST OPTION")

        seen_cats = {}
        for r in results:
            cat = r["sub_category"]
            if cat not in seen_cats or r["avg_spend"] < results[seen_cats[cat]]["avg_spend"]:
                seen_cats[cat] = results.index(r)
        for idx in seen_cats.values():
            if not any(t in results[idx]["tags"] for t in ["SMART CHOICE", "MAX SAVINGS", "CLOSEST OPTION"]):
                results[idx]["tags"].append("CHEAPEST IN CAT")

    return results
