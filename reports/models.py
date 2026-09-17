from decimal import Decimal

from django.db import models

from sales.models import Sale


class Laporan(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    user_name = models.CharField(max_length=150)
    nik = models.CharField(max_length=20)
    sale = models.ForeignKey(Sale, related_name='laporans', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    ai_summary = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    def total(self) -> Decimal:
        return sum(Decimal(str(it.subtotal)) for it in self.sale.items.all())

    def __str__(self):
        return f"Laporan {self.id} - {self.sale.receipt_number} ({self.user_name})"

    class Meta:
        ordering = ['-created_at']
