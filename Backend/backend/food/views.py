from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate,logout
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.files.storage import FileSystemStorage
import json
from django.shortcuts import get_object_or_404
from django.db.models import *
from rest_framework import status
from .serializers import *
from rest_framework.pagination import PageNumberPagination
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.views.decorators.http import require_http_methods
from .models import *
from django.contrib.auth.hashers import make_password
from django.core.paginator import Paginator
from django.db import transaction
import logging
from collections import defaultdict

from employer.permission import *
from rest_framework.decorators import api_view, permission_classes,parser_classes,throttle_classes
from django.db.models import Q
from datetime import *
from django.utils import timezone
from rest_framework.throttling import UserRateThrottle


from rest_framework.parsers import MultiPartParser,FormParser
from django.db import DatabaseError
from django.core.paginator import Paginator, EmptyPage
from .permission import *
import json
from math import radians, sin, cos, sqrt, atan2
from rest_framework.decorators import api_view, permission_classes
import http.client
"""
Ce fichier contient plusieurs vues API pour gérer les commandes, les livreurs, les magasins et les actions dans une application Django.
Classes:
    - CustomPagination: Classe de pagination personnalisée pour les vues API.
    - ActionsPagination: Classe de pagination pour les actions.
Fonctions:
    - commande_par_chef_bureux(request): Vue pour récupérer les commandes par chef de bureau avec pagination et filtres.
    - create_commande(request): Vue pour créer une nouvelle commande par un client.
    - create_livreur_solo(request): Vue pour créer un livreur seul.
    - liste_magasin_par_client(request): Vue pour lister les magasins par client.
    - get_produis_magasin(request): Vue pour récupérer les produits d'un magasin.
    - add_produis(request): Vue pour ajouter des produits à un magasin.
    - magasin_par_catalogue(request): Vue pour récupérer les magasins par catalogue.
    - get_all_catalogue(request): Vue pour récupérer tous les catalogues.
    - create_commande_articles(request): Vue pour créer une commande avec des articles.
    - commande_par_magasin(request): Vue pour récupérer les commandes par magasin.
    - articles_pour_commande(request): Vue pour récupérer les articles d'une commande.
    - valider_le_payment(request): Vue pour valider le paiement d'une commande.
    - get_credi_emplois(request): Vue pour récupérer le crédit d'un employé.
    - create_livreur_chefbureux(request, chefbureau_id): Vue pour créer un livreur par un chef de bureau.
    - get_all_livreur_de_chef_bu(request, chef_bu_id): Vue pour récupérer tous les livreurs d'un chef de bureau.
    - all_commande_par_groupe(request, chef_id): Vue pour récupérer toutes les commandes par groupe.
    - get_credi_de_livreur(request, livreur_id): Vue pour récupérer le crédit d'un livreur.
    - get_action_for_chef_bureux_x(request): Vue pour récupérer les actions d'un chef de bureau avec pagination et filtres.
    - api_all_False(request): Vue pour mettre à jour toutes les commandes avec valide_payment à False.
    """
#pagination classs configation de pagination 
class CustomPagination(PageNumberPagination):
    page_size = 20 # Nombre d'éléments par page
    page_size_query_param = 'page_size'  # Permet de définir dynamiquement le nombre d'éléments par page
    max_page_size = 100  # Nombre maximal d'éléments par page
#api________voir_tout_les_commande de chef bureux with groupe : x avec paginsation 
class ActionsPagination(PageNumberPagination):
    page_size = 50  # Number of actions per page
    page_size_query_param = 'page_size'  # Allow clients to specify page size
    max_page_size = 100
class ComentairePagination(PageNumberPagination):
    page_size = 10 # Nombre d'éléments par page
    page_size_query_param = 'page_size'  # Permet de définir dynamiquement le nombre d'éléments par page
    max_page_size = 100  
@api_view(['GET'])

@permission_classes([IsAuthenticated])
@permission_classes([Ischefbureux])
def commande_par_chef_bureux(request):
    if request.method == "GET":
        try:
            # Get search filters from query parameters
            search_client = request.GET.get("client", None) #parmetre de recherche par client 
            search_livreur = request.GET.get("livreur", None) #parmetre de recherche par livreur
            search_valide=request.GET.get("valide",None) #parmetre de recherche par les commande valide et pas valide 
            if request.user.groupe is None or request.user.groupe =="" :
                return JsonResponse({"message":"you dont have permission"},status=404)
            # Base queryset filtered by the user's group
            queryset = Commande.objects.filter(
                livreur__partenneur__user__groupe=request.user.groupe
            ).select_related("client", "magasin", "livreur").order_by("-id")

            # Filter by client name if provided
            if search_client:
                queryset = queryset.filter(
                    Q(client__first_name__icontains=search_client) |
                    Q(client__last_name__icontains=search_client) |
                    Q(client__phone_number_1__icontains=search_client)
                      # added phone_number search for client
                )

            # Filter by livreur name or phone number if provided
            if search_livreur:
                queryset = queryset.filter(
                     Q(livreur__partenneur__user__first_name__icontains=search_livreur) |
                    Q(livreur__partenneur__user__last_name__icontains=search_livreur) |
                    Q(livreur__partenneur__user__phone_number_1__icontains=search_livreur)
                )
            if search_valide is not None:
              if search_valide.lower() in ['true', 'yes']:  # Checking for valid 'True' inputs (case-insensitive)
               queryset = queryset.filter(valide_payment=True)
              elif search_valide.lower() in ['false', 'no']:  # Checking for valid 'False' inputs
               queryset = queryset.filter(valide_payment=False)

            # Paginate and serialize the queryset
            paginator = CustomPagination()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            serializer = CommandeSerializer(paginated_queryset, many=True)

            return paginator.get_paginated_response(serializer.data)

        except CustomUser.DoesNotExist:
            return Response({"error": "Utilisateur non trouvé"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": "Probleme de connexion"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        return Response({"error": "Méthode non autorisée"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

#api________________create_commande_par_client___________________________________________
@api_view(['POST'])

@permission_classes([IsAuthenticated])
@permission_classes([IsClient]) #permission le seul qui peut faire cette api est user avec role client 
def create_commande(request):
    if request.method == 'POST':
        try:
            data=json.loads(request.body)
            magasin_id=data['magasin_id']
            user :CustomUser= CustomUser.objects.get(id=request.user.id)
            magasin:Magasin=Magasin.objects.get(id=magasin_id) #query data for avoir le user 
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND) 
        except Magasin.DoesNotExist :
            return JsonResponse({"message":"magasin do not existe "},status=404) #si le id client not valid returner for une message error
        # Calculate distance in kilometers between client and magasin using Haversine formula

        lan_client = user.latitude
        long_client = user.longitude
        lan_magasin = magasin.owner.latitude
        long_magasin = magasin.owner.longitude

        # Check if all coordinates are present
        if None not in (lan_client, long_client, lan_magasin, long_magasin):
            # Convert latitude and longitude from degrees to radians
            lat1 = radians(lan_client)
            lon1 = radians(long_client)
            lat2 = radians(lan_magasin)
            lon2 = radians(long_magasin)

            # Haversine formula
            dlon = lon2 - lon1
            dlat = lat2 - lat1
            a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
            c = 2 * atan2(sqrt(a), sqrt(1 - a))
            R = 6371  # Radius of Earth in kilometers
            distance_km = R * c
        else:
            distance_km = None
        
        if distance_km is not None:
            # Use the actual distance to determine the delivery price
            if 0 < distance_km <= 3:
                request.data["delivery_price"] = 250
            elif 3 < distance_km <= 6:
                request.data["delivery_price"] = 300
            elif 6 < distance_km <= 9:
                request.data["delivery_price"] = 350
            elif 9 < distance_km <= 12:
                request.data["delivery_price"] = 400
            else:
                force_distance = request.data.get("force_distance") or request.data.get("confirmer_distance")
                if force_distance:
                    extra_km = max(0, distance_km - 12)
                    request.data["delivery_price"] = int(400 + (extra_km * 35))
                else:
                    return JsonResponse({
                        "error_type": "DISTANCE_HIGH",
                        "distance_km": round(distance_km, 1),
                        "message": "le distance est eleve ,commande annule"
                    }, status=400)

            if request.data.get("type_livraison") == "premium":
                request.data["delivery_price"] = request.data.get("delivery_price", 250) + 100


            
        
        
        request.data['client'] = user.pk#add user to request
        request.data['magasin'] =magasin.pk#query to get magasin information
        request.data["livreur"]=None
        request.data["status"]="pending" #etat de la commande en cours par default
        if magasin.EtatOuverture ==False :
            return JsonResponse({"message":"le magasin est ferme "},status=400)

 
    
        print (f"data is {request.data}")
        serializer = CommandeSerializer(data=request.data) #serializer data 
        if serializer.is_valid(): #test les donnes de commande si valide ou pas 
            serializer.save()
            message={
                "message":"la commande est bien cree",
                "commande_id":serializer.data["id"] #return id de commande
            } # cree une commande 
            return JsonResponse({"result":message}, status=status.HTTP_201_CREATED)
        else :#return message de success
            print (f"erooor is : {serializer.errors}")
            return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST) #si le selelizer pas valide return message de error
    else :
        return JsonResponse({'eroor':"methode not allow "},status=405)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_prix_de_de_livraison(request):
    if request.method == 'GET':
        try:
            data = json.loads(request.body)
            magasin_ids = data.get("magasin_ids", None)
            if not magasin_ids or not isinstance(magasin_ids, list):
                return JsonResponse({"error": "magasin_ids must be a list"}, status=400)
            user = CustomUser.objects.get(id=request.user.id)
            magasins = Magasin.objects.filter(id__in=magasin_ids).select_related("owner").prefetch_related("cataloguqe")
            result = []
            for magasin in magasins:
                lan_client = user.latitude
                long_client = user.longitude
                lan_magasin = magasin.owner.latitude
                long_magasin = magasin.owner.longitude

                # Check if all coordinates are present
                if None not in (lan_client, long_client, lan_magasin, long_magasin):
                    # Convert latitude and longitude from degrees to radians
                    lat1 = radians(lan_client)
                    lon1 = radians(long_client)
                    lat2 = radians(lan_magasin)
                    lon2 = radians(long_magasin)

                    # Haversine formula
                    dlon = lon2 - lon1
                    dlat = lat2 - lat1
                    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
                    c = 2 * atan2(sqrt(a), sqrt(1 - a))
                    R = 6371  # Radius of Earth in kilometers
                    distance_km = R * c
                else:
                    distance_km = None

                if distance_km is not None:
                    if 0 < distance_km <= 3:
                        delivery_price = 250
                    elif 3 < distance_km <= 6:
                        delivery_price = 300
                    elif 6 < distance_km <= 9:
                        delivery_price = 350
                    elif 9 < distance_km <= 12:
                        delivery_price = 400
                    else:
                        delivery_price = None
                else:
                    delivery_price = None

                result.append({
                    "magasin_id": magasin.id,
                    "distance": distance_km,
                    "tarif": delivery_price
                })

            return JsonResponse({"data": result}, status=200)
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Magasin.DoesNotExist:
            return JsonResponse({"message": "magasin do not existe"}, status=404)
        except Exception as e:
            return JsonResponse({"message": "Impossible de calculer la distance"}, status=400)
        
        

# version no complete de creation de livreures 
@api_view(["POST"])
def create_livreur_solo (request):
        #he neeed to create partner and than create livraiosn 
        if request.method=="POST" :
            try :
                data= json.loads(request.body) 
                partener_id=data.get("partner_id") #avoir le partner id en forme json 
                partener_cible=Partenneur.objects.get(id=partener_id) #get partener qui a partner id 
                data = json.loads(request.body)
                phone = data.get('phone') #avoir le num de telephone en forme json 
                wilaya=data.get("wilaya")
                Livreur.objects.create(partenneur=partener_cible,wilaya=partener_cible.user.wilaya) #query to get livreur information
                if Livreur.objects.get(partenneur=partener_cible) :  
                    return JsonResponse({"message":"tu peut pas cree deusieme compte livreur "},status=404) #si existe le livreur dans le base de donne return error message 
                return JsonResponse({"message":"le compte livreur est cree  "},status=201) # return message de success quand le livreur est cree
            except Partenneur.DoesNotExist :
                return JsonResponse({"eroor":"id partenneur not valide "},status=404) #return message de error si le partner exite pas dans la base de donne 
            except Exception as e  :
                return JsonResponse({"erooor":"Probleme de connexion"},status=500) 
        else :
            return JsonResponse({'eroor':"method not alllow "},status=405) #return message de error si le request est method pas post 
WILAYA_CODE_NAME_MAP = {
    1: "adrar", 2: "chlef", 3: "laghouat", 4: "oum el bouaghi", 5: "batna",
    6: "bejaia", 7: "biskra", 8: "bechar", 9: "blida", 10: "bouira",
    11: "tamanrasset", 12: "tebessa", 13: "tlemcen", 14: "tiaret", 15: "tizi ouzou",
    16: "alger", 17: "djelfa", 18: "jijel", 19: "setif", 20: "saida",
    21: "skikda", 22: "sidi bel abbes", 23: "annaba", 24: "guelma", 25: "constantine",
    26: "medea", 27: "mostaganem", 28: "msila", 29: "mascara", 30: "ouargla",
    31: "oran", 32: "el bayadh", 33: "illizi", 34: "bordj bou arreridj", 35: "boumerdes",
    36: "el tarf", 37: "tindouf", 38: "tissemsilt", 39: "el oued", 40: "khenchela",
    41: "souk ahras", 42: "tipaza", 43: "mila", 44: "ain defla", 45: "naama",
    46: "ain temouchent", 47: "ghardaia", 48: "relizane", 49: "timimoun", 50: "bordj badji mokhtar",
    51: "ouled djellal", 52: "beni abbes", 53: "in salah", 54: "in guezzam", 55: "touggourt",
    56: "djanet", 57: "el mghair", 58: "el meniaa"
}

def ensure_magasins_exist():
    try:
        # Delete any Magasin records created by mistake for livreurs/chauffeurs/vtc
        Magasin.objects.filter(
            Q(owner__type_compte__name__in=['livreur', 'choffeur', 'chauffeur', 'vtc']) |
            Q(owner__type_compte__name__icontains='chauf') |
            Q(owner__type_compte__name__icontains='chof') |
            Q(owner__type_compte__name__icontains='vtc') |
            Q(owner__type_compte__name__icontains='livr') |
            Q(owner__vihucule__isnull=False) |
            Q(owner__user__role__in=['livreur', 'driver']) |
            Q(name__icontains='chauffeur') |
            Q(name__icontains='choffeur')
        ).delete()

        # Get all real store partners only (exclude chauffeurs and livreurs)
        partners = Partenneur.objects.select_related('user', 'type_compte').filter(
            Q(type_compte__name__in=['magasin', 'starshop', 'restaurant', 'store', 'shop'])
        ).exclude(
            Q(type_compte__name__icontains='chauf') |
            Q(type_compte__name__icontains='chof') |
            Q(type_compte__name__icontains='vtc') |
            Q(type_compte__name__icontains='livr') |
            Q(vihucule__isnull=False)
        )

        for p in partners:
            u = p.user
            w_code = getattr(u, 'wilaya_code', None)
            w_name = getattr(u, 'wilaya', None)
            w_val = str(w_code or w_name or "")
            
            magasin, created = Magasin.objects.get_or_create(
                owner=p,
                defaults={
                    "name": p.nom_de_magasin or u.first_name or u.username,
                    "address": p.adresse or "Adresse non spécifiée",
                    "wilaya": w_val,
                    "is_active": True,
                    "EtatOuverture": True,
                }
            )
            updated = False
            if not magasin.EtatOuverture:
                magasin.EtatOuverture = True
                updated = True
            if not magasin.is_active:
                magasin.is_active = True
                updated = True
            if not magasin.wilaya and w_val:
                magasin.wilaya = w_val
                updated = True
            if updated:
                magasin.save()
    except Exception as e:
        logger.error(f"Error in ensure_magasins_exist: {e}")

def get_wilaya_criteria(user, wilaya_param=None):
    codes = set()
    names = set()

    if wilaya_param:
        param_str = str(wilaya_param).strip()
        if param_str.isdigit():
            c = int(param_str)
            codes.add(c)
            if c in WILAYA_CODE_NAME_MAP:
                names.add(WILAYA_CODE_NAME_MAP[c])
        else:
            names.add(param_str.lower())

    if user and user.is_authenticated:
        w_code = getattr(user, 'wilaya_code', None)
        if w_code:
            try:
                c = int(w_code)
                codes.add(c)
                if c in WILAYA_CODE_NAME_MAP:
                    names.add(WILAYA_CODE_NAME_MAP[c])
            except (ValueError, TypeError):
                pass

        w_name = getattr(user, 'wilaya', None)
        if w_name:
            n_str = str(w_name).strip()
            if n_str.isdigit():
                c = int(n_str)
                codes.add(c)
                if c in WILAYA_CODE_NAME_MAP:
                    names.add(WILAYA_CODE_NAME_MAP[c])
            else:
                names.add(n_str.lower())

    return codes, names

def filter_magasins_by_wilaya(queryset, user, wilaya_param=None):
    codes, names = get_wilaya_criteria(user, wilaya_param)
    
    q_filter = Q()
    for code in codes:
        q_filter |= Q(owner__user__wilaya_code=code)
        q_filter |= Q(owner__user__wilaya__iexact=str(code))
        q_filter |= Q(wilaya__iexact=str(code))

    for name in names:
        q_filter |= Q(owner__user__wilaya__icontains=name)
        q_filter |= Q(wilaya__icontains=name)

    if q_filter:
        filtered = queryset.filter(q_filter)
        if filtered.exists():
            return filtered

    return queryset

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def liste_magasin_par_client(request):
    if request.method == "GET":
        try:
            ensure_magasins_exist()
            catalogue_id = request.GET.get("catalogue", None)
            name = request.GET.get("name", None)
            wilaya_param = request.GET.get("wilaya", None) or request.GET.get("wilaya_code", None)
            page_number = request.GET.get('page', 1)
            page_size = request.GET.get('page_size', 10)

            queryset = Magasin.objects.filter(is_active=True).select_related("owner", "owner__user").prefetch_related("cataloguqe").order_by(F('ordre').asc(nulls_last=True), '-id')

            queryset = filter_magasins_by_wilaya(queryset, request.user, wilaya_param)

            if catalogue_id:
                queryset = queryset.filter(cataloguqe__id__in=[catalogue_id])
            if name:
                queryset = queryset.filter(name__icontains=name)

            try:
                page_number = int(page_number)
            except ValueError:
                page_number = 1

            try:
                page_size = int(page_size)
                if page_size < 1:
                    page_size = 10
            except ValueError:
                page_size = 10

            paginator = Paginator(queryset, page_size)
            try:
                current_page = paginator.page(page_number)
            except PageNotAnInteger:
                current_page = paginator.page(1)
            except EmptyPage:
                response_data = {
                    'magasins': [],
                    'total': 0,
                    'page': page_number,
                    'page_size': 0,
                    'total_pages': 0,
                }
                return JsonResponse(response_data, status=200)

            serializer = MagasinSerializer(current_page, many=True)
            response_data = {
                'magasins': serializer.data,
                'total': paginator.count,
                'page': page_number,
                'page_size': page_size,
                'total_pages': paginator.num_pages,
            }
            return JsonResponse(response_data, safe=False, status=200)
        except Exception as e:
            logger.error(f"Error in liste_magasin_par_client: {e}")
            return JsonResponse({'message': "erreur serveur"}, status=500)
    else:
        return JsonResponse({'message': "probleme de connexion "}, status=405)
    
@api_view(["GET"])
@permission_classes([IsClient])
def produis_hot (request ):
    if request.method =="GET" :
        try :
            ensure_magasins_exist()
            codes, names = get_wilaya_criteria(request.user)

            q_filter = Q()
            for code in codes:
                q_filter |= Q(magasin__owner__user__wilaya_code=code)
                q_filter |= Q(magasin__wilaya__iexact=str(code))
            for name in names:
                q_filter |= Q(magasin__owner__user__wilaya__icontains=name)
                q_filter |= Q(magasin__wilaya__icontains=name)

            if q_filter:
                produis_queryset = Produis.objects.filter(q_filter, magasin__is_active=True).select_related("magasin").order_by("-rating")
            else:
                produis_queryset = Produis.objects.filter(magasin__is_active=True).select_related("magasin").order_by("-rating")

            seen_magasin_ids = set()
            unique_produis = []
            for produit in produis_queryset:
                if produit.magasin_id not in seen_magasin_ids:
                    unique_produis.append(produit)
                    seen_magasin_ids.add(produit.magasin_id)
                if len(unique_produis) >= 5:
                    break
            produis = unique_produis
            selezers=ProduisSerializer(produis,many=True)
            return JsonResponse({"data":selezers.data},status=200)
        except Produis.DoesNotExist :
            return JsonResponse({"data":[]},status=200)
        except Exception as e :
            return JsonResponse({"data":str(e)},status=500)
    else :
        return JsonResponse({"message":"probleme de connewion "},status=500)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_catalogue_magasin (request):
    if request.method=="GET":
        try :
            type_filter = request.GET.get('type', None)
            if type_filter:
                catalogues = Catlogue.objects.filter(type__name__icontains=type_filter).select_related("type")
            else:
                catalogues = Catlogue.objects.all().select_related("type")
            selezers = CatalogueSerializer(catalogues, many=True)
            return JsonResponse({"message": selezers.data}, status=200)
        except Exception as e:
            return JsonResponse({"data": [], "error": str(e)}, status=200)
    else :
        return JsonResponse({"message":"method not allow"},status=500)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_produis_magasin(request):
    if request.method == "GET":
        try:
            magasin_id = request.GET.get('magasin_id')
            if not magasin_id and request.body:
                try:
                    data = json.loads(request.body)
                    magasin_id = data.get("magasin_id")
                except Exception:
                    pass

            if not magasin_id:
                return JsonResponse({"message": "magasin_id est requis", "results": [], "count": 0}, status=400)

            name = request.GET.get('name', None)
            catalogue = request.GET.get('catalogue', None)

            query_set = Produis.objects.filter(magasin__id=magasin_id).select_related("magasin", "catalogue").order_by(F('ordre').asc(nulls_last=True), "-id")

            if name:
                query_set = query_set.filter(name__icontains=name)
            if catalogue:
                query_set = query_set.filter(catalogue__id=catalogue)

            # Paginate the queryset
            paginator = CustomPagination()
            paginated_queryset = paginator.paginate_queryset(query_set, request)
            serializer = ProduisSerializer(paginated_queryset, many=True)

            return paginator.get_paginated_response(serializer.data)
        except Magasin.DoesNotExist:
            return JsonResponse({"message": "Magasin non trouvé"}, status=404)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)
    else:
        return JsonResponse({"message": "Méthode non autorisée"}, status=405)


# @api_view(["POST"])
# @parser_classes([MultiPartParser])
# def add_produis(request):
    
#     if request.method == "POST":
#         try :
#             data = request.data.copy()  # Get data from multipart/form-data
#             magasin_id = data.get("magasin_id")
#             image_file=request.FILES.get("image")
#             catalogue_id=data.get("catalogue_id")
            
            
#             print (f"catalogue_id is : {catalogue_id}")
#             print (f"magasin id : {magasin_id}")
#             print (f"data is {data}")
            
            
            
            
            
            
#             # Validate magasin_id
#             if not Magasin.objects.filter(id=magasin_id).exists():
#                 return Response({"message": "Invalid magasin ID"}, status=status.HTTP_404_NOT_FOUND)
#             magasin_cible = Magasin.objects.get (id=magasin_id)
            
            
#             # Assign magasin ID to the data
#             data["magasin"] = magasin_id
            
#             image_file = request.FILES.get('image')  # Key should be 'image_url'
                
#             if not image_file:
#                     return JsonResponse({"message": "Aucun fichier téléchargé"}, status=400)

#                 # Validate the file type
#             filename = image_file.name.lower()
                
#             if not filename.endswith(('.jpg', '.jpeg', '.png',".webp")):
#                     return JsonResponse(
#                         {'message': 'Seuls les fichiers JPG, JPEG, PNG et webp  sont autorisés'}, 
#                         status=400
#                     )
                
#             if image_file.size > 5 * 1024 * 1024:  # 5MB
#                     return JsonResponse(
#                         {'message': 'La taille de l\'image ne doit pas dépasser 5MB'}, 
#                         status=400
#                     )
#             data["catalogue"]=catalogue_id
#             # Create PrixStarshop instance and assign its ID to prixstar_ids
#             # prix can be a list of dicts or a single dict
#             # Extract prix_list from request.data (handling QueryDict with keys like 'prix_starshop[prix][0]')
#             prix_list = []
#             # Find all indices for prix_starshop[prix][i]
#             indices = []
#             for key in data.keys():
#                 if key.startswith("prix_starshop[prix]["):
#                     idx = key.split("[")[-1].split("]")[0]
#                     if idx.isdigit():
#                         indices.append(int(idx))
#             indices = sorted(set(indices))
#             for idx in indices:
#                 prix_value = data.get(f"prix_starshop[prix][{idx}]")
#                 quantity_value = data.get(f"prix_starshop[quantity][{idx}]")
#                 if prix_value is not None and quantity_value is not None:
#                     prix_list.append({
#                     "prix": prix_value,
#                     "quantity": quantity_value
#                 })
#             # Fallback: if no indexed keys, try single prix/quantity
#             if not prix_list and data.get("prix") and data.get("quantity"):
#                 prix_list = [{
#                 "prix": data.get("prix"),
#                 "quantity": data.get("quantity")
#                 }]
#             prixstar_idss = [] 
#             for prix_item in prix_list:
#                 selizzer_prix = PrixStarshopSerializer(data=prix_item)
                
#                 if selizzer_prix.is_valid():
#                     prix_instance = selizzer_prix.save()
#                     prixstar_idss.append(prix_instance.id)
#                 else:
#                     return Response(
#                     {"message": str(selizzer_prix.errors)},
#                     status=400
#                 )
#             print (f"after save prix ")
            
            
        
        

#     # With this:
#             # Flatten the list if it's nested (should be a flat list of ints)
#             if any(isinstance(i, list) for i in prixstar_idss):
#                 prixstar_idss = [item for sublist in prixstar_idss for item in sublist]
#             # Ensure prixstar_idss is a flat list of ints
#             prixstar_idss = [int(i) for i in prixstar_idss]
#             print (f'prix ids is : {prixstar_idss}')
#             data.setlist("prixstar_ids", [str(i) for i in prixstar_idss])  # For QueryDict compatibility
#             print (f"data is : {data}")
#             # Validate and save the product
#             serializer = ProduisSerializer(data=data,many=True)
#             if serializer.is_valid():
#                 print (f'the document is valid ')
#                 print (f"catalogue id : {catalogue_id}")
#                 print (f"prix starshop is : {prixstar_idss}")
#                 print (f"magasin id : {magasin_cible.pk}")
#                 produis :Produis =serializer.save()
#                 if catalogue_id and not magasin_cible.cataloguqe.filter(id=catalogue_id).exists():
#                     magasin_cible.cataloguqe.add(catalogue_id)
#                     print (f"catalogue ")
                
#                 # print ("iam hete to set prix starshop")
#                 # for i in prixstar_idss :
#                 #     produis.prixstar_shop.add(i)  
                        
               
#                 return Response(
#                         {"message": serializer.data},
#                         status=status.HTTP_201_CREATED
#                     )
#             # for n in magasin.   """quand je """
#             else:
#                 print (f"probleme is :{serializer.errors} ")
#                 errors = serializer.errors
#                 # Extract the first error message
#                 if 'non_field_errors' in errors:
#                     first_error = errors['non_field_errors'][0]
#                 else:
#                     # Get the first field error
#                     first_field = next(iter(errors))
#                     first_error = errors[first_field][0]

#                 return Response(
#                     {"message": str(first_error)},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )
#         except Magasin.DoesNotExist:
#             return JsonResponse({"message":"magasin not valide "},status=404    )
#         except Exception as e :
#             return JsonResponse({"message de exception ":str(e)},status=500)
#     else:
#             return Response(
#                 {'error': "Méthode non autorisée"},
#                 status=status.HTTP_405_METHOD_NOT_ALLOWED
#             )
@api_view(["POST"])
@parser_classes([MultiPartParser])
def add_produis(request):
    if request.method == "POST":
        try:
            data = request.data.copy()
            magasin_id = data.get("magasin_id")
            image_file = request.FILES.get("image")
            catalogue_id = data.get("catalogue_id")

            # Validate Magasin
            if not Magasin.objects.filter(id=magasin_id).exists():



                return Response({"message": "Invalid magasin ID"}, status=status.HTTP_404_NOT_FOUND)
            magasin_cible = Magasin.objects.get(id=magasin_id)

            # Assign magasin and catalogue to data
            data["magasin"] = magasin_id
            data["catalogue"] = catalogue_id

            # Validate Image
            if not image_file:
                return JsonResponse({"message": "Aucun fichier téléchargé"}, status=400)
            filename = image_file.name.lower()
            if not filename.endswith(('.jpg', '.jpeg', '.png', ".webp")):
                return JsonResponse(
                    {'message': 'Seuls les fichiers JPG, JPEG, PNG et webp sont autorisés'}, 
                    status=400
                )
            if image_file.size > 5 * 1024 * 1024:  # 5MB
                return JsonResponse(
                    {'message': 'La taille de l\'image ne doit pas dépasser 5MB'}, 
                    status=400
                )

            # Process PrixStarshop data
            prix_list = []
            indices = []
            for key in data.keys():
                if key.startswith("prix_starshop[prix]["):
                    idx = key.split("[")[-1].split("]")[0]
                    if idx.isdigit():
                        indices.append(int(idx))
            indices = sorted(set(indices))
            for idx in indices:
                prix_value = data.get(f"prix_starshop[prix][{idx}]")
                quantity_value = data.get(f"prix_starshop[quantity][{idx}]")
                if prix_value and quantity_value:
                    prix_list.append({"prix": prix_value, "quantity": quantity_value})
            # Fallback for single prix/quantity
            if not prix_list and data.get("prix") and data.get("quantity"):
                prix_list = [{"prix": data.get("prix"), "quantity": data.get("quantity")}]

            # Create PrixStarshop instances
            prixstar_ids = []
            for prix_item in prix_list:
                serializer_prix = PrixStarshopSerializer(data=prix_item)
                if serializer_prix.is_valid():
                    prix_instance = serializer_prix.save()
                    
                    prixstar_ids.append(prix_instance.id)
                else:



                    print (f"PrixStarshop validation errors: {serializer_prix.errors}")

                    return Response(


                        {"message": serializer_prix.errors}, 
                        status=400
                    )

            # Assign prixstar_ids to data (for QueryDict compatibility)
            data.setlist("prixstar_ids", [str(i) for i in prixstar_ids])
            # Validate and save Produis
            

            # Remove read-only fields from data before passing to serializer
            data.pop('magasin', None)
            data.pop('catalogue_name', None)
            serializer = ProduisSerializer(data=data)  # many=False by default
            if serializer.is_valid():
                

                produis = serializer.save()
                
                
                
                # Set prixstar_shop many-to-many field after saving the Produis instance
                if prixstar_ids:
                    
                    produis.prixstar_shop.set(prixstar_ids)


                # Link catalogue to magasin if needed
                if catalogue_id and not magasin_cible.cataloguqe.filter(id=catalogue_id).exists():
                    magasin_cible.cataloguqe.add(catalogue_id)
                
                return Response(
                    {"message": "Produit créé avec succès", "data": ProduisSerializer(produis).data},
                    status=status.HTTP_201_CREATED
                )
            else:

                print (f"Validation errors: {serializer.errors}")


                return Response(
                    {"message": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Magasin.DoesNotExist:


            return Response({"message": "Magasin invalide"}, status=404)
        except Exception as e:
            
            return Response({"message":"probleme de connexion"}, status=500)


    else:
        return Response(
            {'error': "Méthode non autorisée"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    
@api_view(['GET'])
def magasin_par_catalogue(request):
    if request.method == "GET":
        try:
            data=json.loads(request.body)
            catalogue_id=data.get("catalogue_id")
            catalogue = Catlogue.objects.get(id=catalogue_id)
            magasins = Magasin.objects.filter(cataloguqe=catalogue).select_related("owner","cataloguqe")
            serializer = MagasinSerializer(magasins, many=True)
            
            # Include both the message and the serialized data in a single dictionary
            return JsonResponse(
                {"message": "success", "data": serializer.data},
                status=200
            )
        
        except Catlogue.DoesNotExist:
            return JsonResponse({"error": "Catalogue ID not found"}, status=404)
        
        except Exception as e:
            return JsonResponse({"error": "Probleme de connexion"}, status=500)
    
    return JsonResponse({"error": "Method not allowed"}, status=405)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_all_catalogue(request):
    if request.method == "GET":
        try:
            partenneur = Partenneur.objects.filter(user=request.user).first()
            if partenneur and partenneur.type_compte:
                queryset = Catlogue.objects.filter(type=partenneur.type_compte).select_related("type")
                if not queryset.exists():
                    magasin = Magasin.objects.filter(owner=partenneur).first()
                    if magasin and magasin.cataloguqe.exists():
                        queryset = magasin.cataloguqe.all().select_related("type")
                    else:
                        queryset = Catlogue.objects.all().select_related("type")
            else:
                queryset = Catlogue.objects.all().select_related("type")
            
            serializer = CatalogueSerializer(queryset, many=True)
            return JsonResponse({"message": "success", "data": serializer.data}, status=200)
        except Exception as e:
            return JsonResponse({"message": "error", "error": str(e), "data": []}, status=500)
    else:
        return JsonResponse({"error": "method not allowed"}, status=405)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_catalogue_api(request):
    if request.method == "POST":
        try:
            name = request.data.get("name")
            description = request.data.get("description", "")
            magasin_id = request.data.get("magasin_id")

            if not name:
                return JsonResponse({"message": "Le nom du catalogue est requis"}, status=400)

            # Check if exists or create
            catalogue, created = Catlogue.objects.get_or_create(
                name=name.strip(),
                defaults={"description": description}
            )

            if magasin_id:
                try:
                    magasin = Magasin.objects.get(id=magasin_id)
                    magasin.cataloguqe.add(catalogue)
                except Magasin.DoesNotExist:
                    pass

            return JsonResponse({
                "message": "Catalogue créé avec succès",
                "data": CatalogueSerializer(catalogue).data
            }, status=201 if created else 200)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)
    return JsonResponse({"message": "Méthode non autorisée"}, status=405)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def add_catalogue_to_magasin(request):
    if request.method == "POST":
        try:
            magasin_id = request.data.get("magasin_id")
            catalogue_id = request.data.get("catalogue_id")
            catalogue_name = request.data.get("catalogue_name")

            if not magasin_id:
                return JsonResponse({"message": "magasin_id est requis"}, status=400)

            magasin = Magasin.objects.get(id=magasin_id)

            if catalogue_id:
                catalogue = Catlogue.objects.get(id=catalogue_id)
            elif catalogue_name:
                catalogue, _ = Catlogue.objects.get_or_create(name=catalogue_name.strip())
            else:
                return JsonResponse({"message": "catalogue_id ou catalogue_name requis"}, status=400)

            magasin.cataloguqe.add(catalogue)
            return JsonResponse({
                "message": "Catalogue associé au magasin",
                "catalogue": CatalogueSerializer(catalogue).data
            }, status=200)
        except Magasin.DoesNotExist:
            return JsonResponse({"message": "Magasin non trouvé"}, status=404)
        except Catlogue.DoesNotExist:
            return JsonResponse({"message": "Catalogue non trouvé"}, status=404)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)
    return JsonResponse({"message": "Méthode non autorisée"}, status=405)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def remove_catalogue_from_magasin(request):
    if request.method == "POST":
        try:
            magasin_id = request.data.get("magasin_id")
            catalogue_id = request.data.get("catalogue_id")

            if not magasin_id or not catalogue_id:
                return JsonResponse({"message": "magasin_id et catalogue_id requis"}, status=400)

            magasin = Magasin.objects.get(id=magasin_id)
            catalogue = Catlogue.objects.get(id=catalogue_id)
            magasin.cataloguqe.remove(catalogue)

            return JsonResponse({"message": "Catalogue retiré du magasin"}, status=200)
        except Magasin.DoesNotExist:
            return JsonResponse({"message": "Magasin non trouvé"}, status=404)
        except Catlogue.DoesNotExist:
            return JsonResponse({"message": "Catalogue non trouvé"}, status=404)
        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)
    return JsonResponse({"message": "Méthode non autorisée"}, status=405)

    


@api_view(["POST"])

def create_commande_articles(request):
    if request.method == "POST":
        try:
            # Retrieve the client instance
            client = CustomUser.objects.get(id=request.user.id)

            # Parse the request body to get the data
            data = json.loads(request.body)

            # Extract the magasin and livreur IDs
            magasin_id = data.get('magasin')
            livreur_id = data.get('livreur', None)
            id_produis = data.get('id_produis', [])

            # Retrieve the magasin and livreur instances
            magasin = Magasin.objects.get(id=magasin_id)
            livreur = Livreur.objects.get(id=livreur_id) if livreur_id else None

            
            commande = Commande(
                client=client,
                magasin=magasin,
                livreur=livreur,
                total_price=Decimal('0.00'),  # Total price as Decimal
                delivery_price=Decimal('5.00'),  # Example fixed delivery price as Decimal
                status='pending'  # Initial status
            )
            commande.save()

            # Add articles to the commande and calculate total price
            total_price = Decimal('0.00')  # Ensure total_price is a Decimal
            for produit_id in id_produis:
                produit = Produis.objects.get(id=produit_id)
                quantity = 1  

                # Create CommandeArticle instance
                commande_article = CommandeArticle(
                    commande=commande,
                    article=produit,
                    quantity=quantity,
                    subtotal=produit.price * quantity  # produit.price should be Decimal
                )
                
                commande_article.save()

                # Add to the total price
                total_price += commande_article.subtotal  # Both are now Decimal types

            # Update total price in the commande
            commande.total_price = total_price
            commande.save()

            return JsonResponse({
                "message": "Commande créée avec succès",
                "commande_id": commande.id,
                "total_price": str(total_price)  # Convert to string for JSON serialization
            }, status=201)

        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Client non trouvé"}, status=404)
        except Magasin.DoesNotExist:
            return JsonResponse({"error": "Magasin non trouvé"}, status=404)
        except Livreur.DoesNotExist:
            return JsonResponse({"error": "Livreur non trouvé"}, status=404)
        except Produis.DoesNotExist:
            return JsonResponse({"error": "Produit non trouvé"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Données JSON invalides"}, status=400)
        except Exception as e:
            return JsonResponse({"error": "Probleme de connexion"}, status=500)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
@permission_classes([IsPertener])
def commande_par_magasin(request):
    if request.method == 'GET':
        try:
            data = json.loads(request.body)
            magasin_id = data.get("magasin_id")
            etat = request.GET.get("etat", "")
            commande_id=request.GET.get("id","")
            
            queryset = Commande.objects.filter(magasin__id=magasin_id).select_related('livreur', "magasin", "client").order_by("-id")
            if etat :
                queryset=queryset.filter(status=etat)
            if commande_id :
                queryset=queryset.filter(id=commande_id)
            
            # Paginate the queryset
            paginator = CustomPagination()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            serializer = CommandeSerializer(paginated_queryset, many=True)
            
            return paginator.get_paginated_response(serializer.data)
        except Magasin.DoesNotExist:
            return JsonResponse({"error": "magasin id not valid"}, status=404)
    else:
        return JsonResponse({'error': "method not allowed"}, status=405)

@api_view(["GET"])
@permission_classes([IsPertener | IsClient |IsCentreappel])
def articles_pour_commande(request):
    if request.method in ["GET", "POST"]:
        try:
            data = {}
            if request.body:
                try:
                    data = json.loads(request.body)
                except Exception:
                    data = {}
            commande_id = data.get("commande_id") or request.GET.get("commande_id")
            if not commande_id:
                return JsonResponse({"error": "commande_id is required"}, status=400)
            
            queryset = CommandeArticle.objects.filter(commande__id=commande_id).select_related("commande", "article").prefetch_related("commande__magasin__cataloguqe")
            serializer = CommandeArticleSerializer(queryset, many=True)
            
            commande_obj = Commande.objects.filter(id=commande_id).select_related("magasin", "livreur__partenneur__user", "client").first()
            commande_data = CommandeSerializer(commande_obj).data if commande_obj else None
            
            return JsonResponse({
                "message": "la liste les artices succes recuperer ",
                "data": serializer.data,
                "commande": commande_data
            }, status=200)
        except Commande.DoesNotExist:
            return JsonResponse({"error": "commande id not valide "}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "method not allow "}, status=405)
    

@api_view(["PATCH"])
@permission_classes([IsAgentAdmin or Ischefbureux])
@permission_classes([IsAuthenticated])
def valider_le_payment(request) :
    if request.method=="PATCH" :
        try :
            data=json.loads(request.body)
            commande_id=data.get("commande_id")
            commande_cible=Commande.objects.get(id=commande_id)
            emplois=CustomUser.objects.get(id=request.user.id)
            commande_cible.valide_payment=True
            commande_cible.emp_val=emplois 
            commande_cible.save()
            return JsonResponse({"message":"le commande est bien paye par le livreur "},status=200)
        except Commande.DoesNotExist :
            return JsonResponse({"eoor":"le commande id not valide "},status=404)
        except CustomUser.DoesNotExist :
            return JsonResponse({"eroor":"le emlpois idis not valide "},status=404)
    else :
        return JsonResponse({"eroor":"le method not alllow "},status=405)
@api_view(["GET"])
@permission_classes([IsAgentAdmin ])
@permission_classes([IsAuthenticated])
def get_credi_emplois(request):
    if request.method == 'GET':
        try:
            # Get the emplois (user) object
            print(f"request is is : {request.user.id}")
            emplois_cible = CustomUser.objects.get(id=request.user.id)

            # Get the PaymentEmplois object for the emplois
            queryset = PaymentEmplois.objects.filter(emplois=emplois_cible).select_related("emplois")

            if not queryset.exists():
                return JsonResponse({"error": "No payment records found for this user"}, status=404)

            # Serialize the queryset
            serializer = PaymentEmploisSerializer(queryset, many=True)

            return JsonResponse({"message": "Credit is ready", "data": serializer.data}, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Invalid user ID"}, status=404)
        except Exception as e:
            return JsonResponse({"error": "Probleme de connexion"}, status=500)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)
    
#api pour les chef bureux cree les livreurs
api_view(['POST'])
@permission_classes([Ischefbureux])
def create_livreur_chefbureux(request):
    if request.method=="POST" :
     try:
       
      

        # Access the incoming JSON data
        data = json.loads(request.body)
        print(f"Request body: {request.body}")

        chefbureau_cible = CustomUser.objects.get(id=request.user.id)

        # Extract user and livreur details
        user_data = data.get("user")
        partenneur_data = data.get("partenneur", {})
        is_available = data.get("is_available", False)
        wilaya = data.get("wilaya")


        if not user_data:
            return JsonResponse({"error": "User data is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        user = CustomUser.objects.create_user(
            username=user_data.get("username"),
            email=user_data.get("email"),
            password=user_data.get("password"),
            first_name=user_data.get("first_name"),
            last_name=user_data.get("last_name"),
            groupe=chefbureau_cible.pk,
            wilaya=chefbureau_cible.wilaya
        )
        partener = Partenneur.objects.create(user=user)

        # Create livreur
        livreur = Livreur.objects.create(
            partenneur=partener,
            is_available=is_available,
            wilaya=chefbureau_cible.wilaya,
        )

        return JsonResponse(
            {"message": "Livreur créé avec succès!", "livreur_id": livreur.id},
            status=status.HTTP_201_CREATED,
        )
     except Exception as e:
        return JsonResponse({"error": "Probleme de connexion"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
     

@api_view(["GET"])
@permission_classes([Ischefbureux])
def get_all_livreur_de_chef_bu(request):
    if request.method=='GET' :
     try :
        
        livreures=Livreur.objects.filter(partenneur__user__groupe=request.user.id)
        
        serializer=LivreurSerializer(livreures,many=True)
        return JsonResponse(serializer.data,status=200,safe=False)
     except CustomUser.DoesNotExist :
        return JsonResponse({"eroor":"id chef bureux not valide "},status=404)
    else :
        return JsonResponse({"eroor":"method not alllow "},status=405)
@api_view(["GET"])
def all_commande_par_groupe(request):
    if request.method=='GET' :
        try :
            today = date.today()
            print(f'today : {today}')
            filtered_commandes = Commande.objects.filter( livreur__partenneur__user__groupe=request.user.id).select_related('client')
            print(filtered_commandes)
            serializer=CommandeSerializer(filtered_commandes,many=True)
            return JsonResponse(serializer.data,status=200,safe=False)
        except Commande.DoesNotExist :
            return JsonResponse({"eroos":"filter commande not working "},status=404)
    else :
        return JsonResponse({"eroor":'method not allow'},status=405)
@api_view(["GET"])
@permission_classes([Islivreur])
def get_credi_de_livreur(request):
    if request.method == 'GET':
        try:
            
            partenneur =Partenneur.objects.get(user__id=request.user.id)
            
            livreur_cible = Payment_de_livreur.objects.get(liveur__partenneur__id=partenneur.id)
            serializer = PyamentLivreurSerialize(livreur_cible)  # Remove many=True
            return JsonResponse(serializer.data, status=200)
        except Payment_de_livreur.DoesNotExist:
            return JsonResponse({"error": "id livreur not valid"}, status=404)
    else:
        return JsonResponse({'error': "method not allowed"}, status=405)
@api_view(["GET"])
@permission_classes([Ischefbureux])

#api de afficheer tout les actions de chef bureux 
def get_action_for_chef_bureux_x(request):
    if request.method == 'GET':
        try:
            search_phone = request.GET.get('search', '')
            username = request.GET.get("username", "")
            date = request.GET.get("date", "")
            agent = request.GET.get("agent")
            
            # Base queryset
            queryset = Actions.objects.filter(agent__groupe=request.user.id)
            
            # Apply filters
            if search_phone:
                queryset = queryset.filter(agent__phone_number_1__icontains=search_phone)
            if username:
                queryset = queryset.filter(agent__username__icontains=username)
            if date:
                queryset = queryset.filter(date_action__icontains=date)
            if agent:
                queryset = queryset.filter(agent__id=agent)
            
            # Calculate TOTAL AMOUNT for all filtered actions
            total_amount = queryset.aggregate(total=Sum('total_amount'))['total'] or 0
            
            # Paginate the queryset
            paginator = Paginator(queryset.select_related("agent", "livreur").order_by("-id"), 20)
            page_number = request.GET.get('page', 1)
            page_obj = paginator.get_page(page_number)
            
            # Serialize the data
            serializers = ActionsSerlaizers(page_obj.object_list, many=True)
            
            return Response({
                'count': paginator.count,
                'next': page_obj.has_next(),
                'previous': page_obj.has_previous(),
                'results': serializers.data,
                "prix_count": total_amount  # Return the total directly (e.g., 35000.0)
            })
            
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "chef bureux id not valide"}, status=404)
    else:
        return JsonResponse({"error": "method not allowed"}, status=405)

@api_view(["GET"])
@permission_classes([IsPertener])
def get_magasin_info(request):
    if request.method == 'GET':
        try:
            perteneur = Partenneur.objects.get(
                Q(type_compte__name="magasin") | Q(type_compte__name="starshop"),
                user__id=request.user.id
            )
             
            magasin, _ = Magasin.objects.get_or_create(
                owner=perteneur,
                defaults={
                    "name": perteneur.nom_de_magasin or perteneur.user.username,
                    "address": perteneur.adresse or "Adresse non spécifiée",
                    "wilaya": getattr(perteneur.user, "wilaya_code", "") or "",
                }
            )
            serializer = MagasinSerializer(magasin)
            return JsonResponse(serializer.data, status=200)
            
        except Partenneur.DoesNotExist:
            return JsonResponse({"message": "vous avez pas access a cette platforme "}, status=404)
        except Exception as e:
            logger.error(f"Error in get_magasin_info: {e}")
            return JsonResponse({"message": "Erreur serveur"}, status=500)
    else:
        return JsonResponse({"message": "method not allowed"}, status=405)
@api_view(["PUT"])
@permission_classes([IsPertener])  # Fixed typo in permission class name
def update_magasin(request):
    if request.method == 'PUT':
        try:
            # Get data from request
            magasin_id = request.data.get("magasin_id")
            catalogue_ids = request.data.get('catalogue')
            
            
            # Validate required fields
            if not magasin_id:
                return Response({"error": "magasin_id is required"}, status=status.HTTP_400_BAD_REQUEST)


            # Get and validate magasin
            magasin = Magasin.objects.get(id=magasin_id)
            
            # Verify ownership
            if magasin.owner.user != request.user:
                return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)

            if catalogue_ids : 
                try:
                    catalogue_ids = [int(cid) for cid in catalogue_ids]
                except (ValueError, TypeError):
                    return Response({"error": "Invalid catalogue ID format"}, status=status.HTTP_400_BAD_REQUEST)

            # Update data dictionary
            update_data = request.data.copy()
            

            # Serialize and validate
            serializer = MagasinSerializer(
                magasin, 
                data=update_data, 
                partial=True,
                context={'request': request}
            )
            print (f"data is : {request.data}")
            if serializer.is_valid():
                # Save and update M2M relationship
                instance = serializer.save()
                if catalogue_ids is not None :
                 instance.cataloguqe.set(catalogue_ids)
                
                return Response({
                    "message": "vous avez modifier le magasin avec success",
                    
                }, status=status.HTTP_200_OK)
                
            return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        except Magasin.DoesNotExist:
            return Response({"error": "Magasin not found"}, status=status.HTTP_404_NOT_FOUND)
        except Partenneur.DoesNotExist:
            return Response({"error": "Partner not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print (f"erooor 500 is {str(e)}")
            return Response({"error": "Probleme de connexion"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({"error": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
@api_view(['PUT'])
@permission_classes([IsPertener])
@parser_classes([MultiPartParser, FormParser])
def upload_image_magasin(request):
    if request.method == 'PUT':
        try:
            data = request.data.copy() 
            magasin_id = data.get("magasin_id")
            if not magasin_id:
                return JsonResponse({'message': 'magasin_id requis'}, status=400)
            magasin = Magasin.objects.get(id=magasin_id)

            image_file = request.FILES.get('image')
            image_file2 = request.FILES.get("image_backgroud") or request.FILES.get("image_background")
            
            if image_file:
                magasin.image = image_file
            if image_file2:
                magasin.image_background = image_file2
            magasin.save()

            return JsonResponse({
                "message": "Image téléchargée avec succès",
                "image": magasin.image.url if magasin.image else None,
                "image_background": magasin.image_background.url if magasin.image_background else None
            }, status=200)

        except Magasin.DoesNotExist:
            return JsonResponse({'message': 'Magasin non trouvé'}, status=404)
        except Exception as e:
            return JsonResponse({'message': str(e)}, status=500)

    return JsonResponse({"message": "Method not allowed"}, status=405)
@api_view(["DELETE"])
@permission_classes([IsPertener])
def delete_produit(request) :
    if request.method == 'DELETE':
        try:
            
            
            data=json.loads(request.body)
            id=data.get("id")
            Produis.objects.get (id=id).delete()
            return JsonResponse({"message":"produit supprimer avec succès"})
        except Exception as e :
            return JsonResponse({"message" :"Probleme de connexion"})
    else :
        return JsonResponse({"message": "method not allowed"}, status=405)
def magasin_sponserie (request):
    pass 
    #i need to create api for magasin sponsobr 

@api_view(["PUT"])
@permission_classes([IsPertener])
@parser_classes([MultiPartParser])
def update_produit(request):
    if request.method == "PUT":
        data = request.data.copy() 
        catalogue_id=data.get("catalogue_id") # Get data from multipart/form-data


        

        # Try getting the product id from one of the expected keys
        produis_id = data.get("produis_id") or data.get("id")

        

        

        


        if not produis_id:
            return Response({"message": "ID du produit requis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            produis_id = int(produis_id)
        except ValueError:
            return Response({"message": "ID invalide."}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve the product instance
        try:


            produis :Produis = Produis.objects.get(id=produis_id)


        except Produis.DoesNotExist:
            return Response(
                {"message": "Produit non trouvé."},
                status=status.HTTP_404_NOT_FOUND
            )
            


        
        # Handle updating prixstar_shop (many-to-many) if new prix_starshop data is provided
        # Update existing PrixStarshop instances based on provided indices and IDs
        prixstar_ids = []
        indices = []
        for key in data.keys():
            if key.startswith("prix_starshop[") and key.endswith("][id]"):
                idx = key.split("[")[1].split("]")[0]
                if idx.isdigit():
                    indices.append(int(idx))
        indices = sorted(set(indices))

        for idx in indices:
            prix_id = data.get(f"prix_starshop[{idx}][id]")
            prix_value = data.get(f"prix_starshop[{idx}][prix]")
            quantity_value = data.get(f"prix_starshop[{idx}][quantity]")
            if prix_id and prix_value and quantity_value:
                try:
                    prix_instance = PrixStarshop.objects.get(id=prix_id)
                    serializer_prix = PrixStarshopSerializer(
                    prix_instance,
                    data={"prix": prix_value, "quantity": quantity_value},
                    partial=True
                    )
                    if serializer_prix.is_valid():
                            serializer_prix.save()
                    prixstar_ids.append(prix_instance.id)
                except PrixStarshop.DoesNotExist:
                    serializer_prixx = PrixStarshopSerializer(data={"prix": prix_value, "quantity": quantity_value})
                    if serializer_prixx.is_valid():
                        prix_instance = serializer_prixx.save()
                        prixstar_ids.append(prix_instance.id)
                        
                    else:
                        return Response(
                        {"message": str(serializer_prixx.errors)},
                        status=status.HTTP_400_BAD_REQUEST
                    )
        # Handle new prix_starshop entries without id (for creation)
        # Handle new prix_starshop entries without id (for creation)
        for key in data.keys():
            if key.startswith("prix_starshop[") and key.endswith("][prix]"):
                idx = key.split("[")[1].split("]")[0]
                prix_id = data.get(f"prix_starshop[{idx}][id]")
                prix_value = data.get(f"prix_starshop[{idx}][prix]")
                quantity_value = data.get(f"prix_starshop[{idx}][quantity]")
                if not prix_id and prix_value and quantity_value:
                    serializer_prixx = PrixStarshopSerializer(data={"prix": prix_value, "quantity": quantity_value})
                    if serializer_prixx.is_valid():
                        prix_instance = serializer_prixx.save()
                        prixstar_ids.append(prix_instance.id)
                    else:
                        return Response(
                            {"message": str(serializer_prixx.errors)},
                            status=status.HTTP_400_BAD_REQUEST
                        )

        #Set the updated prixstar_shop M2M field
        
        if prixstar_ids:
            produis.prixstar_shop.set(prixstar_ids)


        
        
        

        # Process the file upload if applicable
        image_file = request.FILES.get("image")
        if image_file:
            data["image"] = image_file
        else:
            data["image"] = produis.image  # Keep the existing image if no new image is provided

        # Set the instance id into the data to ensure we update the correct object
        data['id'] = produis_id
        data["is_available"] = data.get("is_available", "").lower() in ["true", "1"]
        if catalogue_id :
            
            data["catalogue"] = catalogue_id
        quantity_current = produis.quantity_stock
        quantity = data.get("quantity_stock", None)
        if quantity is not None:
            data["quantity_stock"] = int(quantity_current + int(quantity))
        
            
        
        
        

        # Create the serializer with the instance and updated data, allowing partial updates
        serializer = ProduisSerializer(instance=produis, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Le produit a été mis à jour avec succès"},
                status=status.HTTP_200_OK
            )
        else:
            errors = serializer.errors
            # Extract the first error message
            if 'non_field_errors' in errors:
                first_error = errors['non_field_errors'][0]
            else:
                first_field = next(iter(errors))
                first_error = errors[first_field][0]

            return Response(
                {"message": str(first_error)},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        return Response(
            {'error': "Méthode non autorisée"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    

@api_view(["GET"])
def get_produis_magasin_application(request):
    if request.method == "GET":
        try:
            
            magasin_id = request.GET.get("magasin_id")
            name=request.GET.get('name', None)
            catalogue=request.GET.get('catalogue', None)

            print (f'magasin is {magasin_id}')
           
            query_set = Produis.objects.filter(magasin__id=magasin_id).select_related("magasin").order_by(F('ordre').asc(nulls_last=True), "-id")

            
            if name :
                query_set = query_set.filter(name__icontains=name)
            if catalogue :
                query_set = query_set.filter(catalogue__id=catalogue)
            


            # Paginate the queryset
            page_number = request.GET.get('page', 1)
            page_size = request.GET.get('page_size', 10)
        
            try:
             page_number = int(page_number)
            except ValueError:
             page_number = 1


            try:
             page_size = int(page_size)
             if page_size < 1:
                page_size = 10  # Ensure page size is at least 1
            except ValueError:
             page_size = 10

        # Paginate the queryset
            paginator = Paginator(query_set, page_size)
        
            try:
             current_page = paginator.page(page_number)
            except PageNotAnInteger:
             current_page = paginator.page(1)
            except EmptyPage:
             response_data = {
                'data': [],
                'total': 0,
                'page': page_number,
                'page_size': 0,
                'total_pages': 0,
                
            
        }
             return JsonResponse(response_data,status=200)
            
            serializer = ProduisSerializer(current_page, many=True)
            return JsonResponse({'produits': serializer.data}, safe=False, status=200)
        except Magasin.DoesNotExist:
            return JsonResponse({"message": "vous avez pas acces de cette plateforme"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"message": "vous avez pas acces de cette plateforme"}, status=400)
        except Exception as e:
            return JsonResponse({"message": "Probleme de connexion"}, status=500)
    else:
        return JsonResponse({"message": "vous avez pas acces de cette plateforme"}, status=405) 


             
@api_view(["GET"])
@permission_classes([IsClient])
def liste_magasin_par_client_application(request):
    if request.method == "GET":
        try:
            ensure_magasins_exist()
            wilaya_param = request.GET.get("wilaya", None) or request.GET.get("wilaya_code", None)
            page_number = request.GET.get('page', 1)
            page_size = request.GET.get('page_size', 10)

            queryset = Magasin.objects.filter(is_active=True).select_related("owner", "owner__user").prefetch_related("cataloguqe").order_by(F('ordre').asc(nulls_last=True), '-id')

            queryset = filter_magasins_by_wilaya(queryset, request.user, wilaya_param)

            try:
                page_number = int(page_number)
            except ValueError:
                page_number = 1

            try:
                page_size = int(page_size)
                if page_size < 1:
                    page_size = 10
            except ValueError:
                page_size = 10

            paginator = Paginator(queryset, page_size)
            try:
                current_page = paginator.page(page_number)
            except PageNotAnInteger:
                current_page = paginator.page(1)
            except EmptyPage:
                response_data = {
                    'data': [],
                    'total': 0,
                    'page': page_number,
                    'page_size': 0,
                    'total_pages': 0,
                }
                return JsonResponse(response_data, status=200)

            serializer = MagasinSerializer(current_page, many=True)
            return JsonResponse({'magasins': serializer.data}, safe=False, status=200)

        except Exception as e:
            logger.error(f"Error in liste_magasin_par_client_application: {e}")
            return JsonResponse({'error': "Probleme de connexion"}, status=500)
            return JsonResponse({'error': "Probleme de connexion"}, status=500)
    else :
        return JsonResponse({'error': "Method not allowed"}, status=405)
@api_view(["GET"])
def get_magasin_sponsorise(request):
    if request.method == "GET":
        try:
            queryset = Magasin.objects.filter(
                is_active=True, 
                ordre_sponsor__gte=1
            ).select_related("owner", "owner__user").prefetch_related("cataloguqe").order_by('ordre_sponsor', '-id')

            wilaya_param = request.GET.get("wilaya", None) or request.GET.get("wilaya_code", None)
            if wilaya_param:
                queryset = filter_magasins_by_wilaya(queryset, request.user, wilaya_param)

            serializer = MagasinSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response([], status=status.HTTP_200_OK)
    else:
        return Response({"message": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
api_view(["GET"])
def get_produis_details (request):
    if request.method=="GET" :
        try:
            produis_id = request.GET.get("produis_id")
            
            queryset=Produis.objects.select_related('catalogue','magasin').prefetch_related('prixstar_shop').get(id=produis_id)
            serializer=ProduisSerializer(queryset)
            return JsonResponse({"produit": serializer.data}, safe=False, status=200)
        except Produis.DoesNotExist :
            return JsonResponse({"message": "produit non trouvé"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"message": "vous avez pas acces à cette plateforme"}, status=400)
        except Exception as e:
            return JsonResponse({"message": "Probleme de connexion"}, status=500)
    else :
        return JsonResponse({"message": "vous avez pas acces à cette plateforme"}, status=405)
@permission_classes([IsPertener])
@api_view(["PATCH"])
def chnange_etat_commande(request):
    if request.method == "PATCH":
        try:
            data = json.loads(request.body)
            commande_id = data.get("commande_id", None)
            confirmation = data.get("confirmation", None)
            # print(f"commande id is : {confirmation}")
            status=data.get("status", None)
            commande = Commande.objects.get(id=commande_id)
            if confirmation is not None:
                commande.confirmation = confirmation
            if status is not None:
                commande.status=status
            commande.save()
            
            return JsonResponse({"message": "La commande a été mise à jour avec succès"}, status=200)
        except Commande.DoesNotExist:
            return JsonResponse({"message": "probleme de connexion"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"message": "probleme de connexion"}, status=400)
        except Exception as e:
            return JsonResponse({"message": "Probleme de connexion"}, status=500)
    else :
        return JsonResponse({"message":"probleme de connexion"})


class CommandeParuser(UserRateThrottle) :
    rate = '1/seconds'
    
@api_view(["GET"])
@permission_classes([IsPertener])
def get_livreuves_pour_magasin (request):
    if request.method == "GET":
        try:
            
            magasin_id=request.GET.get("magasin_id")
            
            
            livreues=Livreur.objects.filter(magasin__id=magasin_id,is_available=True).select_related("magasin","partenneur")
            selezer=SelectionLivreurSerializer(livreues,many=True)
            return JsonResponse(selezer.data, status=200,safe=False)
        except Livreur.DoesNotExist :
            return JsonResponse({"message": "Livreur not found"}, status=404)
    else :
        return JsonResponse({"message":"method pas valide "},status=405)
    

@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def get_commissions_livreur(request):
    """
    Récupère la liste des paliers de tarifs / commissions pour livreurs ordonnée par km.
    Auto-seed des paliers de référence si la table est vide.
    """
    if request.method == "GET":
        try:
            # Auto-seed initial tiers if none exist
            if CommissionLivreur.objects.count() == 0:
                CommissionLivreur.objects.bulk_create([
                    CommissionLivreur(km=3.0, prix=250.0, description="Livraison courte distance (0 à 3 km)"),
                    CommissionLivreur(km=6.0, prix=300.0, description="Livraison urbaine standard (3 à 6 km)"),
                    CommissionLivreur(km=9.0, prix=350.0, description="Livraison moyenne distance (6 à 9 km)"),
                    CommissionLivreur(km=12.0, prix=400.0, description="Livraison longue distance (9 à 12 km)"),
                    CommissionLivreur(km=20.0, prix=680.0, description="Livraison extra-urbaine (au-delà de 12 km)"),
                ])

            queryset = CommissionLivreur.objects.all().order_by("km")

            search = request.GET.get("search")
            if search:
                s = search.strip()
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(description__icontains=s) |
                    Q(km__icontains=s) |
                    Q(prix__icontains=s)
                )

            serializer = CommisionLivreurSerializer(queryset, many=True)
            return Response(serializer.data, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    return Response({"message": "Method not allowed"}, status=405)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_commision_livraison(request):
    """
    Endpoint de rétro-compatibilité pour l'ancien chemin api/v1/commission/livrision
    """
    if request.method == "GET":
        try:
            if CommissionLivreur.objects.count() == 0:
                CommissionLivreur.objects.bulk_create([
                    CommissionLivreur(km=3.0, prix=250.0, description="Livraison courte distance (0 à 3 km)"),
                    CommissionLivreur(km=6.0, prix=300.0, description="Livraison urbaine standard (3 à 6 km)"),
                    CommissionLivreur(km=9.0, prix=350.0, description="Livraison moyenne distance (6 à 9 km)"),
                    CommissionLivreur(km=12.0, prix=400.0, description="Livraison longue distance (9 à 12 km)"),
                    CommissionLivreur(km=20.0, prix=680.0, description="Livraison extra-urbaine (au-delà de 12 km)"),
                ])
            queryset = CommissionLivreur.objects.all().order_by("km")
            serializer = CommisionLivreurSerializer(queryset, many=True)
            return JsonResponse({"result": serializer.data}, status=200)
        except Exception:
            return JsonResponse({"message": "Probleme de connexion"}, status=500)
    return JsonResponse({"message": "method not allow"}, status=405)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def create_commission_livreur(request):
    """
    Crée un nouveau palier de commission / tarif livreur (km, prix, description).
    """
    if request.method == "POST":
        try:
            if isinstance(request.data, dict) and request.data:
                data = request.data
            else:
                data = json.loads(request.body)

            km_val = data.get("km")
            prix_val = data.get("prix")
            description = data.get("description", "").strip()

            if km_val is None or prix_val is None:
                return Response({"error": "Les champs 'km' et 'prix' sont obligatoires."}, status=400)

            try:
                km = float(km_val)
                prix = float(prix_val)
            except (ValueError, TypeError):
                return Response({"error": "Les valeurs 'km' et 'prix' doivent être numériques."}, status=400)

            commission = CommissionLivreur.objects.create(
                km=km,
                prix=prix,
                description=description
            )
            serializer = CommisionLivreurSerializer(commission)
            return Response({"message": "Palier de commission livreur créé avec succès", "data": serializer.data}, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
    return Response({"message": "Method not allowed"}, status=405)


@csrf_exempt
@api_view(["PUT", "PATCH"])
@permission_classes([AllowAny])
def update_commission_livreur(request):
    """
    Met à jour un palier de commission / tarif livreur existant.
    """
    if request.method in ["PUT", "PATCH"]:
        try:
            if isinstance(request.data, dict) and request.data:
                data = request.data
            else:
                data = json.loads(request.body)

            item_id = data.get("id")
            if not item_id:
                return Response({"error": "ID de commission livreur requis"}, status=400)

            commission = get_object_or_404(CommissionLivreur, id=item_id)

            if "km" in data and data["km"] is not None:
                commission.km = float(data["km"])
            if "prix" in data and data["prix"] is not None:
                commission.prix = float(data["prix"])
            if "description" in data:
                commission.description = str(data["description"]).strip()

            commission.save()
            serializer = CommisionLivreurSerializer(commission)
            return Response({"message": "Palier de commission livreur mis à jour avec succès", "data": serializer.data}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
    return Response({"message": "Method not allowed"}, status=405)


@csrf_exempt
@api_view(["DELETE"])
@permission_classes([AllowAny])
def delete_commission_livreur(request, id=None):
    """
    Supprime un palier de commission livreur par son ID.
    """
    if request.method == "DELETE":
        try:
            target_id = id
            if not target_id:
                if isinstance(request.data, dict) and request.data:
                    target_id = request.data.get("id")
                elif request.GET.get("id"):
                    target_id = request.GET.get("id")
                elif request.body:
                    try:
                        data = json.loads(request.body)
                        target_id = data.get("id")
                    except Exception:
                        pass

            if not target_id:
                return Response({"error": "ID de commission livreur requis", "message": "ID de commission livreur requis"}, status=400)

            try:
                commission = CommissionLivreur.objects.get(id=int(target_id))
            except (CommissionLivreur.DoesNotExist, ValueError):
                return Response({"error": "Barème introuvable", "message": "Barème introuvable"}, status=404)

            commission.delete()
            return Response({"message": "Palier de commission livreur supprimé avec succès"}, status=200)
        except Exception as e:
            return Response({"error": str(e), "message": str(e)}, status=400)
    return Response({"message": "Method not allowed"}, status=405)


@csrf_exempt
@api_view(["GET", "PUT", "PATCH"])
@permission_classes([AllowAny])
def manage_livreur_commission_rate(request):
    """
    Gère le taux de commission prélevé par la plateforme sur les livreurs (tax_tawsile).
    Stocké dans Type_compte_partener sous name='livreur'.
    """
    from employer.models import Type_compte_partener
    try:
        type_compte = Type_compte_partener.objects.filter(
            Q(name__icontains="livreur") | Q(name__icontains="livr")
        ).first()
        if not type_compte:
            type_compte = Type_compte_partener.objects.create(
                name="livreur",
                description="Commission plateforme livreur",
                tax_tawsile=10
            )

        if request.method == "GET":
            return Response({
                "id": type_compte.id,
                "name": type_compte.name,
                "tax_tawsile": type_compte.tax_tawsile or 0,
                "description": type_compte.description or ""
            }, status=200)

        elif request.method in ["PUT", "PATCH"]:
            if isinstance(request.data, dict) and request.data:
                data = request.data
            else:
                data = json.loads(request.body)

            if "tax_tawsile" in data:
                try:
                    type_compte.tax_tawsile = int(data["tax_tawsile"])
                except (ValueError, TypeError):
                    return Response({"error": "Valeur invalide pour le taux"}, status=400)

            if "description" in data:
                type_compte.description = data["description"]

            type_compte.save()
            return Response({
                "message": "Taux de commission livreur mis à jour avec succès",
                "data": {
                    "id": type_compte.id,
                    "name": type_compte.name,
                    "tax_tawsile": type_compte.tax_tawsile,
                    "description": type_compte.description
                }
            }, status=200)

    except Exception as e:
        return Response({"error": str(e)}, status=500)
    return Response({"message": "Method not allowed"}, status=405)

@api_view(["PATCH"])
@permission_classes([IssuperVisseur | IsPertener])
def update_partenneur_par_viseur(request):
    if request.method == "PATCH":
        try:
            # Parse le JSON depuis le corps de la requête
                data = json.loads(request.body)
                id = data.get("id")            
                
                long = data.get("long")
                lat = data.get("lat")
                wilaya=data.get ("wilaya")
                
                print (f"id is {id}")
                
                # Récupère le Partenneur ciblé
                
                
                partener_cible = Partenneur.objects.get(id=id)
                print (f"partennneur {partener_cible.id}")
                
                # Met à jour les coordonnées
                partener_cible.longitude = long
               
                partener_cible.latitude = lat
                try : 
                    
                    magasin =Magasin.objects.get (owner__id=partener_cible.id)
                except Magasin.DoesNotExist :
                    return JsonResponse({"message":"partenneur id not valide "},status=404)


                magasin.wilaya =wilaya
                magasin.save()
                # Save the user instance
                partener_cible.save()
                return JsonResponse({"message": "Partner updated "}, status=200)  # Save the partener instance
        except Exception as e:
                print (f'erroor is {str(e)}')
                return JsonResponse({"error": str(e)}, status=500)
            
            

        except json.JSONDecodeError:
            # Erreur de format JSON
            return JsonResponse({"message": "probleme de connextion"}, status=400)
        
        except Partenneur.DoesNotExist:
            # Si le partenaire avec l'ID donné n'existe pas
            return JsonResponse({"message": "probleme de connexion"}, status=404)
        
        except Exception as e:
            # Gestion des erreurs inattendues
            return JsonResponse({"error": "Probleme de connexion"}, status=500)


    # Si la méthode HTTP n'est pas PATCH
    return JsonResponse({"error": "Method not allowed"}, status=405)
@api_view(["POST"])
@permission_classes([IsClient])
def create_reviews_produis(request):
    if request.method == "POST":
        try:
            data = request.data if isinstance(request.data, dict) else json.loads(request.body)
            
            article_id = data.get("produis_id")
            comm = data.get("comm", "") or ""
            star = data.get("star")
            
            if not article_id or star is None:
                return JsonResponse({"message": "L'article et la note sont requis"}, status=400)
            
            article = Produis.objects.get(id=article_id)
            review = ReviewsProduis.objects.create(
                article=article,
                client=request.user,
                commentaire=comm,
                star=star
            )
            return JsonResponse({"message": "review créé avec succès"}, status=201)
        except Produis.DoesNotExist:
            return JsonResponse({"message": "article non trouvé"}, status=404)
        except Exception as e:
            return JsonResponse({"message": f"Erreur: {str(e)}"}, status=500)
    else:
        return JsonResponse({"message": "vous avez pas acces à cette plateforme"}, status=405)

@api_view(["GET"])
@permission_classes([IsPertener | IsClient])
def get_reviews_for_produis(request):
    if request.method == "GET":
        try:
            produis_id = request.GET.get("produis_id")
            queryset = ReviewsProduis.objects.filter(article=produis_id).select_related('article', 'client').order_by("-id")

            # Paginate the queryset
            paginator = ComentairePagination()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            serializer = ReviewsProduisSerializer(paginated_queryset, many=True)

            return paginator.get_paginated_response(serializer.data)
        except ReviewsProduis.DoesNotExist:
            return JsonResponse({"message": "aucune review disponible"}, status=404)

        except json.JSONDecodeError:
            return JsonResponse({"message": "vous avez pas acces à cette plateforme"}, status=400)
        except Exception as e:
            return JsonResponse({"message": "Probleme de connexion"}, status=500)

    else:
        return JsonResponse({"message": "vous avez pas acces à cette plateforme"}, status=405)

@api_view(["POST"])
@permission_classes([IsClient])
def reviews_magasin_create(request):
    if request.method == "POST":
        try:
            data = request.data if isinstance(request.data, dict) else json.loads(request.body)
            magasin_id = data.get("magasin_id")
            comm = data.get("comm", "") or ""
            star = data.get("star")
            
            if not magasin_id or star is None:
                return JsonResponse({"error": "Le magasin et la note sont requis"}, status=400)
            
            magasin = Magasin.objects.get(id=magasin_id)
            ReviewsMagasin.objects.create(
                magasin=magasin,
                client=request.user,
                commentaire=comm,
                star=star
            )
            
            return JsonResponse({"result": "Review added successfully"}, status=201)
        except Magasin.DoesNotExist:
            return JsonResponse({"error": "Magasin not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": f"Erreur: {str(e)}"}, status=500)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)

@api_view(["GET"])
@permission_classes([IsPertener | IsClient])
def get_reviews_magasin(request):
    if request.method == "GET":
        try:
            
            queryset = ReviewsMagasin.objects.filter(magasin__owner__user=request.user).select_related('magasin', 'client').order_by("-id")

            # Paginate the queryset
            paginator = ComentairePagination()
            paginated_queryset = paginator.paginate_queryset(queryset, request)
            serializer = ReviewsMagasinSerializers(paginated_queryset, many=True)

            return paginator.get_paginated_response(serializer.data)
        except ReviewsMagasin.DoesNotExist:
            return JsonResponse({"message": "aucune review disponible"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"message": "vous avez pas acces à cette plateforme"}, status=400)
        except Exception as e:
            return JsonResponse({"message": "Probleme de connexion"}, status=500)
    else:
        return JsonResponse({"message":"vous avez pas acces à cette plateforme"},status=405)
    

@api_view(["GET"])
@permission_classes([IsClient | IsAuthenticated])
def get_publisites(request):
    if request.method == "GET":
        try:
            
            
            publisites = Publicity.objects.filter(client__user__id=request.user.id)
            serializer = PublicattionSerializer(publisites, many=True)
            return JsonResponse(serializer.data, status=200)
        except Publicity.DoesNotExist:
            return JsonResponse({"message": "Invalid user"}, status=400)
    else:
        return JsonResponse({"message": "Method not allowed"}, status=405)
@api_view(["GET"])
@permission_classes([IsComtable])

#api de afficheer tout les actions de chef bureux 
def get_all_actions_for_comptable(request):
    if request.method == 'GET':
        try:
            search_phone = request.GET.get('search', '')
            username = request.GET.get("username", "")
            date = request.GET.get("date", "")
            agent = request.GET.get("agent")
            groupe=request.GET.get("groupe")
            
            # Base queryset
            queryset = Actions.objects.all().select_related("livreur","agent")
            
            # Apply filters
            if search_phone:
                queryset = queryset.filter(agent__phone_number_1__icontains=search_phone)   
            if username:
                queryset = queryset.filter(agent__username__icontains=username)
            if date:
                queryset = queryset.filter(date_action__icontains=date)
            if agent:
                queryset = queryset.filter(agent__id=agent)
            if groupe:
                queryset = queryset.filter(agent__groupe=groupe)
            
            # Calculate TOTAL AMOUNT for all filtered actions
            total_amount = queryset.aggregate(total=Sum('total_amount'))['total'] or 0
            
            # Paginate the queryset
            paginator = Paginator(queryset.select_related("agent", "livreur").order_by("-id"), 20)
            page_number = request.GET.get('page', 1)
            page_obj = paginator.get_page(page_number)
            
            # Serialize the data
            serializers = ActionsSerlaizers(page_obj.object_list, many=True)
            
            return Response({
                'count': paginator.count,
                'next': page_obj.has_next(),
                'previous': page_obj.has_previous(),
                'results': serializers.data,
                "prix_count": total_amount  # Return the total directly (e.g., 35000.0)
            })
            
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "chef bureux id not valide"}, status=404)
    else:
        return JsonResponse({"error": "method not allowed"}, status=405)
@api_view(["PATCH"])
@permission_classes([IsClient])
def updtae_lan_log_client(request):
    if request.method=="PATCH" :
        try :
            data=json.loads(request.body)
            lan=data.get("lan")
            lon=data.get("lon")
            localtion=data.get("location")
            client=CustomUser.objects.get(id=request.user.id)
            client.latitude=lan
            client.longitude=lon
            client.localtion_name=localtion
            client.save()
            return JsonResponse({"message":"client update location success"},status=200)
        except CustomUser.DoesNotExist :
            return JsonResponse({"message":"client id not valide "},status=404)
        except Exception as e :
            print(f'probleme is :{e}')
            return JsonResponse({"message":"probleme de connexion "},status=405)
    else :
        return JsonResponse({"message":"method not allow "},status=405)
@api_view(["POST"])
def verifie_commande_scaned (request):
    if request.method=="POST" :
        try :
            data=json.loads(request.body)

            commande_id=data.get("magasin_id")
            magasin=Magasin.objects.get(id=commande_id)
            return JsonResponse({"exists":True},status=200)
            
        except Commande.DoesNotExist :
            return JsonResponse({"exists":False},status=404)

    else :
        return JsonResponse({"message":"method not allow "},status=405)
@api_view(["GET"])
@permission_classes([IsPertener])
def commades_livreurs(request):
    if request.method == "GET":
        try:
            commandes = Commande.objects.filter(
                livreur__partenneur__user=request.user
            ).select_related("livreur", "magasin", "client")

            # Paginate the queryset
            paginator = CustomPagination()
            paginated_queryset = paginator.paginate_queryset(commandes, request)
            serializer = CommandeSerializer(paginated_queryset, many=True)

            return paginator.get_paginated_response(serializer.data)
        except Exception as e:
            return JsonResponse({"error": "Probleme de connexion"}, status=500)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


@api_view(["GET"])
@permission_classes([IsClient])
def get_magasin_ids(request) :

    if request.method=="GET" :
     try:
        data = json.loads(request.body)
        ids = data.get("ids", None)
        magasins = Magasin.objects.filter(id__in=ids).select_related("owner").prefetch_related("cataloguqe")
        selezers = MagasinSerializer(magasins, many=True)
        return JsonResponse({"data": selezers.data}, status=200)
     except Magasin.DoesNotExist:
         return JsonResponse({"message": "No magasins"}, status=404)
     
    else:
        return JsonResponse({"message": "method not allow"}, status=405)

@api_view(["GET"])
@permission_classes([IsClient])
def get_produis_ids(request):
    if request.method=="GET" :
        try :
            data=json.loads(request.body)
            ids=data.get("ids",None)
            produis=Produis.objects.filter(id__in=ids).select_related("magasin","catalogue")
            selezer=ProduisSerializer(produis,many=True)
            return JsonResponse({"data": selezer.data}, status=200)
        except Produis.DoesNotExist :
            return JsonResponse({"message":"magasin ids null or ids not valide"},status=404)
    else :
        return JsonResponse({"message":"method not allow "},status=405)
@api_view(["GET"])
@permission_classes([IsAuthenticated])

def get_commandes_client(request):
    try:
        if request.method == "GET":
            # Fetch commandes
            commandes = Commande.objects.filter(client=request.user).select_related("magasin","client","livreur").values("id", "status","distination", "total_price", "delivery_price", "created_at").order_by("-id")

            # Fetch related CommandeArticle instances with articles pre-loaded
            commande_ids = [commande["id"] for commande in commandes]
            articles = CommandeArticle.objects.filter(commande__id__in=commande_ids).select_related("article","commande")

            # Group articles by commande_id
            articles_by_commande = defaultdict(list)
            for article in articles:
                
                articles_by_commande[article.commande_id].append(article)

            # Serialize data
            result = [
                {
                    "commande": CommandeClientSelezers(commande).data,
                    "articles": CommandeArticleSerializerPhoneapp(articles_by_commande.get(commande["id"], []), many=True).data
                }
                for commande in commandes
            ]

            # Paginate and return
            paginator = CustomPagination()
            paginated_result = paginator.paginate_queryset(result, request)
            return paginator.get_paginated_response(paginated_result)
        else:
            return JsonResponse({"message": "method not allowed"}, status=405)
    except Exception as e:
        return JsonResponse({"message": str(e)}, status=500)




@api_view(["GET"])
@permission_classes([IsClient])
def get_magasin_ids(request) :

    if request.method=="GET" :
     try:
        data = json.loads(request.body)
        ids = data.get("ids", None)
        magasins = Magasin.objects.filter(id__in=ids).select_related("owner").prefetch_related("cataloguqe")
        selezers = MagasinSerializer(magasins, many=True)
        return JsonResponse({"data": selezers.data}, status=200)
     except Magasin.DoesNotExist:
         return JsonResponse({"message": "No magasins"}, status=404)
     
    else:
        return JsonResponse({"message": "method not allow"}, status=405)

@api_view(["GET"])
@permission_classes([IsClient])
def get_produis_ids(request):
    if request.method=="GET" :
        try :
            data=json.loads(request.body)
            ids=data.get("ids",None)
            produis=Produis.objects.filter(id__in=ids).select_related("magasin","catalogue")
            selezer=ProduisSerializer(produis,many=True)
            return JsonResponse({"data": selezer.data}, status=200)
        except Produis.DoesNotExist :
            return JsonResponse({"message":"magasin ids null or ids not valide"},status=404)
    else :
        return JsonResponse({"message":"method not allow "},status=405)
    
api_view(["GET"])
@permission_classes([IsClient])
def get_magasin_by_id (request):
    if request.method=="GET" :
        try:
            data=json.loads(request.body)
            id=data.get("id")
            magasin_ciblie =Magasin.objects.select_related("owner").prefetch_related("cataloguqe").get(id=id)
            selezers=MagasinSerializer(magasin_ciblie)
            return JsonResponse({"data":selezers.data},status=200)
        except Magasin.DoesNotExist:
            return JsonResponse({"message":"magasi do not existe "},status=404)
    else :
            return JsonResponse({"message":"method not allow "},status=405)


@csrf_exempt
def get_all_produis_star_shop(request):
    if request.method == "GET":
        try:


            catalogue=request.GET.get("catalogue_id",None)
            disponible =request.GET.get("disponible")
            prix_max=request.GET.get("prix_max")
            prix_min=request.GET.get("prix_min",0)
            name=request.GET.get("name",None)
            produis = Produis.objects.filter(
                magasin__owner__type_compte__name="starshop"
            ).select_related("magasin").prefetch_related("catalogue")

            # Use Django's Paginator for standard Django views
            if catalogue:
                produis = produis.filter(catalogue__id=catalogue)
            if disponible is not None:
                # Convert string to boolean (accepts 'true', '1', 'false', '0')
                disponible_bool = str(disponible).lower() in ['true', '1']
                produis = produis.filter(disponibilite=disponible_bool)
            if prix_max and prix_min :
                produis = produis.filter(price__gte=prix_min, price__lte=prix_max)
            if name :
                produis =produis.filter(name__icontains=name)
                
            




            page_number = request.GET.get('page', 1)

            page_size = request.GET.get('page_size', 20)

            try:
                page_number = int(page_number)
            except ValueError:
                page_number = 1
            try:
                page_size = int(page_size)
                if page_size < 1:

                    page_size = 20
            except ValueError:
                page_size = 20




            # Use Django's Paginator for standard Django views

            page_number = request.GET.get('page', 1)

            page_size = request.GET.get('page_size', 20)


            try:
                page_number = int(page_number)
            except ValueError:
                page_number = 1
            try:
                page_size = int(page_size)
                if page_size < 1:

                    page_size = 20
            except ValueError:
                page_size = 20

            from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
            paginator = Paginator(produis, page_size)
            try:
                current_page = paginator.page(page_number)
            except PageNotAnInteger:
                current_page = paginator.page(1)
            except EmptyPage:
                return JsonResponse({
                    "data": [],
                    "total": paginator.count,
                    "page": page_number,
                    "page_size": 0,
                    "total_pages": paginator.num_pages,
                }, status=200)

            selezers = ProduisSerializer(current_page, many=True)
            return JsonResponse({
                "data": selezers.data,
                "total": paginator.count,
                "page": page_number,
                "page_size": page_size,
                "total_pages": paginator.num_pages,
            }, status=200)
        except Produis.DoesNotExist:
            return JsonResponse({"data": []}, status=200)
        
@api_view(["GET"])
@permission_classes([IsClient])
def magasin_disponible (request):
    if request.method=="GET":
        try :

            id =request.GET.get ("id")
            magasin =Magasin.objects.get (id=id)
            return JsonResponse({"disponible":magasin.EtatOuverture},status=200)
        except Magasin.DoesNotExist :
            return JsonResponse({"message":"probleme de connexion "},status=404)
        except Exception as  e :
            return JsonResponse({"message":"probleme de connexion "},status=500)
    else :
        return JsonResponse({"message":"probleme de connexion "},status=405)
    
    
@api_view(["GET"])
@permission_classes([IsCentreappel])
def commande_de_service_cofimation(request):
    if request.method == "GET":
        try:
            magasin_name =request.GET.get ("search",None)
            confirmation =request.GET.get("confirmation")
            commandes = Commande.objects.select_related("client","magasin","livreur","emp_val"
            ).filter(magasin__owner__user__confirmation=True
            ,magasin__owner__type_compte__name="starshop"
            ).order_by("-id")
            
            # Pagination sur 20 éléments par page
            if magasin_name:
                print (f"magasin name : {magasin_name}")
                commandes = commandes.filter(magasin__name__icontains=magasin_name)
            if confirmation  :
                commandes=commandes.filter(confirmation=confirmation,status="pending")
            
            page_number = request.GET.get('page', 1)
            page_size = 20
            paginator = Paginator(commandes, page_size)
            try:
                current_page = paginator.page(page_number)
            except PageNotAnInteger:
                current_page = paginator.page(1)
            except EmptyPage:
                return JsonResponse({
                    "data": [],
                    "total": paginator.count,
                    "page": page_number,
                    "page_size": 0,
                    "total_pages": paginator.num_pages,
                }, status=200)
            selzers = CommandeCnetreAppelSerializer(current_page, many=True)
            return JsonResponse({
                "data": selzers.data,
                "total": paginator.count,
                "page": int(page_number),
                "page_size": page_size,
                "total_pages": paginator.num_pages,
            }, status=200)
        except Commande.DoesNotExist:
            return JsonResponse({"data": []}, status=204)
        except Exception as e:
            return JsonResponse({"message":str(e)}, status=500)
    else:
        return JsonResponse({"message": "probleme de connexion "}, status=405)
    
@api_view(["GET"])
@permission_classes([IsClient])
def commande_starshop_client (request):
    if request.method=="GET":
        try :
            commandes =Commande.objects.filter(client=request.user
            ,magasin__owner__type_compte__name="starshop").order_by("-id")
            selezers =CommandeSerializer(commandes,many=True)
            paginator = CustomPagination()
            paginated_queryset = paginator.paginate_queryset(commandes, request)
            selezers = CommandeSerializer(paginated_queryset, many=True)


            return paginator.get_paginated_response(selezers.data)
            
        except Commande.DoesNotExist :
            return JsonResponse({"data":[]},status=204)
        except Exception as e :
            return JsonResponse({"message":str(e)},status=500)
    else :
        return JsonResponse({"message":"probleme de connexion "},status=405)

    
@api_view(["GET"])
@permission_classes([IsCentreappel])
def commande_de_service_cofimation(request):
    if request.method == "GET":
        try:
            magasin_name =request.GET.get ("search",None)
            confirmation =request.GET.get("confirmation")
            commandes = Commande.objects.select_related("client","magasin","livreur","emp_val"
            ).filter(magasin__owner__user__confirmation=True
            ,magasin__owner__type_compte__name="starshop"
            ).order_by("-id")
            
            # Pagination sur 20 éléments par page
            if magasin_name:
                print (f"magasin name : {magasin_name}")
                commandes = commandes.filter(magasin__name__icontains=magasin_name)
            if confirmation  :
                commandes=commandes.filter(confirmation=confirmation,status="pending")
            
            page_number = request.GET.get('page', 1)
            page_size = 20
            paginator = Paginator(commandes, page_size)
            try:
                current_page = paginator.page(page_number)
            except PageNotAnInteger:
                current_page = paginator.page(1)
            except EmptyPage:
                return JsonResponse({
                    "data": [],
                    "total": paginator.count,
                    "page": page_number,
                    "page_size": 0,
                    "total_pages": paginator.num_pages,
                }, status=200)
            selzers = CommandeCnetreAppelSerializer(current_page, many=True)
            return JsonResponse({
                "data": selzers.data,
                "total": paginator.count,
                "page": int(page_number),
                "page_size": page_size,
                "total_pages": paginator.num_pages,
            }, status=200)
        except Commande.DoesNotExist:
            return JsonResponse({"data": []}, status=204)
        except Exception as e:
            return JsonResponse({"message":str(e)}, status=500)
    else:
        return JsonResponse({"message": "probleme de connexion "}, status=405)
    
@api_view(["GET"])
@permission_classes([IsClient])
def commande_starshop_client (request):
    if request.method=="GET":
        try :
            commandes =Commande.objects.filter(client=request.user
            ,magasin__owner__type_compte__name="starshop").order_by("-id")
            selezers =CommandeSerializer(commandes,many=True)
            paginator = CustomPagination()
            paginated_queryset = paginator.paginate_queryset(commandes, request)
            selezers = CommandeSerializer(paginated_queryset, many=True)

            return paginator.get_paginated_response(selezers.data)
            
        except Commande.DoesNotExist :
            return JsonResponse({"data":[]},status=204)
        except Exception as e :
            return JsonResponse({"message":str(e)},status=500)
    else :
        return JsonResponse({"message":"probleme de connexion "},status=405)
    


@api_view(["GET"])
@permission_classes([IsCentreappel])
def count_commandes_confirmation_centre_appel(request):
    if request.method=="GET":
        try :
            count = Commande.objects.select_related("client","magasin","livreur","emp_val"
            ).filter(magasin__owner__user__confirmation=True,confirmation=False
            ,magasin__owner__type_compte__name="starshop",status="pending"
            ).count()
            
            
            
            return JsonResponse({"count":count},status=200)
        except Commande.DoesNotExist :
            return JsonResponse({"message":"probleme de connexion "},status=404)
    else :
        return JsonResponse({"message":"probleme de connexion"},status=405)


    

@api_view(["GET"])
@permission_classes([IsCentreappel])
def count_commandes_confirmation_centre_appel(request):
    if request.method=="GET":
        try :
            count = Commande.objects.select_related("client","magasin","livreur","emp_val"
            ).filter(magasin__owner__user__confirmation=True,confirmation=False
            ,magasin__owner__type_compte__name="starshop",status="pending"
            ).count()
            
            
            
            return JsonResponse({"count":count},status=200)
        except Commande.DoesNotExist :
            return JsonResponse({"message":"probleme de connexion "},status=404)
    else :
        return JsonResponse({"message":"probleme de connexion"},status=405)


    


@api_view(["GET"])
@permission_classes([IsCentreappel])
def count_commandes_confirmation_centre_appel(request):
    if request.method=="GET":
        try :
            count = Commande.objects.select_related("client","magasin","livreur","emp_val"
            ).filter(magasin__owner__user__confirmation=True,confirmation=False
            ,magasin__owner__type_compte__name="starshop",status="pending"
            ).count()
            
            
            
            return JsonResponse({"count":count},status=200)
        except Commande.DoesNotExist :
            return JsonResponse({"message":"probleme de connexion "},status=404)
    else :
        return JsonResponse({"message":"probleme de connexion"},status=405)


    


@api_view(["GET"])
@permission_classes([IsCentreappel])
def count_commandes_confirmation_centre_appel(request):
    if request.method=="GET":
        try :
            count = Commande.objects.select_related("client","magasin","livreur","emp_val"
            ).filter(magasin__owner__user__confirmation=True,confirmation=False
            ,magasin__owner__type_compte__name="starshop",status="pending"
            ).count()
            
            
            
            return JsonResponse({"count":count},status=200)
        except Commande.DoesNotExist :
            return JsonResponse({"message":"probleme de connexion "},status=404)
    else :
        return JsonResponse({"message":"probleme de connexion"},status=405)


    




@api_view(["GET"])
@permission_classes([])  # public – accessible sans authentification
def get_publisites(request):
    """
    Retourne la liste des publicités actives (non expirées).
    Peut être filtré par wilaya via ?wilaya=<wilaya>
    Peut être filtré par cible/rôle via ?target=<client|livreur|chauffeur>
    GET /api/v1/publisites/magasin
    """
    if request.method == "GET":
        try:
            now = timezone.now()
            wilaya = request.query_params.get("wilaya", None)
            target = request.query_params.get("target", None)

            qs = Publicity.objects.select_related("magasin").filter(
                date_expires__gte=now,
                is_active=True
            ).order_by("-id")

            if target and target.lower() in ["client", "livreur", "chauffeur"]:
                qs = qs.filter(target=target.lower())
            elif target and target.lower() == "all":
                pass
            else:
                # Par défaut pour les requêtes publiques/clients : uniquement les publicités clients
                qs = qs.filter(target="client")

            if wilaya:
                qs = qs.filter(Q(magasin__wilaya__iexact=wilaya) | Q(magasin__isnull=True))

            serializer = PublicattionSerializer(qs, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"message": "Erreur lors de la récupération des publicités", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    return Response({"message": "Méthode non autorisée"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_tax_tawsil_livreur(request):
    """
    Endpoint pour récupérer la taxe / commission due par le livreur
    """
    if request.method == 'GET':
        try:
            partenneur = Partenneur.objects.filter(user=request.user).first()
            if not partenneur:
                return JsonResponse({"tax_tawsile": 0.0, "date": ""}, status=200)

            payment = Payment_de_livreur.objects.filter(livreur__partenneur=partenneur).first()
            if payment:
                tax_val = float(payment.total_fees or payment.application_fee or 0.0)
                return JsonResponse({
                    "tax_tawsile": tax_val,
                    "date": ""
                }, status=200)

            # Fallback: sum of unpaid delivered orders
            commandes = Commande.objects.filter(livreur__partenneur=partenneur, status="delivered")
            total_tax = sum(float(c.prix_de_tax or 0.0) for c in commandes)
            return JsonResponse({"tax_tawsile": total_tax, "date": ""}, status=200)
        except Exception as e:
            return JsonResponse({"tax_tawsile": 0.0, "date": "", "error": str(e)}, status=200)
    return JsonResponse({"error": "Method not allowed"}, status=405)
@csrf_exempt
def request_client_phone_livreur(request):
    """
    Endpoint pour permettre au livreur de demander le numéro de téléphone du client avec une raison.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)
    try:
        try:
            data = json.loads(request.body)
        except Exception:
            data = request.POST.dict() if request.POST else {}

        raw_id = data.get("commande_id")
        reason = data.get("reason", "Autre")
        comment = data.get("comment", "")

        if not raw_id:
            return JsonResponse({"success": False, "error": "commande_id est requis"}, status=200)

        import re
        clean_id_str = re.sub(r'\D', '', str(raw_id))
        if not clean_id_str:
            return JsonResponse({"success": False, "error": "ID de commande invalide"}, status=200)

        commande_id = int(clean_id_str)
        commande = Commande.objects.filter(id=commande_id).select_related('client', 'livreur', 'magasin').first()
        if not commande:
            return JsonResponse({"success": False, "error": "Commande introuvable"}, status=200)

        client_phone = ""
        client_name = "Client"
        if commande.client:
            client_phone = commande.client.phone_number_1 or ""
            client_name = commande.client.username or "Client"

        # Resolve livreur info
        livreur_obj = commande.livreur
        liv_name = "Livreur"
        liv_phone = ""
        if livreur_obj and livreur_obj.partenneur and livreur_obj.partenneur.user:
            liv_name = f"{livreur_obj.partenneur.user.first_name} {livreur_obj.partenneur.user.last_name}".strip() or livreur_obj.partenneur.user.username
            liv_phone = livreur_obj.partenneur.user.phone_number_1 or ""
        elif hasattr(request, 'user') and request.user and request.user.is_authenticated:
            liv_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
            liv_phone = getattr(request.user, 'phone_number_1', '') or ""

        # Broadcast via WebSocket to confirmation dashboard
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                request_payload = {
                    'commande_id': commande.id,
                    'livreur_id': livreur_obj.id if livreur_obj else None,
                    'livreur_name': liv_name,
                    'livreur_phone': liv_phone,
                    'client_name': client_name,
                    'client_phone': client_phone,
                    'magasin_name': commande.magasin.name if commande.magasin else "Restaurant",
                    'reason': reason,
                    'comment': comment,
                    'timestamp': str(timezone.now()),
                }

                async_to_sync(channel_layer.group_send)(
                    "confirmation_commandes_all",
                    {
                        'type': 'send_client_phone_request',
                        'request_data': request_payload
                    }
                )
        except Exception as ws_err:
            logger.warning(f"Error broadcasting client phone request: {ws_err}")

        return JsonResponse({
            "success": True,
            "status": "pending",
            "message": "Votre demande est en cours de traitement. Veuillez attendre la validation de la plateforme.",
            "client_name": client_name,
            "reason": reason,
        }, status=200)

    except Exception as e:
        logger.error(f"Error in request_client_phone_livreur: {e}")
        return JsonResponse({"success": False, "error": str(e)}, status=200)


@api_view(["POST"])
def reorder_produits(request):
    """
    Met à jour l'ordre de classement des produits en masse ou individuellement.
    Format : [{"id": 1, "ordre": 1}, ...] ou {"produits": [{"id": 1, "ordre": 1}, ...]}
    """
    try:
        data = request.data
        items = data.get("produits", data) if isinstance(data, dict) else data
        if not isinstance(items, list):
            return Response({"message": "Données invalides, liste attendue"}, status=400)

        for item in items:
            prod_id = item.get("id")
            ordre = item.get("ordre")
            if prod_id is not None and ordre is not None:
                Produis.objects.filter(id=prod_id).update(ordre=int(ordre))

        return Response({"message": "Classement mis à jour avec succès"}, status=200)
    except Exception as e:
        return Response({"message": str(e)}, status=500)


@api_view(["POST"])
def reorder_magasins(request):
    """
    Met à jour l'ordre de classement des magasins en masse ou individuellement.
    Format : [{"id": 1, "ordre": 1}, ...] ou {"magasins": [{"id": 1, "ordre": 1}, ...]}
    """
    try:
        data = request.data
        items = data.get("magasins", data) if isinstance(data, dict) else data
        if not isinstance(items, list):
            return Response({"message": "Données invalides, liste attendue"}, status=400)

        for item in items:
            mag_id = item.get("id")
            ordre = item.get("ordre")
            if mag_id is not None and ordre is not None:
                try:
                    val_ordre = int(ordre) if str(ordre).strip() != "" else 999
                except (ValueError, TypeError):
                    val_ordre = 999
                Magasin.objects.filter(id=mag_id).update(ordre=val_ordre)

        return Response({"message": "Classement des magasins mis à jour avec succès"}, status=200)
    except Exception as e:
        return Response({"message": str(e)}, status=500)

