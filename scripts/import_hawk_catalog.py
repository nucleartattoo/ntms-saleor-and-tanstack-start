#!/usr/bin/env python3
"""
Import Hawk Tattoo Supply catalog into Saleor:
1. Import the exclusive Eagle Cartridges line (1 Configurable Product + 59 Variants) with
   - Attributes: Type, Gauge, Size
   - ProductMedia: 2 high-res gallery images
   - Pricing: $14.95 USD in channel 'hawk' (and 'default-channel')
   - Inventory: Stock records in 'hawk-warehouse' and 'default-warehouse'
2. Map all 2,000+ active overlapping products from Hawk into channel 'hawk':
   - ProductChannelListing (published & visible)
   - ProductVariantChannelListing (USD pricing)
   - Stock entries
"""

import os
import sys
import json
import time
from decimal import Decimal

# Setup Django environment
CORE_DIR = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/apps/saleor-core"
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")

import django
django.setup()

from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from saleor.channel.models import Channel
from saleor.warehouse.models import Warehouse, Stock
from saleor.product.models import (
    Product,
    ProductVariant,
    ProductType,
    Category,
    ProductChannelListing,
    ProductVariantChannelListing,
    ProductMedia,
)
from saleor.attribute.models import Attribute, AttributeValue
from saleor.attribute.utils import associate_attribute_values_to_instance

EAGLE_DATA_PATH = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/scripts/data/hawk_eagle_cartridges.json"
ACTIVE_DATA_PATH = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/scripts/data/hawk_active_products.json"

def make_editorjs_description(text):
    return {
        "time": int(time.time() * 1000),
        "blocks": [
            {
                "id": "hawk-desc",
                "type": "paragraph",
                "data": {"text": text},
            }
        ],
        "version": "2.30.0",
    }

def run_import():
    print("🚀 [Hawk Catalog Migration] Starting catalog import and channel mapping...")
    start_time = time.time()

    # 1. Fetch Channel & Warehouses
    hawk_channel = Channel.objects.filter(slug="hawk").first()
    us_channel = Channel.objects.filter(slug="default-channel").first()

    if not hawk_channel:
        raise RuntimeError("Channel 'hawk' not found! Please run scripts/create_hawk_channel.py first.")

    hawk_wh = Warehouse.objects.filter(slug="hawk-warehouse").first()
    default_wh = Warehouse.objects.filter(slug="default-warehouse").first()

    print(f"  • Target Channel: {hawk_channel.name} (ID: {hawk_channel.id}, Slug: '{hawk_channel.slug}')")
    print(f"  • Warehouses: Hawk WH ({hawk_wh.slug if hawk_wh else 'None'}), Default WH ({default_wh.slug if default_wh else 'None'})")

    # =========================================================================
    # PART 1: Import Eagle Cartridges (Exclusive Product Line)
    # =========================================================================
    print("\n📦 [Part 1/2] Importing Eagle Cartridges (59 Variants)...")
    with open(EAGLE_DATA_PATH) as f:
        eagle_data = json.load(f)

    # 1.1 Category Setup
    eagle_category, _ = Category.objects.get_or_create(
        slug="hawk-eagle-cartridges",
        defaults={
            "name": "Eagle Cartridges",
            "parent": None,
            "description": make_editorjs_description("Eagle professional tattoo needle cartridges.")
        }
    )
    eagle_category.parent = None
    eagle_category.save(update_fields=["parent"])
    print(f"  ✅ Category: '{eagle_category.name}' (parent: None)")

    # 1.2 Product Type & Attributes
    conf_type = ProductType.objects.get(name="NTMS Configurable Product")
    type_attr = Attribute.objects.get(id=12)   # Type
    gauge_attr = Attribute.objects.get(id=11)  # Gauge
    size_attr = Attribute.objects.get(id=8)    # Size

    # 1.3 Master Product
    eagle_product, prod_created = Product.objects.update_or_create(
        slug="eagle-cartridges",
        defaults={
            "name": "Eagle Cartridges",
            "product_type": conf_type,
            "category": eagle_category,
            "description": make_editorjs_description(
                "Eagle Cartridge Needles - Professional High Precision Tattoo Needle Cartridges. "
                "Featuring medical grade plastic and highest grade stainless steel needles for smooth ink flow and maximum stability."
            ),
            "description_plaintext": "Eagle Cartridge Needles - Professional High Precision Tattoo Needle Cartridges.",
            "seo_title": "Eagle Cartridges | Professional Tattoo Needles | Hawk Tattoo Supply",
            "seo_description": "Shop Eagle Tattoo Needle Cartridges in Round Liner, Round Shader, Magnum and Curved Magnum configurations.",
        }
    )
    print(f"  ✅ Master Product: '{eagle_product.name}' (ID: {eagle_product.id}, created: {prod_created})")

    # 1.4 Product Channel Listings (Hawk Channel Only)
    for ch in [hawk_channel]:
        if ch:
            ProductChannelListing.objects.update_or_create(
                product=eagle_product,
                channel=ch,
                defaults={
                    "is_published": True,
                    "visible_in_listings": True,
                    "available_for_purchase_at": timezone.now(),
                    "discounted_price_amount": Decimal("14.95"),
                }
            )
    print("  ✅ ProductChannelListing configured exclusively for channel 'hawk'")

    # 1.5 Product Media
    media_files = [
        ("products/hawk/c/a/cartridge_1_1_39.jpg", "Eagle Cartridge Needle Tip", 0),
        ("products/hawk/e/a/eagle-box.jpg", "Eagle Cartridge Box Packaging", 1),
    ]
    for rel_path, alt_text, sort_order in media_files:
        ProductMedia.objects.update_or_create(
            product=eagle_product,
            image=rel_path,
            defaults={
                "alt": alt_text,
                "type": "IMAGE",
                "sort_order": sort_order,
            }
        )
    print(f"  ✅ ProductMedia: {len(media_files)} high-res gallery images attached")

    # 1.6 Child Variants (59)
    variants_imported = 0
    eagle_price = Decimal("14.95")
    eagle_cost = Decimal("7.50")

    for v_data in eagle_data["variants"]:
        v_sku = v_data["sku"].strip()
        v_name = v_data["name"].strip()
        config_group = v_data.get("config_group") or "Round Liner"
        gauge = v_data.get("gauge") or "0.35mm"
        size = str(v_data.get("size") or "7")
        stock_qty = int(float(v_data.get("qty", 0)))
        if stock_qty <= 0 and v_data.get("is_in_stock") == "1":
            stock_qty = 50

        # Attribute Values
        t_obj, _ = AttributeValue.objects.get_or_create(
            attribute=type_attr,
            name=config_group,
            defaults={"slug": slugify(f"eagle-{config_group}")}
        )
        g_obj, _ = AttributeValue.objects.get_or_create(
            attribute=gauge_attr,
            name=gauge,
            defaults={"slug": slugify(f"eagle-{gauge}")}
        )
        s_obj, _ = AttributeValue.objects.get_or_create(
            attribute=size_attr,
            name=size,
            defaults={"slug": slugify(f"eagle-size-{size}")}
        )

        variant, v_created = ProductVariant.objects.update_or_create(
            sku=v_sku,
            defaults={
                "product": eagle_product,
                "name": v_name,
                "track_inventory": True,
            }
        )

        # Assign attributes
        associate_attribute_values_to_instance(
            variant,
            {
                type_attr.id: [t_obj],
                gauge_attr.id: [g_obj],
                size_attr.id: [s_obj],
            }
        )

        # Variant Channel Listings (Hawk Channel Only)
        for ch in [hawk_channel]:
            if ch:
                ProductVariantChannelListing.objects.update_or_create(
                    variant=variant,
                    channel=ch,
                    defaults={
                        "currency": "USD",
                        "price_amount": eagle_price,
                        "discounted_price_amount": eagle_price,
                        "cost_price_amount": eagle_cost,
                    }
                )

        # Stock
        for wh in [hawk_wh, default_wh]:
            if wh:
                Stock.objects.update_or_create(
                    product_variant=variant,
                    warehouse=wh,
                    defaults={
                        "quantity": stock_qty if stock_qty > 0 else 50,
                    }
                )

        variants_imported += 1

    print(f"  ✅ Imported {variants_imported} Eagle Cartridge variants with full attributes & stock!")

    # =========================================================================
    # PART 2: Map Overlapping Active Products to Hawk Channel
    # =========================================================================
    print("\n📦 [Part 2/2] Mapping active overlapping products to 'hawk' channel...")
    with open(ACTIVE_DATA_PATH) as f:
        hawk_active = json.load(f)

    # Build lookup of Hawk price
    hawk_prices = {}
    for p in hawk_active:
        sku = p.get("sku")
        if sku and p.get("price"):
            try:
                p_val = Decimal(str(p["price"]))
                if p_val > 0:
                    hawk_prices[sku] = p_val
            except Exception:
                pass

    # Find existing variants in Saleor matching active Hawk SKUs
    matched_variants = ProductVariant.objects.filter(sku__in=hawk_prices.keys()).select_related("product")
    matched_products = set(v.product for v in matched_variants)

    print(f"  • Found {len(matched_variants)} variants across {len(matched_products)} products matching Hawk catalog")

    # Bulk prepare channel listings
    product_listings_to_create = []
    variant_listings_to_create = []
    stocks_to_create = []

    # Get existing listings to avoid duplicates
    existing_p_listings = set(
        ProductChannelListing.objects.filter(channel=hawk_channel, product__in=matched_products)
        .values_list("product_id", flat=True)
    )
    existing_v_listings = set(
        ProductVariantChannelListing.objects.filter(channel=hawk_channel, variant__in=matched_variants)
        .values_list("variant_id", flat=True)
    )

    now = timezone.now()

    # 1. Product Channel Listings
    for p in matched_products:
        if p.id not in existing_p_listings:
            product_listings_to_create.append(
                ProductChannelListing(
                    product=p,
                    channel=hawk_channel,
                    is_published=True,
                    visible_in_listings=True,
                    available_for_purchase_at=now,
                )
            )

    if product_listings_to_create:
        ProductChannelListing.objects.bulk_create(product_listings_to_create, ignore_conflicts=True)
        print(f"  ✅ Created {len(product_listings_to_create)} ProductChannelListings for 'hawk'")

    # 2. Variant Channel Listings
    # Pre-fetch existing US prices as fallback
    us_prices = dict(
        ProductVariantChannelListing.objects.filter(channel=us_channel, variant__in=matched_variants)
        .values_list("variant_id", "price_amount")
    )

    for v in matched_variants:
        if v.id not in existing_v_listings:
            price = hawk_prices.get(v.sku) or us_prices.get(v.id) or Decimal("19.95")
            cost = round(price * Decimal("0.5"), 2)
            variant_listings_to_create.append(
                ProductVariantChannelListing(
                    variant=v,
                    channel=hawk_channel,
                    currency="USD",
                    price_amount=price,
                    cost_price_amount=cost,
                )
            )

    if variant_listings_to_create:
        ProductVariantChannelListing.objects.bulk_create(variant_listings_to_create, ignore_conflicts=True)
        print(f"  ✅ Created {len(variant_listings_to_create)} ProductVariantChannelListings in USD for 'hawk'")

    # 3. Ensure Warehouse Stock in Hawk Warehouse
    if hawk_wh:
        existing_stocks = set(
            Stock.objects.filter(warehouse=hawk_wh, product_variant__in=matched_variants)
            .values_list("product_variant_id", flat=True)
        )
        for v in matched_variants:
            if v.id not in existing_stocks:
                stocks_to_create.append(
                    Stock(
                        product_variant=v,
                        warehouse=hawk_wh,
                        quantity=100,
                    )
                )
        if stocks_to_create:
            Stock.objects.bulk_create(stocks_to_create, ignore_conflicts=True)
            print(f"  ✅ Created {len(stocks_to_create)} Stock entries in Hawk Warehouse")

    elapsed = time.time() - start_time
    print("\n🎉 ==========================================================")
    print(f"🎉 Hawk Catalog Migration Complete in {elapsed:.2f}s!")
    print("🎉 ==========================================================")
    print(f"  • Eagle Cartridges Master: 1 Configurable Product, {variants_imported} Variants")
    print(f"  • Overlapping Products Listed in Hawk Channel: {len(matched_products)}")
    print(f"  • Overlapping Variants Listed in Hawk Channel: {len(matched_variants)}")
    print("==========================================================\n")

if __name__ == "__main__":
    run_import()
