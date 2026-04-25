"""Full end-to-end test: register → login → fetch GitHub files → scan selected file."""
import urllib.request
import json
import sys

BASE = "http://127.0.0.1:8000/api"
REPO_URL = "https://github.com/Navyasree-ulava/SecureCodeX"


def post(path, body, token=None):
    data = json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        BASE + path, data=data, headers=headers, method="POST"
    )
    try:
        r = urllib.request.urlopen(req, timeout=90)
        return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())


def get_url(url):
    req = urllib.request.Request(url, headers={"User-Agent": "CodeSecureX-e2e"})
    r = urllib.request.urlopen(req, timeout=15)
    return r.read().decode("utf-8", errors="replace")


# Step 1 — register a throw-away test account
print("Step 1: Registering test account...")
s, _ = post(
    "/auth/register",
    {"username": "e2etest2", "email": "e2etest2@test.com", "password": "TestPass123!"},
)
print(f"  Register status: {s} (422/400 = already exists, that's OK)")

# Step 2 — login
print("Step 2: Logging in...")
s, r = post("/auth/login", {"email": "e2etest2@test.com", "password": "TestPass123!"})
if s != 200:
    print(f"  Login FAILED ({s}): {r}")
    sys.exit(1)
token = r["access_token"]
print(f"  Login OK — token: {token[:20]}...")

# Step 3 — fetch GitHub repo files
print("Step 3: Fetching GitHub repo file list...")
s, r = post("/github/analyze-repo", {"repo_url": REPO_URL})
if s != 200:
    print(f"  FAIL ({s}): {r}")
    sys.exit(1)
files = r["files"]
print(f"  {r['total_files']} files found for {r['repo']}")
for f in files[:5]:
    print(f"    {f['path']} ({f['size']}B)")

# Step 4 — pick largest .py file for a meaningful scan
py_files = sorted(
    [f for f in files if f["filename"].endswith(".py")],
    key=lambda x: x["size"],
    reverse=True,
)
if not py_files:
    print("No .py files found")
    sys.exit(1)

target = py_files[0]
print(f"\nStep 4: Fetching raw content of '{target['path']}'...")
raw = get_url(target["download_url"])
print(f"  {len(raw)} chars fetched")
code_to_scan = raw[:48_000]

# Step 5 — scan the code
print("Step 5: Running vulnerability scan...")
s, r = post("/scan/analyze", {"code": code_to_scan, "language": "python"}, token)
if s != 200:
    print(f"  FAIL ({s}): {r}")
    sys.exit(1)

vulns = r.get("vulnerabilities", [])
score = r.get("security_health_score", "N/A")
label = r.get("score_label", "")
print(f"  Security Score: {score}/100  ({label})")
print(f"  Vulnerabilities found: {len(vulns)}")
for v in vulns[:5]:
    print(f"    [{v['severity']:8}] {v['type']}: {v['explanation'][:70]}...")

print("\n=== ALL STEPS PASSED — GitHub integration is fully working! ===")
