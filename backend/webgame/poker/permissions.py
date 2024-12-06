from rest_framework.permissions import BasePermission
from django.contrib.auth import get_user_model


class HasUserId(BasePermission):
    """
    Проверка, имеет ли пользователь в cookie user_id, совпадающий с user_id из БД пользователей.
    """
    def has_permission(self, request, view):
        User = get_user_model()
        if User.objects.filter(user_id=request.COOKIES.get('user_id')).exists():
            return True
        return False