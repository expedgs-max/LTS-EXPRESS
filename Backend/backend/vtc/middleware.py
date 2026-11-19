from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser
from asgiref.sync import sync_to_async

class TokenAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope["headers"])
        token = None
        

        
        if b"authorization" in headers:
            auth_header = headers[b"authorization"].decode()
            if auth_header.startswith("Bearer "):
                token = auth_header.split("Bearer ")[1]

        
        if not token:
            query_string = scope["query_string"].decode()
            query_params = dict(item.split("=") for item in query_string.split("&") if "=" in item)
            token = query_params.get("token")

        

        if token:  # Validate the token
            try:
                # Validate and retrieve the user
                validated_token = await sync_to_async(JWTAuthentication().get_validated_token)(token)
                user = await sync_to_async(JWTAuthentication().get_user)(validated_token)
                scope["user"] = user
            except (InvalidToken, TokenError):
                # Close the WebSocket connection if the token is invalid
                await send({
                    "type": "websocket.close",
                    "code": 4001,  # Custom close code for authentication failure
                })
                return
        else:  # Handle missing token case
            # Close the WebSocket connection if no token is provided
            await send({
                "type": "websocket.close",
                "code": 4002,  # Custom close code for missing token
            })
            return

        return await super().__call__(scope, receive, send)
