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

from saleor.account.models import User, Group
from saleor.site.models import SiteSettings

def sync_credentials():
    # 1. Ensure email confirmation is disabled for seamless local dev & test
    site_settings = SiteSettings.objects.first()
    if site_settings and site_settings.enable_account_confirmation_by_email:
        site_settings.enable_account_confirmation_by_email = False
        site_settings.save()
        print("✅ Disabled enable_account_confirmation_by_email")

    full_access = Group.objects.filter(name="Full Access").first()

    default_pw = os.environ.get('NTMS_ADMIN_PASSWORD', 'NTMS2026!')
    ACCOUNTS = [
        ('admin@nucleartattoosupply.com', default_pw, True, True),
        ('admin@tattoogoat.com', default_pw, True, True),
        ('admin@example.com', 'admin', True, True),
    ]

    for email, password, is_staff, is_superuser in ACCOUNTS:
        u, created = User.objects.get_or_create(
            email=email,
            defaults={
                'is_active': True,
                'is_confirmed': True,
                'is_staff': is_staff,
                'is_superuser': is_superuser,
            }
        )
        u.set_password(password)
        u.is_active = True
        u.is_confirmed = True
        if is_staff:
            u.is_staff = True
            u.is_superuser = is_superuser
        u.save()
        if full_access:
            u.groups.add(full_access)
        print(f"✅ Verified {email} -> (staff={u.is_staff}, superuser={u.is_superuser}, group='Full Access')")

    # 3. Ensure Canada Manager account
    canada_group = Group.objects.filter(name="Canada Store Managers").first()
    ca_user, _ = User.objects.get_or_create(
        email="canada-manager@nucleartattoosupply.com",
        defaults={
            "is_active": True,
            "is_confirmed": True,
            "is_staff": True,
            "is_superuser": False,
        }
    )
    ca_user.is_active = True
    ca_user.is_confirmed = True
    ca_user.is_staff = True
    ca_user.is_superuser = False
    ca_user.set_password("Canada2026!")
    ca_user.save()
    ca_user.groups.clear()
    if canada_group:
        ca_user.groups.add(canada_group)
    print("✅ Verified canada-manager@nucleartattoosupply.com -> (staff=True, superuser=False, group='Canada Store Managers')")

if __name__ == '__main__':
    sync_credentials()
