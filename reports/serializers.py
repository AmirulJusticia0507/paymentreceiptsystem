from decimal import Decimal

from rest_framework import serializers

from inventory.models import Product
from sales.models import Sale, SaleItem
from .models import Laporan


class ProductListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name']


class SaleItemListSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = SaleItem
        fields = ['product', 'product_name', 'quantity', 'unit_price', 'subtotal']


class SaleMiniSerializer(serializers.ModelSerializer):
    items = SaleItemListSerializer(many=True)

    class Meta:
        model = Sale
        fields = ['id', 'receipt_number', 'customer_name', 'created_at', 'items']
        read_only_fields = ['receipt_number', 'created_at']


class LaporanSerializer(serializers.ModelSerializer):
    sale_data = SaleMiniSerializer(source='sale', read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Laporan
        fields = ['id', 'user_name', 'nik', 'sale', 'sale_data', 'status', 'total', 'ai_summary', 'created_at', 'approved_at']
        read_only_fields = ['id', 'status', 'created_at', 'approved_at', 'total']

    def get_total(self, obj: Laporan) -> Decimal:
        return obj.total()

    def create(self, validated_data):
        return Laporan.objects.create(**validated_data)

    def validate(self, attrs):
        sale = attrs.get('sale')
        if sale and sale.laporans.exists():
            raise serializers.ValidationError('Transaksi ini sudah memiliki laporan.')
        return attrs