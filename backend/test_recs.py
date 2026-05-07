from services.recommendation import merchant_recommendations
import json

recs = merchant_recommendations({}, {"lat": 3.139, "lng": 101.6869})
print(json.dumps(recs[:2], indent=2))
print("Total recommendations:", len(recs))
