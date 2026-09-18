#!/usr/bin/env python3
"""
Reorganize Medical & Shop Supply Categories:
1. Medical (ntms-89-medical):
   - Infection Control & Disinfectants (ntms-med-disinfectants)
   - Aftercare & Ointments (ntms-med-aftercare)
   - Gloves & PPE (ntms-med-gloves)
   - Topical Anesthetics (ntms-med-anesthetics)
   - Sterilization & Autoclave (ntms-med-sterilization)
2. Shop Supply (ntms-113-shop-supply):
   - Stencil Paper & Copiers (ntms-shop-stencils)
   - Tattoo Books & Flash (ntms-shop-books)
   - Studio Furniture & Lighting (ntms-shop-furniture)
   - Body Jewelry & Piercing (ntms-shop-jewelry)
   - Studio Apparel & Gear (ntms-shop-apparel)
3. Clean up empty placeholders and nested redundant categories.
4. Ensure lead images for Apple Subcategory Ribbon.
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

from saleor.product.models import Category, Product, ProductChannelListing, ProductVariantChannelListing, ProductMedia
from saleor.channel.models import Channel
from saleor.warehouse.models import Warehouse, Stock
from django.core.cache import cache

def run():
    print("🚀 [Medical & Shop Supply] Starting Reorganization...")

    us_channel = Channel.objects.get(slug="default-channel")
    ca_channel = Channel.objects.get(slug="canada")
    ca_wh = Warehouse.objects.get(slug="canada-warehouse")
    CAD_RATE = Decimal("1.37")

    # =========================================================================
    # 1. MEDICAL CATEGORY
    # =========================================================================
    med_root = Category.objects.get(slug="ntms-89-medical")
    med_defs = [
        {"slug": "ntms-med-disinfectants", "name": "Infection Control", "kw": ["disinfect", "cavicide", "madacide", "soap", "alcohol", "sharps", "cleanse", "hazmat"]},
        {"slug": "ntms-med-aftercare", "name": "Aftercare & Ointments", "kw": ["ointment", "aftercare", "bandage", "gauze", "tegaderm", "hustle", "a&d", "butter"]},
        {"slug": "ntms-med-gloves", "name": "Gloves & PPE", "kw": ["glove", "mask", "protection", "bib", "barrier", "sleeve", "shield", "ppe"]},
        {"slug": "ntms-med-anesthetics", "name": "Topical Anesthetics", "kw": ["anesthetic", "numb", "bactine", "vasocaine", "lidocaine", "soothing"]},
        {"slug": "ntms-med-sterilization", "name": "Sterilization", "kw": ["steril", "autoclave", "pouch", "indicator", "tape", "tray"]},
    ]

    med_subcats = {}
    print("\n📦 [1/4] Configuring Medical Subcategories...")
    for item in med_defs:
        cat, _ = Category.objects.get_or_create(
            slug=item["slug"],
            defaults={"name": item["name"], "parent": med_root}
        )
        if cat.parent_id != med_root.id:
            cat.parent = med_root
            cat.name = item["name"]
            cat.save(update_fields=["parent", "name"])
        med_subcats[item["slug"]] = (cat, item["kw"])

    # Map Medical products
    for p in Product.objects.filter(category__in=med_root.get_descendants(include_self=True)).distinct():
        p_text = f"{p.name} {p.slug} {p.category.name if p.category else ''}".lower()
        for slug, (cat, kws) in med_subcats.items():
            if any(kw in p_text for kw in kws):
                p.category = cat
                p.save(update_fields=["category"])
                break

    # Clean old empty categories under Medical
    for c in med_root.children.all():
        if c.slug not in med_subcats and c.products.count() == 0 and c.children.count() == 0:
            c.delete()

    # =========================================================================
    # 2. SHOP SUPPLY CATEGORY
    # =========================================================================
    shop_root = Category.objects.get(slug="ntms-113-shop-supply")
    shop_defs = [
        {"slug": "ntms-shop-stencils", "name": "Stencil Paper & Copiers", "kw": ["stencil", "thermal", "copier", "printer", "carbon", "paper", "reprofx", "spirit"]},
        {"slug": "ntms-shop-books", "name": "Tattoo Books & Flash", "kw": ["book", "dvd", "flash", "design", "reference", "sketch", "collection", "oriental", "dragon"]},
        {"slug": "ntms-shop-furniture", "name": "Studio Furniture & Lights", "kw": ["chair", "arm rest", "armrest", "workstation", "light", "lamp", "led", "table", "stand"]},
        {"slug": "ntms-shop-jewelry", "name": "Body Jewelry", "kw": ["jewelry", "ring", "barbell", "piercing jewelry", "stud", "bead"]},
        {"slug": "ntms-shop-apparel", "name": "Studio Apparel & Gear", "kw": ["apron", "clothing", "label", "shirt", "gear", "banner", "sticker"]},
    ]

    shop_subcats = {}
    print("\n📦 [2/4] Configuring Shop Supply Subcategories...")
    for item in shop_defs:
        cat, _ = Category.objects.get_or_create(
            slug=item["slug"],
            defaults={"name": item["name"], "parent": shop_root}
        )
        if cat.parent_id != shop_root.id:
            cat.parent = shop_root
            cat.name = item["name"]
            cat.save(update_fields=["parent", "name"])
        shop_subcats[item["slug"]] = (cat, item["kw"])

    # Map Shop Supply products
    for p in Product.objects.filter(category__in=shop_root.get_descendants(include_self=True)).distinct():
        p_text = f"{p.name} {p.slug} {p.category.name if p.category else ''}".lower()
        for slug, (cat, kws) in shop_subcats.items():
            if any(kw in p_text for kw in kws):
                p.category = cat
                p.save(update_fields=["category"])
                break

    # Clean old empty categories under Shop Supply
    for c in shop_root.children.all():
        if c.slug not in shop_subcats and c.products.count() == 0 and c.children.count() == 0:
            c.delete()

    # =========================================================================
    # 3. VERIFY LEAD IMAGES FOR RIBBON
    # =========================================================================
    print("\n📸 [3/4] Verifying Lead Images in Ribbon for Medical & Shop Supply...")
    for root in [med_root, shop_root]:
        for c in root.children.all():
            lead_p = c.products.filter(media__isnull=False).first()
            print(f"  • {c.name:<30} ({c.products.count()} prods) | Lead: {lead_p.name if lead_p else 'None'}")

    # =========================================================================
    # 4. DUAL-CHANNEL PRICING & STOCK
    # =========================================================================
    print("\n💰 [4/4] Verifying Dual-Channel Pricing & Stock...")
    new_ca_vcls = []
    new_ca_stocks = []

    combined_prods = Product.objects.filter(
        category__in=list(med_root.get_descendants(include_self=True)) + list(shop_root.get_descendants(include_self=True)),
        channel_listings__channel=us_channel,
        channel_listings__is_published=True
    ).distinct()

    for p in combined_prods:
        us_pcl = p.channel_listings.filter(channel=us_channel).first()
        p_price = us_pcl.discounted_price_amount or Decimal("20.00")
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
        print(f"  ✅ Created {len(new_ca_vcls)} Canada variant listings")
    if new_ca_stocks:
        Stock.objects.bulk_create(new_ca_stocks, ignore_conflicts=True)
        print(f"  ✅ Created {len(new_ca_stocks)} Canada stock records")

    cache.clear()
    print("\n🎉 [Complete] Medical & Shop Supply Reorganization Finished!")

if __name__ == "__main__":
    run()
