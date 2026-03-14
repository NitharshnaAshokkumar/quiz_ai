from django.urls import path
from .views import AttemptStartView, AttemptSubmitView, AttemptHistoryView, AttemptDetailView

urlpatterns = [
    path('history/', AttemptHistoryView.as_view(), name='attempt-history'),
    path('<int:pk>/', AttemptDetailView.as_view(), name='attempt-detail'),
    path('start/<int:quiz_id>/', AttemptStartView.as_view(), name='attempt-start'),
    path('<int:attempt_id>/submit/', AttemptSubmitView.as_view(), name='attempt-submit'),
]
