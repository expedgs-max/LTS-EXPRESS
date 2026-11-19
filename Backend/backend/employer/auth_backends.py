from django.contrib.auth.backends import BaseBackend
from .models import CustomUser
from django.db.models import Q


class CustomAuthenticationBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username:
            return None

        try:
            user = CustomUser.objects.filter(
                Q(email=username) |
                Q(phone_number_1=username) |
                Q(username=username)
            ).first()

            if user is None:
                return None
            if user.check_password(password):
                return user

        except CustomUser.DoesNotExist:
            return None
        return None
