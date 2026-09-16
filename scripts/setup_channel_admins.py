import os
import sys

# Ensure saleor-core is in python path
saleor_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "saleor-core"))
sys.path.insert(0, saleor_path)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")

import django
django.setup()

from saleor.account.models import User, Group
from saleor.channel.models import Channel
from saleor.permission.models import Permission

DEFAULT_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin123456!")

def setup():
    print("🚀 Configuring Saleor Multi-Channel Staff Accounts...")

    # 1. Fetch Channels
    us_channel = Channel.objects.filter(slug="default-channel").first()
    ca_channel = Channel.objects.filter(slug="canada").first()

    if not us_channel or not ca_channel:
        print("❌ Error: Missing channels in database!")
        return

    print(f"  Found US Channel: id={us_channel.id}, slug={us_channel.slug}")
    print(f"  Found Canada Channel: id={ca_channel.id}, slug={ca_channel.slug}")

    # Standard Store Manager permissions
    manager_perm_codenames = [
        "manage_products",
        "manage_orders",
        "manage_checkouts",
        "manage_discounts",
        "manage_gift_card",
        "manage_shipping",
        "manage_users",
        "manage_pages",
        "manage_translations",
    ]
    manager_perms = list(Permission.objects.filter(codename__in=manager_perm_codenames))

    # 2. Configure Canada Store Managers Group
    ca_group, _ = Group.objects.get_or_create(name="Canada Store Managers")
    ca_group.permissions.set(manager_perms)
    ca_group.channels.set([ca_channel])
    ca_group.restricted_access_to_channels = True
    ca_group.save()
    print(f"  ✅ Configured 'Canada Store Managers' group (restricted to Canada channel)")

    # 3. Configure US Store Managers Group
    us_group, _ = Group.objects.get_or_create(name="US Store Managers")
    us_group.permissions.set(manager_perms)
    us_group.channels.set([us_channel])
    us_group.restricted_access_to_channels = True
    us_group.save()
    print(f"  ✅ Configured 'US Store Managers' group (restricted to US channel)")

    # 4. Configure Full Access Group (Unrestricted)
    full_group, _ = Group.objects.get_or_create(name="Full Access")
    all_perms = list(Permission.objects.all())
    full_group.permissions.set(all_perms)
    full_group.channels.clear()
    full_group.restricted_access_to_channels = False
    full_group.save()
    print(f"  ✅ Configured 'Full Access' group (all 25 permissions, unrestricted channels)")

    # 5. Create / Update Canada Admin
    ca_email = "canada-admin@nucleartattoosupply.com"
    ca_user, ca_created = User.objects.get_or_create(
        email=ca_email,
        defaults={
            "first_name": "Canada",
            "last_name": "Manager",
            "is_staff": True,
            "is_superuser": False,
            "is_active": True,
            "is_confirmed": True,
        }
    )
    ca_user.first_name = "Canada"
    ca_user.last_name = "Manager"
    ca_user.is_staff = True
    ca_user.is_superuser = False  # Crucial: superusers bypass channel restrictions!
    ca_user.is_active = True
    ca_user.is_confirmed = True
    ca_user.set_password(DEFAULT_PASSWORD)
    ca_user.save()
    ca_user.groups.set([ca_group])
    print(f"  ✅ {'Created' if ca_created else 'Updated'} Canada Admin: {ca_email}")

    # 6. Create / Update US Admin
    us_email = "us-admin@nucleartattoosupply.com"
    us_user, us_created = User.objects.get_or_create(
        email=us_email,
        defaults={
            "first_name": "US",
            "last_name": "Manager",
            "is_staff": True,
            "is_superuser": False,
            "is_active": True,
            "is_confirmed": True,
        }
    )
    us_user.first_name = "US"
    us_user.last_name = "Manager"
    us_user.is_staff = True
    us_user.is_superuser = False  # Crucial: superusers bypass channel restrictions!
    us_user.is_active = True
    us_user.is_confirmed = True
    us_user.set_password(DEFAULT_PASSWORD)
    us_user.save()
    us_user.groups.set([us_group])
    print(f"  ✅ {'Created' if us_created else 'Updated'} US Admin: {us_email}")

    # 7. Ensure Global SuperAdmin (Full Access)
    root_email = "admin@nucleartattoosupply.com"
    root_user, root_created = User.objects.get_or_create(
        email=root_email,
        defaults={
            "first_name": "Global",
            "last_name": "SuperAdmin",
            "is_staff": True,
            "is_superuser": True,
            "is_active": True,
            "is_confirmed": True,
        }
    )
    root_user.first_name = "Global"
    root_user.last_name = "SuperAdmin"
    root_user.is_staff = True
    root_user.is_superuser = True
    root_user.is_active = True
    root_user.is_confirmed = True
    root_user.set_password(DEFAULT_PASSWORD)
    root_user.save()
    root_user.groups.set([full_group])
    print(f"  ✅ {'Created' if root_created else 'Updated'} Global SuperAdmin: {root_email}")

    print("\n🎉 ALL ACCOUNTS READY:")
    print(f"  1. 加拿大管理员 (Canada Channel Only):")
    print(f"     邮箱: {ca_email}")
    print(f"     密码: {DEFAULT_PASSWORD}")
    print(f"  2. 美国管理员 (US Channel Only):")
    print(f"     邮箱: {us_email}")
    print(f"     密码: {DEFAULT_PASSWORD}")
    print(f"  3. 全局总管 (Full Access SuperAdmin):")
    print(f"     邮箱: {root_email}")
    print(f"     密码: {DEFAULT_PASSWORD}")

if __name__ == "__main__":
    setup()
