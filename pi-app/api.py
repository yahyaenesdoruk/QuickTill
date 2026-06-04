# QuickTill Pi App — Backend API İstemcisi
import json
import urllib.request
import urllib.error
from config import API_BASE_URL

_token: str = ""


def set_token(token: str):
    global _token
    _token = token


def _request(method: str, path: str, body=None, auth=False):
    url = f"{API_BASE_URL}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if auth and _token:
        headers["Authorization"] = f"Bearer {_token}"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        error = json.loads(e.read())
        raise Exception(error.get("detail", str(e)))
    except Exception as e:
        raise Exception(f"Bağlantı hatası: {e}")


# ── Auth ──────────────────────────────────────
def login(username: str, password: str) -> dict:
    result = _request("POST", "/auth/login", {"username": username, "password": password})
    set_token(result["token"])
    return result["user"]


# ── Products ──────────────────────────────────
def get_products() -> list:
    return _request("GET", "/products")


def find_by_barcode(barcode: str) -> dict | None:
    try:
        return _request("GET", f"/products/barcode/{barcode}")
    except Exception:
        return None


def create_product(barcode: str, name: str, price: float, category: str = "General") -> dict:
    return _request("POST", "/products", {
        "barcode": barcode,
        "name": name,
        "price": price,
        "category": category,
    }, auth=True)


def delete_product(product_id: str):
    return _request("DELETE", f"/products/{product_id}", auth=True)
