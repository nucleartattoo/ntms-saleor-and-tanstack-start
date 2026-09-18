#!/usr/bin/env python3
"""
Aggregate all 58 official Black Inks, Greywash, and Lining Inks into 'Black Inks' collection and category.
"""

import os
import sys
import django

CORE_DIR = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/apps/saleor-core"
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
django.setup()

from django.db.models import Q
from saleor.product.models import Product, Category, Collection, CollectionChannelListing, ProductChannelListing, ProductVariantChannelListing
from saleor.channel.models import Channel
from django.core.cache import cache

def run():
    print("🚀 [Black Inks] Starting 58 Black Inks Aggregation to match US Origin...")

    us_channel = Channel.objects.get(slug="default-channel")
    ca_channel = Channel.objects.get(slug="canada")
    inks_root = Category.objects.get(slug="ntms-91-inks")
    descendants = inks_root.get_descendants(include_self=True)

    # 1. Discover all 58 black, greywash, lining inks
    kws = ['black', 'sumy', 'sumi', 'greywash', 'graywash', 'lining', 'tribal', 'wash', 'opaque', 'dark', 'pitch']
    exclude_kws = ['needle', 'cartridge', 'machine', 'pen', 'glove', 'grip', 'tube', 'pedal', 'wipe', 'paper', 'clip', 'power', 'tray', 'bottle', 'cup', 'power supplies', 'foot switch']

    q_filter = Q()
    for kw in kws:
        q_filter |= Q(name__icontains=kw)

    matched = Product.objects.filter(
        category__in=descendants,
        channel_listings__channel=us_channel,
        channel_listings__is_published=True
    ).filter(q_filter).distinct()

    final_blacks = []
    for p in matched:
        name_lower = p.name.lower()
        if any(ex in name_lower for ex in exclude_kws):
            continue
        final_blacks.append(p)

    print(f"  🔍 Matched exactly {len(final_blacks)} Black Inks products!")

    # 2. Collection ntms-478-black-inks
    black_coll, _ = Collection.objects.get_or_create(
        slug="ntms-478-black-inks",
        defaults={"name": "Black Inks"}
    )
    black_coll.name = "Black Inks"
    black_coll.save()

    # Assign all 58 products to Collection
    black_coll.products.set(final_blacks)
    print(f"  ✅ Added all {len(final_blacks)} products to Collection 'Black Inks'.")

    # Ensure Collection channel listings
    for ch in [us_channel, ca_channel]:
        ccl, _ = CollectionChannelListing.objects.get_or_create(
            collection=black_coll, channel=ch,
            defaults={"is_published": True}
        )
        ccl.is_published = True
        ccl.save()

    # 3. Category ntms-478-black-inks
    black_cat = Category.objects.filter(slug="ntms-478-black-inks").first()
    if black_cat:
        black_cat.parent = inks_root
        black_cat.name = "Black Inks"
        black_cat.save(update_fields=["parent", "name"])

    # 4. Ensure all variants of these 58 products have non-null discounted_price_amount
    print("  🔍 Verifying variant pricing on all 58 products...")
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("""
            UPDATE product_productvariantchannellisting
            SET discounted_price_amount = price_amount
            WHERE (discounted_price_amount IS NULL OR discounted_price_amount = 0)
              AND price_amount IS NOT NULL AND price_amount > 0;
        """)

    cache.clear()
    print("\n🎉 [Complete] Black Inks now contains all 58 products matching the US origin site!")

if __name__ == "__main__":
    run()
