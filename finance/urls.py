from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import PaymentViewSet, ExpenseViewSet

router = DefaultRouter()
router.register('payments', PaymentViewSet)
router.register('expenses', ExpenseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]