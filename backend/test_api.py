import urllib.request
import json

req = urllib.request.Request(
    'http://localhost:8000/api/auth/register',
    data=json.dumps({'username': 'api_test', 'email': 'api@test.com', 'password': 'password123'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)

try:
    response = urllib.request.urlopen(req)
    print(response.read().decode())
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode())
