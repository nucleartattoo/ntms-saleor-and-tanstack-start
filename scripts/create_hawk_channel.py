#!/usr/bin/env python3
"""
Create and configure Hawk Tattoo Supply Channel (channel: hawk).
- US Dollar (USD), based in Santa Fe Springs, CA
- Domestic (US) Shipping: Standard Ground ($15) & Free Shipping over $300
- Worldwide Shipping (all non-US countries): Standard International ($45) & Express ($75)
- Tax Configuration (TAX_APP)
- Dedicated Hawk Warehouse + Default Warehouse fallback
"""
import os
import sys

CORE_DIR = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/apps/saleor-core"
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")

import django
django.setup()

from django_countries import countries
from saleor.channel.models import Channel
from saleor.warehouse.models import Warehouse, ChannelWarehouse
from saleor.account.models import Address
from saleor.shipping.models import (
    ShippingZone,
    ShippingMethod,
    ShippingMethodChannelListing,
    ShippingMethodType,
)
from saleor.tax.models import TaxConfiguration

def setup_hawk_channel():
    print("🦅 [Saleor] Setting up Hawk Tattoo Supply Channel (hawk)...")

    # 1. Create or get Channel
    channel, created = Channel.objects.get_or_create(
        slug="hawk",
        defaults={
            "name": "Hawk Tattoo Supply",
            "currency_code": "USD",
            "default_country": "US",
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
        print(f"✅ Created Channel: {channel.name} (slug: '{channel.slug}', currency: '{channel.currency_code}')")
    else:
        print(f"ℹ️ Channel already exists: {channel.name} (slug: '{channel.slug}', currency: '{channel.currency_code}')")

    # 2. Setup Address & Warehouse
    hawk_address, _ = Address.objects.get_or_create(
        company_name="Hawk Tattoo Supply",
        street_address_1="11808 Burke St",
        city="Santa Fe Springs",
        country_area="CA",
        postal_code="90670",
        country="US",
        defaults={"phone": ""}
    )
    hawk_wh, wh_created = Warehouse.objects.get_or_create(
        slug="hawk-warehouse",
        defaults={
            "name": "Hawk Tattoo Supply Warehouse",
            "email": "hawktattoosupply@gmail.com",
            "address": hawk_address,
        }
    )
    if wh_created:
        print(f"✅ Created Warehouse: {hawk_wh.name}")
    else:
        print(f"ℹ️ Warehouse already exists: {hawk_wh.name}")

    # Bind warehouses to Hawk channel
    cw_hawk, _ = ChannelWarehouse.objects.get_or_create(
        channel=channel,
        warehouse=hawk_wh,
        defaults={"sort_order": 1}
    )
    default_wh = Warehouse.objects.filter(slug="default-warehouse").first()
    if default_wh:
        cw_def, _ = ChannelWarehouse.objects.get_or_create(
            channel=channel,
            warehouse=default_wh,
            defaults={"sort_order": 2}
        )
        print("✅ Linked Hawk Warehouse (Priority 1) & Default Warehouse (Priority 2) to Hawk Channel")

    # 3. Setup Shipping Zones
    # A. US Domestic Zone
    domestic_countries = ["US", "PR", "VI"]
    domestic_zone, _ = ShippingZone.objects.get_or_create(
        name="Hawk Domestic Shipping",
        defaults={"countries": domestic_countries}
    )
    domestic_zone.channels.add(channel)
    print(f"✅ Configured Domestic Shipping Zone: '{domestic_zone.name}' (Countries: {domestic_countries})")

    # Domestic Methods
    # 1. Standard Ground
    ground_method, _ = ShippingMethod.objects.get_or_create(
        name="Hawk UPS Standard Ground",
        shipping_zone=domestic_zone,
        type=ShippingMethodType.PRICE_BASED,
    )
    ShippingMethodChannelListing.objects.update_or_create(
        shipping_method=ground_method,
        channel=channel,
        defaults={
            "price_amount": 15.00,
            "currency": "USD",
            "minimum_order_price_amount": 0.00,
        }
    )
    print("  - Added 'Hawk UPS Standard Ground' ($15.00 USD)")

    # 2. Free Shipping over $300
    free_method, _ = ShippingMethod.objects.get_or_create(
        name="Free Shipping on Orders Over $300",
        shipping_zone=domestic_zone,
        type=ShippingMethodType.PRICE_BASED,
    )
    ShippingMethodChannelListing.objects.update_or_create(
        shipping_method=free_method,
        channel=channel,
        defaults={
            "price_amount": 0.00,
            "currency": "USD",
            "minimum_order_price_amount": 300.00,
        }
    )
    print("  - Added 'Free Shipping on Orders Over $300' ($0.00 USD, min $300.00)")

    # B. Worldwide Shipping Zone (Rest of the World)
    intl_countries = [c[0] for c in countries if c[0] not in domestic_countries]
    intl_zone, _ = ShippingZone.objects.get_or_create(
        name="Hawk Worldwide Shipping",
        defaults={"countries": intl_countries}
    )
    intl_zone.channels.add(channel)
    print(f"✅ Configured Worldwide Shipping Zone: '{intl_zone.name}' ({len(intl_countries)} countries)")

    # Link Warehouses to Shipping Zones (Critical for Saleor stock availability in checkouts)
    hawk_wh.shipping_zones.add(domestic_zone, intl_zone)
    if default_wh:
        default_wh.shipping_zones.add(domestic_zone, intl_zone)
    print("✅ Linked Hawk Warehouse and Default Warehouse to shipping zones")

    # Worldwide Methods
    # 1. Standard International
    intl_std_method, _ = ShippingMethod.objects.get_or_create(
        name="Standard International Shipping",
        shipping_zone=intl_zone,
        type=ShippingMethodType.PRICE_BASED,
    )
    ShippingMethodChannelListing.objects.update_or_create(
        shipping_method=intl_std_method,
        channel=channel,
        defaults={
            "price_amount": 45.00,
            "currency": "USD",
            "minimum_order_price_amount": 0.00,
        }
    )
    print("  - Added 'Standard International Shipping' ($45.00 USD)")

    # 2. Express International
    intl_exp_method, _ = ShippingMethod.objects.get_or_create(
        name="Express International Shipping (DHL/UPS)",
        shipping_zone=intl_zone,
        type=ShippingMethodType.PRICE_BASED,
    )
    ShippingMethodChannelListing.objects.update_or_create(
        shipping_method=intl_exp_method,
        channel=channel,
        defaults={
            "price_amount": 75.00,
            "currency": "USD",
            "minimum_order_price_amount": 0.00,
        }
    )
    print("  - Added 'Express International Shipping (DHL/UPS)' ($75.00 USD)")

    # 4. Tax Configuration
    tax_config, _ = TaxConfiguration.objects.get_or_create(
        channel=channel,
        defaults={
            "charge_taxes": True,
            "tax_calculation_strategy": "TAX_APP",
            "prices_entered_with_tax": False,
        }
    )
    print("✅ Configured Tax Configuration (TAX_APP, exclusive tax)")

    print(f"\n🎉 Hawk Channel Setup Complete! ID={channel.id}, Slug='{channel.slug}'")

if __name__ == "__main__":
    setup_hawk_channel()
