"""
FINMATE OS — Merchant Recommendation Engine
Merchants are stored as (direction_deg, distance_km) offsets from a reference center.
At query time, each merchant's real lat/lng is computed from the USER's actual GPS position.
This guarantees natural spatial spread in all directions around the real user location.
"""
import math

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
    """
    Returns (lat, lng) that is `distance_km` away from (base_lat, base_lng)
    in the direction `bearing_deg` (0 = North, 90 = East, 180 = South, 270 = West).
    """
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
# MERCHANT TEMPLATE DATABASE
# Each entry has:
#   bearing_deg : compass direction from user (0=N, 45=NE, 90=E, …)
#   distance_km : how far from user (0.05 – 2.8 km)
# lat/lng are computed at query time from the real user GPS position.
# ──────────────────────────────────────────────────────────────
MERCHANT_TEMPLATES = [
    # ── FOOD: Local Hawker / Street Food (scattered N, SW, SE) ──
    {"id": "f1",  "name": "Nasi Lemak Stall",          "category": "Food & Beverage", "sub_category": "Local Hawker",            "bearing": 15,  "dist": 0.18, "avg_spend": 8,   "perk": "Cheapest local breakfast, open 24h"},
    {"id": "f2",  "name": "Economy Rice Corner",        "category": "Food & Beverage", "sub_category": "Local Hawker",            "bearing": 200, "dist": 0.25, "avg_spend": 10,  "perk": "Value meal — save vs delivery"},
    {"id": "f3",  "name": "Roti Canai Uncle",           "category": "Food & Beverage", "sub_category": "Street Food",             "bearing": 260, "dist": 0.12, "avg_spend": 5,   "perk": "RM5 full breakfast"},
    {"id": "f4",  "name": "Mamak Maju",                 "category": "Food & Beverage", "sub_category": "Local Hawker",            "bearing": 320, "dist": 0.30, "avg_spend": 12,  "perk": "Late-night alternative, open 24h"},
    {"id": "f5",  "name": "Wantan Mee Ah Kow",          "category": "Food & Beverage", "sub_category": "Street Food",             "bearing": 130, "dist": 0.40, "avg_spend": 7,   "perk": "Best wantan mee under RM10"},
    {"id": "f6",  "name": "Pasar Malam Brickfields",    "category": "Food & Beverage", "sub_category": "Night Market",            "bearing": 225, "dist": 0.55, "avg_spend": 15,  "perk": "Night market variety, cheapest prices"},
    {"id": "f7",  "name": "Sushi Zanmai",               "category": "Food & Beverage", "sub_category": "Dining / Restaurant",     "bearing": 60,  "dist": 0.35, "avg_spend": 40,  "perk": "Mid-tier Japanese dining"},
    {"id": "f8",  "name": "Char Kway Teow Lady",        "category": "Food & Beverage", "sub_category": "Street Food",             "bearing": 170, "dist": 0.20, "avg_spend": 8,   "perk": "Famous hawker stall"},
    {"id": "f9",  "name": "McD Drive-Through",          "category": "Food & Beverage", "sub_category": "Fast Food",               "bearing": 85,  "dist": 0.45, "avg_spend": 14,  "perk": "Value meals & app deals"},
    {"id": "f10", "name": "Premium Steakhouse",         "category": "Food & Beverage", "sub_category": "Fine Dining",             "bearing": 50,  "dist": 0.80, "avg_spend": 80,  "perk": "Fine dining experience"},
    {"id": "f11", "name": "Cendol & Ais Kacang",        "category": "Food & Beverage", "sub_category": "Street Food",             "bearing": 290, "dist": 0.15, "avg_spend": 4,   "perk": "Cheapest dessert nearby"},
    {"id": "f12", "name": "KFC",                        "category": "Food & Beverage", "sub_category": "Fast Food",               "bearing": 110, "dist": 0.30, "avg_spend": 16,  "perk": "App promos & bucket deals"},

    # ── COFFEE (spread NW, E, S, NE) ────────────────────────────
    {"id": "c1",  "name": "Auntie's Kopitiam",          "category": "Food & Beverage", "sub_category": "Café / Coffee",           "bearing": 340, "dist": 0.08, "avg_spend": 6,   "perk": "RM3 kopi-o — cheapest nearby"},
    {"id": "c2",  "name": "ZUS Coffee",                 "category": "Food & Beverage", "sub_category": "Café / Coffee",           "bearing": 100, "dist": 0.22, "avg_spend": 11,  "perk": "App discounts, 30% off first order"},
    {"id": "c3",  "name": "Tealive",                    "category": "Food & Beverage", "sub_category": "Café / Coffee",           "bearing": 240, "dist": 0.18, "avg_spend": 9,   "perk": "Bubble tea & cold brew"},
    {"id": "c4",  "name": "Starbucks",                  "category": "Food & Beverage", "sub_category": "Café / Coffee",           "bearing": 30,  "dist": 0.42, "avg_spend": 18,  "perk": "Premium — loyalty rewards"},
    {"id": "c5",  "name": "Gong Cha",                   "category": "Food & Beverage", "sub_category": "Café / Coffee",           "bearing": 195, "dist": 0.28, "avg_spend": 10,  "perk": "Popular milk tea under RM12"},

    # ── GROCERY (N, SW, SE, far E) ──────────────────────────────
    {"id": "g1",  "name": "99 Speedmart",               "category": "Food & Beverage", "sub_category": "Convenience Store",       "bearing": 270, "dist": 0.35, "avg_spend": 15,  "perk": "Cheapest essential groceries"},
    {"id": "g2",  "name": "MyNews",                     "category": "Food & Beverage", "sub_category": "Convenience Store",       "bearing": 5,   "dist": 0.10, "avg_spend": 12,  "perk": "Quick convenience, open 24h"},
    {"id": "g3",  "name": "Jaya Grocer",                "category": "Food & Beverage", "sub_category": "Grocery",                 "bearing": 80,  "dist": 0.50, "avg_spend": 45,  "perk": "Fresh produce & local brands"},
    {"id": "g4",  "name": "Village Grocer",             "category": "Food & Beverage", "sub_category": "Grocery",                 "bearing": 55,  "dist": 1.10, "avg_spend": 70,  "perk": "Premium imported goods"},
    {"id": "g5",  "name": "Econsave",                   "category": "Food & Beverage", "sub_category": "Grocery",                 "bearing": 215, "dist": 0.70, "avg_spend": 30,  "perk": "Budget supermarket, good value"},

    # ── TRANSPORT (close, multiple directions) ───────────────────
    {"id": "t1",  "name": "LRT Station",                "category": "Transport",       "sub_category": "Public Transport",        "bearing": 358, "dist": 0.06, "avg_spend": 3,   "perk": "My50 monthly pass eligible"},
    {"id": "t2",  "name": "KTM Komuter",                "category": "Transport",       "sub_category": "Public Transport",        "bearing": 185, "dist": 0.09, "avg_spend": 2,   "perk": "Cheapest rail option"},
    {"id": "t3",  "name": "Rapid Bus Stop",             "category": "Transport",       "sub_category": "Public Transport",        "bearing": 90,  "dist": 0.04, "avg_spend": 1,   "perk": "RM1 city bus — save vs Grab"},
    {"id": "t4",  "name": "Grab Kiosk",                 "category": "Transport",       "sub_category": "Ride-hailing",            "bearing": 135, "dist": 0.18, "avg_spend": 22,  "perk": "Convenient ride-hailing"},

    # ── FUEL (far W and SW) ──────────────────────────────────────
    {"id": "u1",  "name": "Petronas Station",           "category": "Transport",       "sub_category": "Fuel",                    "bearing": 255, "dist": 0.60, "avg_spend": 50,  "perk": "Setel app 3% cashback"},
    {"id": "u2",  "name": "Shell Station",              "category": "Transport",       "sub_category": "Fuel",                    "bearing": 235, "dist": 0.80, "avg_spend": 52,  "perk": "Shell Go+ loyalty points"},

    # ── SHOPPING (E quadrant in mall) ───────────────────────────
    {"id": "s1",  "name": "Uniqlo",                     "category": "Shopping",        "sub_category": "Fashion / Clothing",      "bearing": 70,  "dist": 0.38, "avg_spend": 90,  "perk": "Durable basics, seasonal sale"},
    {"id": "s2",  "name": "Padini",                     "category": "Shopping",        "sub_category": "Fashion / Clothing",      "bearing": 65,  "dist": 0.36, "avg_spend": 60,  "perk": "Affordable fashion"},
    {"id": "s3",  "name": "Bata Shoes",                 "category": "Shopping",        "sub_category": "Fashion / Clothing",      "bearing": 75,  "dist": 0.34, "avg_spend": 80,  "perk": "Comfortable everyday shoes"},
    {"id": "s4",  "name": "Popular Bookstore",          "category": "Education",       "sub_category": "Books / Stationery",      "bearing": 45,  "dist": 0.42, "avg_spend": 35,  "perk": "Books, stationery & exam prep"},

    # ── ENTERTAINMENT (NE) ───────────────────────────────────────
    {"id": "e1",  "name": "GSC Cinemas",                "category": "Entertainment",   "sub_category": "Movies",                  "bearing": 40,  "dist": 0.55, "avg_spend": 22,  "perk": "Movie deals Mon–Thu RM14"},
    {"id": "e2",  "name": "Timezone Arcade",            "category": "Entertainment",   "sub_category": "Gaming",                  "bearing": 35,  "dist": 0.50, "avg_spend": 20,  "perk": "Family entertainment"},

    # ── HEALTHCARE (NW, SE) ──────────────────────────────────────
    {"id": "h1",  "name": "Guardian Pharmacy",          "category": "Health & Wellness","sub_category": "Pharmacy",               "bearing": 310, "dist": 0.14, "avg_spend": 25,  "perk": "Member card 15% off"},
    {"id": "h2",  "name": "Klinik Sentral",             "category": "Health & Wellness","sub_category": "Medical / Clinic",       "bearing": 155, "dist": 0.32, "avg_spend": 45,  "perk": "Panel clinic, gov subsidy"},
    {"id": "h3",  "name": "Watsons",                    "category": "Health & Wellness","sub_category": "Pharmacy",               "bearing": 350, "dist": 0.11, "avg_spend": 28,  "perk": "App vouchers & loyalty points"},

    # ── UTILITIES / SERVICES ─────────────────────────────────────
    {"id": "x1",  "name": "TNB Payment Kiosk",          "category": "Living Expenses", "sub_category": "Utilities",               "bearing": 280, "dist": 0.16, "avg_spend": 0,   "perk": "Pay bills, no service fee"},
    {"id": "x2",  "name": "Pos Malaysia",               "category": "Living Expenses", "sub_category": "Utilities",               "bearing": 175, "dist": 0.13, "avg_spend": 5,   "perk": "Parcel collection & payments"},
    {"id": "x3",  "name": "GXBank Partner ATM",         "category": "Financial Services","sub_category": "Bank Fee",              "bearing": 5,   "dist": 0.07, "avg_spend": 0,   "perk": "Zero-fee GXBank withdrawals"},

    # ── SUBSCRIPTIONS / GYM (far N, NE) ─────────────────────────
    {"id": "q1",  "name": "Fitness First",              "category": "Health & Wellness","sub_category": "Fitness / Gym",          "bearing": 20,  "dist": 0.90, "avg_spend": 180, "perk": "Monthly gym, free trial"},
    {"id": "q2",  "name": "Celebrity Fitness",          "category": "Health & Wellness","sub_category": "Fitness / Gym",          "bearing": 25,  "dist": 0.85, "avg_spend": 120, "perk": "Cheaper gym alternative"},

    # ── TRAVEL (far SW, S) ───────────────────────────────────────
    {"id": "v1",  "name": "KTM/ETS Ticket Counter",     "category": "Travel",          "sub_category": "Local Travel",            "bearing": 190, "dist": 0.12, "avg_spend": 50,  "perk": "Train tickets KL→Penang/JB"},
    {"id": "v2",  "name": "Aeroline Bus Terminal",      "category": "Travel",          "sub_category": "Local Travel",            "bearing": 210, "dist": 0.25, "avg_spend": 35,  "perk": "Cheaper than flight for short trips"},
]

# ── Category spend defaults (per-transaction estimate) ────────
CATEGORY_DEFAULTS = {
    "Food & Beverage": 20, "Transport": 15, "Shopping": 80,
    "Entertainment": 25, "Health & Wellness": 40, "Living Expenses": 100,
    "Financial Services": 0, "Education": 35, "Travel": 55, "Other": 20,
}

SUB_DEFAULTS = {
    "Local Hawker": 10, "Street Food": 8, "Fast Food": 15,
    "Café / Coffee": 14, "Dining / Restaurant": 35, "Fine Dining": 80,
    "Food Delivery": 22, "Grocery": 50, "Convenience Store": 15, "Night Market": 15,
    "Public Transport": 3, "Ride-hailing": 20, "Fuel": 52,
    "Pharmacy": 26, "Medical / Clinic": 45, "Fitness / Gym": 150,
    "Fashion / Clothing": 70, "Online Shopping": 100, "Movies": 22, "Gaming": 20,
    "Utilities": 0, "Books / Stationery": 35, "Local Travel": 40, "Bank Fee": 0,
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
    coffee_amt = (summary.get("sub_category_breakdown", {})
                  .get("Food & Beverage", {}).get("Café / Coffee", 0))
    delivery_amt = (summary.get("sub_category_breakdown", {})
                    .get("Food & Beverage", {}).get("Food Delivery", 0))

    if sub == "Public Transport" and dist_km < 0.5 and grab_amt > 0:
        return (f"You use ride-hailing. {name} is {dist_km}km away — saves ~RM{max(savings,15):.0f} per trip.", 0.98)
    if sub == "Café / Coffee" and coffee_amt > 0 and savings > 0:
        return (f"Daily coffee habit detected. {name} saves RM{savings:.0f} per cup vs your average.", 0.95)
    if sub in ("Local Hawker", "Street Food") and delivery_amt > 0:
        return (f"You rely on delivery. {name} at RM{spend} is {dist_km}km away — 40–60% cheaper.", 0.93)
    if savings > 5:
        return (f"RM{savings:.0f} cheaper than your usual {sub} spend. Good nearby alternative.", 0.85)
    if savings > 0:
        return (f"Matches your {sub} budget. Closer option vs what you normally use.", 0.70)
    if savings > -5:
        return (f"Similar price to your {sub} spending. Consider for convenience.", 0.55)
    return (f"More expensive than your usual {sub} spend — only if necessary.", 0.30)


def merchant_recommendations(summary, location=None, category_filter=None):
    user_lat = (location or {}).get("lat", 3.1330)
    user_lng = (location or {}).get("lng", 101.6870)

    # ── Build merchants at real GPS positions ────────────────
    merchants = []
    for t in MERCHANT_TEMPLATES:
        lat, lng = _offset_coords(user_lat, user_lng, t["bearing"], t["dist"])
        merchants.append({**t, "lat": lat, "lng": lng})

    # ── Distance filter (3km hard, expand if needed) ─────────
    for radius in (3.0, 5.0, 10.0):
        within = [m for m in merchants
                  if get_distance(user_lat, user_lng, m["lat"], m["lng"]) <= radius]
        if len(within) >= 10:
            break
    candidates = within

    # ── Category filter ───────────────────────────────────────
    if category_filter and category_filter not in ("All", ""):
        candidates = [m for m in candidates
                      if m["category"] == category_filter
                      or m.get("sub_category") == category_filter]

    # ── Build result objects ──────────────────────────────────
    results = []
    for m in candidates:
        dist = round(get_distance(user_lat, user_lng, m["lat"], m["lng"]), 2)
        user_avg = _user_sub_avg(summary, m["sub_category"], m["category"])
        savings = round(user_avg - m["avg_spend"], 2)
        reason, confidence = _ai_reason(m, user_avg, savings, dist, summary)

        if savings > 5:
            color = "green"
        elif savings > -5:
            color = "yellow"
        else:
            color = "red"

        if m["sub_category"] == "Public Transport" and m["avg_spend"] <= 5 and dist < 0.5:
            color = "green"
            savings = max(savings, 15)

        results.append({
            "id": m["id"],
            "name": m["name"],
            "category": m["category"],
            "sub_category": m["sub_category"],
            "lat": m["lat"],
            "lng": m["lng"],
            "distance_km": dist,
            "avg_spend": m["avg_spend"],
            "estimated_savings": savings,
            "color": color,
            "reason": reason,
            "confidence": round(confidence, 2),
            "perk": m["perk"],
            "tags": [],
        })

    # ── Priority sort: distance tier → savings ────────────────
    def sort_key(r):
        tier = 0 if r["distance_km"] <= 0.5 else 1 if r["distance_km"] <= 1.5 else 2
        return (tier, -r["estimated_savings"], r["distance_km"])

    results.sort(key=sort_key)

    # ── Tag best picks ────────────────────────────────────────
    if results:
        green = [r for r in results if r["color"] == "green"]
        if green:
            green[0]["tags"].append("BEST SAVING OPTION")

        closest = min(results, key=lambda r: r["distance_km"])
        if "BEST SAVING OPTION" not in closest["tags"]:
            closest["tags"].append("CLOSEST OPTION")

        seen_cats = {}
        for r in results:
            cat = r["sub_category"]
            if cat not in seen_cats or r["avg_spend"] < results[seen_cats[cat]]["avg_spend"]:
                seen_cats[cat] = results.index(r)
        for idx in seen_cats.values():
            if "CHEAPEST OPTION" not in results[idx]["tags"]:
                results[idx]["tags"].append("CHEAPEST OPTION")

    return results
