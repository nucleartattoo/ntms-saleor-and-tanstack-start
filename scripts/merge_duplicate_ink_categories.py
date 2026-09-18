#!/usr/bin/env python3
"""
Merge duplicate categories in Inks:
1. Merge 'Black Ink' (ntms-119-black-ink) into 'Black Inks' (ntms-478-black-inks).
2. Merge 'Ink Accessories' (ntms-183-ink-accessories) into 'Ink Accessories' (ntms-480-ink-accessories).
3. Clean up any remaining empty duplicate nodes under Inks root.
"""

import os
import sys
import django

CORE_DIR = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/apps/saleor-core"
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
django.setup()

from saleor.product.models import Category, Product
from django.core.cache import cache

def run():
    print("🚀 [Inks Deduplication] Starting category deduplication and product re-linking...")

    # 1. Merge Black Ink (31) -> Black Inks (145)
    c1_black = Category.objects.filter(slug="ntms-119-black-ink").first()
    c2_blacks = Category.objects.filter(slug="ntms-478-black-inks").first()

    if c1_black and c2_blacks:
        p_count = Product.objects.filter(category=c1_black).update(category=c2_blacks)
        print(f"  ✅ Re-linked {p_count} products from 'Black Ink' -> 'Black Inks'")
        c1_black.delete()
        print("  🗑️ Deleted redundant 'Black Ink' category.")

    # 2. Merge Ink Accessories (75) -> Ink Accessories (212)
    acc1 = Category.objects.filter(slug="ntms-183-ink-accessories").first()
    acc2 = Category.objects.filter(slug="ntms-480-ink-accessories").first()

    if acc1 and acc2:
        p_count = Product.objects.filter(category=acc1).update(category=acc2)
        print(f"  ✅ Re-linked {p_count} products from 'ntms-183-ink-accessories' -> 'ntms-480-ink-accessories'")
        acc1.delete()
        print("  🗑️ Deleted redundant 'ntms-183-ink-accessories' category.")

    # 3. Check for any remaining duplicates under Inks root
    inks_root = Category.objects.get(slug="ntms-91-inks")
    children = inks_root.children.all()
    seen_names = {}
    for c in children:
        clean_name = c.name.strip().lower()
        if clean_name in seen_names:
            prev = seen_names[clean_name]
            print(f"  ⚠️ Detected duplicate child under Inks: '{c.name}' (id={c.id}) vs (id={prev.id})")
            # Move products to previous and delete current
            Product.objects.filter(category=c).update(category=prev)
            c.delete()
            print(f"  ✅ Merged and deleted duplicate '{c.name}'.")
        else:
            seen_names[clean_name] = c

    cache.clear()
    print("\n🎉 Deduplication completed successfully! Current Inks subcategories:")
    for c in inks_root.children.all():
        print(f"  • {c.name:<25} (slug={c.slug:<30}) | Products: {c.products.count()}")

if __name__ == "__main__":
    run()
