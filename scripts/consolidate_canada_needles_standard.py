#!/usr/bin/env python3
"""
Consolidate Canada Needles & Cartridges into 4 Standard Master Configurable Products:
1. Nuclear Tattoo Needles (Traditional needles)
2. Papa Cartridges
3. Kwadron Cartridges
4. Kwadron Optima PMU Cartridges
"""

import os
import sys
import re
import json
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
    ProductChannelListing, ProductVariantChannelListing
)
from saleor.warehouse.models import Warehouse, Stock
from saleor.channel.models import Channel
from saleor.attribute.models import Attribute, AttributeValue, AssignedVariantAttributeValue

DATA_PATH = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/scripts/data/ntca_all_products.json"

def parse_needle_attributes(sku, name):
    """
    Extract Type, Gauge, Size from needle SKU and name.
    """
    name_lower = name.lower()
    sku_upper = sku.upper()

    # --- 1. GAUGE ---
    gauge_val = None
    if "0.18" in name_lower or "4 bugpin" in name_lower or "04" in sku_upper:
        gauge_val = "#4 Bugpin (0.18)"
    elif "0.20" in name_lower or "6 bugpin" in name_lower or "06" in sku_upper:
        gauge_val = "#6 Bugpin (0.20)"
    elif "0.25" in name_lower or "8 bugpin" in name_lower or "25/" in name_lower or "25-" in sku_upper or "c8" in sku_upper or "08" in sku_upper or "#8" in name_lower:
        gauge_val = "#8 Bugpin (0.25)"
    elif "0.30" in name_lower or "10 bugpin" in name_lower or "30/" in name_lower or "30-" in sku_upper or "c10" in sku_upper or "10" in sku_upper or "#10" in name_lower:
        gauge_val = "#10 Bugpin (0.30)"
    elif "0.35" in name_lower or "12 standard" in name_lower or "35/" in name_lower or "35-" in sku_upper or "c12" in sku_upper or "12" in sku_upper or "#12" in name_lower:
        gauge_val = "#12 Standard (0.35)"
    elif "0.40" in name_lower or "14 traditional" in name_lower or "14" in sku_upper or "#14" in name_lower:
        gauge_val = "#14 Traditional (0.40)"
    else:
        gauge_val = "#10 Bugpin (0.30)"

    # --- 2. TYPE ---
    type_val = None
    if "curved magnum" in name_lower or "magnum curve" in name_lower or "mc" in sku_upper or "cmlt" in sku_upper or "sem" in sku_upper:
        type_val = "Magnum Curved"
    elif "hollow round liner" in name_lower or "hrl" in sku_upper:
        type_val = "Round Liner Hollow"
    elif "round liner" in name_lower or "rl" in sku_upper:
        type_val = "Round Liner"
    elif "round shader" in name_lower or "rs" in sku_upper:
        type_val = "Round Shader"
    elif "magnum" in name_lower or "mg" in sku_upper or " m" in name_lower:
        type_val = "Magnum"
    elif "flat" in name_lower or " f" in name_lower or "f " in name_lower:
        type_val = "Flat"
    elif "diamond" in name_lower:
        type_val = "Diamond"
    elif "round" in name_lower:
        type_val = "Round"
    else:
        type_val = "Round Liner"

    # --- 3. SIZE ---
    size_val = None
    # Try finding size number e.g. 1005RL -> 5, 25/7RLLT -> 7, C1015M -> 15, etc.
    size_match = re.search(r'(\d+)\s*(?:round|magnum|hollow|flat|curved)', name_lower)
    if size_match:
        size_num = int(size_match.group(1))
        if size_num > 100:
            # 1205RL -> 5
            size_val = str(int(str(size_num)[2:]))
        else:
            size_val = str(size_num)
    else:
        m_sku = re.search(r'(?:C8|C10|C12|NT-|PM|25-|30-|35-|10|12)(\d{2})(?:RL|RS|M|MC|HRL|F)', sku_upper)
        if m_sku:
            size_val = str(int(m_sku.group(1)))
        else:
            m_any = re.search(r'\b([1-9]|1[13579]|2[1357])\b', name)
            if m_any:
                size_val = str(int(m_any.group(1)))
            else:
                size_val = "5"

    return type_val, gauge_val, size_val

def make_editorjs_desc(text):
    return {
        "time": 1700000000000,
        "blocks": [
            {
                "type": "paragraph",
                "data": {
                    "text": text
                }
            }
        ],
        "version": "2.29.0"
    }

def run():
    print("🚀 Starting Canada Needles Standardization into 4 Master Products...")

    ca_channel = Channel.objects.get(slug="canada")
    ca_warehouse = Warehouse.objects.get(slug="canada-warehouse")
    needles_category = Category.objects.get(slug="ntms-289-needles")
    conf_type = ProductType.objects.get(name="NTMS Configurable Product")

    # Fetch Attributes
    type_attr = Attribute.objects.get(id=12) # Type
    gauge_attr = Attribute.objects.get(id=11) # Gauge
    size_attr = Attribute.objects.get(id=8)  # Size

    # Load JSON catalog
    with open(DATA_PATH) as f:
        products_json = json.load(f)

    # 4 Master Products Configuration
    masters_spec = [
        {
            "name": "Nuclear Tattoo Needles",
            "slug": "ntca-nuclear-tattoo-needles-master",
            "filter": lambda p: "nuclear tattoo needle" in p.get("name", "").lower() or ("nuclear" in p.get("name", "").lower() and "needle" in p.get("name", "").lower()),
            "default_price": Decimal("26.00"),
        },
        {
            "name": "Papa Cartridges",
            "slug": "ntca-papa-cartridges-master",
            "filter": lambda p: "papa cartridge" in p.get("name", "").lower() or ("papa" in p.get("name", "").lower() and ("cartridge" in p.get("name", "").lower() or "c10" in p.get("sku", "").lower() or "c12" in p.get("sku", "").lower() or "c8" in p.get("sku", "").lower())),
            "default_price": Decimal("34.25"),
        },
        {
            "name": "Kwadron Cartridges",
            "slug": "ntca-kwadron-cartridges-master",
            "filter": lambda p: "kwadron" in p.get("name", "").lower() and not ("optima" in p.get("name", "").lower() or "pmu" in p.get("name", "").lower()),
            "default_price": Decimal("38.50"),
        },
        {
            "name": "Kwadron Optima PMU Cartridges",
            "slug": "ntca-kwadron-optima-pmu-cartridges-master",
            "filter": lambda p: "optima" in p.get("name", "").lower() or "pmu" in p.get("name", "").lower(),
            "default_price": Decimal("45.95"),
        },
    ]

    all_scattered_skus = set()

    for spec in masters_spec:
        m_name = spec["name"]
        m_slug = spec["slug"]
        m_filter = spec["filter"]
        m_def_price = spec["default_price"]

        matched_items = [p for p in products_json if m_filter(p)]
        print(f"\n📦 Processing Master Product: '{m_name}' ({len(matched_items)} source SKUs)...")

        # Create or update master product
        master_prod, created = Product.objects.get_or_create(
            slug=m_slug,
            defaults={
                "name": m_name,
                "category": needles_category,
                "product_type": conf_type,
                "description": make_editorjs_desc(f"{m_name} professional tattoo supply - full series of configurations."),
                "description_plaintext": f"{m_name} professional tattoo supply - full series of configurations.",
            }
        )
        if master_prod.name != m_name or master_prod.category != needles_category:
            master_prod.name = m_name
            master_prod.category = needles_category
            master_prod.save(update_fields=["name", "category"])

        # Ensure channel listing
        pcl, _ = ProductChannelListing.objects.get_or_create(
            product=master_prod,
            channel=ca_channel,
            defaults={
                "is_published": True,
                "visible_in_listings": True,
                "discounted_price_amount": m_def_price,
            }
        )
        pcl.is_published = True
        pcl.visible_in_listings = True
        pcl.discounted_price_amount = m_def_price
        pcl.save()

        # Build variants
        existing_variant_skus = set(master_prod.variants.values_list("sku", flat=True))
        added_variants = 0

        for item in matched_items:
            sku = item.get("sku", "").strip()
            if not sku:
                continue
            all_scattered_skus.add(sku)
            raw_price = item.get("price")
            try:
                price = Decimal(str(raw_price)) if raw_price and float(raw_price) > 0 else m_def_price
            except Exception:
                price = m_def_price

            t_val, g_val, s_val = parse_needle_attributes(sku, item.get("name", ""))

            # Attribute Value objects
            t_obj, _ = AttributeValue.objects.get_or_create(attribute=type_attr, name=t_val, defaults={"slug": slugify(t_val)})
            g_obj, _ = AttributeValue.objects.get_or_create(attribute=gauge_attr, name=g_val, defaults={"slug": slugify(g_val)})
            s_obj, _ = AttributeValue.objects.get_or_create(attribute=size_attr, name=s_val, defaults={"slug": slugify(s_val)})

            var_name = f"{s_val} {t_val} ({g_val})"
            variant = master_prod.variants.filter(sku=sku).first()
            if not variant:
                # Check if SKU exists elsewhere in DB
                conflict_var = ProductVariant.objects.filter(sku=sku).first()
                if conflict_var:
                    # Move variant to this master product
                    conflict_var.product = master_prod
                    conflict_var.name = var_name
                    conflict_var.save(update_fields=["product", "name"])
                    variant = conflict_var
                else:
                    variant = ProductVariant.objects.create(
                        product=master_prod,
                        sku=sku,
                        name=var_name,
                        track_inventory=True,
                    )
                added_variants += 1

            # Assign Attribute Values using Saleor's official attribute mapper
            from saleor.attribute.utils import associate_attribute_values_to_instance
            associate_attribute_values_to_instance(
                variant,
                {
                    type_attr.id: [t_obj],
                    gauge_attr.id: [g_obj],
                    size_attr.id: [s_obj],
                }
            )

            # Price Listing in CAD
            pvcl, _ = ProductVariantChannelListing.objects.get_or_create(
                variant=variant,
                channel=ca_channel,
                defaults={
                    "currency": "CAD",
                    "price_amount": price,
                    "cost_price_amount": round(price * Decimal("0.5"), 2),
                }
            )
            pvcl.price_amount = price
            pvcl.save()

            # Stock in Canada Warehouse
            Stock.objects.get_or_create(
                product_variant=variant,
                warehouse=ca_warehouse,
                defaults={"quantity": 100, "quantity_allocated": 0}
            )

        print(f"  ✅ '{m_name}': Active variants={master_prod.variants.count()} (New: {added_variants})")

    print(f"\n🧹 [Cleanup] Unpublishing scattered single-variant products from Canada Needles...")
    scattered_prods = Product.objects.filter(
        variants__sku__in=all_scattered_skus
    ).exclude(
        slug__in=[m["slug"] for m in masters_spec]
    ).distinct()

    unpub_count = ProductChannelListing.objects.filter(
        product__in=scattered_prods,
        channel=ca_channel
    ).update(is_published=False, visible_in_listings=False)

    print(f"  ✅ Unpublished {unpub_count} scattered single-variant products from Canada catalog.")

    cache.clear()
    print("\n🎉 Consolidation completed successfully!")

if __name__ == "__main__":
    run()
