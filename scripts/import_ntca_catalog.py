#!/usr/bin/env python3
"""
Import Nuclear Tattoo Canada (NTCA) Magento 2 catalog into Saleor Canada channel.
- Shared products (overlapping SKUs with existing US catalog):
    Attaches product & variants to Canada channel (CAD pricing from NTCA).
- Canada-only products:
    Creates Categories, Products, Variants, Stock, ProductMedia, and Canada Channel Listings.
"""

import os
import sys
import re
import json
import time
from decimal import Decimal
from datetime import datetime

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

DATA_PATH = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/scripts/data/ntca_all_products.json"


def clean_html(raw_html):
    """Clean basic HTML tags to plain text for search and description_plaintext."""
    if not raw_html:
        return ""
    cleanr = re.compile("<.*?>")
    cleantext = re.sub(cleanr, " ", raw_html)
    return " ".join(cleantext.split())


def make_editorjs_description(raw_html):
    """Convert raw text or HTML to Saleor EditorJS JSON block format."""
    clean_text = clean_html(raw_html)
    if not clean_text:
        return None
    return {
        "time": int(time.time() * 1000),
        "blocks": [
            {
                "id": "ntca-desc",
                "type": "paragraph",
                "data": {"text": clean_text[:5000]},
            }
        ],
        "version": "2.30.0",
    }


def generate_unique_slug(base_str, existing_slugs, max_length=240):
    base_slug = slugify(base_str)[:max_length]
    if not base_slug:
        base_slug = "product"
    slug = base_slug
    counter = 1
    while slug in existing_slugs:
        slug = f"{base_slug[:max_length-10]}-{counter}"
        counter += 1
    existing_slugs.add(slug)
    return slug


def run_import():
    print("🇨🇦 ==========================================================")
    print("🇨🇦 Starting NTCA Catalog Import into Saleor Canada Channel...")
    print("🇨🇦 ==========================================================\n")

    if not os.path.exists(DATA_PATH):
        print(f"❌ Data file not found: {DATA_PATH}")
        sys.exit(1)

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        ntca_products = json.load(f)

    print(f"📦 Loaded {len(ntca_products)} products from {DATA_PATH}")

    # 1. Target Channel and Warehouse
    canada_channel = Channel.objects.filter(slug="canada").first()
    if not canada_channel:
        print("❌ 'canada' channel not found in database! Please run create_canada_channel.py first.")
        sys.exit(1)

    default_warehouse = Warehouse.objects.first()
    if not default_warehouse:
        print("❌ No default warehouse found in database!")
        sys.exit(1)

    print(f"✅ Target Channel: {canada_channel.name} (id={canada_channel.id}, currency={canada_channel.currency_code})")
    print(f"✅ Default Warehouse: {default_warehouse.name} (id={default_warehouse.id})")

    # 2. Product Types
    pt_configurable = ProductType.objects.filter(slug="ntms-configurable-product").first()
    pt_simple = ProductType.objects.filter(slug="ntms-simple-product").first()
    if not pt_configurable or not pt_simple:
        pt_configurable = ProductType.objects.filter(has_variants=True).first()
        pt_simple = pt_configurable
    print(f"✅ Product Types: Configurable='{pt_configurable.name}', Simple='{pt_simple.name}'")

    # 3. Cache Existing Categories
    print("🔍 Caching existing categories...")
    category_map = {c.name.strip().lower(): c for c in Category.objects.all()}
    existing_category_slugs = set(Category.objects.values_list("slug", flat=True))

    def get_or_create_category(cat_name):
        cat_name = cat_name.strip()
        if not cat_name:
            return None
        key = cat_name.lower()
        if key in category_map:
            return category_map[key]

        slug = generate_unique_slug(f"ntca-{cat_name}", existing_category_slugs)
        cat = Category.objects.create(
            name=cat_name,
            slug=slug,
            description=make_editorjs_description(cat_name),
            description_plaintext=cat_name,
            background_image_alt=cat_name,
        )
        category_map[key] = cat
        return cat

    # 4. Cache Existing Products & Variants
    print("🔍 Caching existing Saleor products & variants...")
    saleor_variant_by_sku = {}
    for v in ProductVariant.objects.select_related("product").filter(sku__isnull=False):
        sku_clean = v.sku.strip().upper()
        saleor_variant_by_sku[sku_clean] = v

    existing_product_slugs = set(Product.objects.values_list("slug", flat=True))
    all_used_skus = set(saleor_variant_by_sku.keys())

    # Pre-fetch existing channel listings for Canada
    existing_product_listings = set(
        ProductChannelListing.objects.filter(channel=canada_channel).values_list("product_id", flat=True)
    )
    existing_variant_listings = set(
        ProductVariantChannelListing.objects.filter(channel=canada_channel).values_list("variant_id", flat=True)
    )

    now = timezone.now()

    # Counters
    stats = {
        "shared_products_linked": 0,
        "shared_variants_listed": 0,
        "new_products_created": 0,
        "new_variants_created": 0,
        "new_stocks_created": 0,
        "new_media_created": 0,
        "skipped_products": 0,
    }

    # Prepare batches for bulk creation where appropriate
    new_product_listings = []
    new_variant_listings = []
    new_stocks = []
    new_medias = []

    print("\n🚀 Processing NTCA Catalog...")
    start_time = time.time()

    for idx, p in enumerate(ntca_products, 1):
        variants = p.get("variants", [])
        p_name = p.get("name") or p.get("sku") or "Untitled Product"
        raw_desc = p.get("description", "")
        clean_desc = clean_html(raw_desc)
        editorjs_desc = make_editorjs_description(raw_desc)

        # Determine primary category
        primary_cat = None
        for cat_name in p.get("categories", []):
            if cat_name:
                primary_cat = get_or_create_category(cat_name)
                break

        # Check for SKU overlap in variants
        matched_variants = []
        unmatched_variants = []
        for v in variants:
            v_sku = (v.get("sku") or "").strip().upper()
            if v_sku and v_sku in saleor_variant_by_sku:
                matched_variants.append((v, saleor_variant_by_sku[v_sku]))
            else:
                unmatched_variants.append(v)

        # ----------------------------------------------------
        # CASE A: Product has variants matched to existing Saleor product
        # ----------------------------------------------------
        if matched_variants:
            # Use the existing Saleor product from the first matched variant
            existing_saleor_product = matched_variants[0][1].product

            # 1. Product Channel Listing
            if existing_saleor_product.id not in existing_product_listings:
                new_product_listings.append(
                    ProductChannelListing(
                        product=existing_saleor_product,
                        channel=canada_channel,
                        is_published=True,
                        visible_in_listings=True,
                        published_at=now,
                        available_for_purchase_at=now,
                        currency="CAD",
                        discounted_price_dirty=False,
                    )
                )
                existing_product_listings.add(existing_saleor_product.id)
                stats["shared_products_linked"] += 1

            # 2. Existing Variants: Create or Update CAD Listing
            for ntca_v, saleor_v in matched_variants:
                if saleor_v.id not in existing_variant_listings:
                    price_val = Decimal(str(round(float(ntca_v.get("price") or 0.0), 3)))
                    new_variant_listings.append(
                        ProductVariantChannelListing(
                            variant=saleor_v,
                            channel=canada_channel,
                            price_amount=price_val,
                            discounted_price_amount=price_val,
                            currency="CAD",
                        )
                    )
                    existing_variant_listings.add(saleor_v.id)
                    stats["shared_variants_listed"] += 1

            # 3. Unmatched variants under this existing product: create new variant
            for ntca_v in unmatched_variants:
                v_sku = (ntca_v.get("sku") or "").strip()
                if not v_sku or v_sku.upper() in all_used_skus:
                    v_sku = generate_unique_slug(f"{ntca_v.get('sku') or 'v'}-ca", all_used_skus, max_length=250)

                new_var = ProductVariant.objects.create(
                    product=existing_saleor_product,
                    sku=v_sku,
                    name=ntca_v.get("name") or v_sku,
                    track_inventory=True,
                    weight=ntca_v.get("weight") or None,
                )
                saleor_variant_by_sku[v_sku.upper()] = new_var
                all_used_skus.add(v_sku.upper())

                price_val = Decimal(str(round(float(ntca_v.get("price") or 0.0), 3)))
                new_variant_listings.append(
                    ProductVariantChannelListing(
                        variant=new_var,
                        channel=canada_channel,
                        price_amount=price_val,
                        discounted_price_amount=price_val,
                        currency="CAD",
                    )
                )
                existing_variant_listings.add(new_var.id)

                new_stocks.append(
                    Stock(
                        warehouse=default_warehouse,
                        product_variant=new_var,
                        quantity=100,
                        quantity_allocated=0,
                    )
                )
                stats["new_variants_created"] += 1
                stats["new_stocks_created"] += 1

        # ----------------------------------------------------
        # CASE B: Canada-only Product (no variants matched in Saleor)
        # ----------------------------------------------------
        else:
            is_configurable = (p.get("type_id") == "configurable") or (len(variants) > 1)
            target_pt = pt_configurable if is_configurable else pt_simple

            product_slug = generate_unique_slug(f"ntca-{p_name}", existing_product_slugs)

            try:
                with transaction.atomic():
                    new_product = Product.objects.create(
                        name=p_name,
                        slug=product_slug,
                        description=editorjs_desc,
                        description_plaintext=clean_desc,
                        category=primary_cat,
                        product_type=target_pt,
                        weight=p.get("weight") or None,
                        search_document=p_name,
                        search_index_dirty=False,
                    )

                    new_product_listings.append(
                        ProductChannelListing(
                            product=new_product,
                            channel=canada_channel,
                            is_published=True,
                            visible_in_listings=True,
                            published_at=now,
                            available_for_purchase_at=now,
                            currency="CAD",
                            discounted_price_dirty=False,
                        )
                    )
                    existing_product_listings.add(new_product.id)
                    stats["new_products_created"] += 1

                    # Create Variants
                    for sort_idx, ntca_v in enumerate(variants):
                        v_sku = (ntca_v.get("sku") or "").strip()
                        if not v_sku or v_sku.upper() in all_used_skus:
                            v_sku = generate_unique_slug(f"{v_sku or 'v'}-ca", all_used_skus, max_length=250)

                        new_var = ProductVariant.objects.create(
                            product=new_product,
                            sku=v_sku,
                            name=ntca_v.get("name") or p_name,
                            track_inventory=True,
                            weight=ntca_v.get("weight") or None,
                            sort_order=sort_idx,
                        )
                        saleor_variant_by_sku[v_sku.upper()] = new_var
                        all_used_skus.add(v_sku.upper())

                        price_val = Decimal(str(round(float(ntca_v.get("price") or 0.0), 3)))
                        new_variant_listings.append(
                            ProductVariantChannelListing(
                                variant=new_var,
                                channel=canada_channel,
                                price_amount=price_val,
                                discounted_price_amount=price_val,
                                currency="CAD",
                            )
                        )
                        existing_variant_listings.add(new_var.id)

                        new_stocks.append(
                            Stock(
                                warehouse=default_warehouse,
                                product_variant=new_var,
                                quantity=100,
                                quantity_allocated=0,
                            )
                        )
                        stats["new_variants_created"] += 1
                        stats["new_stocks_created"] += 1

                    # Create ProductMedia
                    gallery = p.get("gallery_images", [])
                    main_img = p.get("main_image")
                    if main_img and main_img not in gallery:
                        gallery.insert(0, main_img)

                    for m_idx, img_path in enumerate(gallery):
                        if img_path:
                            # Normalize path: /0/0/002.jpg -> products/ntca/0/0/002.jpg
                            clean_img_path = img_path.lstrip("/")
                            media_rel_path = f"products/ntca/{clean_img_path}"
                            # Django ImageField default max_length is 100 characters
                            if len(media_rel_path) > 100:
                                base, ext = os.path.splitext(clean_img_path)
                                allowed_base_len = 100 - len("products/ntca/") - len(ext)
                                if allowed_base_len > 0:
                                    media_rel_path = f"products/ntca/{base[:allowed_base_len]}{ext}"
                                else:
                                    media_rel_path = media_rel_path[:100]
                            new_medias.append(
                                ProductMedia(
                                    product=new_product,
                                    image=media_rel_path,
                                    alt=p_name[:240],
                                    type="IMAGE",
                                    sort_order=m_idx,
                                )
                            )
                            stats["new_media_created"] += 1

            except Exception as e:
                print(f"⚠️ Error creating product '{p_name}': {e}")
                stats["skipped_products"] += 1

        # Periodically flush bulk listings & stocks to database
        if len(new_product_listings) >= 200:
            ProductChannelListing.objects.bulk_create(new_product_listings, ignore_conflicts=True)
            new_product_listings = []

        if len(new_variant_listings) >= 500:
            ProductVariantChannelListing.objects.bulk_create(new_variant_listings, ignore_conflicts=True)
            new_variant_listings = []

        if len(new_stocks) >= 500:
            Stock.objects.bulk_create(new_stocks, ignore_conflicts=True)
            new_stocks = []

        if len(new_medias) >= 500:
            ProductMedia.objects.bulk_create(new_medias, ignore_conflicts=True)
            new_medias = []

        if idx % 500 == 0 or idx == len(ntca_products):
            elapsed = time.time() - start_time
            print(f"  ⏳ Processed {idx}/{len(ntca_products)} products ({elapsed:.1f}s) | "
                  f"New: {stats['new_products_created']} | Shared Linked: {stats['shared_products_linked']} | "
                  f"Variants Created: {stats['new_variants_created']}")

    # Final flush
    if new_product_listings:
        ProductChannelListing.objects.bulk_create(new_product_listings, ignore_conflicts=True)
    if new_variant_listings:
        ProductVariantChannelListing.objects.bulk_create(new_variant_listings, ignore_conflicts=True)
    if new_stocks:
        Stock.objects.bulk_create(new_stocks, ignore_conflicts=True)
    if new_medias:
        ProductMedia.objects.bulk_create(new_medias, ignore_conflicts=True)

    elapsed_total = time.time() - start_time

    print("\n🎉 ==========================================================")
    print(f"🎉 NTCA Catalog Import Complete in {elapsed_total:.2f}s!")
    print("🎉 ==========================================================")
    print(f"  • Existing US Products Linked to Canada: {stats['shared_products_linked']}")
    print(f"  • Existing US Variants Configured with CAD: {stats['shared_variants_listed']}")
    print(f"  • New Canada-Only Products Created: {stats['new_products_created']}")
    print(f"  • New Canada Variants Created: {stats['new_variants_created']}")
    print(f"  • Warehouse Stock Records Created: {stats['new_stocks_created']}")
    print(f"  • Product Media Records Created: {stats['new_media_created']}")
    print(f"  • Skipped on error: {stats['skipped_products']}")
    print("==========================================================\n")


if __name__ == "__main__":
    run_import()
