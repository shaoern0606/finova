import requests
import time
query = """
[out:json][timeout:25];
(
  node["amenity"~"restaurant|fast_food|cafe"](around:3000, 3.139, 101.6869);
  node["shop"~"supermarket|convenience"](around:3000, 3.139, 101.6869);
  node["shop"~"mall|clothes"](around:3000, 3.139, 101.6869);
  node["public_transport"~"station"](around:3000, 3.139, 101.6869);
);
out 50;
"""
print("Querying Overpass with POST and User-Agent...")
try:
    headers = {"User-Agent": "FinMate_App/1.0"}
    start = time.time()
    resp = requests.post("https://overpass-api.de/api/interpreter", data={'data': query}, headers=headers, timeout=25)
    print("Time taken:", time.time() - start)
    print(resp.status_code)
    if resp.status_code == 200:
        print(len(resp.json().get('elements', [])))
except Exception as e:
    print(e)
