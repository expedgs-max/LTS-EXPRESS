# routing.py
from django.urls import re_path
from .consumers import *

websocket_urlpatterns = [
 
   re_path(r'ws/commandes/magasin/$', CommandeConsumer.as_asgi()),
     re_path(r'ws/commande/livreur/$', LivreurConsumer.as_asgi()),
     re_path(r'ws/livreurs/$', LivreurStatusConsumer.as_asgi()),
     re_path(r'ws/client/commandes/$', ClientCommandeConsumer.as_asgi()),
     re_path(r'ws/confirmation/commandes/$', ConfirmationCommandeConsumer.as_asgi()),
    #  re_path(r'ws/centreappel/partnneur/cnnect',PertnnneurConnetCentreAppel.as_asgi())
    #  re_path(r'ws/magasins/open/$',MagasinOuverteConsumer.as_asgi()),
]