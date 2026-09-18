#!/usr/bin/env python3
"""
Reorganize Tubes & Grips Category:
1. Organize into 5 clean standard subcategories:
   - Disposable Tubes & Grips (ntms-grips-disposable)
   - Stainless Steel Tubes & Grips (ntms-grips-stainless)
   - Cartridge Click Grips (ntms-grips-cartridge-click)
   - Memory Foam & Grip Covers (ntms-grips-foam-covers)
   - Grip Accessories & Cleaning (ntms-grips-accessories)
2. Clean up empty placeholders and nested sub-subcategories.
3. Assign lead representative images for each subcategory in the Apple Ribbon.
4. Ensure dual-channel (USD & CAD) pricing and stock.
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

from saleor.product.models import Category, Product, ProductChannelListing, ProductVariantChannelListing, ProductMedia
from saleor.channel.models import Channel
from saleor.warehouse.models import Warehouse, Stock
from django.core.cache import cache

def run():
    print("🚀 [Tubes & Grips] Starting Category Reorganization...")

    tubes_root = Category.objects.get(slug="ntms-107-tubes-and-grips")
    us_channel = Channel.objects.get(slug="default-channel")
    ca_channel = Channel.objects.get(slug="canada")
    ca_wh = Warehouse.objects.get(slug="canada-warehouse")

    # 1. Standard 5 Subcategories Definition
    subcat_defs = [
        {"slug": "ntms-grips-disposable", "name": "Disposable Tubes & Grips", "kw": ["disposable", "silicone disposable", "pen grip", "plastic tube"]},
        {"slug": "ntms-grips-stainless", "name": "Stainless Tubes & Grips", "kw": ["stainless", "steel", "304", "316", "metal tip", "handle"]},
        {"slug": "ntms-grips-cartridge-click", "name": "Cartridge Click Grips", "kw": ["cartridge grip", "click", "ergo", "adjustable grip"]},
        {"slug": "ntms-grips-foam-covers", "name": "Memory Foam & Covers", "kw": ["foam", "cover", "wrap", "memory foam", "true tube"]},
        {"slug": "ntms-grips-accessories", "name": "Grip Accessories & Parts", "kw": ["brush", "cleaning", "plunger", "screw", "accessory", "accessories", "stem"]},
    ]

    subcats = {}
    print("\n📦 [1/4] Ensuring standard direct subcategories under Tubes & Grips...")
    for item in subcat_defs:
        cat, _ = Category.objects.get_or_create(
            slug=item["slug"],
            defaults={"name": item["name"], "parent": tubes_root}
        )
        if cat.parent_id != tubes_root.id:
            cat.parent = tubes_root
            cat.name = item["name"]
            cat.save(update_fields=["parent", "name"])
        subcats[item["slug"]] = (cat, item["kw"])
        print(f"  ✅ Subcategory '{cat.name}' ready (slug={cat.slug})")

    # 2. Map all products in Tubes & Grips hierarchy
    all_prods = Product.objects.filter(
        category__in=tubes_root.get_descendants(include_self=True)
    ).distinct()
    print(f"\n📦 [2/4] Mapping {all_prods.count()} products into standard subcategories...")

    for p in all_prods:
        p_text = f"{p.name} {p.slug} {p.category.name if p.category else ''}".lower()
        matched = False
        for slug, (cat, kws) in subcats.items():
            if any(kw in p_text for kw in kws):
                p.category = cat
                p.save(update_fields=["category"])
                matched = True
                break
        if not matched:
            if "foam" in p_text or "cover" in p_text:
                p.category = subcats["ntms-grips-foam-covers"][0]
            elif "stainless" in p_text or "steel" in p_text or "tip" in p_text:
                p.category = subcats["ntms-grips-stainless"][0]
            else:
                p.category = subcats["ntms-grips-disposable"][0]
            p.save(update_fields=["category"])

    # 3. Clean up empty old subcategories
    print("\n🧹 [3/4] Cleaning up old empty subcategories...")
    for c in tubes_root.children.all():
        if c.slug not in subcats and c.products.count() == 0 and c.children.count() == 0:
            c.delete()
            print(f"  🗑️ Deleted empty category: {c.slug}")

    # 4. Ensure lead images for each of the 5 subcategories
    print("\n📸 [4/4] Verifying lead images for each subcategory in ribbon...")
    for slug, (cat, _) in subcats.items():
        prods = cat.products.filter(channel_listings__channel=us_channel, channel_listings__is_published=True)
        lead_p = prods.filter(media__isnull=False).first()
        print(f"  • Subcategory '{cat.name}': {prods.count()} products | Lead: {lead_p.name if lead_p else 'None'}")

    # 5. Ensure dual-channel pricing and stock
    CAD_RATE = Decimal("1.37")
    new_ca_vcls = []
    new_ca_stocks = []

    for p in Product.objects.filter(category__in=tubes_root.get_descendants(include_self=True), channel_listings__channel=us_channel, channel_listings__is_published=True).distinct():
        us_pcl = p.channel_listings.filter(channel=us_channel).first()
        p_price = us_pcl.discounted_price_amount or Decimal("22.00")
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
                    variant=v, channel=us_channel, currency="USD", price_amount=p_price, discounted_price_amount=p_price, cost_price_amount=round(p_price * Decimal("0.5"), 2)
                )
            vcl_ca = ProductVariantChannelListing.objects.filter(variant=v, channel=ca_channel).first()
            if not vcl_ca:
                new_ca_vcls.append(
                    ProductVariantChannelListing(
                        variant=v, channel=ca_channel, currency="CAD", price_amount=ca_price, discounted_price_amount=ca_price, cost_price_amount=round(ca_price * Decimal("0.5"), 2)
                    )
                )
            stk_ca = Stock.objects.filter(product_variant=v, warehouse=ca_wh).first()
            if not stk_ca:
                new_ca_stocks.append(
                    Stock(product_variant=v, warehouse=ca_wh, quantity=100, quantity_allocated=0)
                )

    if new_ca_vcls:
        ProductVariantChannelListing.objects.bulk_create(new_ca_vcls, ignore_conflicts=True)
        print(f"  ✅ Created {len(new_ca_vcls)} Canada variant listings for Tubes & Grips")
    if new_ca_stocks:
        Stock.objects.bulk_create(new_ca_stocks, ignore_conflicts=True)
        print(f"  ✅ Created {len(new_ca_stocks)} Canada stock records for Tubes & Grips")

    cache.clear()
    print("\n🎉 [Complete] Tubes & Grips Reorganization Finished!")

if __name__ == "__main__":
    run()
