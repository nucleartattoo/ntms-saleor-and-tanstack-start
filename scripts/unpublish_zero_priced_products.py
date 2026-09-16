import os
import sys

SALEOR_ROOT = os.environ.get(
    "SALEOR_ROOT",
    "/app" if os.path.exists("/app/saleor") else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "apps/saleor-core")
)
if SALEOR_ROOT not in sys.path:
    sys.path.insert(0, SALEOR_ROOT)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saleor.settings')

import django
django.setup()

from django.core.cache import cache
from django.db.models import Max
from saleor.product.models import ProductChannelListing, ProductVariantChannelListing
from saleor.channel.models import Channel

def unpublish_zero_priced_products(dry_run=False):
    print("🔍 Inspecting zero-priced products across all channels...")

    channels = Channel.objects.all()
    total_unpublished = 0

    for ch in channels:
        # Find all product IDs in this channel whose maximum variant price <= 0
        zero_price_product_ids = (
            ProductVariantChannelListing.objects.filter(channel=ch)
            .values('variant__product_id')
            .annotate(max_price=Max('price_amount'))
            .filter(max_price__lte=0)
            .values_list('variant__product_id', flat=True)
        )

        listings_to_update = ProductChannelListing.objects.filter(
            channel=ch,
            product_id__in=zero_price_product_ids,
            is_published=True
        )

        count = listings_to_update.count()
        print(f"📊 Channel '{ch.slug}': found {count} active published products with price <= 0.")

        if not dry_run and count > 0:
            updated = listings_to_update.update(
                is_published=False,
                visible_in_listings=False
            )
            print(f"✅ Successfully unpublished {updated} products in channel '{ch.slug}'.")
            total_unpublished += updated

    if not dry_run and total_unpublished > 0:
        try:
            cache.clear()
            print("🧹 Flushed Django & Redis cache.")
        except Exception as e:
            print(f"⚠️ Cache clear warning: {e}")

    print(f"\n🎉 Done. Total products unpublished: {total_unpublished}")

if __name__ == '__main__':
    dry_run = "--dry-run" in sys.argv
    unpublish_zero_priced_products(dry_run=dry_run)
