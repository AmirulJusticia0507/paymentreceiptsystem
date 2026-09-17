from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ai import services
from ai.services import AIServiceError


class _ChatRequest(serializers.Serializer):
    message = serializers.CharField(max_length=2000)

    def validate_message(self, value):
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError('Pesan tidak boleh kosong.')
        return stripped


class BusinessChatView(APIView):
    """Chatbot: jawab pertanyaan bisnis berdasarkan data di database."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payload = _ChatRequest(data=request.data)
        payload.is_valid(raise_exception=True)
        try:
            reply = services.business_chat(payload.validated_data['message'])
        except AIServiceError as exc:
            return Response({'detail': str(exc)}, status=502)
        return Response({'reply': reply})


class ReportSummaryView(APIView):
    """Ringkasan narasi otomatis untuk laporan / periode tertentu."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payload = _SummaryRequest(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        laporan = None
        if data.get('laporan_id'):
            from rest_framework import exceptions
            from reports.models import Laporan
            try:
                laporan = Laporan.objects.select_related('sale').get(pk=data['laporan_id'])
            except Laporan.DoesNotExist:
                raise exceptions.NotFound('Laporan tidak ditemukan.')

        sections = services.report_sections(laporan=laporan, days=data['days'])
        title = laporan.sale.receipt_number if laporan else f'Periode {data["days"]} hari terakhir'
        try:
            summary = services.summarize_report(sections, title=title)
        except AIServiceError as exc:
            return Response({'detail': str(exc)}, status=502)

        saved = False
        if laporan and data['save']:
            laporan.ai_summary = summary
            laporan.save(update_fields=['ai_summary'])
            saved = True

        return Response({'summary': summary, 'saved': saved})


class _SummaryRequest(serializers.Serializer):
    laporan_id = serializers.IntegerField(required=False, allow_null=True)
    days = serializers.IntegerField(min_value=1, max_value=365, default=30)
    save = serializers.BooleanField(default=False)


class CategorizeExpenseView(APIView):
    """Klasifikasi otomatis kategori pengeluaran dari deskripsi."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payload = _CategorizeRequest(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data
        try:
            result = services.categorize_expense(data['description'], data.get('amount'))
        except AIServiceError as exc:
            return Response({'detail': str(exc)}, status=502)
        return Response(result)


class _CategorizeRequest(serializers.Serializer):
    description = serializers.CharField(max_length=500)

    def validate_description(self, value):
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError('Deskripsi tidak boleh kosong.')
        return stripped

    amount = serializers.CharField(required=False, allow_blank=True)


class ProductDescriptionView(APIView):
    """Generate deskripsi produk dari nama (opsional harga)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payload = _ProductDescRequest(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data
        try:
            description = services.product_description(data['name'], data.get('price'))
        except AIServiceError as exc:
            return Response({'detail': str(exc)}, status=502)
        return Response({'description': description})


class _ProductDescRequest(serializers.Serializer):
    name = serializers.CharField(max_length=200)

    def validate_name(self, value):
        stripped = value.strip()
        if not stripped:
            raise serializers.ValidationError('Nama produk tidak boleh kosong.')
        return stripped

    price = serializers.CharField(required=False, allow_blank=True)