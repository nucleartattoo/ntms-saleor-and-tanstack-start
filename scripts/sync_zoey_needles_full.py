#!/usr/bin/env python3
"""
Sync 12 Official Configurable Needle Products from US Zoey Origin Site to Saleor.
Creates/updates products and variants in both default-channel (USD) and canada (CAD).
"""

import os
import sys
import json
import urllib.request
import urllib.parse
from decimal import Decimal

CORE_DIR = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/apps/saleor-core"
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")

import django
django.setup()

from django.utils.text import slugify
from django.core.cache import cache
from saleor.product.models import (
    Product, ProductVariant, ProductType, Category,
    ProductChannelListing, ProductVariantChannelListing, ProductMedia
)
from saleor.warehouse.models import Warehouse, Stock
from saleor.channel.models import Channel
from saleor.attribute.models import Attribute, AttributeValue
from saleor.attribute.utils import associate_attribute_values_to_instance

def get_zoey_token():
    token_url = "https://tattoomaster-container.zoeysite.com/oauth/token"
    client_id = "85ab94ce3ff685971ea8706661de68ed"
    client_secret = "c010a5b0223e38ae18a39f451fe5c132641321eb2c4d9a4943a65d3e85fa1d51"

    data = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret
    }).encode("utf-8")

    req = urllib.request.Request(token_url, data=data, headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0"
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))["access_token"]

def zoey_get(path, token):
    url = f"https://store.nucleartattoo.com/api/rest{path}"
    r = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    })
    with urllib.request.urlopen(r) as res:
        return json.loads(res.read().decode("utf-8"))

def make_editorjs_desc(text):
    return {
        "time": 1700000000000,
        "blocks": [{"type": "paragraph", "data": {"text": text}}],
        "version": "2.29.0"
    }

def run():
    print("🚀 [Zoey -> Saleor] Starting Full Synchronization of 12 Official Needle Series...")
    token = get_zoey_token()
    print("  ✅ Authenticated with US Origin Zoey API.")

    us_channel = Channel.objects.get(slug="default-channel")
    ca_channel = Channel.objects.get(slug="canada")
    us_warehouse = Warehouse.objects.get(slug="default-warehouse")
    ca_warehouse = Warehouse.objects.get(slug="canada-warehouse")
    needles_category = Category.objects.get(slug="ntms-289-needles")
    conf_type = ProductType.objects.get(name="NTMS Configurable Product")

    # Attributes
    type_attr = Attribute.objects.get(id=12)  # Type
    gauge_attr = Attribute.objects.get(id=11) # Gauge
    size_attr = Attribute.objects.get(id=8)   # Size

    CAD_EXCHANGE_RATE = Decimal("1.37")

    needle_pids = [7284, 7285, 7456, 7457, 7458, 7459, 7468, 7469, 7470, 7471, 7472, 7921]

    for pid in needle_pids:
        print(f"\n📦 Fetching Zoey Product ID: {pid}...")
        p_data = zoey_get(f"/products/{pid}", token)
        name = p_data.get("name", "").strip()
        sku = p_data.get("sku", "").strip()
        url_key = p_data.get("url_key", "").strip() or slugify(name)
        slug = f"ntms-{url_key}" if not url_key.startswith("ntms-") else url_key

        desc_raw = p_data.get("description") or f"Professional sterile {name} direct supply."
        import re
        clean_desc = re.sub(r"<[^>]+>", " ", desc_raw).strip()
        clean_desc = " ".join(clean_desc.split())[:300]

        # 1. Product in Saleor
        prod, _ = Product.objects.get_or_create(
            slug=slug,
            defaults={
                "name": name,
                "category": needles_category,
                "product_type": conf_type,
                "description": make_editorjs_desc(clean_desc),
                "description_plaintext": clean_desc,
            }
        )
        prod.name = name
        prod.category = needles_category
        prod.description = make_editorjs_desc(clean_desc)
        prod.description_plaintext = clean_desc
        prod.save(update_fields=["name", "category", "description", "description_plaintext"])

        # Determine base starting price
        assoc_items = p_data.get("associated_products", {})
        if isinstance(assoc_items, dict):
            child_list = list(assoc_items.values())
        elif isinstance(assoc_items, list):
            child_list = assoc_items
        else:
            child_list = []

        prices = []
        for c in child_list:
            p_val = c.get("price") or c.get("children_price")
            try:
                if p_val and float(p_val) > 0:
                    prices.append(Decimal(str(p_val)))
            except Exception:
                pass
        base_usd_price = min(prices) if prices else Decimal("25.00")
        base_cad_price = round(base_usd_price * CAD_EXCHANGE_RATE, 2)

        # 2. Channel Listings (Dual-Channel US & Canada)
        us_pcl, _ = ProductChannelListing.objects.get_or_create(
            product=prod, channel=us_channel,
            defaults={"is_published": True, "visible_in_listings": True, "discounted_price_amount": base_usd_price}
        )
        us_pcl.is_published = True
        us_pcl.visible_in_listings = True
        us_pcl.discounted_price_amount = base_usd_price
        us_pcl.save()

        ca_pcl, _ = ProductChannelListing.objects.get_or_create(
            product=prod, channel=ca_channel,
            defaults={"is_published": True, "visible_in_listings": True, "discounted_price_amount": base_cad_price}
        )
        ca_pcl.is_published = True
        ca_pcl.visible_in_listings = True
        ca_pcl.discounted_price_amount = base_cad_price
        ca_pcl.save()

        # 3. Product Media Images
        images_info = p_data.get("media_gallery", {}).get("images", [])
        if not images_info and p_data.get("image"):
            images_info = [{"file": p_data.get("image"), "label": name}]

        for m_idx, img in enumerate(images_info):
            img_file = img.get("file", "").lstrip("/")
            if not img_file:
                continue
            media_path = f"products/{os.path.basename(img_file)}"
            # Link or create ProductMedia
            if not prod.media.filter(image__icontains=os.path.basename(img_file)).exists():
                ProductMedia.objects.create(
                    product=prod,
                    image=f"products/{img_file}",
                    alt=name[:240],
                    type="IMAGE",
                    sort_order=m_idx,
                )

        # 4. Associated Variants
        created_vars = 0
        updated_vars = 0

        for c_item in child_list:
            c_sku = c_item.get("sku", "").strip()
            if not c_sku:
                continue
            c_name = c_item.get("name", "").strip()
            raw_p = c_item.get("price") or c_item.get("children_price") or base_usd_price
            try:
                usd_p = Decimal(str(raw_p)) if float(raw_p) > 0 else base_usd_price
            except Exception:
                usd_p = base_usd_price
            cad_p = round(usd_p * CAD_EXCHANGE_RATE, 2)

            stock_qty_raw = c_item.get("stock_item", {}).get("qty", "100")
            try:
                stock_qty = max(0, int(float(stock_qty_raw)))
            except Exception:
                stock_qty = 100

            # Attributes Extraction
            attrs = c_item.get("custom_attributes", {})
            t_label = attrs.get("type", {}).get("label") or "Round Liner"
            g_label = attrs.get("gauge", {}).get("label") or "#10 Bugpin (0.30)"
            s_label = attrs.get("size", {}).get("label") or "5"

            t_obj, _ = AttributeValue.objects.get_or_create(attribute=type_attr, name=t_label, defaults={"slug": slugify(t_label)})
            g_obj, _ = AttributeValue.objects.get_or_create(attribute=gauge_attr, name=g_label, defaults={"slug": slugify(g_label)})
            s_obj, _ = AttributeValue.objects.get_or_create(attribute=size_attr, name=s_label, defaults={"slug": slugify(s_label)})

            # Find or Create Variant
            var = prod.variants.filter(sku=c_sku).first()
            if not var:
                existing_var = ProductVariant.objects.filter(sku=c_sku).first()
                if existing_var:
                    existing_var.product = prod
                    existing_var.name = c_name
                    existing_var.save(update_fields=["product", "name"])
                    var = existing_var
                    updated_vars += 1
                else:
                    var = ProductVariant.objects.create(
                        product=prod,
                        sku=c_sku,
                        name=c_name,
                        track_inventory=True,
                    )
                    created_vars += 1

            # Associate attributes
            associate_attribute_values_to_instance(
                var,
                {
                    type_attr.id: [t_obj],
                    gauge_attr.id: [g_obj],
                    size_attr.id: [s_obj],
                }
            )

            # Pricing
            us_pvcl, _ = ProductVariantChannelListing.objects.get_or_create(
                variant=var, channel=us_channel,
                defaults={"currency": "USD", "price_amount": usd_p, "cost_price_amount": round(usd_p * Decimal("0.5"), 2)}
            )
            us_pvcl.price_amount = usd_p
            us_pvcl.save()

            ca_pvcl, _ = ProductVariantChannelListing.objects.get_or_create(
                variant=var, channel=ca_channel,
                defaults={"currency": "CAD", "price_amount": cad_p, "cost_price_amount": round(cad_p * Decimal("0.5"), 2)}
            )
            ca_pvcl.price_amount = cad_p
            ca_pvcl.save()

            # Stocks
            us_stk, _ = Stock.objects.get_or_create(
                product_variant=var, warehouse=us_warehouse,
                defaults={"quantity": stock_qty, "quantity_allocated": 0}
            )
            us_stk.quantity = max(10, stock_qty)
            us_stk.save()

            ca_stk, _ = Stock.objects.get_or_create(
                product_variant=var, warehouse=ca_warehouse,
                defaults={"quantity": 100, "quantity_allocated": 0}
            )

        print(f"  ✅ '{name}': Total variants={prod.variants.count()} (Created: {created_vars}, Re-linked: {updated_vars}) | Base USD: ${base_usd_price} | Base CAD: ${base_cad_price}")

    cache.clear()
    print("\n🎉 [Complete] All 12 Official Zoey Needle Series Synchronized to US and Canada channels!")

if __name__ == "__main__":
    run()
