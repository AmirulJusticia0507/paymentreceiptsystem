from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Payment, Expense
from .serializers import PaymentSerializer, ExpenseSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-created_at')
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-created_at')
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]