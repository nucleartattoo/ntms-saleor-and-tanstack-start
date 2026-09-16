import logging
import os
import re
import mimetypes

from django.conf import settings
from django.http import FileResponse, Http404, HttpRequest, HttpResponse, JsonResponse
from django.template.response import TemplateResponse
from django.views.static import serve

from .jwt_manager import get_jwt_manager

logger = logging.getLogger(__name__)


def home(request):
    storefront_url = os.environ.get("STOREFRONT_URL", "")
    dashboard_url = os.environ.get("DASHBOARD_URL", "")
    return TemplateResponse(
        request,
        "home/index.html",
        {"storefront_url": storefront_url, "dashboard_url": dashboard_url},
    )


def jwks(request):
    return JsonResponse(get_jwt_manager().get_jwks())


def serve_media_view(
    request: HttpRequest, *args, **kwargs
) -> HttpResponse | FileResponse:
    """Serve media files from local storage during development with smart fallback resolution."""
    if not settings.DEBUG:
        raise Http404

    document_root = kwargs.get("document_root", settings.MEDIA_ROOT)
    path = kwargs.get("path", args[0] if args else "")

    try:
        response = serve(request, path, document_root=document_root)
    except Http404:
        found_file = None

        if path.startswith("products/"):
            filename = path[len("products/"):]
            stem, ext = os.path.splitext(filename)

            # Clean thumbnail suffixes: _thumbnail_xxx, _th_xxx, _thu_xxx, _thum_xxx
            base_stem = re.sub(r'(_thumbnail_\d+|_th_[a-zA-Z0-9_-]+|_thu_[a-zA-Z0-9_-]+|_thum_[a-zA-Z0-9_-]+)$', '', stem)

            candidates = [
                # If requested as products/ but actually lives in thumbnails/products/
                os.path.join(document_root, "thumbnails", "products", filename),
                # Original product image candidates
                os.path.join(document_root, "products", base_stem + ".jpg"),
                os.path.join(document_root, "products", base_stem + ".png"),
                os.path.join(document_root, "products", base_stem + ".jpeg"),
                os.path.join(document_root, "products", base_stem + ".webp"),
                os.path.join(document_root, "products", stem + ".jpg"),
                os.path.join(document_root, "products", stem + ".png"),
                os.path.join(document_root, "products", stem + ".jpeg"),
                # Thumbnail candidates
                os.path.join(document_root, "thumbnails", "products", f"{base_stem}_thumbnail_512.webp"),
                os.path.join(document_root, "thumbnails", "products", f"{base_stem}_thumbnail_1024.webp"),
                os.path.join(document_root, "thumbnails", "products", f"{base_stem}_thumbnail_4096.png"),
                os.path.join(document_root, "thumbnails", "products", f"{base_stem}_thumbnail_4096.jpg"),
            ]
            for candidate in candidates:
                if os.path.isfile(candidate):
                    found_file = candidate
                    break

        elif path.startswith("thumbnails/products/"):
            filename = path[len("thumbnails/products/"):]
            stem, ext = os.path.splitext(filename)
            base_stem = re.sub(r'(_thumbnail_\d+|_th_[a-zA-Z0-9_-]+|_thu_[a-zA-Z0-9_-]+|_thum_[a-zA-Z0-9_-]+)$', '', stem)

            candidates = [
                os.path.join(document_root, "products", base_stem + ".png"),
                os.path.join(document_root, "products", base_stem + ".jpg"),
                os.path.join(document_root, "products", base_stem + ".jpeg"),
                os.path.join(document_root, "products", filename),
            ]
            for candidate in candidates:
                if os.path.isfile(candidate):
                    found_file = candidate
                    break

        if found_file and os.path.isfile(found_file):
            content_type, _ = mimetypes.guess_type(found_file)
            response = FileResponse(open(found_file, "rb"), content_type=content_type or "image/jpeg")
        else:
            raise Http404(f"Media file '{path}' not found.")

    if isinstance(response, FileResponse):
        response.headers["Content-Disposition"] = "inline"
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Cache-Control"] = "public, max-age=86400"
    return response
