from django.urls import path

from .views import BusinessChatView, ReportSummaryView, CategorizeExpenseView, ProductDescriptionView

app_name = 'ai'

urlpatterns = [
    path('chat/', BusinessChatView.as_view(), name='business-chat'),
    path('summarize-report/', ReportSummaryView.as_view(), name='summarize-report'),
    path('categorize-expense/', CategorizeExpenseView.as_view(), name='categorize-expense'),
    path('product-description/', ProductDescriptionView.as_view(), name='product-description'),
]