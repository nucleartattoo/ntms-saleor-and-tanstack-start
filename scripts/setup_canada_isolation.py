#!/usr/bin/env python3
"""
Setup full physical & business isolation for Nuclear Tattoo Canada (NTCA) channel:
1. Dedicated Canada Warehouse (Mississauga, ON) with stock migration
2. Dedicated Canada Shipping Zone & Methods (UPS Standard, UPS Express, Free Shipping > $200 CAD)
3. Dedicated Canada Tax Configuration & Tax Class Rates
4. Dedicated Stripe Payment Gateway enabled for CAD
"""
import os
import sys
import django

CORE_DIR = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/apps/saleor-core"
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
django.setup()

from saleor.account.models import Address
from saleor.warehouse.models import Warehouse, ChannelWarehouse, Stock
from saleor.channel.models import Channel
from saleor.shipping.models import ShippingZone, ShippingMethod, ShippingMethodChannelListing
from saleor.tax.models import TaxClass, TaxClassCountryRate, TaxConfiguration
from saleor.plugins.models import PluginConfiguration
from saleor.product.models import ProductVariantChannelListing

def setup_canada_isolation():
    print("🇨🇦 [NTMS] Starting Canada Channel physical & business isolation...")

    ca_channel = Channel.objects.get(slug="canada")
    us_channel = Channel.objects.get(slug="default-channel")

    # =========================================================================
    # 1. DEDICATED CANADA WAREHOUSE
    # =========================================================================
    print("\n📦 [1/4] Configuring dedicated Canada Warehouse...")
    ca_address, _ = Address.objects.get_or_create(
        company_name="Nuclear Tattoo Supply Canada",
        street_address_1="3-1550 Meyerside Dr",
        city="Mississauga",
        postal_code="L5T 1V4",
        country="CA",
        country_area="ON",
        defaults={
            "phone": "+14373403231",
            "first_name": "Nuclear",
            "last_name": "Canada",
        }
    )

    ca_warehouse, wh_created = Warehouse.objects.get_or_create(
        slug="canada-warehouse",
        defaults={
            "name": "Nuclear Tattoo Canada Warehouse",
            "address": ca_address,
            "email": "info@nucleartattooca.com",
        }
    )
    if not ca_warehouse.address:
        ca_warehouse.address = ca_address
        ca_warehouse.save(update_fields=["address"])

    print(f"  ✅ Canada Warehouse: {ca_warehouse.name} ({ca_warehouse.slug}) at {ca_address.street_address_1}, {ca_address.city}, {ca_address.country_area}")

    # Bind Canada Warehouse exclusively to Canada Channel
    cw_ca, _ = ChannelWarehouse.objects.get_or_create(
        channel=ca_channel,
        warehouse=ca_warehouse,
        defaults={"sort_order": 1}
    )
    # Remove US Default Warehouse from Canada Channel
    default_wh = Warehouse.objects.filter(slug="default-warehouse").first()
    if default_wh:
        ChannelWarehouse.objects.filter(channel=ca_channel, warehouse=default_wh).delete()
        print(f"  ✅ Removed US 'Default Warehouse' from Canada channel (isolation established)")

    # Stock Assignment for Canada Warehouse
    print("  🔄 Checking and assigning stock to Canada Warehouse...")
    ca_variant_ids = set(ProductVariantChannelListing.objects.filter(channel=ca_channel).values_list("variant_id", flat=True))
    existing_ca_stocks = set(Stock.objects.filter(warehouse=ca_warehouse).values_list("product_variant_id", flat=True))
    missing_stock_vids = ca_variant_ids - existing_ca_stocks

    new_stocks = []
    # If variant already had stock in default warehouse, replicate that quantity, else default 100
    existing_us_stocks = {
        s.product_variant_id: s.quantity
        for s in Stock.objects.filter(warehouse=default_wh, product_variant_id__in=missing_stock_vids)
    }

    for vid in missing_stock_vids:
        qty = existing_us_stocks.get(vid, 100)
        new_stocks.append(
            Stock(
                warehouse=ca_warehouse,
                product_variant_id=vid,
                quantity=qty,
                quantity_allocated=0,
            )
        )

    if new_stocks:
        Stock.objects.bulk_create(new_stocks, batch_size=1000)
        print(f"  ✅ Created {len(new_stocks)} stock records for Canada Warehouse")
    else:
        print(f"  ℹ️ All {len(ca_variant_ids)} Canada variants already have stock in Canada Warehouse")

    # =========================================================================
    # 2. DEDICATED SHIPPING ZONE & METHODS
    # =========================================================================
    print("\n🚚 [2/4] Configuring dedicated Canada Shipping Zone & Methods...")
    ca_zone, z_created = ShippingZone.objects.get_or_create(
        name="Canada Domestic Shipping",
        defaults={"countries": ["CA"]}
    )
    if "CA" not in [c.code for c in ca_zone.countries]:
        ca_zone.countries = ["CA"]
        ca_zone.save()

    ca_zone.channels.add(ca_channel)
    # Ensure US channel is not on Canada Domestic zone
    ca_zone.channels.remove(us_channel)
    ca_warehouse.shipping_zones.add(ca_zone)

    # Detach generic shipping zone from Canada channel
    old_zone = ShippingZone.objects.filter(name__icontains="Canada/Mexico").first()
    if old_zone:
        old_zone.channels.remove(ca_channel)

    # Shipping Method 1: Free Shipping on Orders Over CA$200
    sm_free, _ = ShippingMethod.objects.get_or_create(
        name="Free Shipping on Orders Over CA$200",
        shipping_zone=ca_zone,
        defaults={"type": "price"}
    )
    ShippingMethodChannelListing.objects.update_or_create(
        shipping_method=sm_free,
        channel=ca_channel,
        defaults={
            "price_amount": 0.00,
            "currency": "CAD",
            "minimum_order_price_amount": 200.00,
        }
    )
    print("  ✅ Configured: Free Shipping on Orders Over CA$200 (Min order: $200 CAD, Price: $0.00)")

    # Shipping Method 2: UPS Standard Shipping
    sm_std, _ = ShippingMethod.objects.get_or_create(
        name="UPS Standard Ground",
        shipping_zone=ca_zone,
        defaults={"type": "price"}
    )
    ShippingMethodChannelListing.objects.update_or_create(
        shipping_method=sm_std,
        channel=ca_channel,
        defaults={
            "price_amount": 20.00,
            "currency": "CAD",
            "minimum_order_price_amount": 0.00,
        }
    )
    print("  ✅ Configured: UPS Standard Ground ($20.00 CAD)")

    # Shipping Method 3: UPS Express Shipping
    sm_exp, _ = ShippingMethod.objects.get_or_create(
        name="UPS Express Saver",
        shipping_zone=ca_zone,
        defaults={"type": "price"}
    )
    ShippingMethodChannelListing.objects.update_or_create(
        shipping_method=sm_exp,
        channel=ca_channel,
        defaults={
            "price_amount": 40.00,
            "currency": "CAD",
            "minimum_order_price_amount": 0.00,
        }
    )
    print("  ✅ Configured: UPS Express Saver ($40.00 CAD)")

    # =========================================================================
    # 3. DEDICATED TAX CONFIGURATION
    # =========================================================================
    print("\n🏛️ [3/4] Configuring Canada Tax Configuration...")
    tax_config, _ = TaxConfiguration.objects.get_or_create(
        channel=ca_channel,
        defaults={
            "charge_taxes": True,
            "tax_calculation_strategy": "FLAT_RATES",
            "prices_entered_with_tax": False,
        }
    )
    tax_config.charge_taxes = True
    tax_config.tax_calculation_strategy = "FLAT_RATES"
    tax_config.save()

    # Set Standard Tax Class country rate for Canada (13% HST benchmark / Ontario)
    std_tax = TaxClass.objects.first()
    if std_tax:
        TaxClassCountryRate.objects.update_or_create(
            tax_class=std_tax,
            country="CA",
            defaults={"rate": 13.000}
        )
        print(f"  ✅ Configured CA Tax Rate in '{std_tax.name}': 13.00% HST")

    # =========================================================================
    # 4. DEDICATED PAYMENT GATEWAY (STRIPE CAD)
    # =========================================================================
    print("\n💳 [4/4] Configuring Canada Payment Gateway (Stripe CAD)...")
    us_stripe = PluginConfiguration.objects.filter(identifier="saleor.payments.stripe", channel=us_channel).first()

    ca_stripe, _ = PluginConfiguration.objects.get_or_create(
        identifier="saleor.payments.stripe",
        channel=ca_channel,
        defaults={
            "name": "Stripe",
            "description": "Payment gateway using Stripe for Canada (CAD)",
            "active": True,
            "configuration": [
                {
                    "name": "public_api_key",
                    "type": "String",
                    "label": "Public API key",
                    "value": us_stripe.configuration[0]["value"] if us_stripe else "",
                    "help_text": "Provide Stripe public API key."
                },
                {
                    "name": "secret_api_key",
                    "type": "Secret",
                    "label": "Secret API key",
                    "value": us_stripe.configuration[1]["value"] if us_stripe else "",
                    "help_text": "Provide Stripe secret API key."
                },
                {
                    "name": "automatic_payment_capture",
                    "type": "Boolean",
                    "label": "Automatic payment capture",
                    "value": True,
                    "help_text": "Determines if Saleor should automatically capture payments."
                },
                {
                    "name": "supported_currencies",
                    "type": "String",
                    "label": "Supported currencies",
                    "value": "CAD",
                    "help_text": "Determines currencies supported by gateway."
                }
            ]
        }
    )
    ca_stripe.active = True
    # Ensure supported currency is CAD
    for item in ca_stripe.configuration:
        if item.get("name") == "supported_currencies":
            item["value"] = "CAD"
    ca_stripe.save()
    print("  ✅ Configured Stripe for Canada Channel (Currency: CAD)")

    # Enable dummy payment for local testing
    dummy_pc, _ = PluginConfiguration.objects.get_or_create(
        identifier="mirumee.payments.dummy",
        channel=ca_channel,
        defaults={
            "name": "Dummy payment gateway",
            "active": True,
            "configuration": [
                {"name": "Store customers card", "type": "Boolean", "label": "Store customers card", "value": False, "help_text": "Determines if Saleor should store cards."},
                {"name": "Automatic payment capture", "type": "Boolean", "label": "Automatic payment capture", "value": True, "help_text": "Determines if Saleor should automatically capture payments."},
                {"name": "Supported currencies", "type": "String", "label": "Supported currencies", "value": "CAD", "help_text": "Determines currencies supported by gateway."}
            ]
        }
    )
    dummy_pc.active = True
    dummy_pc.save()
    print("  ✅ Configured Dummy Payment for Canada Channel (Testing)")

    print("\n🎉 Canada Channel physical & business isolation complete!")

if __name__ == "__main__":
    setup_canada_isolation()
