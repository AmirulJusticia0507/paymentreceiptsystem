"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.django.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path("", views.home, name="home")
Class-based views
    1. Add a URL to urlpatterns:  path("", Home.as_view(), name="home")
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path("blog/", include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import HttpResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def root_redirect(request):
    """Simple root endpoint that returns a basic status page."""
    return HttpResponse(
        "<h1>Payment Receipt System is running</h1>"
        "<p>API documentation: <a href='/api/ai/'>/api/ai/ endpoints</a></p>"
        "<p>Login: <a href='/api/token/'>/api/token/</a> (admin/admin123)</p>"
        "<p>For full UI, deploy the React frontend to Vercel and set ALLOWED_HOSTS.</p>"
    )

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/inventory/", include("inventory.urls")),
    path("api/sales/", include("sales.urls")),
    path("api/finance/", include("finance.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/ai/", include("ai.urls")),
    # Catch‑all: return a simple status page instead of 404
    re_path(r"^.*$", root_redirect),
]