from rest_framework import serializers

from .models import Payment, Expense


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    category = serializers.ChoiceField(
        choices=Expense.Category.choices,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['created_at']

    def create(self, validated_data):
        category = validated_data.get('category', '')
        if not category or category == Expense.Category.OTHER:
            try:
                from ai.services import categorize_expense
                description = validated_data.get('description', '')
                amount = f"{validated_data['amount']:.2f}" if validated_data.get('amount') is not None else ''
                validated_data['category'] = categorize_expense(description, amount, timeout=10)['category']
            except Exception:
                pass
        return super().create(validated_data)