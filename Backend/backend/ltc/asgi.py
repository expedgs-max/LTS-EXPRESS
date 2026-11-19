import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ltc.settings')

from django.core.asgi import get_asgi_application
django_application = get_asgi_application()


from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from food.routing import websocket_urlpatterns as food_websocket_urlpatterns
from vtc.routing import websocket_urlpatterns as vtc_websocket_urlpatterns
from vtc.middleware import TokenAuthMiddleware



# Combine WebSocket URL patterns from different apps
combined_websocket_urlpatterns = food_websocket_urlpatterns + vtc_websocket_urlpatterns

application = ProtocolTypeRouter({

    "http": django_application,  # Handle HTTP requests
    "websocket": TokenAuthMiddleware(  # First, apply TokenAuthMiddleware
        AuthMiddlewareStack(  # Then wrap it with AuthMiddlewareStack
            URLRouter(
                combined_websocket_urlpatterns  # Pass the combined WebSocket routing
            )
        )

    ),
})
