from django.contrib import admin

from .models import Payment, Expense


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['sale', 'amount', 'method', 'status', 'paid_at']
    list_filter = ['method', 'status']
    search_fields = ['sale__receipt_number', 'notes']


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['description', 'amount', 'category', 'created_at']
    list_filter = ['category']
    search_fields = ['description']