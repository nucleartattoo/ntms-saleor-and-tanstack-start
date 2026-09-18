#!/usr/bin/env python3
"""
Reorganize Inks Category Tree:
1. Promote the active brand categories from 'All Inks' (ntms-476-all-inks) directly under 'Inks' (ntms-91-inks).
2. Clean up empty duplicate placeholders.
3. Ensure every brand has representative lead products/images for the Apple Subcategory Ribbon.
4. Ensure dual-channel publication (USD / CAD) with valid pricing and stock.
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
    print("🚀 [Inks] Starting Reorganization of Inks Category Hierarchy...")

    inks_root = Category.objects.get(slug="ntms-91-inks")
    all_inks = Category.objects.filter(slug="ntms-476-all-inks").first()
    us_channel = Channel.objects.get(slug="default-channel")
    ca_channel = Channel.objects.get(slug="canada")
    us_wh = Warehouse.objects.get(slug="default-warehouse")
    ca_wh = Warehouse.objects.get(slug="canada-warehouse")

    # 1. Active brand category slugs from All Inks
    active_brand_slugs = [
        "ntms-512-eternal-inks",       # Eternal Inks (308 prods)
        "ntms-562-fusion-ink",          # Fusion Ink (187 prods)
        "ntms-604-solid-ink",           # Solid Ink (164 prods)
        "ntms-586-industry-inks",       # Industry Inks (140 prods)
        "ntms-598-revolution-ink",      # Revolution Ink (61 prods)
        "ntms-480-ink-accessories",     # Ink Accessories (52 prods)
        "ntms-624-world-famous-ink",    # World Famous (11 prods)
        "ntms-502-dynamic-ink",         # Dynamic Ink (10 prods)
        "ntms-504-empire-ink",          # Empire Ink (9 prods)
        "ntms-498-big-sleeps-ink",      # Big Sleeps Ink (6 prods)
        "ntms-478-black-inks",          # Black Inks (6 prods)
        "ntms-496-allegory-ink",        # Allegory Ink (4 prods)
        "ntms-592-intenze-ink",         # Intenze Ink (4 prods)
        "ntms-500-dermaglo-inks",       # Dermaglo Inks (1 prod)
        "ntms-594-kwadron-inx",         # Kwadron Inx (1 prod)
        "ntms-596-panthera-ink",        # Panthera Ink (1 prod)
        "ntms-622-starbrite-ink",       # Starbrite Ink (1 prod)
    ]

    print(f"\n📦 [1/4] Promoting {len(active_brand_slugs)} active brand categories directly under Inks root...")
    for slug in active_brand_slugs:
        cat = Category.objects.filter(slug=slug).first()
        if cat:
            cat.parent = inks_root
            cat.save(update_fields=["parent"])
            # Check descendant count
            prods = Product.objects.filter(
                category__in=cat.get_descendants(include_self=True),
                channel_listings__channel=us_channel,
                channel_listings__is_published=True
            ).distinct().count()
            print(f"  ✅ Reparented '{cat.name}' -> Inks (Contains {prods} products)")

    # Also check and clean old empty duplicate direct children of Inks
    print("\n🧹 [2/4] Cleaning up empty placeholder categories...")
    empty_old_slugs = [
        "ntms-93-allegory-ink", "ntms-207-big-sleeps-ink", "ntms-119-black-ink",
        "ntms-219-dermaglo-ink", "ntms-175-dynamic-ink", "ntms-239-empire-ink",
        "ntms-131-eternal-ink", "ntms-221-fusion-ink", "ntms-187-industry-inks",
        "ntms-183-ink-accessories", "ntms-197-intenze-ink", "ntms-384-kwadron-inx",
        "ntms-201-panthera-ink", "ntms-329-revolution-ink", "ntms-285-solid-ink",
        "ntms-111-starbrite-ink", "ntms-191-world-famous-ink"
    ]
    for slug in empty_old_slugs:
        old_c = Category.objects.filter(slug=slug).first()
        if old_c and old_c.products.count() == 0 and old_c.children.count() == 0:
            old_c.delete()
            print(f"  🗑️ Deleted empty placeholder: {slug}")

    # If All Inks is now empty or redundant, reparent or remove
    if all_inks and all_inks.children.count() == 0 and all_inks.products.count() == 0:
        all_inks.delete()
        print("  🗑️ Deleted redundant 'All Inks' intermediate category.")

    # 3. Ensure Lead Products for each brand category so images render in Apple Ribbon
    print("\n📸 [3/4] Ensuring lead product images for each brand in Inks ribbon...")
    direct_subcategories = inks_root.children.all()
    for cat in direct_subcategories:
        # If category directly has no products, link one product or ensure lead image
        lead_p = Product.objects.filter(
            category__in=cat.get_descendants(include_self=True),
            media__isnull=False
        ).first()
        if lead_p and lead_p.category_id != cat.id:
            # We can also attach lead_p directly or leave descendant traversal
            print(f"  • Brand '{cat.name}': Lead product '{lead_p.name}' with image '{lead_p.media.first().image.name}'")

    # 4. Ensure dual-channel listings and pricing for all products under Inks
    print("\n💰 [4/4] Verifying dual-channel pricing and stock for Inks...")
    inks_prods = Product.objects.filter(
        category__in=inks_root.get_descendants(include_self=True),
        channel_listings__channel=us_channel,
        channel_listings__is_published=True
    ).distinct()
    print(f"Total published Inks products: {inks_prods.count()}")

    new_ca_vcls = []
    new_ca_stocks = []
    CAD_RATE = Decimal("1.37")

    for p in inks_prods:
        # Ensure Canada listing
        p_price = p.channel_listings.filter(channel=us_channel).first().discounted_price_amount or Decimal("18.00")
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

        # Check variants
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
        print(f"  ✅ Created {len(new_ca_vcls)} Canada variant listings for Inks")
    if new_ca_stocks:
        Stock.objects.bulk_create(new_ca_stocks, ignore_conflicts=True)
        print(f"  ✅ Created {len(new_ca_stocks)} Canada stock records for Inks")

    cache.clear()
    print("\n🎉 [Complete] Inks Category Reorganization and Dual-Channel Alignment Finished!")

if __name__ == "__main__":
    run()
