import jwt
import requests
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError


class RefreshAccessTokenMiddleware(MiddlewareMixin):
    """
    Middleware to refresh access tokens seamlessly without returning 401 responses.
    """

    def process_request(self, request):
        # Exclude paths where token refreshing is not needed
        excluded_paths = ['/api/login/', '/api/v1/token/', '/api/v1/token/refresh/']
        if any(request.path.startswith(path) for path in excluded_paths):
            return None

        access_token = request.COOKIES.get('access_token')
        refresh_token = request.COOKIES.get('refresh_token')

        if access_token:
            try:
                # Validate the access token
                payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=["HS256"])
                if payload.get('type') != 'access':
                    raise jwt.InvalidTokenError("Invalid token type")
                request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
                return None  # Access token is valid, no need to refresh
            except jwt.ExpiredSignatureError:
                # Access token is expired, try to refresh it using the refresh token
                if refresh_token:
                    try:
                        # Call the refresh token endpoint to get a new access token
                        refresh_response = requests.post(
                            f'{settings.BASE_URL}/api/v1/token/refresh/',
                            json={'refresh': refresh_token},
                            headers={'Content-Type': 'application/json'}
                        )
                        if refresh_response.status_code == 200:
                            new_tokens = refresh_response.json()
                            new_access_token = new_tokens.get('access')
                            new_refresh_token = new_tokens.get('refresh')

                            # Attach new tokens to the request
                            request.META['HTTP_AUTHORIZATION'] = f'Bearer {new_access_token}'
                            request.new_access_token = new_access_token
                            request.new_refresh_token = new_refresh_token
                            return None
                    except Exception as e:
                        # Failed to refresh the token, proceed without authentication
                        print(f"Failed to refresh token: {e}")
            except jwt.InvalidTokenError:
                # Invalid access token, skip further processing
                print("Invalid access token")

        # If no valid tokens are present, do nothing; the user remains unauthenticated.
        return None

    def process_response(self, request, response):
        # If new tokens were generated, update cookies and headers
        if hasattr(request, 'new_access_token') and hasattr(request, 'new_refresh_token'):
            response.set_cookie(
                'access_token',
                value=request.new_access_token,
                max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                httponly=True,
                samesite='Lax',
                secure=not settings.DEBUG  # Secure cookies in production
            )
            response.set_cookie(
                'refresh_token',
                value=request.new_refresh_token,
                max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
                httponly=True,
                samesite='Lax',
                secure=not settings.DEBUG  # Secure cookies in production
            )
            response['Authorization'] = f'Bearer {request.new_access_token}'
        return response