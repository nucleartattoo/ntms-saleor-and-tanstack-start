#!/usr/bin/env python3
import os
import sys
import django

# Setup Django environment
CORE_DIR = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/apps/saleor-core"
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
django.setup()

from saleor.channel.models import Channel
from saleor.warehouse.models import Warehouse, ChannelWarehouse
from saleor.shipping.models import ShippingZone, ShippingMethod, ShippingMethodChannelListing
from saleor.tax.models import TaxConfiguration
from prices import Money

def setup_canada_channel():
    print("🇨🇦 [Saleor] Setting up Canada Channel...")

    channel, created = Channel.objects.get_or_create(
        slug="canada",
        defaults={
            "name": "Nuclear Tattoo Canada",
            "currency_code": "CAD",
            "default_country": "CA",
            "is_active": True,
            "allocation_strategy": "prioritize-sorting-order",
            "order_mark_as_paid_strategy": "payment_flow",
            "default_transaction_flow_strategy": "charge",
            "automatically_confirm_all_new_orders": True,
            "allow_unpaid_orders": False,
            "automatically_fulfill_non_shippable_gift_card": True,
        }
    )
    if created:
        print(f"✅ Created Channel: {channel.name} (slug: {channel.slug}, currency: {channel.currency_code})")
    else:
        print(f"ℹ️ Channel already exists: {channel.name} (slug: {channel.slug}, currency: {channel.currency_code})")

    # 1. Bind default warehouse
    default_wh = Warehouse.objects.first()
    if default_wh:
        cw, cw_created = ChannelWarehouse.objects.get_or_create(
            channel=channel,
            warehouse=default_wh,
            defaults={"sort_order": 1}
        )
        if cw_created:
            print(f"✅ Linked Warehouse '{default_wh.name}' to Canada channel")
        else:
            print(f"ℹ️ Warehouse '{default_wh.name}' already linked to Canada channel")

    # 2. Bind shipping zone & methods
    canada_zone = ShippingZone.objects.filter(countries__contains="CA").first()
    if canada_zone:
        canada_zone.channels.add(channel)
        print(f"✅ Linked Shipping Zone '{canada_zone.name}' to Canada channel")

        for method in canada_zone.shipping_methods.all():
            smcl, smcl_created = ShippingMethodChannelListing.objects.get_or_create(
                shipping_method=method,
                channel=channel,
                defaults={
                    "price_amount": 25.00,
                    "currency": "CAD",
                    "minimum_order_price_amount": 0.00,
                }
            )
            if smcl_created:
                print(f"✅ Configured shipping method '{method.name}' in CAD: $25.00 CAD")
            else:
                print(f"ℹ️ Shipping method '{method.name}' already configured for Canada channel")

    # 3. Setup Tax Configuration
    tax_config, tc_created = TaxConfiguration.objects.get_or_create(
        channel=channel,
        defaults={
            "charge_taxes": True,
            "tax_calculation_strategy": "TAX_APP",
            "prices_entered_with_tax": False,
        }
    )
    if tc_created:
        print(f"✅ Configured tax configuration for Canada channel")
    else:
        print(f"ℹ️ Tax configuration already exists for Canada channel")

    print("\n🎉 Canada channel setup complete!")
    print(f"Channel ID: {channel.pk}, Slug: '{channel.slug}', Currency: '{channel.currency_code}'")

if __name__ == "__main__":
    setup_canada_channel()
