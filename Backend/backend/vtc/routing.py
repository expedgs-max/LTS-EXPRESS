# routing.py
from django.urls import re_path
from .consumers import *

websocket_urlpatterns = [
    re_path(r'ws/partner/$', PartnerConsumer.as_asgi()),
    re_path(r'ws/client/$', ClientConsumer.as_asgi()),
    re_path(r'ws/partners/connect/$', ConnectPartener.as_asgi()),
     re_path(r'ws/ride/(?P<ride_id>\w+)/$', RideTrackingConsumer.as_asgi()),
     re_path(r'ws/partners/choffeur/notification/', NotificationChiffeurConsumer.as_asgi()),
     re_path(r'ws/notification/$', NotificationChiffeurConsumer.as_asgi()),
    
    
]