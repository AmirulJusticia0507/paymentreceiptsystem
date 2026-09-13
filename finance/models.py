from django.db import models
from django.utils import timezone

from sales.models import Sale


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = 'CASH', 'Cash'
        TRANSFER = 'TRANSFER', 'Bank Transfer'
        CARD = 'CARD', 'Credit/Debit Card'
        QRIS = 'QRIS', 'QRIS'

    class Status(models.TextChoices):
        PAID = 'PAID', 'Paid'
        PENDING = 'PENDING', 'Pending'
        REFUNDED = 'REFUNDED', 'Refunded'

    sale = models.OneToOneField(Sale, related_name='payment', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=10, choices=Method.choices, default=Method.CASH)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PAID)
    paid_at = models.DateTimeField(default=timezone.now)
    notes = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.id} - {self.sale.receipt_number}"


class Expense(models.Model):
    class Category(models.TextChoices):
        OPERATIONAL = 'OPERATIONAL', 'Operational'
        PURCHASE = 'PURCHASE', 'Purchase'
        UTILITY = 'UTILITY', 'Utility'
        SALARY = 'SALARY', 'Salary'
        OTHER = 'OTHER', 'Other'

    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=12, choices=Category.choices, default=Category.OPERATIONAL)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.description