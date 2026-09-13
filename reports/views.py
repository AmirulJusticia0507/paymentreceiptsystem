from datetime import timedelta

from decimal import Decimal

from django.db.models import Sum, Count
from django.db.models.functions import TruncDay
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from sales.models import Sale, SaleItem
from finance.models import Payment, Expense


class SummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_sales = Sale.objects.count()
        total_revenue = Payment.objects.filter(status='PAID').aggregate(total=Sum('amount'))['total'] or Decimal('0')
        total_expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        products_sold = SaleItem.objects.aggregate(total=Sum('quantity'))['total'] or 0

        return Response({
            'total_sales': total_sales,
            'total_revenue': str(total_revenue),
            'total_expenses': str(total_expenses),
            'net_profit': str(total_revenue - total_expenses),
            'products_sold': products_sold,
        })


class SalesPerDayView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 7))
        cutoff = timezone.now() - timedelta(days=days)
        rows = (
            Sale.objects.filter(created_at__gte=cutoff)
            .annotate(day=TruncDay('created_at'))
            .values('day')
            .annotate(count=Count('id'))
            .order_by('day')
        )
        return Response([{'day': row['day'], 'sales': row['count']} for row in rows])


class RevenuePerDayView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 7))
        cutoff = timezone.now() - timedelta(days=days)
        rows = (
            Payment.objects.filter(status='PAID', paid_at__gte=cutoff)
            .annotate(day=TruncDay('paid_at'))
            .values('day')
            .annotate(total=Sum('amount'))
            .order_by('day')
        )
        return Response([{'day': row['day'], 'revenue': str(row['total'])} for row in rows])