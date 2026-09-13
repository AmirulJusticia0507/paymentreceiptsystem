from django.contrib import admin

from .models import Laporan


@admin.register(Laporan)
class LaporanAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_name', 'nik', 'sale', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['user_name', 'nik', 'sale__receipt_number']
    readonly_fields = ['created_at', 'approved_at', 'sale', 'total']
    autocomplete_fields = ['sale']