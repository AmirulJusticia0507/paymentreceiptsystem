from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Sale, SaleItem
from .serializers import SaleSerializer, SaleItemSerializer


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all().order_by('-created_at')
    serializer_class = SaleSerializer
    permission_classes = [IsAuthenticated]


class SaleItemViewSet(viewsets.ModelViewSet):
    queryset = SaleItem.objects.all()
    serializer_class = SaleItemSerializer
    permission_classes = [IsAuthenticated]