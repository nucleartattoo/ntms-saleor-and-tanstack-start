import urllib.request
import urllib.error
import json

GRAPHQL_URL = "http://localhost:8003/graphql/"

def graphql_request(query, variables=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    data = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
    req = urllib.request.Request(GRAPHQL_URL, data=data, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        raise Exception(f"HTTP {e.code}: {body}")

def login(email, password):
    query = """
    mutation TokenCreate($email: String!, $password: String!) {
      tokenCreate(email: $email, password: $password) {
        token
        errors {
          field
          message
        }
        user {
          id
          email
          isStaff
        }
      }
    }
    """
    res = graphql_request(query, {"email": email, "password": password})
    data = res.get("data", {}).get("tokenCreate", {})
    if data.get("token"):
        return data["token"], data["user"]
    raise Exception(f"Login failed for {email}: {data.get('errors')}")

def get_accessible_channels(token):
    query = """
    query {
      channels {
        id
        slug
        name
        currencyCode
      }
    }
    """
    res = graphql_request(query, token=token)
    return res.get("data", {}).get("channels", [])

def get_orders(token):
    query = """
    query {
      orders(first: 5) {
        totalCount
        edges {
          node {
            id
            number
            channel {
              slug
            }
          }
        }
      }
    }
    """
    res = graphql_request(query, token=token)
    return res.get("data", {}).get("orders", {})

def test_accounts():
    users = [
        ("canada-admin@nucleartattoosupply.com", "Admin123456!", "Canada Store Manager"),
        ("us-admin@nucleartattoosupply.com", "Admin123456!", "US Store Manager"),
        ("admin@nucleartattoosupply.com", "Admin123456!", "Global SuperAdmin"),
    ]

    print("\n🔍 Verifying Multi-Channel Admin Account Logins & Access Boundaries:")
    for email, pwd, expected_scope in users:
        print(f"\n👉 Testing Account: {email} ({expected_scope})")
        token, user_info = login(email, pwd)
        print(f"   ✅ Token Login Success!")
        print(f"      isStaff={user_info['isStaff']}")

        channels = get_accessible_channels(token)
        slugs = [c['slug'] for c in channels]
        print(f"      Visible Channels: {slugs}")

        orders_data = get_orders(token)
        print(f"      Orders Access: totalCount={orders_data.get('totalCount')}")

if __name__ == "__main__":
    test_accounts()
