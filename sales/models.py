from django.db import models

from inventory.models import Product


class Sale(models.Model):
    receipt_number = models.CharField(max_length=20, unique=True, blank=True)
    customer_name = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            self.receipt_number = f"RC-{self.pk:06d}"
            Sale.objects.filter(pk=self.pk).update(receipt_number=self.receipt_number)

    def __str__(self):
        return self.receipt_number


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, related_name='sale_items', on_delete=models.SET_NULL, null=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def subtotal(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return f"{self.product} x {self.quantity}"