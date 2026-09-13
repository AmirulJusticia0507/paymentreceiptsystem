from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Laporan
from .serializers import LaporanSerializer


class LaporanViewSet(viewsets.ModelViewSet):
    queryset = Laporan.objects.select_related('sale').all()
    serializer_class = LaporanSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()