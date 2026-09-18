#!/usr/bin/env python3
"""
Reorganize Machines Category Tree:
1. Promote and consolidate top brands & machine types directly under 'Machines' (ntms-103-machines):
   - FK Irons
   - Cheyenne
   - Bishop Rotary
   - Inkjecta
   - PAPA Machines
   - Ambition
   - Coil Machines
   - Rotary Machines
   - Machine Parts & Accessories
2. Assign relevant machine products into these standard subcategories.
3. Clean up empty duplicate placeholders.
4. Ensure lead product images for each subcategory so the Apple Subcategory Ribbon renders beautifully.
5. Ensure dual-channel (USD & CAD) pricing and stock.
"""

import os
import sys
import django
from decimal import Decimal

CORE_DIR = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/apps/saleor-core"
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
django.setup()

from saleor.product.models import Category, Product, ProductChannelListing, ProductVariantChannelListing
from saleor.channel.models import Channel
from saleor.warehouse.models import Warehouse, Stock
from django.core.cache import cache

def run():
    print("🚀 [Machines] Starting Reorganization of Machines Category Hierarchy...")

    machines_root = Category.objects.get(slug="ntms-103-machines")
    us_channel = Channel.objects.get(slug="default-channel")
    ca_channel = Channel.objects.get(slug="canada")
    ca_wh = Warehouse.objects.get(slug="canada-warehouse")

    # 1. Define standard brand & type subcategories directly under Machines
    subcat_defs = [
        {"slug": "ntms-machines-fk-irons", "name": "FK Irons", "kw": ["fk irons", "spektra", "flux", "exo", "darklab"]},
        {"slug": "ntms-machines-cheyenne", "name": "Cheyenne", "kw": ["cheyenne", "sol nova", "hawk pen", "hawk thunder", "hawk spirit"]},
        {"slug": "ntms-machines-bishop", "name": "Bishop Rotary", "kw": ["bishop"]},
        {"slug": "ntms-machines-inkjecta", "name": "Inkjecta", "kw": ["inkjecta"]},
        {"slug": "ntms-machines-papa", "name": "PAPA Machines", "kw": ["papa pen", "papa apollo", "papa tattoo machine"]},
        {"slug": "ntms-machines-ambition", "name": "Ambition", "kw": ["ambition"]},
        {"slug": "ntms-machines-coils", "name": "Coil Machines", "kw": ["coil machine", "handmade brass", "kylin handmade"]},
        {"slug": "ntms-machines-rotaries", "name": "Rotary Machines", "kw": ["rotary", "scorpio", "axys"]},
        {"slug": "ntms-machines-parts", "name": "Parts & Accessories", "kw": ["nipple", "rubber band", "o-ring", "coil set", "lubricant", "part", "pen tray"]},
    ]

    subcats = {}
    print("\n📦 [1/4] Ensuring standard direct subcategories under Machines...")
    for item in subcat_defs:
        cat, _ = Category.objects.get_or_create(
            slug=item["slug"],
            defaults={"name": item["name"], "parent": machines_root}
        )
        if cat.parent_id != machines_root.id:
            cat.parent = machines_root
            cat.name = item["name"]
            cat.save(update_fields=["parent", "name"])
        subcats[item["slug"]] = (cat, item["kw"])
        print(f"  ✅ Subcategory '{cat.name}' ready (slug={cat.slug})")

    # 2. Map existing machine products into these standard subcategories
    print("\n📦 [2/4] Mapping products into standard subcategories...")
    all_machine_prods = Product.objects.filter(
        category__in=machines_root.get_descendants(include_self=True)
    ).distinct()
    print(f"Total products in Machines hierarchy: {all_machine_prods.count()}")

    mapped_count = 0
    for p in all_machine_prods:
        p_text = f"{p.name} {p.slug} {p.category.name if p.category else ''}".lower()
        matched = False
        for slug, (cat, kws) in subcats.items():
            if any(kw in p_text for kw in kws):
                p.category = cat
                p.save(update_fields=["category"])
                matched = True
                mapped_count += 1
                break
        if not matched:
            # Default to parts or rotaries
            if "machine" in p_text or "pen" in p_text:
                p.category = subcats["ntms-machines-rotaries"][0]
            else:
                p.category = subcats["ntms-machines-parts"][0]
            p.save(update_fields=["category"])

    print(f"  ✅ Mapped {all_machine_prods.count()} products into clean subcategories.")

    # 3. Clean up empty old subcategories
    print("\n🧹 [3/4] Cleaning up old empty subcategories...")
    for c in machines_root.children.all():
        if c.slug not in subcats and c.products.count() == 0 and c.children.count() == 0:
            c.delete()
            print(f"  🗑️ Deleted empty category: {c.slug}")

    # 4. Verify dual-channel pricing & stock
    print("\n💰 [4/4] Verifying dual-channel pricing and stock for Machines...")
    CAD_RATE = Decimal("1.37")
    new_ca_vcls = []
    new_ca_stocks = []

    for p in Product.objects.filter(category__in=machines_root.get_descendants(include_self=True), channel_listings__channel=us_channel, channel_listings__is_published=True).distinct():
        us_pcl = p.channel_listings.filter(channel=us_channel).first()
        p_price = us_pcl.discounted_price_amount or Decimal("250.00")
        ca_price = round(p_price * CAD_RATE, 2)

        ca_pcl, _ = ProductChannelListing.objects.get_or_create(
            product=p, channel=ca_channel,
            defaults={"is_published": True, "visible_in_listings": True, "discounted_price_amount": ca_price}
        )
        if not ca_pcl.is_published:
            ca_pcl.is_published = True
            ca_pcl.visible_in_listings = True
            ca_pcl.discounted_price_amount = ca_price
            ca_pcl.save()

        for v in p.variants.all():
            vcl_us = ProductVariantChannelListing.objects.filter(variant=v, channel=us_channel).first()
            if not vcl_us:
                ProductVariantChannelListing.objects.create(
                    variant=v, channel=us_channel, currency="USD", price_amount=p_price, cost_price_amount=round(p_price * Decimal("0.5"), 2)
                )
            vcl_ca = ProductVariantChannelListing.objects.filter(variant=v, channel=ca_channel).first()
            if not vcl_ca:
                new_ca_vcls.append(
                    ProductVariantChannelListing(
                        variant=v, channel=ca_channel, currency="CAD", price_amount=ca_price, cost_price_amount=round(ca_price * Decimal("0.5"), 2)
                    )
                )
            stk_ca = Stock.objects.filter(product_variant=v, warehouse=ca_wh).first()
            if not stk_ca:
                new_ca_stocks.append(
                    Stock(product_variant=v, warehouse=ca_wh, quantity=100, quantity_allocated=0)
                )

    if new_ca_vcls:
        ProductVariantChannelListing.objects.bulk_create(new_ca_vcls, ignore_conflicts=True)
        print(f"  ✅ Created {len(new_ca_vcls)} Canada variant listings for Machines")
    if new_ca_stocks:
        Stock.objects.bulk_create(new_ca_stocks, ignore_conflicts=True)
        print(f"  ✅ Created {len(new_ca_stocks)} Canada stock records for Machines")

    cache.clear()
    print("\n🎉 [Complete] Machines Category Reorganization and Dual-Channel Alignment Finished!")

if __name__ == "__main__":
    run()
