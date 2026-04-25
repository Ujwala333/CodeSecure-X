import urllib.request, json, sys

data = json.dumps({"repo_url": "https://github.com/Navyasree-ulava/SecureCodeX"}).encode()
req = urllib.request.Request(
    "http://127.0.0.1:8000/api/github/analyze-repo",
    data=data,
    headers={"Content-Type": "application/json"},
    method="POST",
)
try:
    resp = urllib.request.urlopen(req, timeout=30)
    result = json.loads(resp.read().decode())
    print("SUCCESS:", result["total_files"], "files for", result["repo"])
    for f in result["files"][:5]:
        print(" -", f["path"])
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print("HTTP", e.code, ":", body)
except Exception as e:
    print("Error:", e)
