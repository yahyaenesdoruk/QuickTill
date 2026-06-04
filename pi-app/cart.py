# QuickTill Pi App — Sepet (hafızada tutulur)
from typing import List, Dict

_cart: List[Dict] = []


def add_product(product: dict):
    """Ürünü sepete ekle, varsa miktarı artır"""
    for item in _cart:
        if item["id"] == product["id"]:
            item["quantity"] += 1
            return
    _cart.append({**product, "quantity": 1})


def remove_item(product_id: str):
    global _cart
    _cart = [i for i in _cart if i["id"] != product_id]


def get_cart() -> List[Dict]:
    return _cart


def clear_cart():
    _cart.clear()


def get_total() -> float:
    return sum(i["price"] * i["quantity"] for i in _cart)


def get_item_count() -> int:
    return sum(i["quantity"] for i in _cart)
