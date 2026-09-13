from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import LaporanViewSet, SummaryView, SalesPerDayView, RevenuePerDayView

router = DefaultRouter()
router.register('laporans', LaporanViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('summary/', SummaryView.as_view(), name='report-summary'),
    path('sales-per-day/', SalesPerDayView.as_view(), name='report-sales-per-day'),
    path('revenue-per-day/', RevenuePerDayView.as_view(), name='report-revenue-per-day'),
]