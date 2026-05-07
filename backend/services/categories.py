"""
FINMATE OS — Hierarchical Category Taxonomy
Level 1: main_category
Level 2: sub_category
Level 3: behavioral_tag
"""

# ──────────────────────────────────────────────────────────────
# TAXONOMY DEFINITION
# Each entry: (main_category, sub_category, behavioral_tag)
# ──────────────────────────────────────────────────────────────
TAXONOMY = {
    # ── Food & Beverage ──
    "grabfood": ("Food & Beverage", "Food Delivery", "delivery_dependency"),
    "foodpanda": ("Food & Beverage", "Food Delivery", "delivery_dependency"),
    "delivereat": ("Food & Beverage", "Food Delivery", "delivery_dependency"),
    "mcdonalds": ("Food & Beverage", "Fast Food", "routine_spending"),
    "mcd": ("Food & Beverage", "Fast Food", "routine_spending"),
    "kfc": ("Food & Beverage", "Fast Food", "routine_spending"),
    "burger king": ("Food & Beverage", "Fast Food", "routine_spending"),
    "marrybrown": ("Food & Beverage", "Fast Food", "routine_spending"),
    "pizza": ("Food & Beverage", "Fast Food", "occasional"),
    "nasi": ("Food & Beverage", "Local Hawker", "routine_spending"),
    "mamak": ("Food & Beverage", "Local Hawker", "social_spending"),
    "roti canai": ("Food & Beverage", "Local Hawker", "routine_spending"),
    "hawker": ("Food & Beverage", "Local Hawker", "routine_spending"),
    "kopitiam": ("Food & Beverage", "Local Hawker", "routine_spending"),
    "wantan": ("Food & Beverage", "Local Hawker", "routine_spending"),
    "char kway": ("Food & Beverage", "Local Hawker", "routine_spending"),
    "cendol": ("Food & Beverage", "Local Hawker", "occasional"),
    "pasar malam": ("Food & Beverage", "Street Food / Night Market", "social_spending"),
    "night market": ("Food & Beverage", "Street Food / Night Market", "social_spending"),
    "starbucks": ("Food & Beverage", "Café / Coffee", "daily_habit"),
    "zus coffee": ("Food & Beverage", "Café / Coffee", "daily_habit"),
    "zus": ("Food & Beverage", "Café / Coffee", "daily_habit"),
    "tealive": ("Food & Beverage", "Café / Coffee", "daily_habit"),
    "gong cha": ("Food & Beverage", "Café / Coffee", "daily_habit"),
    "coffee bean": ("Food & Beverage", "Café / Coffee", "daily_habit"),
    "café": ("Food & Beverage", "Café / Coffee", "daily_habit"),
    "coffee": ("Food & Beverage", "Café / Coffee", "daily_habit"),
    "sushi": ("Food & Beverage", "Dining / Restaurant", "occasional"),
    "restaurant": ("Food & Beverage", "Dining / Restaurant", "occasional"),
    "steakhouse": ("Food & Beverage", "Fine Dining", "luxury_spending"),
    "fine dining": ("Food & Beverage", "Fine Dining", "luxury_spending"),
    "grocer": ("Food & Beverage", "Grocery", "essential"),
    "grocery": ("Food & Beverage", "Grocery", "essential"),
    "jaya grocer": ("Food & Beverage", "Grocery", "essential"),
    "village grocer": ("Food & Beverage", "Grocery", "essential"),
    "econsave": ("Food & Beverage", "Grocery", "essential"),
    "giant": ("Food & Beverage", "Grocery", "essential"),
    "tesco": ("Food & Beverage", "Grocery", "essential"),
    "mydin": ("Food & Beverage", "Grocery", "essential"),
    "99 speedmart": ("Food & Beverage", "Convenience Store", "impulse"),
    "speedmart": ("Food & Beverage", "Convenience Store", "impulse"),
    "mynews": ("Food & Beverage", "Convenience Store", "impulse"),
    "7-eleven": ("Food & Beverage", "Convenience Store", "impulse"),
    "7eleven": ("Food & Beverage", "Convenience Store", "impulse"),

    # ── Transport ──
    "grab ride": ("Transport", "Ride-hailing", "convenience_spending"),
    "grab car": ("Transport", "Ride-hailing", "convenience_spending"),
    "maxim": ("Transport", "Ride-hailing", "convenience_spending"),
    "bolt": ("Transport", "Ride-hailing", "convenience_spending"),
    "lrt": ("Transport", "Public Transport", "essential"),
    "mrt": ("Transport", "Public Transport", "essential"),
    "ktm": ("Transport", "Public Transport", "essential"),
    "rapid kl": ("Transport", "Public Transport", "essential"),
    "rapid bus": ("Transport", "Public Transport", "essential"),
    "bus": ("Transport", "Public Transport", "essential"),
    "petronas": ("Transport", "Fuel", "essential"),
    "shell": ("Transport", "Fuel", "essential"),
    "petron": ("Transport", "Fuel", "essential"),
    "caltex": ("Transport", "Fuel", "essential"),
    "parking": ("Transport", "Parking", "essential"),
    "touch n go": ("Transport", "Toll / TnG", "essential"),
    "tng": ("Transport", "Toll / TnG", "essential"),

    # ── Living Expenses ──
    "rent": ("Living Expenses", "Rent", "essential"),
    "tenaga": ("Living Expenses", "Utilities", "essential"),
    "tnb": ("Living Expenses", "Utilities", "essential"),
    "syabas": ("Living Expenses", "Utilities", "essential"),
    "water": ("Living Expenses", "Utilities", "essential"),
    "unifi": ("Living Expenses", "Internet / Telco", "essential"),
    "maxis": ("Living Expenses", "Internet / Telco", "essential"),
    "celcom": ("Living Expenses", "Internet / Telco", "essential"),
    "digi": ("Living Expenses", "Internet / Telco", "essential"),
    "u mobile": ("Living Expenses", "Internet / Telco", "essential"),
    "telco": ("Living Expenses", "Internet / Telco", "essential"),
    "pos malaysia": ("Living Expenses", "Utilities", "essential"),

    # ── Shopping ──
    "shopee": ("Shopping", "Online Shopping", "impulse"),
    "lazada": ("Shopping", "Online Shopping", "impulse"),
    "zalora": ("Shopping", "Online Shopping", "impulse"),
    "amazon": ("Shopping", "Online Shopping", "impulse"),
    "uniqlo": ("Shopping", "Fashion / Clothing", "occasional"),
    "padini": ("Shopping", "Fashion / Clothing", "occasional"),
    "fashion": ("Shopping", "Fashion / Clothing", "occasional"),
    "bata": ("Shopping", "Fashion / Clothing", "occasional"),
    "harvey norman": ("Shopping", "Electronics", "big_ticket"),
    "courts": ("Shopping", "Electronics", "big_ticket"),
    "samsung": ("Shopping", "Electronics", "big_ticket"),
    "apple": ("Shopping", "Electronics", "big_ticket"),
    "gadget": ("Shopping", "Electronics", "big_ticket"),
    "flash sale": ("Shopping", "Online Shopping", "impulse"),
    "accessories": ("Shopping", "Accessories", "impulse"),

    # ── Financial Services ──
    "ptptn": ("Financial Services", "Loan Repayment", "essential"),
    "loan": ("Financial Services", "Loan Repayment", "essential"),
    "credit card": ("Financial Services", "Credit Card Payment", "essential"),
    "insurance": ("Financial Services", "Insurance Premium", "essential"),
    "prudential": ("Financial Services", "Insurance Premium", "essential"),
    "great eastern": ("Financial Services", "Insurance Premium", "essential"),
    "allianz": ("Financial Services", "Insurance Premium", "essential"),
    "bank fee": ("Financial Services", "Bank Fee", "essential"),

    # ── Health & Wellness ──
    "clinic": ("Health & Wellness", "Medical / Clinic", "essential"),
    "hospital": ("Health & Wellness", "Medical / Clinic", "essential"),
    "klinik": ("Health & Wellness", "Medical / Clinic", "essential"),
    "guardian": ("Health & Wellness", "Pharmacy", "essential"),
    "watsons": ("Health & Wellness", "Pharmacy", "essential"),
    "pharmacy": ("Health & Wellness", "Pharmacy", "essential"),
    "ubat": ("Health & Wellness", "Pharmacy", "essential"),
    "fitness": ("Health & Wellness", "Fitness / Gym", "lifestyle"),
    "gym": ("Health & Wellness", "Fitness / Gym", "lifestyle"),
    "celebrity fitness": ("Health & Wellness", "Fitness / Gym", "lifestyle"),
    "supplement": ("Health & Wellness", "Supplements", "lifestyle"),

    # ── Entertainment ──
    "gsc": ("Entertainment", "Movies", "leisure"),
    "tgv": ("Entertainment", "Movies", "leisure"),
    "cinema": ("Entertainment", "Movies", "leisure"),
    "netflix": ("Entertainment", "Subscriptions", "routine_spending"),
    "spotify": ("Entertainment", "Subscriptions", "routine_spending"),
    "disney": ("Entertainment", "Subscriptions", "routine_spending"),
    "youtube": ("Entertainment", "Subscriptions", "routine_spending"),
    "gaming": ("Entertainment", "Gaming", "leisure"),
    "steam": ("Entertainment", "Gaming", "leisure"),
    "playstation": ("Entertainment", "Gaming", "leisure"),
    "arcade": ("Entertainment", "Gaming", "leisure"),
    "timezone": ("Entertainment", "Gaming", "leisure"),

    # ── Education ──
    "popular": ("Education", "Books / Stationery", "essential"),
    "bookstore": ("Education", "Books / Stationery", "essential"),
    "tuition": ("Education", "Tuition / Courses", "essential"),
    "course": ("Education", "Tuition / Courses", "self_improvement"),
    "udemy": ("Education", "Online Courses", "self_improvement"),
    "coursera": ("Education", "Online Courses", "self_improvement"),

    # ── Travel ──
    "airasia": ("Travel", "Flights", "occasional"),
    "malindo": ("Travel", "Flights", "occasional"),
    "mas": ("Travel", "Flights", "occasional"),
    "hotel": ("Travel", "Hotels", "occasional"),
    "agoda": ("Travel", "Hotels", "occasional"),
    "booking.com": ("Travel", "Hotels", "occasional"),
    "aeroline": ("Travel", "Local Travel", "occasional"),

    # ── Income ──
    "salary": ("Income", "Employment Income", None),
    "gaji": ("Income", "Employment Income", None),
    "bonus": ("Income", "Employment Income", None),
    "freelance": ("Income", "Freelance", None),
    "initial balance": ("Income", "Opening Balance", None),
}

# Peer averages by MAIN CATEGORY (% of monthly income)
PEER_AVERAGES_HIER = {
    "Food & Beverage": 0.20,
    "Transport": 0.08,
    "Living Expenses": 0.25,
    "Shopping": 0.07,
    "Financial Services": 0.10,
    "Health & Wellness": 0.04,
    "Entertainment": 0.05,
    "Education": 0.03,
    "Travel": 0.05,
    "Income": 0.0,
    "Other": 0.02,
}

BEHAVIORAL_LABELS = {
    "daily_habit": "Daily Habit",
    "routine_spending": "Routine Spending",
    "delivery_dependency": "Delivery Dependency",
    "convenience_spending": "Convenience Spending",
    "social_spending": "Social Spending",
    "impulse": "Impulse Purchase",
    "essential": "Essential",
    "lifestyle": "Lifestyle",
    "leisure": "Leisure",
    "occasional": "Occasional",
    "big_ticket": "Big Ticket Item",
    "luxury_spending": "Luxury Spending",
    "self_improvement": "Self Improvement",
}


def classify(merchant: str) -> dict:
    """
    Returns { main_category, sub_category, behavioral_tag }
    by matching merchant name against the taxonomy.
    """
    text = merchant.lower()
    # Longest-match wins
    best = None
    best_len = 0
    for keyword, (main, sub, tag) in TAXONOMY.items():
        if keyword in text and len(keyword) > best_len:
            best = (main, sub, tag)
            best_len = len(keyword)

    if best:
        return {
            "main_category": best[0],
            "sub_category": best[1],
            "behavioral_tag": best[2],
        }
    return {
        "main_category": "Other",
        "sub_category": "Miscellaneous",
        "behavioral_tag": None,
    }
