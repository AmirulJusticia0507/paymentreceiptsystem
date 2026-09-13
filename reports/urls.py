from django.urls import path

from .views import SummaryView, SalesPerDayView, RevenuePerDayView

urlpatterns = [
    path('summary/', SummaryView.as_view(), name='report-summary'),
    path('sales-per-day/', SalesPerDayView.as_view(), name='report-sales-per-day'),
    path('revenue-per-day/', RevenuePerDayView.as_view(), name='report-revenue-per-day'),
]