#!/usr/bin/env python3
"""
1. Fix Needle Subcategories: assign the 12 master products to their proper subcategories under Needles.
2. Fix ProductMedia: assign real existing local image files to the 12 master products so thumbnails load with 200 OK.
"""

import os
import sys
import django

CORE_DIR = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/apps/saleor-core"
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
django.setup()

from saleor.product.models import Product, Category, ProductMedia
from saleor.channel.models import Channel
from django.core.cache import cache

def run():
    print("🚀 [Fix] Assigning 12 Master Products to Subcategories & Linking Local High-Res Images...")

    needles_root = Category.objects.get(slug="ntms-289-needles")

    # 1. Subcategories mapping
    subcat_defs = {
        "cheyenne": {"slug": "ntms-418-cheyenne-cartridges", "name": "Cheyenne Cartridges"},
        "kwadron": {"slug": "ntms-420-kwadron-tattoo-cartridges", "name": "Kwadron Cartridges"},
        "papa": {"slug": "ntms-422-papa-tattoo-cartridge-needles", "name": "Papa Cartridges"},
        "nuclear": {"slug": "ntms-291-nuclear-tattoo-needles", "name": "Nuclear Tattoo Needles"},
        "piercing": {"slug": "ntms-315-piercing-needles", "name": "Piercing Needles"},
        "taneco": {"slug": "ntms-taneco-cartridges", "name": "Taneco Cartridges"},
    }

    subcats = {}
    for key, spec in subcat_defs.items():
        cat, _ = Category.objects.get_or_create(
            slug=spec["slug"],
            defaults={"name": spec["name"], "parent": needles_root}
        )
        if cat.parent_id != needles_root.id:
            cat.parent = needles_root
            cat.name = spec["name"]
            cat.save(update_fields=["parent", "name"])
        subcats[key] = cat

    print("  ✅ Subcategories ready and parented to Needles.")

    # 2. Assign products to subcategories
    product_category_map = {
        "ntms-cheyenne-craft-cartridge-needle-20pcsbox": "cheyenne",
        "ntms-cheyenne-capillary-cartridge-needle": "cheyenne",
        "ntms-cheyenne-hawk-safety-cartridge-needle-20pcsbox": "cheyenne",
        "ntms-kwadron-cartridge": "kwadron",
        "ntms-papa-cartridges": "papa",
        "ntms-papa-premium-cartridge": "papa",
        "ntms-nuclear-tattoo-needle-bar-standard": "nuclear",
        "ntms-nuclear-tattoo-needle-bar-short-taper": "nuclear",
        "ntms-nuclear-tattoo-needle-bar-extra-long-taper": "nuclear",
        "ntms-piercing-needles-100pcsbox": "piercing",
        "ntms-cannula-catheter-piercing-needle": "piercing",
        "ntms-taneco-inc-cartridge": "taneco",
    }

    for p_slug, cat_key in product_category_map.items():
        p = Product.objects.filter(slug=p_slug).first()
        if p:
            p.category = subcats[cat_key]
            p.save(update_fields=["category"])
            print(f"  • Mapped {p.name} -> {subcats[cat_key].name}")

    # 3. Media mapping to REAL files on disk in media/products/
    MEDIA_DIR = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/apps/saleor-core/media/products"

    # Specific proven existing files in media/products/
    product_images_map = {
        "ntms-cheyenne-craft-cartridge-needle-20pcsbox": "cheyennehawk10th_adc8aa62.jpg",
        "ntms-cheyenne-capillary-cartridge-needle": "cheyenne_fixed-grip_web_318abe56.jpg",
        "ntms-cheyenne-hawk-safety-cartridge-needle-20pcsbox": "cheyenne_hawk_anthracite_acc1_1_92c9f3bc.jpg",
        "ntms-kwadron-cartridge": "kwadron_cartridge_1_13_1_695157e0.jpg",
        "ntms-papa-cartridges": "papa_cartridges7_22_66c9ea98.jpg",
        "ntms-papa-premium-cartridge": "new_premium-1_13_cbf120aa.jpg",
        "ntms-nuclear-tattoo-needle-bar-standard": "regular_tight_1205rl_4_tattoo_needles_nuclear_tattoo_su_ca42f6e1.jpg",
        "ntms-nuclear-tattoo-needle-bar-short-taper": "short_taper_1225mc_-_2_4_tattoo_needles_nuclear_tattoo__bfc42ec4.jpg",
        "ntms-nuclear-tattoo-needle-bar-extra-long-taper": "long_taper_1215mc_-_1_4_tattoo_needles_nuclear_tattoo_s_c640d9dc.jpg",
        "ntms-piercing-needles-100pcsbox": "piercing_needle_receiving_tube_9cacdbcb.png",
        "ntms-cannula-catheter-piercing-needle": "piercingneedlesreceiving2_7575939a.png",
        "ntms-taneco-inc-cartridge": "papa_foot_pedal_f15b565a.jpg",
    }

    print("\n📸 [Media] Linking proven physical local image files to master products...")
    for p_slug, img_filename in product_images_map.items():
        p = Product.objects.filter(slug=p_slug).first()
        if not p:
            continue

        full_img_path = os.path.join(MEDIA_DIR, img_filename)
        if not os.path.exists(full_img_path):
            print(f"  ⚠️ Warning: {img_filename} not found on disk, skipping.")
            continue

        rel_path = f"products/{img_filename}"
        # Set primary media
        p.media.all().delete()
        ProductMedia.objects.create(
            product=p,
            image=rel_path,
            alt=p.name,
            type="IMAGE",
            sort_order=0
        )
        print(f"  ✅ Linked real image for {p.name}: {rel_path} (File size: {os.path.getsize(full_img_path)} bytes)")

    cache.clear()
    print("\n🎉 Subcategories and media successfully updated!")

if __name__ == "__main__":
    run()
