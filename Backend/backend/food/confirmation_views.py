import json
import logging
from django.http import JsonResponse
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.db.models import Q, F, Sum, Avg, Count
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Commande, Magasin, Livreur, Historique_annuler_commande, CommandeArticle, Publicity, Story, StoryItem
from .serializers import CommandeCnetreAppelSerializer, PublicattionSerializer, StorySerializer, StoryItemSerializer
from .permission import IsConfirmation
from .consumers import get_online_livreur_ids
from employer.models import CustomUser, Partenneur, Vihucule, Type_compte_partener, Notication_choffeur, Remise, generate_random_code
from django.db import transaction
from django.utils import timezone

import math
import re
import random
from datetime import datetime
from decimal import Decimal

logger = logging.getLogger(__name__)


def parse_wilaya_filter(val):
    """
    Retourne un tuple (code_int, clean_name_str) à partir d'une valeur de wilaya.
    Exemples :
      - '13' -> (13, '')
      - 13 -> (13, '')
      - 'wilaya de Tlemcen' -> (None, 'Tlemcen')
      - 'Tlemcen' -> (None, 'Tlemcen')
      - '13 - Tlemcen' -> (13, 'Tlemcen')
    """
    if val is None:
        return (None, None)
    s = str(val).strip()
    if not s:
        return (None, None)

    if s.isdigit():
        return (int(s), "")

    clean_name = re.sub(r'^(wilaya\s+de\s+|wilaya\s+d\'|wilaya\s+)', '', s, flags=re.IGNORECASE).strip()
    code_match = re.search(r'\b\d{1,2}\b', s)
    code_int = int(code_match.group(0)) if code_match else None

    return (code_int, clean_name or s)


def build_magasin_wilaya_q(wilaya):
    if not wilaya:
        return Q()
    code, name = parse_wilaya_filter(wilaya)
    q = Q()
    if name:
        q |= Q(wilaya__icontains=name) | Q(owner__user__wilaya__icontains=name)
    if code is not None:
        q |= Q(owner__user__wilaya_code=code)
    return q


def build_livreur_wilaya_q(wilaya):
    if not wilaya:
        return Q()
    code, name = parse_wilaya_filter(wilaya)
    q = Q()
    if name:
        q |= Q(wilaya__icontains=name) | Q(partenneur__user__wilaya__icontains=name)
    if code is not None:
        q |= Q(partenneur__user__wilaya_code=code)
    return q


def build_commande_wilaya_q(wilaya):
    if not wilaya:
        return Q()
    code, name = parse_wilaya_filter(wilaya)
    q = Q()
    if name:
        q |= Q(magasin__wilaya__icontains=name) | \
             Q(magasin__owner__user__wilaya__icontains=name) | \
             Q(client__wilaya__icontains=name) | \
             Q(distination__icontains=name)
    if code is not None:
        q |= Q(magasin__owner__user__wilaya_code=code) | \
             Q(client__wilaya_code=code)
    return q


def haversine_distance_km(lat1, lon1, lat2, lon2):
    """
    Calcule la distance en kilomètres entre deux coordonnées géographiques
    selon la formule de Haversine.
    """
    try:
        lat1 = float(str(lat1).strip())
        lon1 = float(str(lon1).strip())
        lat2 = float(str(lat2).strip())
        lon2 = float(str(lon2).strip())
        if (lat1 == 0.0 and lon1 == 0.0) or (lat2 == 0.0 and lon2 == 0.0):
            return None
        R = 6371.0  # Rayon de la Terre en kilomètres
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return round(R * c, 2)
    except Exception:
        return None


@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_confirmation_dashboard_stats(request):
    """
    Renvoie les métriques globales pour le tableau de bord de confirmation :
    - Magasins (total, ouverts, fermés)
    - Livreurs (total, en ligne / disponibles, hors ligne)
    - Commandes (total, en attente, confirmées, non confirmées)
    - Statistiques par wilaya si demandées
    """
    try:
        wilaya = request.GET.get("wilaya", None)
        online_ids = get_online_livreur_ids()

        magasins_qs = Magasin.objects.all()
        livreurs_qs = Livreur.objects.select_related("partenneur__user")
        commandes_qs = Commande.objects.all()

        if wilaya:
            mag_q = build_magasin_wilaya_q(wilaya)
            liv_q = build_livreur_wilaya_q(wilaya)
            cmd_q = build_commande_wilaya_q(wilaya)

            if mag_q:
                magasins_qs = magasins_qs.filter(mag_q)
            if liv_q:
                livreurs_qs = livreurs_qs.filter(liv_q)
            if cmd_q:
                commandes_qs = commandes_qs.filter(cmd_q)

        # Magasins stats
        total_magasins = magasins_qs.count()
        magasins_ouverts = magasins_qs.filter(EtatOuverture=True, is_active=True).count()
        magasins_fermes = total_magasins - magasins_ouverts

        # Livreurs stats based strictly on active WebSocket connections
        total_livreurs = livreurs_qs.count()
        livreurs_en_ligne = livreurs_qs.filter(id__in=online_ids, partenneur__user__bloquer=False).count()
        livreurs_offline = max(total_livreurs - livreurs_en_ligne, 0)

        # Commandes stats
        total_commandes = commandes_qs.count()
        commandes_en_attente = commandes_qs.filter(status="pending").count()
        commandes_confirmees = commandes_qs.filter(confirmation=True).count()
        commandes_non_confirmees = commandes_qs.filter(confirmation=False, status="pending").count()
        commandes_en_livraison = commandes_qs.filter(status__in=["in_progress", "search", "ready"]).count()
        commandes_livrees = commandes_qs.filter(status="delivered").count()

        return JsonResponse({
            "success": True,
            "data": {
                "magasins": {
                    "total": total_magasins,
                    "ouverts": magasins_ouverts,
                    "fermes": magasins_fermes,
                },
                "livreurs": {
                    "total": total_livreurs,
                    "en_ligne": livreurs_en_ligne,
                    "offline": livreurs_offline,
                },
                "commandes": {
                    "total": total_commandes,
                    "en_attente": commandes_en_attente,
                    "confirmees": commandes_confirmees,
                    "non_confirmees": commandes_non_confirmees,
                    "en_livraison": commandes_en_livraison,
                    "livrees": commandes_livrees,
                }
            }
        }, status=200)

    except Exception as e:
        logger.error(f"Error in get_confirmation_dashboard_stats: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_confirmation_magasins(request):
    """
    Récupère la liste des magasins avec filtres :
    - wilaya
    - etat (ouvert / ferme)
    - search (nom, adresse, téléphone, propriétaire)
    """
    try:
        wilaya = request.GET.get("wilaya", None)
        etat = request.GET.get("etat", None)  # 'ouvert', 'ferme', 'true', 'false'
        search = request.GET.get("search", None)
        page = request.GET.get("page", 1)
        page_size = int(request.GET.get("page_size", 20))
        qs = Magasin.objects.select_related("owner__user").prefetch_related("cataloguqe").exclude(
            Q(owner__type_compte__name__icontains="chauf") |
            Q(owner__type_compte__name__icontains="chof") |
            Q(owner__type_compte__name__icontains="vtc") |
            Q(owner__type_compte__name__icontains="livr") |
            Q(owner__vihucule__isnull=False) |
            Q(name__icontains="chauffeur") |
            Q(name__icontains="choffeur")
        ).order_by(F('ordre').asc(nulls_last=True), "-id")

        if wilaya:
            mag_q = build_magasin_wilaya_q(wilaya)
            if mag_q:
                qs = qs.filter(mag_q)

        if etat in ["ouvert", "true", "True", "1"]:
            qs = qs.filter(EtatOuverture=True, is_active=True)
        elif etat in ["ferme", "false", "False", "0"]:
            qs = qs.filter(Q(EtatOuverture=False) | Q(is_active=False))

        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(address__icontains=search) |
                Q(contact__icontains=search) |
                Q(owner__user__username__icontains=search) |
                Q(owner__user__phone_number_1__icontains=search)
            )

        paginator = Paginator(qs, page_size)
        try:
            current_page = paginator.page(page)
        except (PageNotAnInteger, EmptyPage):
            current_page = paginator.page(1) if paginator.num_pages > 0 else []

        results = []
        for mag in (current_page if hasattr(current_page, '__iter__') else []):
            mag_lat = None
            mag_lon = None
            try:
                if mag.owner and mag.owner.latitude is not None and str(mag.owner.latitude).strip():
                    mag_lat = float(str(mag.owner.latitude))
                elif mag.owner and mag.owner.user and mag.owner.user.latitude is not None and str(mag.owner.user.latitude).strip():
                    mag_lat = float(str(mag.owner.user.latitude))
            except Exception:
                mag_lat = None

            try:
                if mag.owner and mag.owner.longitude is not None and str(mag.owner.longitude).strip():
                    mag_lon = float(str(mag.owner.longitude))
                elif mag.owner and mag.owner.user and mag.owner.user.longitude is not None and str(mag.owner.user.longitude).strip():
                    mag_lon = float(str(mag.owner.user.longitude))
            except Exception:
                mag_lon = None

            results.append({
                "id": mag.id,
                "name": mag.name,
                "address": mag.address,
                "contact": mag.contact or (mag.owner.user.phone_number_1 if mag.owner and mag.owner.user else ""),
                "descprition": mag.descprition or "",
                "is_active": mag.is_active,
                "EtatOuverture": mag.EtatOuverture,
                "wilaya": mag.wilaya or (mag.owner.user.wilaya_code if mag.owner and mag.owner.user else ""),
                "latitude": mag_lat,
                "longitude": mag_lon,
                "rating": mag.rating,
                "image": mag.image.url if mag.image else None,
                "image_background": mag.image_background.url if mag.image_background else None,
                "owner": {
                    "id": mag.owner.id if mag.owner else None,
                    "username": mag.owner.user.username if mag.owner and mag.owner.user else "",
                    "first_name": mag.owner.user.first_name if mag.owner and mag.owner.user else "",
                    "last_name": mag.owner.user.last_name if mag.owner and mag.owner.user else "",
                    "phone": mag.owner.user.phone_number_1 if mag.owner and mag.owner.user else "",
                    "latitude": mag_lat,
                    "longitude": mag_lon,
                } if mag.owner else None,
                "categories": [c.name for c in mag.cataloguqe.all()],
                "catalogues": [{"id": c.id, "name": c.name} for c in mag.cataloguqe.all()],
                "ordre": mag.ordre,
                "livraison_gratuite": bool(mag.livraison_gratuite),
                "date_debut_livraison_gratuite": mag.date_debut_livraison_gratuite.isoformat() if mag.date_debut_livraison_gratuite else None,
                "date_fin_livraison_gratuite": mag.date_fin_livraison_gratuite.isoformat() if mag.date_fin_livraison_gratuite else None,
                "tarif_livraison": float(mag.tarif_livraison) if mag.tarif_livraison is not None else None,
                "pourcentage_commission": float(mag.pourcentage_commission) if mag.pourcentage_commission is not None else 0.0,
                "pourcentage_remise": float(mag.pourcentage_remise) if mag.pourcentage_remise is not None else 0.0,
                "is_livraison_gratuite_active": mag.is_livraison_gratuite_active(),
            })

        return JsonResponse({
            "success": True,
            "data": results,
            "total": paginator.count,
            "page": int(page),
            "page_size": page_size,
            "total_pages": paginator.num_pages,
        }, status=200)

    except Exception as e:
        logger.error(f"Error in get_confirmation_magasins: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_confirmation_livreurs(request):
    """
    Récupère la liste des livreurs avec filtres :
    - wilaya
    - available (en ligne / hors ligne)
    - search (nom, prénom, username, téléphone)
    - commande_id ou magasin_lat/magasin_lng pour calculer la distance et vérifier la zone de 3 km
    """
    try:
        wilaya = request.GET.get("wilaya", None)
        available = request.GET.get("available", None)  # 'true', 'false', 'en_ligne', 'offline'
        search = request.GET.get("search", None)
        page = request.GET.get("page", 1)
        page_size = int(request.GET.get("page_size", 20))
        online_ids = get_online_livreur_ids()

        # Coordonnées du magasin de référence (pour calcul de distance et zone 3 km)
        ref_lat = None
        ref_lng = None
        commande_id_param = request.GET.get("commande_id", None)
        if commande_id_param:
            try:
                cmd_ref = Commande.objects.select_related("magasin__owner").get(id=commande_id_param)
                # Check specific first for colis or express orders
                if cmd_ref.specific:
                    try:
                        spec = json.loads(cmd_ref.specific) if isinstance(cmd_ref.specific, str) else cmd_ref.specific
                        p_lat = spec.get("point_depart_lat") or spec.get("pickup_lat")
                        p_lng = spec.get("point_depart_lng") or spec.get("pickup_lng")
                        if p_lat and p_lng:
                            ref_lat = float(str(p_lat))
                            ref_lng = float(str(p_lng))
                    except Exception:
                        pass
                if ref_lat is None and cmd_ref.magasin and cmd_ref.magasin.owner:
                    if cmd_ref.magasin.owner.latitude and cmd_ref.magasin.owner.longitude:
                        ref_lat = float(str(cmd_ref.magasin.owner.latitude))
                        ref_lng = float(str(cmd_ref.magasin.owner.longitude))
            except Exception:
                pass

        if ref_lat is None and request.GET.get("magasin_lat") and request.GET.get("magasin_lng"):
            try:
                ref_lat = float(request.GET.get("magasin_lat"))
                ref_lng = float(request.GET.get("magasin_lng"))
            except Exception:
                pass

        qs = Livreur.objects.select_related("partenneur__user", "partenneur__vihucule", "magasin").order_by("-id")

        if wilaya:
            liv_q = build_livreur_wilaya_q(wilaya)
            if liv_q:
                qs = qs.filter(liv_q)

        if available in ["true", "True", "1", "en_ligne", "online"]:
            qs = qs.filter(id__in=online_ids, partenneur__user__bloquer=False)
        elif available in ["false", "False", "0", "offline", "hors_ligne"]:
            qs = qs.exclude(id__in=online_ids).filter(partenneur__user__bloquer=False)
        elif available in ["blocked", "bloquer", "bloque"]:
            qs = qs.filter(partenneur__user__bloquer=True)

        if search:
            qs = qs.filter(
                Q(partenneur__user__username__icontains=search) |
                Q(partenneur__user__first_name__icontains=search) |
                Q(partenneur__user__last_name__icontains=search) |
                Q(partenneur__user__phone_number_1__icontains=search) |
                Q(partenneur__RC__icontains=search)
            )

        paginator = Paginator(qs, page_size)
        try:
            current_page = paginator.page(page)
        except (PageNotAnInteger, EmptyPage):
            current_page = paginator.page(1) if paginator.num_pages > 0 else []

        results = []
        for liv in (current_page if hasattr(current_page, '__iter__') else []):
            partenaire = liv.partenneur if hasattr(liv, 'partenneur') else None
            user = partenaire.user if partenaire else None
            active_orders = Commande.objects.filter(livreur=liv, status__in=["confirmed", "in_progress", "ready"]).count()
            liv_is_online = bool(liv.id in online_ids and not (user and user.bloquer))

            lat = None
            lng = None
            try:
                raw_lat = None
                raw_lng = None
                if partenaire and partenaire.latitude is not None and partenaire.longitude is not None:
                    try:
                        raw_lat = float(str(partenaire.latitude).strip())
                        raw_lng = float(str(partenaire.longitude).strip())
                    except Exception:
                        pass

                if (raw_lat is None or raw_lng is None or (raw_lat == 0 and raw_lng == 0)) and user:
                    if hasattr(user, 'latitude') and user.latitude is not None and user.longitude is not None:
                        try:
                            raw_lat = float(str(user.latitude).strip())
                            raw_lng = float(str(user.longitude).strip())
                        except Exception:
                            pass

                if raw_lat is not None and raw_lng is not None and not (raw_lat == 0 and raw_lng == 0):
                    # Smart auto-swap for Algeria coordinates (lat: ~18..38, lng: ~-9..12)
                    if abs(raw_lat) <= 15 and 18 <= raw_lng <= 38:
                        lat, lng = raw_lng, raw_lat
                    else:
                        lat, lng = raw_lat, raw_lng
            except Exception:
                lat = None
                lng = None

            dist_km = None
            if ref_lat is not None and ref_lng is not None and lat is not None and lng is not None:
                dist_km = haversine_distance_km(ref_lat, ref_lng, lat, lng)

            in_zone_3km = (dist_km is not None and dist_km <= 3.0)
            vehicule_obj = partenaire.vihucule if (partenaire and partenaire.vihucule) else None

            user_image = None
            if user and hasattr(user, 'image_url') and user.image_url:
                try:
                    user_image = user.image_url.url
                except Exception:
                    user_image = str(user.image_url)

            results.append({
                "id": liv.id,
                "is_available": liv_is_online,
                "wilaya": liv.wilaya or (user.wilaya_code if user else ""),
                "active_orders_count": active_orders,
                "latitude": lat,
                "longitude": lng,
                "distance_km": dist_km,
                "in_zone_3km": in_zone_3km,
                "is_blocked": bool(user.bloquer) if user else False,
                "RC": partenaire.RC if partenaire else "",
                "Nif": partenaire.Nif if partenaire else "",
                "card_number": partenaire.card_number if partenaire else "",
                "numero_act": partenaire.numero_act if partenaire else "",
                "user": {
                    "id": user.id if user else None,
                    "username": user.username if user else "",
                    "first_name": user.first_name if user else "",
                    "last_name": user.last_name if user else "",
                    "phone": user.phone_number_1 if user else "",
                    "email": user.email if user else "",
                    "rating": user.rating if user else 5.0,
                    "bloquer": bool(user.bloquer) if user else False,
                    "image_url": user_image,
                    "nbr_commandes": (user.nbr_commandes or 0) if user else 0,
                } if user else None,
                "vehicule": {
                    "type_vehicule": vehicule_obj.type_vehicule if vehicule_obj else "Moto",
                    "marque": vehicule_obj.marque if vehicule_obj else "",
                    "modele": vehicule_obj.modele if vehicule_obj else "",
                    "matricule": vehicule_obj.matricule if vehicule_obj else "",
                    "num_assurance": vehicule_obj.num_assurance if vehicule_obj else "",
                } if vehicule_obj else None,
                "magasin_name": liv.magasin.name if liv.magasin else None,
                "magasin": {
                    "id": liv.magasin.id,
                    "name": liv.magasin.name
                } if liv.magasin else None
            })

        return JsonResponse({
            "success": True,
            "data": results,
            "total": paginator.count,
            "page": int(page),
            "page_size": page_size,
            "total_pages": paginator.num_pages,
        }, status=200)

    except Exception as e:
        logger.error(f"Error in get_confirmation_livreurs: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_confirmation_commandes(request):
    """
    Récupère toutes les commandes reçues avec filtrage avancé :
    - wilaya (code wilaya du magasin / client / destination)
    - status (pending, confirmed, delivered, canceled, in_progress...)
    - confirmation (true, false)
    - search (magasin, client, id, telephone)
    - pagination
    """
    try:
        wilaya = request.GET.get("wilaya", None)
        status_filter = request.GET.get("status", None)
        confirmation_filter = request.GET.get("confirmation", None)
        search = request.GET.get("search", None)
        date_filter = request.GET.get("date", None)
        date_start = request.GET.get("date_start", None) or request.GET.get("date_from", None)
        date_end = request.GET.get("date_end", None) or request.GET.get("date_to", None)
        page = request.GET.get("page", 1)
        page_size = int(request.GET.get("page_size", 20))

        qs = Commande.objects.select_related(
            "client", "magasin", "magasin__owner__user", "livreur__partenneur__user", "emp_val"
        ).prefetch_related("articles_commandes").order_by("-id")

        if wilaya:
            cmd_q = build_commande_wilaya_q(wilaya)
            if cmd_q:
                qs = qs.filter(cmd_q)

        if status_filter:
            qs = qs.filter(status=status_filter)

        if confirmation_filter in ["true", "True", "1"]:
            qs = qs.filter(confirmation=True)
        elif confirmation_filter in ["false", "False", "0"]:
            qs = qs.filter(confirmation=False)

        if date_filter:
            qs = qs.filter(created_at__date=date_filter)

        if date_start:
            qs = qs.filter(created_at__date__gte=date_start)

        if date_end:
            qs = qs.filter(created_at__date__lte=date_end)

        if search:
            qs = qs.filter(
                Q(id__icontains=search) |
                Q(magasin__name__icontains=search) |
                Q(client__username__icontains=search) |
                Q(client__first_name__icontains=search) |
                Q(client__last_name__icontains=search) |
                Q(client__phone_number_1__icontains=search) |
                Q(distination__icontains=search)
            )

        paginator = Paginator(qs, page_size)
        try:
            current_page = paginator.page(page)
        except (PageNotAnInteger, EmptyPage):
            current_page = paginator.page(1) if paginator.num_pages > 0 else []

        serializer = CommandeCnetreAppelSerializer(current_page, many=True)

        return JsonResponse({
            "success": True,
            "data": serializer.data,
            "total": paginator.count,
            "page": int(page),
            "page_size": page_size,
            "total_pages": paginator.num_pages,
        }, status=200)

    except Exception as e:
        logger.error(f"Error in get_confirmation_commandes: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def assign_or_dispatch_commande(request):
    """
    Assigne / diffuse une commande à un livreur spécifique :
    - Body JSON : { "commande_id": int, "livreur_id": int, "status": optional("confirmed" / "in_progress") }
    - Met à jour la commande : livreur, confirmation=True, status="confirmed"
    - Émet un événement WebSocket vers le livreur
    """
    try:
        data = json.loads(request.body)
        commande_id = data.get("commande_id")
        livreur_id = data.get("livreur_id")
        new_status = data.get("status", "confirmed")

        if not commande_id or not livreur_id:
            return JsonResponse({
                "success": False,
                "message": "commande_id et livreur_id sont obligatoires"
            }, status=400)

        commande = Commande.objects.get(id=commande_id)
        previous_livreur = commande.livreur
        livreur = Livreur.objects.get(id=livreur_id)

        commande.livreur = livreur
        commande.confirmation = True
        if new_status:
            commande.status = new_status
        commande.save()

        # Si un ancien livreur différent était assigné, on le notifie du changement
        if previous_livreur and previous_livreur.id != livreur.id:
            try:
                channel_layer = get_channel_layer()
                if channel_layer:
                    async_to_sync(channel_layer.group_send)(
                        f'livreur_commande_updates_{previous_livreur.id}',
                        {
                            'type': 'livreur_notification',
                            'message': {
                                'commande_id': str(commande.id),
                                'action': 'reassigned',
                                'new_status': 'reassigned',
                                'message': f'La commande #{commande.id} a été assignée à un autre livreur.',
                            }
                        }
                    )
            except Exception as prev_err:
                logger.warning(f"Error notifying previous livreur {previous_livreur.id}: {prev_err}")

        # Envoi de la notification WebSocket temps réel au nouveau livreur
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                room_group_name = f'livreur_commande_updates_{livreur.id}'
                
                produis = CommandeArticle.objects.filter(commande=commande)
                prix_total = sum(p.subtotal for p in produis) or float(commande.total_price or 0.0)

                magasin_lat = str(commande.magasin.owner.latitude) if commande.magasin and hasattr(commande.magasin, 'owner') and commande.magasin.owner and commande.magasin.owner.latitude else "0.0"
                magasin_lon = str(commande.magasin.owner.longitude) if commande.magasin and hasattr(commande.magasin, 'owner') and commande.magasin.owner and commande.magasin.owner.longitude else "0.0"
                client_lat = str(commande.client.latitude) if commande.client and commande.client.latitude else "0.0"
                client_lon = str(commande.client.longitude) if commande.client and commande.client.longitude else "0.0"

                mag_name = commande.magasin.name if commande.magasin else "Commande Express"
                mag_addr = commande.magasin.address if commande.magasin else ""
                items_desc = str(commande.itemss or "")
                client_dest = commande.distination or (commande.client.username if commande.client else "")

                # Colis / express handling
                colis_data = {}
                if commande.specific:
                    if isinstance(commande.specific, dict):
                        colis_data = commande.specific
                    elif isinstance(commande.specific, str):
                        try:
                            colis_data = json.loads(commande.specific)
                        except Exception:
                            pass
                if colis_data:
                    if colis_data.get('nom_produit'):
                        mag_name = f"📦 Colis: {colis_data.get('nom_produit')}"
                        items_desc = str(colis_data.get('nom_produit'))
                    if colis_data.get('adresse_depart'):
                        mag_addr = str(colis_data.get('adresse_depart'))
                    if colis_data.get('adresse_livraison'):
                        client_dest = str(colis_data.get('adresse_livraison'))
                    p_lat = colis_data.get("point_depart_lat") or colis_data.get("pickup_lat")
                    p_lng = colis_data.get("point_depart_lng") or colis_data.get("pickup_lng")
                    if p_lat and p_lng:
                        magasin_lat = str(p_lat)
                        magasin_lon = str(p_lng)
                    d_lat = colis_data.get("point_livraison_lat") or colis_data.get("destination_lat")
                    d_lng = colis_data.get("point_livraison_lng") or colis_data.get("destination_lng")
                    if d_lat and d_lng:
                        client_lat = str(d_lat)
                        client_lon = str(d_lng)

                msg_payload = {
                    'type': 'livreur_notification',
                    'message': {
                        'commande_id': commande.id,
                        'new_status': commande.status,
                        'action': 'assigne',
                        'client': commande.client.username if commande.client else "",
                        'total_price': str(prix_total),
                        'delivery_price': str(commande.delivery_price or "0"),
                        'items': items_desc,
                        'distance': str(commande.distance or colis_data.get("distance_km") or "0"),
                        'trip_time': str(commande.trip_time or "0"),
                        'logo_magasin': str(commande.magasin.image) if commande.magasin and commande.magasin.image else (colis_data.get("image") or ""),
                        'logo_client': str(commande.client.image_url) if commande.client and commande.client.image_url else "",
                        'rating': str(commande.magasin.rating) if commande.magasin and commande.magasin.rating else "5.0",
                        'magasin_name': mag_name,
                        'client_name': client_dest,
                        'client_phone': commande.client.phone_number_1 if commande.client else "",
                        'client_localtion': client_dest,
                        'magasin_adresse': mag_addr,
                        'client_lat': client_lat,
                        'client_lon': client_lon,
                        'magasin_lat': magasin_lat,
                        'magasin_lon': magasin_lon,
                        'is_colis': bool(colis_data),
                        'specific': colis_data
                    }
                }
                async_to_sync(channel_layer.group_send)(room_group_name, msg_payload)
                try:
                    async_to_sync(channel_layer.group_send)(f'livreur_{livreur.id}', msg_payload)
                except Exception:
                    pass

                # Mettre à jour le dashboard de confirmation en temps réel
                try:
                    serialized_cmd = CommandeCnetreAppelSerializer(commande).data
                    async_to_sync(channel_layer.group_send)(
                        "confirmation_commandes_all",
                        {
                            'type': 'send_commande_update',
                            'commande': serialized_cmd
                        }
                    )
                except Exception as conf_err:
                    logger.warning(f"Error broadcasting assignment to confirmation dashboard: {conf_err}")
        except Exception as ws_err:
            logger.warning(f"WebSocket notification warning: {ws_err}")

        return JsonResponse({
            "success": True,
            "message": f"Commande #{commande.id} assignée avec succès au livreur {livreur.partenneur.user.first_name if livreur.partenneur and livreur.partenneur.user else livreur.id} !",
            "commande_id": commande.id,
            "livreur_id": livreur.id,
            "status": commande.status
        }, status=200)

    except Commande.DoesNotExist:
        return JsonResponse({"success": False, "message": "Commande introuvable"}, status=404)
    except Livreur.DoesNotExist:
        return JsonResponse({"success": False, "message": "Livreur introuvable"}, status=404)
    except Exception as e:
        logger.error(f"Error in assign_or_dispatch_commande: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def confirm_commande_by_centre(request):
    """
    Confirme une commande après appel et vérification avec le magasin :
    - Body JSON : { "commande_id": int }
    - Met à jour la commande : confirmation=True, status="confirmed" (si pending)
    """
    try:
        data = json.loads(request.body)
        commande_id = data.get("commande_id")

        if not commande_id:
            return JsonResponse({
                "success": False,
                "message": "commande_id est obligatoire"
            }, status=400)

        commande = Commande.objects.get(id=commande_id)
        commande.confirmation = True
        if commande.status == "pending":
            commande.status = "confirmed"
        commande.save()

        return JsonResponse({
            "success": True,
            "message": f"Commande #{commande.id} confirmée avec succès !",
            "commande_id": commande.id,
            "status": commande.status,
            "confirmation": commande.confirmation
        }, status=200)

    except Commande.DoesNotExist:
        return JsonResponse({"success": False, "message": "Commande introuvable"}, status=404)
    except Exception as e:
        logger.error(f"Error in confirm_commande_by_centre: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def cancel_commande_by_centre(request):
    """
    Annule une commande avec enregistrement obligatoire du motif / raison :
    - Body JSON : { "commande_id": int, "reason": str }
    - Met à jour la commande : status="canceled"
    - Enregistre dans Historique_annuler_commande
    """
    try:
        data = json.loads(request.body)
        commande_id = data.get("commande_id")
        reason = data.get("reason", "").strip()

        if not commande_id:
            return JsonResponse({
                "success": False,
                "message": "commande_id est obligatoire"
            }, status=400)

        if not reason:
            return JsonResponse({
                "success": False,
                "message": "La raison d'annulation est obligatoire."
            }, status=400)

        commande = Commande.objects.get(id=commande_id)
        livreur_to_notify = commande.livreur
        commande.status = "canceled"
        commande.specific = f"Annulée par {request.user.username} (Confirmation). Motif: {reason}"
        commande.save()

        # Enregistrement dans l'historique d'annulation
        Historique_annuler_commande.objects.create(
            commande=commande,
            user_annulie=request.user if request.user.is_authenticated else None,
            raison=reason
        )

        # Envoi de la notification WebSocket temps réel au livreur et au client
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                if livreur_to_notify:
                    async_to_sync(channel_layer.group_send)(
                        f'livreur_commande_updates_{livreur_to_notify.id}',
                        {
                            'type': 'livreur_notification',
                            'message': {
                                'commande_id': str(commande.id),
                                'action': 'canceled',
                                'new_status': 'canceled',
                                'reason': reason,
                                'message': f'La commande #{commande.id} a été annulée. Motif: {reason}',
                            }
                        }
                    )
                if commande.client:
                    async_to_sync(channel_layer.group_send)(
                        f'commande_updates_{commande.id}',
                        {
                            'type': 'commande.status',
                            'data': {
                                'commande_id': str(commande.id),
                                'status': 'canceled',
                                'reason': reason,
                            }
                        }
                    )
        except Exception as ws_cancel_err:
            logger.warning(f"Error notifying cancellation via WebSocket: {ws_cancel_err}")

        return JsonResponse({
            "success": True,
            "message": f"Commande #{commande.id} annulée avec succès pour le motif : {reason}",
            "commande_id": commande.id,
            "status": commande.status,
            "reason": reason
        }, status=200)

    except Commande.DoesNotExist:
        return JsonResponse({"success": False, "message": "Commande introuvable"}, status=404)
    except Exception as e:
        logger.error(f"Error in cancel_commande_by_centre: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def mark_commande_delivered_by_centre(request):
    """
    Marque une commande comme livrée (status='delivered') depuis le rôle confirmation.
    - Body JSON : { "commande_id": int }
    """
    try:
        data = json.loads(request.body)
        commande_id = data.get("commande_id")

        if not commande_id:
            return JsonResponse({
                "success": False,
                "message": "commande_id est obligatoire"
            }, status=400)

        commande = Commande.objects.get(id=commande_id)
        commande.status = "delivered"
        commande.confirmation = True
        commande.save()

        return JsonResponse({
            "success": True,
            "message": f"Commande #{commande.id} marquée comme livrée avec succès !",
            "commande_id": commande.id,
            "status": commande.status
        }, status=200)

    except Commande.DoesNotExist:
        return JsonResponse({"success": False, "message": "Commande introuvable"}, status=404)
    except Exception as e:
        logger.error(f"Error in mark_commande_delivered_by_centre: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def update_commande_status_by_centre(request):
    """
    Permet de modifier le statut d'une commande (ex: 'in_progress', 'delivered', 'confirmed', etc.)
    ou son temps de prise ('trip_time') depuis le rôle confirmation.
    - Body JSON : { "commande_id": int, "status": optional(str), "trip_time": optional(str) }
    """
    try:
        data = json.loads(request.body)
        commande_id = data.get("commande_id")
        new_status = data.get("status")
        trip_time = data.get("trip_time")

        if not commande_id or (not new_status and trip_time is None):
            return JsonResponse({
                "success": False,
                "message": "commande_id et (status ou trip_time) sont obligatoires"
            }, status=400)

        commande = Commande.objects.get(id=commande_id)

        if trip_time is not None:
            commande.trip_time = str(trip_time)

        if new_status:
            # Mapping or alias
            if new_status == "livreur_pret_commande":
                new_status = "in_progress"
            commande.status = new_status
            if new_status in ["delivered", "in_progress", "confirmed"]:
                commande.confirmation = True

        commande.save()

        # Notifier les WebSockets
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                if commande.livreur:
                    async_to_sync(channel_layer.group_send)(
                        f"livreur_{commande.livreur.id}",
                        {
                            "type": "livreur_message",
                            "message": {
                                "type": "order_update",
                                "commande_id": commande.id,
                                "status": commande.status,
                                "trip_time": commande.trip_time,
                                "message": f"Mise à jour commande #{commande.id}"
                            }
                        }
                    )
                async_to_sync(channel_layer.group_send)(
                    "confirmation_commandes",
                    {
                        "type": "confirmation_message",
                        "message": {
                            "type": "order_update",
                            "commande_id": commande.id,
                            "status": commande.status,
                            "trip_time": commande.trip_time,
                        }
                    }
                )
        except Exception as ws_err:
            logger.warning(f"WebSocket notification error: {ws_err}")

        return JsonResponse({
            "success": True,
            "message": f"Commande #{commande.id} mise à jour avec succès !",
            "commande_id": commande.id,
            "status": commande.status,
            "trip_time": commande.trip_time
        }, status=200)

    except Commande.DoesNotExist:
        return JsonResponse({"success": False, "message": "Commande introuvable"}, status=404)
    except Exception as e:
        logger.error(f"Error in update_commande_status_by_centre: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def update_commande_trip_time_by_centre(request):
    """
    Permet à l'admin/centre de confirmation de modifier le temps de prise au restaurant ('trip_time')
    pour que le livreur voie le temps de préparation / prise en charge de la commande.
    - Body JSON : { "commande_id": int, "trip_time": str }
    """
    try:
        data = json.loads(request.body)
        commande_id = data.get("commande_id")
        trip_time = data.get("trip_time")

        if not commande_id or trip_time is None:
            return JsonResponse({
                "success": False,
                "message": "commande_id et trip_time sont obligatoires"
            }, status=400)

        commande = Commande.objects.get(id=commande_id)
        commande.trip_time = str(trip_time)
        commande.save()

        # Notifier les WebSockets
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                if commande.livreur:
                    async_to_sync(channel_layer.group_send)(
                        f"livreur_{commande.livreur.id}",
                        {
                            "type": "livreur_message",
                            "message": {
                                "type": "order_update",
                                "commande_id": commande.id,
                                "trip_time": commande.trip_time,
                                "created_at": commande.created_at.isoformat() if commande.created_at else "",
                                "server_time": timezone.now().isoformat(),
                                "message": f"Temps de prise au restaurant : {commande.trip_time}"
                            }
                        }
                    )
                async_to_sync(channel_layer.group_send)(
                    "confirmation_commandes",
                    {
                        "type": "confirmation_message",
                        "message": {
                            "type": "order_update",
                            "commande_id": commande.id,
                            "trip_time": commande.trip_time,
                        }
                    }
                )
        except Exception as ws_err:
            logger.warning(f"WebSocket notification error: {ws_err}")

        return JsonResponse({
            "success": True,
            "message": f"Temps de prise au restaurant mis à jour : {commande.trip_time}",
            "commande_id": commande.id,
            "trip_time": commande.trip_time
        }, status=200)

    except Commande.DoesNotExist:
        return JsonResponse({"success": False, "message": "Commande introuvable"}, status=404)
    except Exception as e:
        logger.error(f"Error in update_commande_trip_time_by_centre: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def toggle_livreur_bloque_by_centre(request):
    """
    Bloquer ou débloquer un livreur depuis le tableau de confirmation.
    - Body JSON : { "livreur_id": int, "bloquer": bool }
    """
    try:
        data = json.loads(request.body)
        livreur_id = data.get("livreur_id")
        bloquer_state = data.get("bloquer", True)

        if not livreur_id:
            return JsonResponse({"success": False, "message": "livreur_id est obligatoire"}, status=400)

        livreur = Livreur.objects.select_related("partenneur__user").get(id=livreur_id)
        if not livreur.partenneur or not livreur.partenneur.user:
            return JsonResponse({"success": False, "message": "Utilisateur associé au livreur introuvable"}, status=404)

        user = livreur.partenneur.user
        user.bloquer = bool(bloquer_state)
        user.save()

        action_label = "bloqué" if user.bloquer else "débloqué"
        return JsonResponse({
            "success": True,
            "message": f"Livreur {user.first_name} {user.last_name} {action_label} avec succès !",
            "livreur_id": livreur.id,
            "is_blocked": user.bloquer
        }, status=200)

    except Livreur.DoesNotExist:
        return JsonResponse({"success": False, "message": "Livreur introuvable"}, status=404)
    except Exception as e:
        logger.error(f"Error in toggle_livreur_bloque_by_centre: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)






@api_view(["POST"])
@permission_classes([IsConfirmation])
def approve_or_reject_client_phone(request):
    """
    Approuve ou refuse la demande de numéro client faite par le livreur.
    Si approved == True:
      - Met à jour le statut de la commande en 'in_progress'
      - Notifie le livreur par WebSocket avec le numéro de téléphone du client
      - Met à jour le dashboard en temps réel
    """
    try:
        data = request.data if isinstance(request.data, dict) else json.loads(request.body)
        commande_id = data.get("commande_id")
        approved = data.get("approved", True)

        if not commande_id:
            return JsonResponse({"success": False, "message": "commande_id est obligatoire"}, status=400)

        commande = Commande.objects.select_related(
            "client", "livreur", "livreur__partenneur__user", "magasin"
        ).get(id=commande_id)

        client_phone = commande.client.phone_number_1 if commande.client else ""

        if approved:
            commande.status = "in_progress"
            commande.save()

            # Notifier le livreur via son canal WebSocket dédié
            if commande.livreur:
                try:
                    channel_layer = get_channel_layer()
                    if channel_layer:
                        async_to_sync(channel_layer.group_send)(
                            f'livreur_commande_updates_{commande.livreur.id}',
                            {
                                'type': 'livreur_notification',
                                'message': {
                                    'action': 'client_phone_approved',
                                    'commande_id': str(commande.id),
                                    'client_phone': client_phone,
                                    'new_status': 'in_progress',
                                    'message': 'Votre demande a été acceptée.'
                                }
                            }
                        )
                except Exception as liv_err:
                    logger.warning(f"Error notifying livreur {commande.livreur.id}: {liv_err}")

            # Mettre à jour les dashboards confirmation
            try:
                channel_layer = get_channel_layer()
                if channel_layer:
                    serialized_cmd = CommandeCnetreAppelSerializer(commande).data
                    async_to_sync(channel_layer.group_send)(
                        "confirmation_commandes_all",
                        {
                            'type': 'send_commande_update',
                            'commande': serialized_cmd
                        }
                    )
            except Exception as bcast_err:
                logger.warning(f"Error broadcasting commande update: {bcast_err}")

            return JsonResponse({
                "success": True,
                "message": "Numéro client partagé avec le livreur et statut passé En Route",
                "client_phone": client_phone,
                "status": "in_progress"
            }, status=200)
        else:
            # Notification de refus au livreur
            if commande.livreur:
                try:
                    channel_layer = get_channel_layer()
                    if channel_layer:
                        async_to_sync(channel_layer.group_send)(
                            f'livreur_commande_updates_{commande.livreur.id}',
                            {
                                'type': 'livreur_notification',
                                'message': {
                                    'action': 'client_phone_rejected',
                                    'commande_id': str(commande.id),
                                    'message': "Désolé, votre demande a été refusée. Vous ne pouvez pas consulter le numéro du client avant de prendre en charge le colis du client."
                                }
                            }
                        )
                except Exception as liv_err:
                    logger.warning(f"Error notifying livreur: {liv_err}")

            return JsonResponse({
                "success": True,
                "message": "Demande de numéro client refusée",
                "status": commande.status
            }, status=200)

    except Commande.DoesNotExist:
        return JsonResponse({"success": False, "message": "Commande introuvable"}, status=404)
    except Exception as e:
        logger.error(f"Error in approve_or_reject_client_phone: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def broadcast_commande_by_centre(request):
    """
    Diffuse une commande à tous les livreurs disponibles dans un rayon de 3 km (zone circulaire) :
    - Body JSON : { "commande_id": int, "radius_km": optional(float, default 3.0) }
    - Met à jour la commande : status="search", confirmation=True, livreur=None
    - Envoie les notifications WebSocket à tous les livreurs ciblés
    - Met à jour les tableaux de bord confirmation en temps réel
    """
    try:
        data = request.data if isinstance(request.data, dict) else json.loads(request.body)
        commande_id = data.get("commande_id")
        radius_km = float(data.get("radius_km", 3.0))

        if not commande_id:
            return JsonResponse({"success": False, "message": "commande_id est obligatoire"}, status=400)

        commande = Commande.objects.select_related(
            "magasin__owner__user", "client", "livreur"
        ).get(id=commande_id)

        # Mettre la commande en mode recherche/diffusion
        commande.status = "search"
        commande.confirmation = True
        commande.livreur = None
        commande.save()

        # Coordonnées du point de départ (restaurant ou colis)
        mag_lat = 0.0
        mag_lon = 0.0
        try:
            if commande.magasin and commande.magasin.owner and commande.magasin.owner.latitude and commande.magasin.owner.longitude:
                mag_lat = float(str(commande.magasin.owner.latitude))
                mag_lon = float(str(commande.magasin.owner.longitude))
        except Exception:
            mag_lat = 0.0
            mag_lon = 0.0

        client_lat = str(commande.client.latitude) if commande.client and commande.client.latitude else "0.0"
        client_lon = str(commande.client.longitude) if commande.client and commande.client.longitude else "0.0"

        # Traitement spécifique pour les commandes Colis / Express
        colis_data = {}
        if commande.specific:
            if isinstance(commande.specific, dict):
                colis_data = commande.specific
            elif isinstance(commande.specific, str):
                try:
                    colis_data = json.loads(commande.specific)
                except Exception:
                    pass

        is_colis_or_express = bool(colis_data and (colis_data.get("type_service") == "colis" or "point_depart_lat" in colis_data or "adresse_depart" in colis_data))
        if is_colis_or_express:
            p_lat = colis_data.get("point_depart_lat") or colis_data.get("pickup_lat")
            p_lng = colis_data.get("point_depart_lng") or colis_data.get("pickup_lng")
            if p_lat and p_lng:
                try:
                    mag_lat = float(str(p_lat))
                    mag_lon = float(str(p_lng))
                except Exception:
                    pass

            d_lat = colis_data.get("point_livraison_lat") or colis_data.get("destination_lat")
            d_lng = colis_data.get("point_livraison_lng") or colis_data.get("destination_lng")
            if d_lat and d_lng:
                client_lat = str(d_lat)
                client_lon = str(d_lng)

        # Détermination intelligente de la wilaya
        wilaya = ""
        if is_colis_or_express:
            from food.views import WILAYA_CODE_NAME_MAP
            text_to_scan = f"{colis_data.get('adresse_livraison', '')} {colis_data.get('adresse_depart', '')} {colis_data.get('point_livraison', '')} {commande.distination or ''}".lower()
            for code, name in WILAYA_CODE_NAME_MAP.items():
                if re.search(r'\b' + re.escape(name) + r'\b', text_to_scan):
                    wilaya = name
                    break
            if not wilaya and commande.client:
                if commande.client.wilaya and str(commande.client.wilaya) not in ['', '0']:
                    wilaya = str(commande.client.wilaya)
                elif getattr(commande.client, 'wilaya_code', None) and commande.client.wilaya_code != 0:
                    wilaya = WILAYA_CODE_NAME_MAP.get(int(commande.client.wilaya_code), str(commande.client.wilaya_code))

        if not wilaya:
            wilaya = (
                commande.magasin.wilaya 
                if commande.magasin and commande.magasin.wilaya 
                else (commande.magasin.owner.user.wilaya_code if commande.magasin and commande.magasin.owner and commande.magasin.owner.user else "")
            )

        # Calculer le total
        produis = CommandeArticle.objects.filter(commande=commande)
        prix_total = sum(p.subtotal for p in produis) or float(commande.total_price or 0.0)

        # Trouver tous les livreurs de la wilaya ou connectés
        online_ids = get_online_livreur_ids()
        livreurs_qs = Livreur.objects.select_related("partenneur__user").filter(
            partenneur__user__bloquer=False
        )
        if wilaya:
            liv_q = build_livreur_wilaya_q(wilaya)
            if liv_q:
                livreurs_qs = livreurs_qs.filter(liv_q)

        target_livreur_ids = []
        for liv in livreurs_qs:
            coords_candidates = []
            if liv.partenneur and liv.partenneur.user and liv.partenneur.user.latitude and liv.partenneur.user.longitude:
                try:
                    coords_candidates.append((float(str(liv.partenneur.user.latitude)), float(str(liv.partenneur.user.longitude))))
                except Exception:
                    pass
            if liv.partenneur and liv.partenneur.latitude and liv.partenneur.longitude:
                try:
                    coords_candidates.append((float(str(liv.partenneur.latitude)), float(str(liv.partenneur.longitude))))
                except Exception:
                    pass

            # Si l'un des jeux de coordonnées est dans le rayon de 3 km :
            in_radius = False
            for c_lat, c_lon in coords_candidates:
                if c_lat != 0.0 and c_lon != 0.0 and mag_lat != 0.0 and mag_lon != 0.0:
                    dist = haversine_distance_km(mag_lat, mag_lon, c_lat, c_lon)
                    if dist is not None and dist <= radius_km:
                        in_radius = True
                        break

            if in_radius:
                target_livreur_ids.append(liv.id)
            elif not coords_candidates:
                # Si pas de coordonnées fixes enregistrées en base, mais dans la même wilaya ou en ligne :
                # On diffuse aussi car l'application mobile Flutter fait la vérification temps réel avec son GPS (checkIfClientIsInRadius <= 15 km)
                target_livreur_ids.append(liv.id)

        # Si aucun livreur trouvé avec le rayon strict ou wilaya, élargir comme la méthode Food
        if not target_livreur_ids:
            if wilaya:
                liv_q = build_livreur_wilaya_q(wilaya)
                if liv_q:
                    target_livreur_ids = list(Livreur.objects.filter(liv_q, partenneur__user__bloquer=False).values_list('id', flat=True))
            if not target_livreur_ids and online_ids:
                target_livreur_ids = list(online_ids)
            if not target_livreur_ids:
                target_livreur_ids = list(Livreur.objects.filter(partenneur__user__bloquer=False).values_list('id', flat=True))

        # Métadonnées adaptées colis ou magasin standard
        mag_name = commande.magasin.name if commande.magasin else "Commande Express"
        mag_addr = commande.magasin.address if commande.magasin else ""
        items_desc = str(commande.itemss or "")
        client_dest = commande.distination or (commande.client.username if commande.client else "")

        if is_colis_or_express:
            if colis_data.get('nom_produit'):
                mag_name = f"📦 Colis: {colis_data.get('nom_produit')}"
                items_desc = str(colis_data.get('nom_produit'))
            if colis_data.get('adresse_depart'):
                mag_addr = str(colis_data.get('adresse_depart'))
            if colis_data.get('adresse_livraison'):
                client_dest = str(colis_data.get('adresse_livraison'))

        # Envoi WebSocket à tous les livreurs ciblés
        channel_layer = get_channel_layer()
        if channel_layer:
            msg_payload = {
                'type': 'livreur_notification',
                'message': {
                    'commande_id': str(commande.id),
                    'action': 'new_commande',
                    'status': 'search',
                    'new_status': 'search',
                    'wilaya': str(wilaya),
                    'client': commande.client.username if commande.client else "",
                    'total_price': str(prix_total),
                    'delivery_price': str(commande.delivery_price or "0"),
                    'items': items_desc,
                    'distance': str(commande.distance or colis_data.get("distance_km") or "0"),
                    'trip_time': str(commande.trip_time or "0"),
                    'logo_magasin': str(commande.magasin.image) if commande.magasin and commande.magasin.image else (colis_data.get("image") or ""),
                    'logo_client': str(commande.client.image_url) if commande.client and commande.client.image_url else "",
                    'rating': str(commande.magasin.rating) if commande.magasin and commande.magasin.rating else "5.0",
                    'magasin_name': mag_name,
                    'client_name': client_dest,
                    'client_phone': commande.client.phone_number_1 if commande.client else "",
                    'client_localtion': client_dest,
                    'magasin_adresse': mag_addr,
                    'client_lat': client_lat,
                    'client_lon': client_lon,
                    'magasin_lat': str(mag_lat),
                    'magasin_lon': str(mag_lon),
                    'is_colis': is_colis_or_express,
                    'specific': colis_data
                }
            }

            for liv_id in target_livreur_ids:
                for grp in [f'livreur_commande_updates_{liv_id}', f'livreur_{liv_id}']:
                    try:
                        async_to_sync(channel_layer.group_send)(
                            grp,
                            msg_payload
                        )
                    except Exception as send_err:
                        logger.warning(f"Error sending broadcast to livreur {liv_id} on {grp}: {send_err}")

            # Notifier également le canal général livreurs si existant
            try:
                async_to_sync(channel_layer.group_send)('livreurs_broadcast', msg_payload)
            except Exception:
                pass

            # Notifier le dashboard de confirmation en temps réel
            try:
                serialized_cmd = CommandeCnetreAppelSerializer(commande).data
                async_to_sync(channel_layer.group_send)(
                    "confirmation_commandes_all",
                    {
                        'type': 'send_commande_update',
                        'commande': serialized_cmd
                    }
                )
            except Exception as conf_err:
                logger.warning(f"Error broadcasting to confirmation dashboard: {conf_err}")

        return JsonResponse({
            "success": True,
            "message": f"Commande #{commande.id} diffusée avec succès aux livreurs dans le cercle de {radius_km} km ({len(target_livreur_ids)} livreurs notifiés) !",
            "commande_id": commande.id,
            "status": "search",
            "targeted_livreurs_count": len(target_livreur_ids),
            "radius_km": radius_km
        }, status=200)

    except Commande.DoesNotExist:
        return JsonResponse({"success": False, "message": "Commande introuvable"}, status=404)
    except Exception as e:
        logger.error(f"Error in broadcast_commande_by_centre: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def create_confirmation_livreur(request):
    """
    Création simple et rapide d'un livreur :
    - username (requis)
    - password (requis)
    - wilaya (requis)
    - type de véhicule automatique : Moto
    - email généré automatiquement : usernameXXXX@ltc.dz (si non fourni)
    - phone (optionnel)
    - magasin_id (optionnel)
    """
    try:
        data = request.data if hasattr(request, 'data') and request.data else json.loads(request.body)
        username = str(data.get("username", "")).strip()
        password = str(data.get("password", "")).strip()
        wilaya = str(data.get("wilaya", "")).strip()
        phone = str(data.get("phone", "") or data.get("phone_number_1", "")).strip()
        magasin_id = data.get("magasin_id", None)

        if not username:
            return JsonResponse({"success": False, "message": "Le nom d'utilisateur est requis"}, status=400)
        if not password:
            return JsonResponse({"success": False, "message": "Le mot de passe est requis"}, status=400)
        if not wilaya:
            return JsonResponse({"success": False, "message": "La wilaya est requise"}, status=400)

        # Vérifier si l'utilisateur existe déjà
        if CustomUser.objects.filter(username=username).exists():
            return JsonResponse({"success": False, "message": "Ce nom d'utilisateur existe déjà"}, status=400)

        # Générer email automatique propre si non fourni
        email = data.get("email", "").strip()
        if not email:
            clean_username = re.sub(r'[^a-zA-Z0-9_]', '', username).lower()
            random_digits = random.randint(1000, 9999)
            email = f"{clean_username}{random_digits}@ltc.dz"
            # S'assurer de l'unicité de l'email
            while CustomUser.objects.filter(email=email).exists():
                random_digits = random.randint(10000, 99999)
                email = f"{clean_username}{random_digits}@ltc.dz"

        with transaction.atomic():
            # 1. Créer l'utilisateur CustomUser
            user = CustomUser.objects.create_user(
                username=username,
                email=email,
                password=password,
                phone_number_1=phone,
                wilaya=wilaya,
                role="partener",
                is_active=True
            )

            # 2. Créer le véhicule (Moto par défaut)
            vehicule = Vihucule.objects.create(
                type_vehicule="Moto",
                modele=data.get("modele", ""),
                marque=data.get("marque", ""),
                matricule=data.get("matricule", ""),
                num_assurance=data.get("num_assurance", "")
            )

            # 3. Récupérer ou créer le type de compte livreur
            type_account, _ = Type_compte_partener.objects.get_or_create(
                name="livreur",
                defaults={"tax_tawsile": 0}
            )

            # 4. Créer le partenaire
            partenaire = Partenneur.objects.create(
                user=user,
                type_compte=type_account,
                vihucule=vehicule,
                RC=data.get("RC", ""),
                Nif=data.get("Nif", ""),
                card_number=data.get("card_number", ""),
                numero_act=data.get("numero_act", "")
            )

            # 5. Créer l'objet Livreur
            magasin_obj = None
            if magasin_id:
                try:
                    magasin_obj = Magasin.objects.get(id=magasin_id)
                except Magasin.DoesNotExist:
                    pass

            livreur = Livreur.objects.create(
                partenneur=partenaire,
                wilaya=wilaya,
                magasin=magasin_obj
            )

        return JsonResponse({
            "success": True,
            "message": f"Livreur '{username}' créé avec succès !",
            "livreur_id": livreur.id,
            "data": {
                "id": livreur.id,
                "username": user.username,
                "email": user.email,
                "wilaya": livreur.wilaya,
                "type_vehicule": "Moto"
            }
        }, status=201)

    except Exception as e:
        logger.error(f"Error in create_confirmation_livreur: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def create_confirmation_magasin(request):
    """
    Création simple et rapide d'un magasin / restaurant :
    - username (requis)
    - password (requis)
    - nom_magasin (requis)
    - type_magasin (optionnel, ex: Restaurant, Fast Food, Supérette, etc.)
    - wilaya (requis)
    - email généré automatiquement : usernameXXXX@ltc.dz (si non fourni)
    - phone (optionnel)
    - address (optionnel)
    """
    try:
        data = request.data if hasattr(request, 'data') and request.data else json.loads(request.body)
        username = str(data.get("username", "")).strip()
        password = str(data.get("password", "")).strip()
        nom_magasin = str(data.get("nom_magasin", "") or data.get("name", "")).strip()
        type_magasin = str(data.get("type_magasin", "") or data.get("category", "")).strip()
        wilaya = str(data.get("wilaya", "")).strip()
        phone = str(data.get("phone", "") or data.get("phone_number_1", "")).strip()
        address = str(data.get("address", "") or data.get("adresse", "")).strip()

        if not username:
            return JsonResponse({"success": False, "message": "Le nom d'utilisateur est requis"}, status=400)
        if not password:
            return JsonResponse({"success": False, "message": "Le mot de passe est requis"}, status=400)
        if not nom_magasin:
            return JsonResponse({"success": False, "message": "Le nom du magasin est requis"}, status=400)
        if not wilaya:
            return JsonResponse({"success": False, "message": "La wilaya est requise"}, status=400)

        # Vérifier si l'utilisateur existe déjà
        if CustomUser.objects.filter(username=username).exists():
            return JsonResponse({"success": False, "message": "Ce nom d'utilisateur existe déjà"}, status=400)

        # Générer email automatique propre si non fourni
        email = data.get("email", "").strip()
        if not email:
            clean_username = re.sub(r'[^a-zA-Z0-9_]', '', username).lower() or "magasin"
            random_digits = random.randint(1000, 9999)
            email = f"{clean_username}{random_digits}@ltc.dz"
            # S'assurer de l'unicité de l'email
            while CustomUser.objects.filter(email=email).exists():
                random_digits = random.randint(10000, 99999)
                email = f"{clean_username}{random_digits}@ltc.dz"

        with transaction.atomic():
            # 1. Créer l'utilisateur CustomUser
            user = CustomUser.objects.create_user(
                username=username,
                email=email,
                password=password,
                phone_number_1=phone,
                wilaya=wilaya,
                role="partener",
                is_active=True
            )

            # 2. Récupérer ou créer le type de compte magasin
            type_account, _ = Type_compte_partener.objects.get_or_create(
                name="magasin",
                defaults={"tax_tawsile": 0}
            )

            # 3. Extraire latitude et longitude (si fournies)
            latitude_val = None
            longitude_val = None
            try:
                raw_lat = data.get("latitude")
                raw_lng = data.get("longitude")
                if raw_lat is not None and raw_lng is not None and str(raw_lat).strip() and str(raw_lng).strip():
                    latitude_val = float(str(raw_lat).strip())
                    longitude_val = float(str(raw_lng).strip())
            except Exception as coord_err:
                logger.warning(f"Could not parse coordinates for new magasin: {coord_err}")

            # 4. Créer le partenaire
            partenaire = Partenneur.objects.create(
                user=user,
                type_compte=type_account,
                nom_de_magasin=nom_magasin,
                adresse=address or wilaya,
                latitude=latitude_val,
                longitude=longitude_val,
                is_available=True
            )

            # Si l'utilisateur possède les champs latitude/longitude
            if latitude_val is not None and longitude_val is not None:
                if hasattr(user, 'latitude'):
                    user.latitude = latitude_val
                    user.longitude = longitude_val
                    user.save()

            # 5. Récupérer le Magasin créé par le signal post_save ou le créer s'il n'existe pas encore
            magasin = Magasin.objects.filter(owner=partenaire).first()
            if not magasin:
                magasin = Magasin.objects.create(
                    owner=partenaire,
                    name=nom_magasin,
                    address=address or wilaya,
                    contact=phone or "",
                    wilaya=wilaya,
                    descprition=type_magasin or "Magasin",
                    is_active=True,
                    EtatOuverture=True
                )
            else:
                # Mettre à jour les informations du magasin avec les données exactes
                magasin.name = nom_magasin
                magasin.address = address or wilaya
                magasin.contact = phone or ""
                magasin.wilaya = wilaya
                if type_magasin:
                    magasin.descprition = type_magasin
                magasin.is_active = True
                magasin.EtatOuverture = True
                magasin.save()

            # 5. Si un type de magasin est fourni, associer / créer le catalogue
            if type_magasin:
                try:
                    cat_obj, _ = Catlogue.objects.get_or_create(
                        name=type_magasin,
                        defaults={"type": type_account, "description": f"Catégorie {type_magasin}"}
                    )
                    magasin.cataloguqe.add(cat_obj)
                except Exception as cat_err:
                    logger.warning(f"Could not link catalogue {type_magasin}: {cat_err}")

        return JsonResponse({
            "success": True,
            "message": f"Magasin '{nom_magasin}' créé avec succès !",
            "magasin_id": magasin.id,
            "data": {
                "id": magasin.id,
                "name": magasin.name,
                "username": user.username,
                "email": user.email,
                "wilaya": magasin.wilaya,
                "type_magasin": type_magasin,
                "address": magasin.address
            }
        }, status=201)

    except Exception as e:
        logger.error(f"Error in create_confirmation_magasin: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST", "PUT", "PATCH"])
@permission_classes([IsConfirmation])
def update_confirmation_magasin(request):
    """
    Modifier les informations d'un magasin depuis le centre de confirmation / appel :
    - magasin_id (requis)
    - name, contact/phone, address/adresse, wilaya, descprition/description, EtatOuverture, is_active
    - owner_first_name, owner_last_name, owner_phone
    """
    try:
        data = request.data if hasattr(request, 'data') and request.data else json.loads(request.body)
        magasin_id = data.get("magasin_id") or data.get("id")

        if not magasin_id:
            return JsonResponse({"success": False, "message": "magasin_id est requis"}, status=400)

        magasin = Magasin.objects.select_related("owner__user").get(id=magasin_id)
        owner_partenaire = magasin.owner
        owner_user = owner_partenaire.user if owner_partenaire else None

        with transaction.atomic():
            # 1. Mise à jour des informations directes du Magasin
            if "name" in data and str(data.get("name", "")).strip():
                magasin.name = str(data.get("name")).strip()
                if owner_partenaire:
                    owner_partenaire.nom_de_magasin = magasin.name

            if "contact" in data or "phone" in data:
                phone_val = str(data.get("contact") or data.get("phone") or "").strip()
                magasin.contact = phone_val
                if owner_user and phone_val and not owner_user.phone_number_1:
                    owner_user.phone_number_1 = phone_val

            if "address" in data or "adresse" in data:
                addr_val = str(data.get("address") or data.get("adresse") or "").strip()
                magasin.address = addr_val
                if owner_partenaire:
                    owner_partenaire.adresse = addr_val

            if "wilaya" in data:
                wilaya_val = str(data.get("wilaya", "")).strip()
                magasin.wilaya = wilaya_val
                if owner_user:
                    owner_user.wilaya = wilaya_val
                    code_int, _ = parse_wilaya_filter(wilaya_val)
                    if code_int is not None:
                        owner_user.wilaya_code = code_int

            if "descprition" in data or "description" in data:
                magasin.descprition = str(data.get("descprition") or data.get("description") or "").strip()

            if "EtatOuverture" in data:
                magasin.EtatOuverture = bool(data.get("EtatOuverture"))

            if "is_active" in data:
                magasin.is_active = bool(data.get("is_active"))

            if "ordre" in data:
                try:
                    val = data.get("ordre")
                    magasin.ordre = int(val) if val is not None and str(val).strip() != "" else 999
                except (ValueError, TypeError):
                    magasin.ordre = 999

            if "livraison_gratuite" in data:
                magasin.livraison_gratuite = bool(data.get("livraison_gratuite"))

            if "date_debut_livraison_gratuite" in data:
                raw_d = data.get("date_debut_livraison_gratuite")
                if raw_d and str(raw_d).strip():
                    try:
                        magasin.date_debut_livraison_gratuite = datetime.strptime(str(raw_d).strip()[:10], "%Y-%m-%d").date()
                    except Exception:
                        pass
                else:
                    magasin.date_debut_livraison_gratuite = None

            if "date_fin_livraison_gratuite" in data:
                raw_f = data.get("date_fin_livraison_gratuite")
                if raw_f and str(raw_f).strip():
                    try:
                        magasin.date_fin_livraison_gratuite = datetime.strptime(str(raw_f).strip()[:10], "%Y-%m-%d").date()
                    except Exception:
                        pass
                else:
                    magasin.date_fin_livraison_gratuite = None

            if "tarif_livraison" in data:
                raw_t = data.get("tarif_livraison")
                if raw_t is not None and str(raw_t).strip() != "":
                    try:
                        magasin.tarif_livraison = Decimal(str(raw_t).strip())
                    except Exception:
                        pass
                else:
                    magasin.tarif_livraison = None

            if "pourcentage_commission" in data:
                try:
                    raw_pc = data.get("pourcentage_commission")
                    magasin.pourcentage_commission = float(raw_pc) if raw_pc is not None and str(raw_pc).strip() != "" else 0.0
                except Exception:
                    pass

            if "pourcentage_remise" in data:
                try:
                    raw_pr = data.get("pourcentage_remise")
                    magasin.pourcentage_remise = float(raw_pr) if raw_pr is not None and str(raw_pr).strip() != "" else 0.0
                except Exception:
                    pass

            magasin.save()

            if owner_partenaire:
                owner_partenaire.save()

            # 2. Mise à jour de l'utilisateur propriétaire si fourni
            if owner_user:
                if "owner_first_name" in data:
                    owner_user.first_name = str(data.get("owner_first_name", "")).strip()
                if "owner_last_name" in data:
                    owner_user.last_name = str(data.get("owner_last_name", "")).strip()
                if "owner_phone" in data and str(data.get("owner_phone")).strip():
                    new_owner_phone = str(data.get("owner_phone")).strip()
                    if not CustomUser.objects.filter(phone_number_1=new_owner_phone).exclude(id=owner_user.id).exists():
                        owner_user.phone_number_1 = new_owner_phone
                owner_user.save()

        return JsonResponse({
            "success": True,
            "message": f"Informations du magasin '{magasin.name}' mises à jour avec succès !",
            "data": {
                "id": magasin.id,
                "name": magasin.name,
                "address": magasin.address,
                "contact": magasin.contact or (owner_user.phone_number_1 if owner_user else ""),
                "wilaya": magasin.wilaya or (owner_user.wilaya if owner_user else ""),
                "EtatOuverture": magasin.EtatOuverture,
                "is_active": magasin.is_active,
                "ordre": magasin.ordre,
                "livraison_gratuite": magasin.livraison_gratuite,
                "date_debut_livraison_gratuite": magasin.date_debut_livraison_gratuite.isoformat() if magasin.date_debut_livraison_gratuite else None,
                "date_fin_livraison_gratuite": magasin.date_fin_livraison_gratuite.isoformat() if magasin.date_fin_livraison_gratuite else None,
                "tarif_livraison": float(magasin.tarif_livraison) if magasin.tarif_livraison is not None else None,
                "pourcentage_commission": magasin.pourcentage_commission,
                "pourcentage_remise": magasin.pourcentage_remise,
                "is_livraison_gratuite_active": magasin.is_livraison_gratuite_active(),
                "descprition": magasin.descprition,
                "owner": {
                    "id": owner_partenaire.id if owner_partenaire else None,
                    "username": owner_user.username if owner_user else "",
                    "first_name": owner_user.first_name if owner_user else "",
                    "last_name": owner_user.last_name if owner_user else "",
                    "phone": owner_user.phone_number_1 if owner_user else ""
                } if owner_user else None
            }
        }, status=200)

    except Magasin.DoesNotExist:
        return JsonResponse({"success": False, "message": "Magasin non trouvé"}, status=404)
    except Exception as e:
        logger.error(f"Error in update_confirmation_magasin: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST", "PUT"])
@permission_classes([IsConfirmation])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def update_confirmation_livreur_profile(request):
    """
    Compléter / mettre à jour le profil d'un livreur :
    - Infos personnelles : first_name, last_name, phone, email, wilaya, image (photo de profil)
    - Documents & Registres : RC, Nif, card_number, numero_act
    - Véhicule : type_vehicule, marque, modele, matricule, num_assurance
    - Magasin assigné : magasin_id (id ou None)
    """
    try:
        data = request.data if hasattr(request, 'data') and request.data else json.loads(request.body)
        livreur_id = data.get("livreur_id")

        if not livreur_id:
            return JsonResponse({"success": False, "message": "livreur_id est requis"}, status=400)

        livreur = Livreur.objects.select_related("partenneur__user", "partenneur__vihucule").get(id=livreur_id)
        partenaire = livreur.partenneur
        user = partenaire.user if partenaire else None
        vehicule = partenaire.vihucule if partenaire else None

        with transaction.atomic():
            # 1. Mise à jour de l'utilisateur
            if user:
                if "first_name" in data:
                    user.first_name = data.get("first_name", "")
                if "last_name" in data:
                    user.last_name = data.get("last_name", "")
                if "phone" in data or "phone_number_1" in data:
                    user.phone_number_1 = data.get("phone") or data.get("phone_number_1") or ""
                if "email" in data and data.get("email"):
                    new_email = data.get("email").strip()
                    if new_email != user.email and not CustomUser.objects.filter(email=new_email).exclude(id=user.id).exists():
                        user.email = new_email
                if "wilaya" in data and data.get("wilaya"):
                    user.wilaya = data.get("wilaya")
                if "password" in data and data.get("password") and str(data.get("password")).strip():
                    user.set_password(str(data.get("password")).strip())

                # Gestion de la photo de profil du livreur
                image_file = request.FILES.get("image") or request.FILES.get("image_url") or request.FILES.get("profile_image")
                if image_file:
                    user.image_url = image_file

                user.save()

            # 2. Mise à jour du Partenaire (RC, NIF, Card Number, Numero Act)
            if partenaire:
                if "RC" in data:
                    partenaire.RC = data.get("RC", "")
                if "Nif" in data:
                    partenaire.Nif = data.get("Nif", "")
                if "card_number" in data:
                    partenaire.card_number = data.get("card_number", "")
                if "numero_act" in data:
                    partenaire.numero_act = data.get("numero_act", "")
                partenaire.save()

            # 3. Mise à jour du Véhicule
            if "type_vehicule" in data or "marque" in data or "modele" in data or "matricule" in data or "num_assurance" in data:
                if not vehicule:
                    vehicule = Vihucule.objects.create(type_vehicule=data.get("type_vehicule", "Moto"))
                    if partenaire:
                        partenaire.vihucule = vehicule
                        partenaire.save()

                if "type_vehicule" in data and data.get("type_vehicule"):
                    vehicule.type_vehicule = data.get("type_vehicule")
                if "marque" in data:
                    vehicule.marque = data.get("marque", "")
                if "modele" in data:
                    vehicule.modele = data.get("modele", "")
                if "matricule" in data:
                    vehicule.matricule = data.get("matricule", "")
                if "num_assurance" in data:
                    vehicule.num_assurance = data.get("num_assurance", "")
                vehicule.save()

            # 4. Mise à jour du Livreur (wilaya et magasin)
            if "wilaya" in data and data.get("wilaya"):
                livreur.wilaya = data.get("wilaya")

            if "magasin_id" in data:
                mag_id = data.get("magasin_id")
                if mag_id and str(mag_id) != "0" and str(mag_id) != "":
                    try:
                        livreur.magasin = Magasin.objects.get(id=mag_id)
                    except Magasin.DoesNotExist:
                        livreur.magasin = None
                else:
                    livreur.magasin = None

            livreur.save()

        user_image_url = None
        if user and user.image_url:
            try:
                user_image_url = user.image_url.url
            except Exception:
                user_image_url = str(user.image_url)

        return JsonResponse({
            "success": True,
            "message": f"Profil du livreur #{livreur.id} mis à jour avec succès !",
            "image_url": user_image_url
        }, status=200)

    except Livreur.DoesNotExist:
        return JsonResponse({"success": False, "message": "Livreur non trouvé"}, status=404)
    except Exception as e:
        logger.error(f"Error in update_confirmation_livreur_profile: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


# =========================================================================
# CENTRE D'APPEL - GESTION DES COMPTES (CLIENTS, LIVREURS, MAGASINS)
# =========================================================================

@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_centreappel_comptes(request):
    """
    Récupère les comptes pour le Centre d'appel avec filtrage par type :
    - type: 'all' | 'client' | 'livreur' | 'magasin'
    - search: recherche sur nom, prénom, username, téléphone, email, nom magasin
    - wilaya: filtre par wilaya
    - status: 'all' | 'active' | 'bloque'
    - page, page_size
    """
    try:
        type_filter = request.GET.get("type", "all").lower().strip()
        search_query = request.GET.get("search", "").strip()
        wilaya_filter = request.GET.get("wilaya", "").strip()
        status_filter = request.GET.get("status", "all").lower().strip()
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 20))

        qs = CustomUser.objects.all().order_by("-id")

        # Exclure les comptes soft-deleted (Corbeille)
        qs = qs.filter(deleted=False)

        # Exclure les superutilisateurs et le personnel d'administration
        qs = qs.exclude(
            Q(role__in=["admin", "superadmin", "superviseur", "centre_appel", "confirmation", "agent_administratif", "chef_bureau"]) |
            Q(is_superuser=True)
        )

        # Filtrage par type de compte
        if type_filter == "client":
            # Inclure les comptes clients explicites ainsi que les comptes sans rôle (qui sont des clients/utilisateurs)
            qs = qs.filter(
                Q(role__in=["client", "user"]) |
                Q(role__isnull=True) |
                Q(role="") |
                Q(role="None")
            ).exclude(role="partener").exclude(USER__isnull=False)
        elif type_filter == "livreur":
            qs = qs.filter(
                Q(role="partener") | Q(USER__isnull=False),
                USER__type_compte__name__icontains="livreur"
            ).distinct()
        elif type_filter == "magasin":
            qs = qs.filter(
                Q(role="partener") | Q(USER__isnull=False),
                Q(USER__type_compte__name__in=["magasin", "restaurant", "starshop"]) | Q(USER__nom_de_magasin__isnull=False)
            ).distinct()

        # Filtrage par Wilaya
        if wilaya_filter:
            code_w, name_w = parse_wilaya_filter(wilaya_filter)
            if code_w is not None and name_w:
                qs = qs.filter(Q(wilaya_code=code_w) | Q(wilaya__icontains=name_w))
            elif code_w is not None:
                qs = qs.filter(Q(wilaya_code=code_w) | Q(wilaya__icontains=str(code_w)))
            elif name_w:
                qs = qs.filter(wilaya__icontains=name_w)
            else:
                qs = qs.filter(wilaya__icontains=wilaya_filter)

        # Filtrage par Statut
        if status_filter == "bloque":
            qs = qs.filter(bloquer=True)
        elif status_filter == "active":
            qs = qs.filter(bloquer=False)

        # Filtrage par recherche
        if search_query:
            qs = qs.filter(
                Q(username__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(phone_number_1__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(USER__nom_de_magasin__icontains=search_query) |
                Q(USER__RC__icontains=search_query)
            ).distinct()

        paginator = Paginator(qs, page_size)
        try:
            current_page = paginator.page(page)
        except (PageNotAnInteger, EmptyPage):
            current_page = paginator.page(1) if paginator.num_pages > 0 else []

        results = []
        for u in current_page:
            # Récupérer les infos partenaire si existantes
            partenaire = u.USER.first() if hasattr(u, 'USER') else None
            
            # Déterminer le type d'affichage
            account_type = "client"
            type_label = "Client"
            nom_magasin = ""

            if partenaire:
                tc_name = (partenaire.type_compte.name if partenaire.type_compte else "").lower()
                if "livreur" in tc_name:
                    account_type = "livreur"
                    type_label = "Livreur"
                elif tc_name in ["magasin", "restaurant", "starshop"] or partenaire.nom_de_magasin:
                    account_type = "magasin"
                    type_label = f"Magasin ({partenaire.nom_de_magasin or tc_name.capitalize()})"
                    nom_magasin = partenaire.nom_de_magasin or ""
                else:
                    account_type = "partenaire"
                    type_label = tc_name.capitalize() or "Partenaire"
            elif u.role == "partener":
                account_type = "partenaire"
                type_label = "Partenaire"
            elif u.role in ["client", "user"]:
                account_type = "client"
                type_label = "Client"
            else:
                # Compte sans rôle défini ou rôle vide
                account_type = "client"
                type_label = "Client (Sans rôle)" if not u.role else f"Utilisateur ({u.role})"

            user_image = None
            if hasattr(u, 'image_url') and u.image_url:
                try:
                    user_image = u.image_url.url
                except Exception:
                    user_image = str(u.image_url)

            try:
                client_cmd_count = Commande.objects.filter(client=u, status='delivered').count()
            except Exception:
                client_cmd_count = 0

            try:
                livreur_cmd_count = Commande.objects.filter(livreur__partenneur__user=u, status='delivered').count()
            except Exception:
                livreur_cmd_count = 0

            try:
                magasin_cmd_count = Commande.objects.filter(magasin__owner__user=u, status='delivered').count()
            except Exception:
                magasin_cmd_count = 0

            nbr_commandes = u.nbr_commandes if (getattr(u, 'nbr_commandes', None) is not None and u.nbr_commandes > 0) else (client_cmd_count + livreur_cmd_count + magasin_cmd_count)

            results.append({
                "id": u.id,
                "username": u.username,
                "first_name": u.first_name or "",
                "last_name": u.last_name or "",
                "date_de_naissance": u.date_de_naissance.strftime("%Y-%m-%d") if u.date_de_naissance else "",
                "type_account": u.type_account or "classique",
                "phone": u.phone_number_1 or "",
                "email": u.email or "",
                "wilaya": u.wilaya or u.wilaya_code or "",
                "wilaya_code": u.wilaya_code,
                "role": u.role,
                "account_type": account_type,
                "type_label": type_label,
                "nom_magasin": nom_magasin,
                "is_active": u.is_active,
                "is_blocked": bool(u.bloquer),
                "date_joined": u.date_joined.strftime("%Y-%m-%d %H:%M") if u.date_joined else "",
                "rating": u.rating if hasattr(u, 'rating') and u.rating is not None else 5.0,
                "image_url": user_image,
                "rc": partenaire.RC if partenaire else "",
                "partenaire_id": partenaire.id if partenaire else None,
                "nbr_commandes": nbr_commandes,
                "commandes_count": nbr_commandes
            })

        return JsonResponse({
            "success": True,
            "data": results,
            "total": paginator.count,
            "page": page,
            "page_size": page_size,
            "total_pages": paginator.num_pages
        }, status=200)

    except Exception as e:
        logger.error(f"Error in get_centreappel_comptes: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST", "PATCH"])
@permission_classes([IsConfirmation])
def toggle_block_user_centreappel(request):
    """
    Bloquer ou débloquer un compte utilisateur (Client, Livreur ou Magasin)
    - user_id (requis)
    - bloquer (optionnel boolean)
    """
    try:
        data = request.data if hasattr(request, 'data') and request.data else json.loads(request.body)
        user_id = data.get("user_id") or data.get("id")

        if not user_id:
            return JsonResponse({"success": False, "message": "user_id est requis"}, status=400)

        user = CustomUser.objects.get(id=user_id)

        if "bloquer" in data:
            should_block = bool(data.get("bloquer"))
        else:
            should_block = not bool(user.bloquer)

        user.bloquer = should_block
        user.is_active = not should_block
        user.save()

        # Si c'est un livreur, notifier via WebSocket pour actualisation immédiate
        channel_layer = get_channel_layer()
        if channel_layer:
            try:
                livreur_obj = Livreur.objects.filter(partenneur__user=user).first()
                if livreur_obj:
                    async_to_sync(channel_layer.group_send)(
                        "confirmation_commandes_all",
                        {
                            "type": "send_livreur_status",
                            "livreur_id": livreur_obj.id,
                            "is_available": False if should_block else livreur_obj.is_available,
                            "is_blocked": should_block
                        }
                    )
            except Exception as b_err:
                logger.warning(f"Error notifying block status: {b_err}")

        action_label = "bloqué" if should_block else "débloqué"
        return JsonResponse({
            "success": True,
            "is_blocked": should_block,
            "message": f"Le compte de {user.username} a été {action_label} avec succès !"
        }, status=200)

    except CustomUser.DoesNotExist:
        return JsonResponse({"success": False, "message": "Utilisateur non trouvé"}, status=404)
    except Exception as e:
        logger.error(f"Error in toggle_block_user_centreappel: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def soft_delete_user_centreappel(request):
    """
    Déplacer un compte utilisateur dans la Corbeille (soft-delete).
    - user_id (requis)
    """
    try:
        data = request.data if hasattr(request, 'data') and request.data else json.loads(request.body)
        user_id = data.get("user_id") or data.get("id")

        if not user_id:
            return JsonResponse({"success": False, "message": "user_id est requis"}, status=400)

        user = CustomUser.objects.get(id=user_id)
        user.deleted = True
        user.save(update_fields=["deleted"])

        logger.info(f"User {user.username} (id={user_id}) soft-deleted by centre appel agent {request.user.username}")

        return JsonResponse({
            "success": True,
            "message": f"Le profil de {user.username} a été déplacé dans la Corbeille."
        }, status=200)

    except CustomUser.DoesNotExist:
        return JsonResponse({"success": False, "message": "Utilisateur non trouvé"}, status=404)
    except Exception as e:
        logger.error(f"Error in soft_delete_user_centreappel: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_corbeille_centreappel(request):
    """
    Récupère les comptes soft-deleted (Corbeille) pour le Centre d'appel.
    - search: recherche sur nom, username, téléphone
    - page, page_size
    """
    try:
        search_query = request.GET.get("search", "").strip()
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 20))

        qs = CustomUser.objects.filter(deleted=True).order_by("-id")

        if search_query:
            qs = qs.filter(
                Q(username__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(phone_number_1__icontains=search_query) |
                Q(email__icontains=search_query)
            ).distinct()

        paginator = Paginator(qs, page_size)
        try:
            current_page = paginator.page(page)
        except (PageNotAnInteger, EmptyPage):
            current_page = paginator.page(1) if paginator.num_pages > 0 else []

        results = []
        for u in current_page:
            partenaire = u.USER.first() if hasattr(u, 'USER') else None

            account_type = "client"
            type_label = "Client"
            nom_magasin = ""

            if partenaire:
                tc_name = (partenaire.type_compte.name if partenaire.type_compte else "").lower()
                if "livreur" in tc_name:
                    account_type = "livreur"
                    type_label = "Livreur"
                elif tc_name in ["magasin", "restaurant", "starshop"] or partenaire.nom_de_magasin:
                    account_type = "magasin"
                    type_label = f"Magasin ({partenaire.nom_de_magasin or tc_name.capitalize()})"
                    nom_magasin = partenaire.nom_de_magasin or ""
                else:
                    account_type = "partenaire"
                    type_label = tc_name.capitalize() or "Partenaire"
            elif u.role == "partener":
                account_type = "partenaire"
                type_label = "Partenaire"

            user_image = None
            if hasattr(u, 'image_url') and u.image_url:
                try:
                    user_image = u.image_url.url
                except Exception:
                    user_image = str(u.image_url)

            results.append({
                "id": u.id,
                "username": u.username,
                "first_name": u.first_name or "",
                "last_name": u.last_name or "",
                "phone": u.phone_number_1 or "",
                "email": u.email or "",
                "wilaya": u.wilaya or u.wilaya_code or "",
                "wilaya_code": u.wilaya_code,
                "role": u.role,
                "account_type": account_type,
                "type_label": type_label,
                "nom_magasin": nom_magasin,
                "is_active": u.is_active,
                "is_blocked": bool(u.bloquer),
                "deleted": True,
                "date_joined": u.date_joined.strftime("%Y-%m-%d %H:%M") if u.date_joined else "",
                "rating": u.rating if hasattr(u, 'rating') and u.rating is not None else 5.0,
                "image_url": user_image,
                "rc": partenaire.RC if partenaire else "",
                "partenaire_id": partenaire.id if partenaire else None,
            })

        return JsonResponse({
            "success": True,
            "data": results,
            "total": paginator.count,
            "page": page,
            "page_size": page_size,
            "total_pages": paginator.num_pages
        }, status=200)

    except Exception as e:
        logger.error(f"Error in get_corbeille_centreappel: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def restore_user_centreappel(request):
    """
    Restaurer un compte depuis la Corbeille (soft-delete → deleted=False).
    - user_id (requis)
    """
    try:
        data = request.data if hasattr(request, 'data') and request.data else json.loads(request.body)
        user_id = data.get("user_id") or data.get("id")

        if not user_id:
            return JsonResponse({"success": False, "message": "user_id est requis"}, status=400)

        user = CustomUser.objects.get(id=user_id)
        user.deleted = False
        user.save(update_fields=["deleted"])

        logger.info(f"User {user.username} (id={user_id}) restored from corbeille by {request.user.username}")

        return JsonResponse({
            "success": True,
            "message": f"Le profil de {user.username} a été restauré avec succès."
        }, status=200)

    except CustomUser.DoesNotExist:
        return JsonResponse({"success": False, "message": "Utilisateur non trouvé"}, status=404)
    except Exception as e:
        logger.error(f"Error in restore_user_centreappel: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def send_notification_to_user_centreappel(request):
    """
    Envoyer une notification directe à un utilisateur (Client, Livreur, Magasin) :
    - user_id (requis)
    - title (requis)
    - message (requis)
    """
    try:
        data = request.data if hasattr(request, 'data') and request.data else json.loads(request.body)
        user_id = data.get("user_id") or data.get("id")
        title = str(data.get("title", "")).strip() or "Notification Centre d'Appel"
        message_text = str(data.get("message", "")).strip()

        if not user_id:
            return JsonResponse({"success": False, "message": "user_id est requis"}, status=400)
        if not message_text:
            return JsonResponse({"success": False, "message": "Le message de notification est requis"}, status=400)

        user = CustomUser.objects.get(id=user_id)
        partenaire = user.USER.first() if hasattr(user, 'USER') else None

        # 1. Enregistrer dans Notication_choffeur si c'est un partenaire/livreur
        notif_record_id = int(timezone.now().timestamp() * 1000) % 2147483647
        if partenaire:
            try:
                notif_obj = Notication_choffeur.objects.create(
                    partenneur=partenaire,
                    message=f"{title}: {message_text}"[:150]
                )
                notif_record_id = notif_obj.id
            except Exception as save_err:
                logger.warning(f"Error saving Notication_choffeur: {save_err}")

        # 2. Envoyer en temps réel via Channels WebSocket sur tous les canaux potentiels du client
        channel_layer = get_channel_layer()
        if channel_layer:
            date_iso = timezone.now().isoformat()
            payload = {
                "type": "send_user_notification",
                "title": title,
                "message": message_text,
                "notification_id": notif_record_id,
                "date": date_iso,
                "user_id": user.id
            }

            # Envoyer uniquement au groupe principal de notifications de l'utilisateur pour éviter les doublons
            target_group = f"user_notifications_{user.id}"
            try:
                async_to_sync(channel_layer.group_send)(target_group, payload)
            except Exception as send_err:
                logger.warning(f"Error sending websocket notification: {send_err}")

        return JsonResponse({
            "success": True,
            "message": f"Notification envoyée avec succès à {user.username} !"
        }, status=200)

    except CustomUser.DoesNotExist:
        return JsonResponse({"success": False, "message": "Utilisateur non trouvé"}, status=404)
    except Exception as e:
        logger.error(f"Error in send_notification_to_user_centreappel: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST", "PUT", "PATCH"])
@permission_classes([IsConfirmation])
def update_user_centreappel(request):
    """
    Modifier les informations d'un utilisateur (Client, Livreur, Magasin, etc.) depuis le centre d'appel :
    - user_id (requis)
    - first_name, last_name, phone, phone_2, email, wilaya, wilaya_code, date_de_naissance, type_account, password, is_blocked, nom_magasin, rc
    """
    try:
        data = request.data if hasattr(request, 'data') and request.data else json.loads(request.body)
        user_id = data.get("user_id") or data.get("id")

        if not user_id:
            return JsonResponse({"success": False, "message": "user_id est requis"}, status=400)

        user = CustomUser.objects.get(id=user_id)
        partenaire = user.USER.first() if hasattr(user, 'USER') else None

        with transaction.atomic():
            if "first_name" in data:
                user.first_name = str(data.get("first_name", "")).strip()
            if "last_name" in data:
                user.last_name = str(data.get("last_name", "")).strip()

            if "date_de_naissance" in data:
                dob = data.get("date_de_naissance")
                if dob and str(dob).strip():
                    try:
                        user.date_de_naissance = str(dob).strip()
                    except Exception:
                        pass
                else:
                    user.date_de_naissance = None

            if "type_account" in data:
                type_acc = str(data.get("type_account", "classique")).lower().strip()
                if type_acc in ["classique", "premium"]:
                    user.type_account = type_acc

            if "phone" in data or "phone_number_1" in data:
                new_phone = str(data.get("phone") or data.get("phone_number_1") or "").strip()
                if new_phone:
                    if CustomUser.objects.filter(phone_number_1=new_phone).exclude(id=user.id).exists():
                        return JsonResponse({"success": False, "message": f"Le numéro de téléphone {new_phone} est déjà utilisé par un autre compte"}, status=400)
                    user.phone_number_1 = new_phone

            if "phone_2" in data or "phone_number_2" in data:
                user.phone_number_2 = str(data.get("phone_2") or data.get("phone_number_2") or "").strip()

            if "email" in data:
                new_email = str(data.get("email", "")).strip()
                if new_email and new_email != (user.email or ""):
                    if CustomUser.objects.filter(email=new_email).exclude(id=user.id).exists():
                        return JsonResponse({"success": False, "message": f"L'adresse email {new_email} est déjà utilisée"}, status=400)
                    user.email = new_email
                elif not new_email:
                    user.email = ""

            if "wilaya" in data:
                wilaya_val = str(data.get("wilaya", "")).strip()
                user.wilaya = wilaya_val
                code_int, _ = parse_wilaya_filter(wilaya_val)
                if code_int is not None:
                    user.wilaya_code = code_int
            
            if "wilaya_code" in data and data.get("wilaya_code"):
                try:
                    user.wilaya_code = int(data.get("wilaya_code"))
                except Exception:
                    pass

            if "is_blocked" in data or "bloquer" in data:
                is_blocked = bool(data.get("is_blocked", data.get("bloquer")))
                user.bloquer = is_blocked
                user.is_active = not is_blocked

            if "password" in data and data.get("password") and str(data.get("password")).strip():
                user.set_password(str(data.get("password")).strip())

            user.save()

            # Mise à jour partenaire si existant
            if partenaire:
                if "nom_magasin" in data:
                    partenaire.nom_de_magasin = str(data.get("nom_magasin", "")).strip()
                if "rc" in data or "RC" in data:
                    partenaire.RC = str(data.get("rc") or data.get("RC") or "").strip()
                partenaire.save()

                # Mise à jour Magasin correspondant si magasin
                magasin = Magasin.objects.filter(owner=partenaire).first()
                if magasin:
                    if "nom_magasin" in data and data.get("nom_magasin"):
                        magasin.name = str(data.get("nom_magasin")).strip()
                    if "phone" in data and data.get("phone"):
                        magasin.contact = str(data.get("phone")).strip()
                    if "wilaya" in data and data.get("wilaya"):
                        magasin.wilaya = str(data.get("wilaya")).strip()
                    magasin.save()

                # Mise à jour Livreur correspondant si livreur
                livreur = Livreur.objects.filter(partenneur=partenaire).first()
                if livreur:
                    if "wilaya" in data and data.get("wilaya"):
                        livreur.wilaya = str(data.get("wilaya")).strip()
                    livreur.save()

        return JsonResponse({
            "success": True,
            "message": f"Compte de {user.username} mis à jour avec succès !",
            "data": {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name or "",
                "last_name": user.last_name or "",
                "date_de_naissance": user.date_de_naissance.strftime("%Y-%m-%d") if user.date_de_naissance else "",
                "type_account": user.type_account or "classique",
                "phone": user.phone_number_1 or "",
                "phone_2": user.phone_number_2 or "",
                "email": user.email or "",
                "wilaya": user.wilaya or "",
                "wilaya_code": user.wilaya_code,
                "role": user.role,
                "is_blocked": bool(user.bloquer),
                "is_active": user.is_active,
                "nom_magasin": partenaire.nom_de_magasin if partenaire else "",
                "rc": partenaire.RC if partenaire else ""
            }
        }, status=200)

    except CustomUser.DoesNotExist:
        return JsonResponse({"success": False, "message": "Utilisateur non trouvé"}, status=404)
    except Exception as e:
        logger.error(f"Error in update_user_centreappel: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)





# ==========================================
# GESTION DES CODES PROMO (CONFIRMATION)
# ==========================================

@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_confirmation_promos(request):
    """
    Récupère la liste des codes promo (Remise) avec statistiques globales,
    recherche multi-critères, ciblage (clients, livreurs, magasins), expiration, compteurs d'utilisateurs et pagination.
    """
    try:
        search_query = request.GET.get("search", "").strip()
        cible_filter = request.GET.get("cible_type", "").strip()
        status_filter = request.GET.get("status", "").strip()
        page_number = request.GET.get("page", "1")
        page_size = int(request.GET.get("page_size", 20))

        queryset = Remise.objects.select_related(
            "partenneur", "partenneur__user", "partenneur__type_compte", "cible_user", "cible_magasin"
        ).prefetch_related("inviteurs", "inviteurs__user").all()

        if search_query:
            queryset = queryset.filter(
                Q(code_invitation__icontains=search_query) |
                Q(partenneur__user__first_name__icontains=search_query) |
                Q(partenneur__user__last_name__icontains=search_query) |
                Q(partenneur__user__username__icontains=search_query) |
                Q(partenneur__user__phone_number_1__icontains=search_query) |
                Q(partenneur__user__wilaya__icontains=search_query) |
                Q(cible_user__first_name__icontains=search_query) |
                Q(cible_user__last_name__icontains=search_query) |
                Q(cible_user__username__icontains=search_query) |
                Q(cible_user__phone_number_1__icontains=search_query) |
                Q(cible_magasin__name__icontains=search_query) |
                Q(partenneur__nom_de_magasin__icontains=search_query)
            )

        if cible_filter:
            queryset = queryset.filter(cible_type=cible_filter)

        now = timezone.now()

        if status_filter == "active":
            queryset = queryset.filter(is_active=True).filter(Q(date_expiration__isnull=True) | Q(date_expiration__gte=now))
        elif status_filter == "expired":
            queryset = queryset.filter(date_expiration__lt=now)
        elif status_filter == "disabled":
            queryset = queryset.filter(is_active=False)

        queryset = queryset.order_by("-id")

        # Calcul des statistiques globales
        all_remises = Remise.objects.all().prefetch_related("inviteurs")
        total_promos = all_remises.count()
        total_revenue = sum(float(r.revunu or 0) for r in all_remises)
        
        all_user_ids = set()
        active_promos_count = 0
        expired_promos_count = 0

        for r in all_remises:
            is_exp = bool(r.date_expiration and now > r.date_expiration)
            if is_exp:
                expired_promos_count += 1
            elif r.is_active:
                active_promos_count += 1

            for inv in r.inviteurs.all():
                if inv.user_id:
                    all_user_ids.add(inv.user_id)
        
        total_users_used_all = len(all_user_ids)
        
        avg_percentage = 0.0
        if total_promos > 0:
            avg_percentage = sum(float(r.pourcentage or 0) for r in all_remises) / total_promos

        stats = {
            "total_promos": total_promos,
            "active_promos": active_promos_count,
            "expired_promos": expired_promos_count,
            "total_revenue": round(total_revenue, 2),
            "total_users_used": total_users_used_all,
            "avg_percentage": round(avg_percentage * 100, 2) if avg_percentage <= 1 else round(avg_percentage, 2)
        }

        paginator = Paginator(queryset, page_size)
        try:
            page_obj = paginator.page(page_number)
        except (PageNotAnInteger, EmptyPage):
            page_obj = paginator.page(1)

        results = []
        for r in page_obj:
            part_user = r.partenneur.user if r.partenneur else None
            partner_name = ""
            partner_phone = ""
            partner_wilaya = ""
            partner_type = ""
            
            if r.partenneur:
                if part_user:
                    partner_name = f"{part_user.first_name or ''} {part_user.last_name or ''}".strip() or part_user.username
                    partner_phone = part_user.phone_number_1 or part_user.phone_number_2 or ""
                    partner_wilaya = part_user.wilaya or ""
                partner_type = r.partenneur.type_compte.name if r.partenneur.type_compte else "Partenaire"

            inviteurs_list = r.inviteurs.select_related("user", "type_compte").all()
            total_inviteurs = inviteurs_list.count()
            
            preview_users = []
            for inv in inviteurs_list[:3]:
                u = inv.user
                if u:
                    preview_users.append({
                        "id": u.id,
                        "name": f"{u.first_name or ''} {u.last_name or ''}".strip() or u.username,
                        "phone": u.phone_number_1 or "",
                        "type": inv.type_compte.name if inv.type_compte else "Client"
                    })

            pct_val = float(r.pourcentage or 0)
            pct_display = pct_val * 100 if pct_val <= 1 else pct_val

            is_expired = bool(r.date_expiration and now > r.date_expiration)
            is_max_reached = bool(r.max_utilisations > 0 and total_inviteurs >= r.max_utilisations)

            if not r.is_active:
                status_code = "disabled"
                status_label = "Désactivé"
            elif is_expired:
                status_code = "expired"
                status_label = "Expiré"
            elif is_max_reached:
                status_code = "max_reached"
                status_label = "Limite atteinte"
            else:
                status_code = "active"
                status_label = "Actif"

            # Cible User details if specific
            cible_user_data = None
            if r.cible_user:
                cu = r.cible_user
                c_name = f"{cu.first_name or ''} {cu.last_name or ''}".strip() or cu.username
                cible_user_data = {
                    "id": cu.id,
                    "name": c_name,
                    "username": cu.username,
                    "phone": cu.phone_number_1 or cu.phone_number_2 or "",
                    "wilaya": cu.wilaya or "",
                    "role": cu.role or ""
                }

            # Cible Magasin details if specific
            cible_magasin_data = None
            if r.cible_magasin:
                cm = r.cible_magasin
                cible_magasin_data = {
                    "id": cm.id,
                    "name": cm.name,
                    "address": cm.address,
                    "wilaya": cm.wilaya or ""
                }

            results.append({
                "id": r.id,
                "code_invitation": r.code_invitation,
                "revunu": float(r.revunu or 0),
                "pourcentage": pct_val,
                "pourcentage_display": round(pct_display, 2),
                "total_users_used": total_inviteurs,
                "cible_type": r.cible_type or "tous_clients",
                "cible_user": cible_user_data,
                "cible_magasin": cible_magasin_data,
                "max_utilisations": r.max_utilisations or 0,
                "date_expiration": r.date_expiration.isoformat() if r.date_expiration else None,
                "date_expiration_display": r.date_expiration.strftime("%d/%m/%Y %H:%M") if r.date_expiration else "Illimitée",
                "is_active": r.is_active,
                "is_expired": is_expired,
                "is_max_reached": is_max_reached,
                "status": status_code,
                "status_label": status_label,
                "created_at": r.created_at.strftime("%d/%m/%Y %H:%M") if r.created_at else "",
                "partenneur": {
                    "id": r.partenneur.id if r.partenneur else None,
                    "name": partner_name or "Système / Général",
                    "username": part_user.username if part_user else "",
                    "phone": partner_phone,
                    "wilaya": partner_wilaya,
                    "type_compte": partner_type
                } if r.partenneur else None,
                "users_preview": preview_users
            })

        return JsonResponse({
            "success": True,
            "stats": stats,
            "data": results,
            "pagination": {
                "total_items": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": page_obj.number,
                "has_next": page_obj.has_next(),
                "has_previous": page_obj.has_previous()
            }
        }, status=200)

    except Exception as e:
        logger.error(f"Error in get_confirmation_promos: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_confirmation_promo_users(request, promo_id):
    """
    Récupère la liste détaillée des utilisateurs ayant utilisé un code promo spécifique.
    """
    try:
        remise = Remise.objects.select_related("partenneur", "partenneur__user", "cible_user", "cible_magasin").prefetch_related("inviteurs", "inviteurs__user", "inviteurs__type_compte").get(id=promo_id)

        search_query = request.GET.get("search", "").strip()
        page_number = request.GET.get("page", "1")
        page_size = int(request.GET.get("page_size", 30))

        inviteurs_qs = remise.inviteurs.select_related("user", "type_compte").all()

        if search_query:
            inviteurs_qs = inviteurs_qs.filter(
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(user__username__icontains=search_query) |
                Q(user__phone_number_1__icontains=search_query) |
                Q(user__email__icontains=search_query) |
                Q(user__wilaya__icontains=search_query)
            )

        paginator = Paginator(inviteurs_qs, page_size)
        try:
            page_obj = paginator.page(page_number)
        except (PageNotAnInteger, EmptyPage):
            page_obj = paginator.page(1)

        users_list = []
        for inv in page_obj:
            u = inv.user
            if u:
                client_cmd_count = Commande.objects.filter(client=u, status='delivered').count()
                livreur_cmd_count = Commande.objects.filter(livreur__partenneur__user=u, status='delivered').count()
                nbr_commandes = client_cmd_count if client_cmd_count > 0 else livreur_cmd_count

                users_list.append({
                    "id": u.id,
                    "partenaire_id": inv.id,
                    "username": u.username,
                    "first_name": u.first_name or "",
                    "last_name": u.last_name or "",
                    "full_name": f"{u.first_name or ''} {u.last_name or ''}".strip() or u.username,
                    "phone": u.phone_number_1 or u.phone_number_2 or "N/A",
                    "email": u.email or "",
                    "wilaya": u.wilaya or "N/A",
                    "type_compte": inv.type_compte.name if inv.type_compte else (u.role or "Utilisateur"),
                    "role": u.role,
                    "is_active": u.is_active,
                    "date_joined": u.date_joined.strftime("%Y-%m-%d %H:%M") if u.date_joined else "",
                    "nbr_commandes": nbr_commandes,
                    "commandes_count": nbr_commandes
                })

        pct_val = float(remise.pourcentage or 0)
        pct_display = pct_val * 100 if pct_val <= 1 else pct_val

        part_user = remise.partenneur.user if remise.partenneur else None
        partner_name = ""
        if part_user:
            partner_name = f"{part_user.first_name or ''} {part_user.last_name or ''}".strip() or part_user.username

        return JsonResponse({
            "success": True,
            "promo": {
                "id": remise.id,
                "code_invitation": remise.code_invitation,
                "revunu": float(remise.revunu or 0),
                "pourcentage": pct_val,
                "pourcentage_display": round(pct_display, 2),
                "cible_type": remise.cible_type,
                "max_utilisations": remise.max_utilisations,
                "date_expiration": remise.date_expiration.isoformat() if remise.date_expiration else None,
                "is_active": remise.is_active,
                "partner_name": partner_name or "Système / Général",
                "partner_phone": part_user.phone_number_1 if part_user else "",
                "total_users": remise.inviteurs.count()
            },
            "users": users_list,
            "pagination": {
                "total_items": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": page_obj.number,
                "has_next": page_obj.has_next(),
                "has_previous": page_obj.has_previous()
            }
        }, status=200)

    except Remise.DoesNotExist:
        return JsonResponse({"success": False, "message": "Code promo non trouvé"}, status=404)
    except Exception as e:
        logger.error(f"Error in get_confirmation_promo_users: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def create_confirmation_promo(request):
    """
    Crée un nouveau code promo (Remise) avec ciblage (clients, livreurs, magasins), limites et date d'expiration.
    """
    try:
        data = json.loads(request.body.decode("utf-8")) if isinstance(request.body, bytes) else request.data
        
        partenaire_id = data.get("partenaire_id")
        code_invitation = data.get("code_invitation", "").strip()
        pourcentage = data.get("pourcentage", 0.02)
        revunu = data.get("revunu", 0.0)
        cible_type = data.get("cible_type", "tous_clients")
        cible_user_id = data.get("cible_user_id")
        cible_magasin_id = data.get("cible_magasin_id")
        max_utilisations = int(data.get("max_utilisations", 0) or 0)
        date_expiration_str = data.get("date_expiration")
        is_active = data.get("is_active", True)

        if not code_invitation:
            code_invitation = generate_random_code(8)
        else:
            code_invitation = code_invitation.upper().strip()

        # Vérifier l'unicité du code
        if Remise.objects.filter(code_invitation=code_invitation).exists():
            return JsonResponse({"success": False, "message": f"Le code promo '{code_invitation}' existe déjà !"}, status=400)

        # Récupérer le partenaire
        partenaire = None
        if partenaire_id:
            try:
                partenaire = Partenneur.objects.get(id=partenaire_id)
            except Partenneur.DoesNotExist:
                return JsonResponse({"success": False, "message": "Partenaire sélectionné non trouvé"}, status=404)
        else:
            current_partner = Partenneur.objects.filter(user_id=request.user.id).first()
            if current_partner:
                partenaire = current_partner
            else:
                partenaire = Partenneur.objects.first()

        if not partenaire:
            return JsonResponse({"success": False, "message": "Aucun partenaire disponible dans le système pour associer ce code"}, status=400)

        # Cible user validation
        cible_user = None
        if cible_user_id and cible_type in ["client_specifique", "livreur_specifique", "partenaire_specifique"]:
            try:
                cible_user = CustomUser.objects.get(id=cible_user_id)
            except CustomUser.DoesNotExist:
                return JsonResponse({"success": False, "message": "Utilisateur ciblé spécifique non trouvé"}, status=404)

        # Cible magasin validation
        cible_magasin = None
        if cible_magasin_id and cible_type == "magasin_specifique":
            try:
                cible_magasin = Magasin.objects.get(id=cible_magasin_id)
            except Magasin.DoesNotExist:
                return JsonResponse({"success": False, "message": "Magasin ciblé spécifique non trouvé"}, status=404)

        # Expiration date parsing
        date_expiration = None
        if date_expiration_str:
            try:
                from django.utils.dateparse import parse_datetime, parse_date
                parsed_dt = parse_datetime(date_expiration_str)
                if not parsed_dt:
                    parsed_d = parse_date(date_expiration_str)
                    if parsed_d:
                        import datetime
                        parsed_dt = timezone.make_aware(datetime.datetime.combine(parsed_d, datetime.time.max))
                date_expiration = parsed_dt
            except Exception:
                date_expiration = None

        # Convert percentage
        try:
            pct_float = float(pourcentage)
            if pct_float > 1:
                pct_float = pct_float / 100.0
        except (ValueError, TypeError):
            pct_float = 0.02

        remise = Remise.objects.create(
            partenneur=partenaire,
            code_invitation=code_invitation,
            pourcentage=pct_float,
            revunu=float(revunu or 0.0),
            cible_type=cible_type,
            cible_user=cible_user,
            cible_magasin=cible_magasin,
            max_utilisations=max_utilisations,
            date_expiration=date_expiration,
            is_active=bool(is_active)
        )

        return JsonResponse({
            "success": True,
            "message": f"Code promo '{code_invitation}' créé avec succès !",
            "promo": {
                "id": remise.id,
                "code_invitation": remise.code_invitation,
                "pourcentage": float(remise.pourcentage),
                "pourcentage_display": round(float(remise.pourcentage) * 100, 2),
                "revunu": float(remise.revunu),
                "cible_type": remise.cible_type,
                "max_utilisations": remise.max_utilisations,
                "date_expiration": remise.date_expiration.isoformat() if remise.date_expiration else None,
                "is_active": remise.is_active,
                "total_users_used": 0
            }
        }, status=201)

    except Exception as e:
        logger.error(f"Error in create_confirmation_promo: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["PUT", "POST"])
@permission_classes([IsConfirmation])
def update_confirmation_promo(request, promo_id):
    """
    Met à jour un code promo existant (ciblage, limites, expiration, taux, code).
    """
    try:
        remise = Remise.objects.get(id=promo_id)
        data = json.loads(request.body.decode("utf-8")) if isinstance(request.body, bytes) else request.data

        code_invitation = data.get("code_invitation", "").strip()
        pourcentage = data.get("pourcentage")
        revunu = data.get("revunu")
        partenaire_id = data.get("partenaire_id")
        cible_type = data.get("cible_type")
        cible_user_id = data.get("cible_user_id")
        cible_magasin_id = data.get("cible_magasin_id")
        max_utilisations = data.get("max_utilisations")
        date_expiration_str = data.get("date_expiration")
        is_active = data.get("is_active")

        if code_invitation:
            code_invitation = code_invitation.upper().strip()
            if code_invitation != remise.code_invitation:
                if Remise.objects.filter(code_invitation=code_invitation).exclude(id=promo_id).exists():
                    return JsonResponse({"success": False, "message": f"Le code '{code_invitation}' est déjà utilisé par un autre code promo"}, status=400)
                remise.code_invitation = code_invitation

        if pourcentage is not None:
            try:
                pct_float = float(pourcentage)
                if pct_float > 1:
                    pct_float = pct_float / 100.0
                remise.pourcentage = pct_float
            except (ValueError, TypeError):
                pass

        if revunu is not None:
            try:
                remise.revunu = float(revunu)
            except (ValueError, TypeError):
                pass

        if partenaire_id:
            try:
                partenaire = Partenneur.objects.get(id=partenaire_id)
                remise.partenneur = partenaire
            except Partenneur.DoesNotExist:
                return JsonResponse({"success": False, "message": "Partenaire sélectionné non trouvé"}, status=404)

        if cible_type:
            remise.cible_type = cible_type

        if cible_user_id is not None:
            if cible_user_id:
                try:
                    remise.cible_user = CustomUser.objects.get(id=cible_user_id)
                except CustomUser.DoesNotExist:
                    pass
            else:
                remise.cible_user = None

        if cible_magasin_id is not None:
            if cible_magasin_id:
                try:
                    remise.cible_magasin = Magasin.objects.get(id=cible_magasin_id)
                except Magasin.DoesNotExist:
                    pass
            else:
                remise.cible_magasin = None

        if max_utilisations is not None:
            try:
                remise.max_utilisations = int(max_utilisations)
            except (ValueError, TypeError):
                pass

        if "date_expiration" in data:
            if date_expiration_str:
                from django.utils.dateparse import parse_datetime, parse_date
                parsed_dt = parse_datetime(date_expiration_str)
                if not parsed_dt:
                    parsed_d = parse_date(date_expiration_str)
                    if parsed_d:
                        import datetime
                        parsed_dt = timezone.make_aware(datetime.datetime.combine(parsed_d, datetime.time.max))
                remise.date_expiration = parsed_dt
            else:
                remise.date_expiration = None

        if is_active is not None:
            remise.is_active = bool(is_active)

        remise.save()

        return JsonResponse({
            "success": True,
            "message": f"Code promo '{remise.code_invitation}' mis à jour avec succès !",
            "promo": {
                "id": remise.id,
                "code_invitation": remise.code_invitation,
                "pourcentage": float(remise.pourcentage),
                "pourcentage_display": round(float(remise.pourcentage) * 100, 2),
                "revunu": float(remise.revunu),
                "cible_type": remise.cible_type,
                "max_utilisations": remise.max_utilisations,
                "date_expiration": remise.date_expiration.isoformat() if remise.date_expiration else None,
                "is_active": remise.is_active,
                "total_users_used": remise.inviteurs.count()
            }
        }, status=200)

    except Remise.DoesNotExist:
        return JsonResponse({"success": False, "message": "Code promo non trouvé"}, status=404)
    except Exception as e:
        logger.error(f"Error in update_confirmation_promo: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["DELETE", "POST"])
@permission_classes([IsConfirmation])
def delete_confirmation_promo(request, promo_id):
    """
    Supprime un code promo (Remise).
    """
    try:
        remise = Remise.objects.get(id=promo_id)
        code_name = remise.code_invitation
        remise.delete()

        return JsonResponse({
            "success": True,
            "message": f"Code promo '{code_name}' supprimé avec succès !"
        }, status=200)

    except Remise.DoesNotExist:
        return JsonResponse({"success": False, "message": "Code promo non trouvé"}, status=404)
    except Exception as e:
        logger.error(f"Error in delete_confirmation_promo: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_confirmation_promo_partners(request):
    """
    Retourne la liste des partenaires pour la sélection lors de la création d'un code promo.
    """
    try:
        search_query = request.GET.get("search", "").strip()
        partners_qs = Partenneur.objects.select_related("user", "type_compte").all()

        if search_query:
            partners_qs = partners_qs.filter(
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(user__username__icontains=search_query) |
                Q(user__phone_number_1__icontains=search_query) |
                Q(nom_de_magasin__icontains=search_query)
            )

        partners_list = []
        for p in partners_qs[:50]:
            u = p.user
            if u:
                name = f"{u.first_name or ''} {u.last_name or ''}".strip() or u.username
                if p.nom_de_magasin:
                    name += f" ({p.nom_de_magasin})"
                partners_list.append({
                    "id": p.id,
                    "name": name,
                    "phone": u.phone_number_1 or "",
                    "wilaya": u.wilaya or "",
                    "type_compte": p.type_compte.name if p.type_compte else "Partenaire"
                })

        return JsonResponse({"success": True, "partners": partners_list}, status=200)

    except Exception as e:
        logger.error(f"Error in get_confirmation_promo_partners: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_confirmation_promo_target_users(request):
    """
    Recherche d'utilisateurs (clients, livreurs, partenaires) pour cibler un compte spécifique dans un code promo.
    """
    try:
        search_query = request.GET.get("search", "").strip()
        role_filter = request.GET.get("role", "").strip()

        users_qs = CustomUser.objects.all()

        if role_filter:
            if role_filter == "client":
                users_qs = users_qs.filter(Q(role="client") | Q(role="user") | Q(role__isnull=True) | Q(role=""))
            elif role_filter == "livreur":
                users_qs = users_qs.filter(Q(role="partener") | Q(role="livreur"))
            elif role_filter == "partener":
                users_qs = users_qs.filter(role="partener")

        if search_query:
            users_qs = users_qs.filter(
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(username__icontains=search_query) |
                Q(phone_number_1__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(wilaya__icontains=search_query)
            )

        users_list = []
        for u in users_qs[:40]:
            name = f"{u.first_name or ''} {u.last_name or ''}".strip() or u.username
            client_cmd_count = Commande.objects.filter(client=u, status='delivered').count()
            livreur_cmd_count = Commande.objects.filter(livreur__partenneur__user=u, status='delivered').count()
            nbr_commandes = client_cmd_count if client_cmd_count > 0 else livreur_cmd_count

            users_list.append({
                "id": u.id,
                "name": name,
                "username": u.username,
                "phone": u.phone_number_1 or u.phone_number_2 or "",
                "wilaya": u.wilaya or "",
                "role": u.role or "client",
                "nbr_commandes": nbr_commandes,
                "commandes_count": nbr_commandes
            })

        return JsonResponse({"success": True, "users": users_list}, status=200)

    except Exception as e:
        logger.error(f"Error in get_confirmation_promo_target_users: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_confirmation_promo_target_magasins(request):
    """
    Recherche de magasins pour cibler un magasin spécifique dans un code promo.
    """
    try:
        search_query = request.GET.get("search", "").strip()
        magasins_qs = Magasin.objects.all()

        if search_query:
            magasins_qs = magasins_qs.filter(
                Q(name__icontains=search_query) |
                Q(address__icontains=search_query) |
                Q(wilaya__icontains=search_query) |
                Q(contact__icontains=search_query)
            )

        magasins_list = []
        for m in magasins_qs[:40]:
            magasins_list.append({
                "id": m.id,
                "name": m.name,
                "address": m.address,
                "wilaya": m.wilaya or "",
                "contact": m.contact or ""
            })

        return JsonResponse({"success": True, "magasins": magasins_list}, status=200)

    except Exception as e:
        logger.error(f"Error in get_confirmation_promo_target_magasins: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST", "GET"])
@permission_classes([AllowAny])
def validate_promo_code(request):
    """
    Validation d'un code promo avec vérification stricte :
    - Existence et statut actif
    - Date d'expiration (si expirée, rejet)
    - Limite du nombre d'utilisations max (si atteinte, rejet)
    - Ciblage (tous clients, client spécifique, tous livreurs, livreur spécifique, tous magasins, magasin spécifique)
    """
    try:
        data = {}
        if request.method == "POST":
            if hasattr(request, "data") and isinstance(request.data, dict) and request.data:
                data = request.data
            elif request.body:
                try:
                    data = json.loads(request.body.decode("utf-8"))
                except Exception:
                    data = request.POST.dict() if request.POST else {}
            else:
                data = request.POST.dict() if request.POST else {}

            code = (data.get("code") or data.get("code_promo") or data.get("promo_code") or data.get("promo") or data.get("code_invitation") or "").strip()
            magasin_id = data.get("magasin_id") or data.get("magasinId") or data.get("id_magasin") or data.get("magasin")
            user_id = data.get("user_id") or data.get("userId") or data.get("client_id")
        else:
            code = (request.GET.get("code") or request.GET.get("code_promo") or request.GET.get("promo_code") or request.GET.get("promo") or request.GET.get("code_invitation") or "").strip()
            magasin_id = request.GET.get("magasin_id") or request.GET.get("magasinId") or request.GET.get("id_magasin") or request.GET.get("magasin")
            user_id = request.GET.get("user_id") or request.GET.get("userId") or request.GET.get("client_id")

        if not code:
            return JsonResponse({"valid": False, "success": False, "message": "Veuillez fournir un code promo"}, status=400)

        remise = Remise.objects.filter(code_invitation__iexact=code).select_related("partenneur", "cible_user", "cible_magasin").first()
        if not remise:
            return JsonResponse({"valid": False, "success": False, "message": "Code promo introuvable ou invalide."}, status=404)

        if not remise.is_active:
            return JsonResponse({"valid": False, "success": False, "message": "Ce code promo a été désactivé."}, status=400)

        now = timezone.now()
        if remise.date_expiration and now > remise.date_expiration:
            return JsonResponse({
                "valid": False,
                "success": False,
                "message": f"Ce code promo a expiré le {remise.date_expiration.strftime('%d/%m/%Y à %H:%M')} et ne fonctionne plus."
            }, status=400)

        total_used = remise.inviteurs.count()
        if remise.max_utilisations > 0 and total_used >= remise.max_utilisations:
            return JsonResponse({
                "valid": False,
                "success": False,
                "message": "Ce code promo a atteint son nombre maximal d'utilisations."
            }, status=400)

        # Vérification du ciblage magasin si commande chez un magasin
        if magasin_id:
            try:
                mag_id_int = int(magasin_id)
                if remise.cible_type == "magasin_specifique" and (not remise.cible_magasin or remise.cible_magasin.id != mag_id_int):
                    mag_target_name = remise.cible_magasin.name if remise.cible_magasin else "un magasin précis"
                    return JsonResponse({"valid": False, "success": False, "message": f"Ce code promo est valide uniquement chez {mag_target_name}."}, status=403)
            except (ValueError, TypeError):
                pass

        # Vérification du ciblage utilisateur si utilisateur connecté ou transmis
        target_user_id = None
        if request.user and request.user.is_authenticated:
            target_user_id = request.user.id
        elif user_id:
            try:
                target_user_id = int(user_id)
            except (ValueError, TypeError):
                pass

        if target_user_id:
            if remise.cible_type == "client_specifique" and (not remise.cible_user or remise.cible_user.id != target_user_id):
                return JsonResponse({"valid": False, "success": False, "message": "Ce code promo est réservé à un client spécifique."}, status=403)
            elif remise.cible_type == "livreur_specifique" and (not remise.cible_user or remise.cible_user.id != target_user_id):
                return JsonResponse({"valid": False, "success": False, "message": "Ce code promo est réservé à un livreur spécifique."}, status=403)
            elif remise.cible_type == "partenaire_specifique" and (not remise.cible_user or remise.cible_user.id != target_user_id):
                return JsonResponse({"valid": False, "success": False, "message": "Ce code promo est réservé à un partenaire spécifique."}, status=403)

        pct_val = float(remise.pourcentage or 0)
        pct_display = pct_val * 100 if pct_val <= 1 else pct_val

        return JsonResponse({
            "valid": True,
            "success": True,
            "message": f"Code promo appliqué avec succès ! (-{round(pct_display, 2)}%)",
            "promo": {
                "id": remise.id,
                "code": remise.code_invitation,
                "code_invitation": remise.code_invitation,
                "pourcentage": pct_val,
                "pourcentage_display": round(pct_display, 2),
                "cible_type": remise.cible_type
            },
            "remise": pct_val,
            "pourcentage": pct_val
        }, status=200)

    except Exception as e:
        logger.error(f"Error in validate_promo_code: {e}")
        return JsonResponse({"valid": False, "success": False, "message": str(e)}, status=500)


# ==========================================
# GESTION DES PUBLICITÉS & BANNIÈRES (CONFIRMATION)
# ==========================================

@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_confirmation_publicites(request):
    """
    Récupère la liste des publicités avec statistiques, filtres (recherche, statut, wilaya) et pagination.
    """
    try:
        search_query = request.GET.get("search", "").strip()
        status_filter = request.GET.get("status", "").strip().lower()
        wilaya_filter = request.GET.get("wilaya", "").strip()
        target_filter = request.GET.get("target", "").strip().lower()
        page = request.GET.get("page", 1)
        page_size = request.GET.get("page_size", 20)

        now = timezone.now()
        all_publicities = Publicity.objects.select_related("magasin").all().order_by("-id")

        # Calcul des statistiques globales
        total_publicities = all_publicities.count()
        active_count = all_publicities.filter(is_active=True, date_expires__gte=now).count()
        expired_count = all_publicities.filter(date_expires__lt=now).count()
        inactive_count = all_publicities.filter(is_active=False).count()
        magasins_linked_count = all_publicities.filter(magasin__isnull=False).values("magasin").distinct().count()

        client_count = all_publicities.filter(target="client").count()
        livreur_count = all_publicities.filter(target="livreur").count()
        chauffeur_count = all_publicities.filter(target="chauffeur").count()

        stats = {
            "total_publicites": total_publicities,
            "active_publicites": active_count,
            "expired_publicites": expired_count,
            "inactive_publicites": inactive_count,
            "total_magasins_linked": magasins_linked_count,
            "client_publicites": client_count,
            "livreur_publicites": livreur_count,
            "chauffeur_publicites": chauffeur_count,
        }

        # Filtrage
        qs = all_publicities

        if target_filter and target_filter in ["client", "livreur", "chauffeur"]:
            qs = qs.filter(target=target_filter)

        if search_query:
            qs = qs.filter(
                Q(name__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(lien__icontains=search_query) |
                Q(badge_tag__icontains=search_query) |
                Q(magasin__name__icontains=search_query) |
                Q(magasin__address__icontains=search_query)
            )

        if wilaya_filter:
            qs = qs.filter(Q(magasin__wilaya__icontains=wilaya_filter) | Q(magasin__isnull=True))

        if status_filter == "active":
            qs = qs.filter(is_active=True, date_expires__gte=now)
        elif status_filter == "expired":
            qs = qs.filter(date_expires__lt=now)
        elif status_filter == "inactive":
            qs = qs.filter(is_active=False)

        # Pagination
        paginator = Paginator(qs, int(page_size))
        try:
            paginated_qs = paginator.page(page)
        except PageNotAnInteger:
            paginated_qs = paginator.page(1)
        except EmptyPage:
            paginated_qs = paginator.page(paginator.num_pages)

        # Sérialisation
        data_list = []
        for pub in paginated_qs:
            is_expired = bool(pub.date_expires and pub.date_expires < now)
            
            image_url = None
            if pub.image and hasattr(pub.image, 'url'):
                image_url = request.build_absolute_uri(pub.image.url)

            magasin_data = None
            if pub.magasin:
                mag_img_url = None
                if pub.magasin.image and hasattr(pub.magasin.image, 'url'):
                    mag_img_url = request.build_absolute_uri(pub.magasin.image.url)
                magasin_data = {
                    "id": pub.magasin.id,
                    "name": pub.magasin.name,
                    "address": pub.magasin.address or "",
                    "wilaya": pub.magasin.wilaya or "",
                    "image": mag_img_url
                }

            # Calcul du statut d'affichage
            if is_expired:
                status_label = "Expirée"
                status_code = "expired"
            elif not pub.is_active:
                status_label = "Désactivée"
                status_code = "inactive"
            else:
                status_label = "Active"
                status_code = "active"

            target_val = pub.target or "client"
            target_labels = {
                "client": "Client (App)",
                "livreur": "Livreur Food",
                "chauffeur": "Chauffeur VTC"
            }

            data_list.append({
                "id": pub.id,
                "name": pub.name or "",
                "description": pub.description or "",
                "magasin": magasin_data,
                "image": pub.image.name if pub.image else None,
                "image_url": image_url,
                "lien": pub.lien or "",
                "target": target_val,
                "target_label": target_labels.get(target_val, "Client (App)"),
                "badge_tag": pub.badge_tag or "",
                "cta_text": pub.cta_text or "En savoir plus",
                "is_active": pub.is_active,
                "is_expired": is_expired,
                "status": status_code,
                "status_label": status_label,
                "date_creation": pub.date_creation.isoformat() if pub.date_creation else None,
                "date_expires": pub.date_expires.isoformat() if pub.date_expires else None,
            })

        return JsonResponse({
            "success": True,
            "stats": stats,
            "data": data_list,
            "pagination": {
                "total_items": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": paginated_qs.number,
                "has_next": paginated_qs.has_next(),
                "has_previous": paginated_qs.has_previous()
            }
        }, status=200)

    except Exception as e:
        logger.error(f"Error in get_confirmation_publicites: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def create_confirmation_publicite(request):
    """
    Crée une nouvelle publicité avec image, magasin ou lien externe, et date d'expiration.
    Accepte FormData ou JSON.
    """
    try:
        data = request.POST if request.POST else {}
        files = request.FILES if request.FILES else {}

        if not data and request.body:
            try:
                data = json.loads(request.body.decode("utf-8"))
            except Exception:
                data = {}

        name = data.get("name", "").strip()
        description = data.get("description", "").strip()
        magasin_id = data.get("magasin_id") or data.get("magasin")
        lien = data.get("lien", "").strip()
        target = data.get("target", "client").strip().lower()
        if target not in ["client", "livreur", "chauffeur"]:
            target = "client"
        badge_tag = data.get("badge_tag", "").strip() or None
        cta_text = data.get("cta_text", "").strip() or "En savoir plus"
        date_expires_str = data.get("date_expires", "").strip()
        is_active = data.get("is_active", True)
        if isinstance(is_active, str):
            is_active = is_active.lower() in ["true", "1", "yes"]

        if not name:
            return JsonResponse({"success": False, "message": "Le nom de la publicité est obligatoire."}, status=400)

        if not date_expires_str:
            return JsonResponse({"success": False, "message": "La date d'expiration est obligatoire."}, status=400)

        # Parse date d'expiration
        from django.utils.dateparse import parse_datetime, parse_date
        import datetime
        parsed_dt = parse_datetime(date_expires_str)
        if not parsed_dt:
            parsed_d = parse_date(date_expires_str)
            if parsed_d:
                parsed_dt = timezone.make_aware(datetime.datetime.combine(parsed_d, datetime.time.max))
        
        if not parsed_dt:
            return JsonResponse({"success": False, "message": "Format de date d'expiration invalide (AAAA-MM-JJ ou ISO)."}, status=400)

        # Magasin lié
        magasin_obj = None
        if magasin_id:
            try:
                magasin_obj = Magasin.objects.get(id=int(magasin_id))
            except (Magasin.DoesNotExist, ValueError):
                magasin_obj = None

        # Création de l'objet
        pub = Publicity(
            name=name,
            description=description,
            magasin=magasin_obj,
            lien=lien if lien else None,
            target=target,
            badge_tag=badge_tag,
            cta_text=cta_text,
            is_active=is_active,
            date_expires=parsed_dt
        )

        if "image" in files:
            pub.image = files["image"]

        pub.save()

        image_url = None
        if pub.image and hasattr(pub.image, 'url'):
            image_url = request.build_absolute_uri(pub.image.url)

        return JsonResponse({
            "success": True,
            "message": f"Publicité '{pub.name}' créée avec succès !",
            "publicite": {
                "id": pub.id,
                "name": pub.name,
                "description": pub.description,
                "image_url": image_url,
                "lien": pub.lien,
                "target": pub.target,
                "badge_tag": pub.badge_tag,
                "cta_text": pub.cta_text,
                "is_active": pub.is_active,
                "date_expires": pub.date_expires.isoformat(),
                "magasin": {
                    "id": pub.magasin.id,
                    "name": pub.magasin.name
                } if pub.magasin else None
            }
        }, status=201)

    except Exception as e:
        logger.error(f"Error in create_confirmation_publicite: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST", "PUT"])
@permission_classes([IsConfirmation])
def update_confirmation_publicite(request, pub_id):
    """
    Modifie une publicité existante.
    """
    try:
        pub = Publicity.objects.select_related("magasin").get(id=pub_id)

        data = request.POST if request.POST else {}
        files = request.FILES if request.FILES else {}

        if not data and request.body:
            try:
                data = json.loads(request.body.decode("utf-8"))
            except Exception:
                data = {}

        if "name" in data:
            pub.name = data.get("name", "").strip()

        if "description" in data:
            pub.description = data.get("description", "").strip()

        if "target" in data:
            target_candidate = data.get("target", "").strip().lower()
            if target_candidate in ["client", "livreur", "chauffeur"]:
                pub.target = target_candidate

        if "badge_tag" in data:
            pub.badge_tag = data.get("badge_tag", "").strip() or None

        if "cta_text" in data:
            pub.cta_text = data.get("cta_text", "").strip() or "En savoir plus"

        if "magasin_id" in data:
            mag_id = data.get("magasin_id")
            if mag_id and str(mag_id).strip() != "" and str(mag_id) != "0":
                try:
                    pub.magasin = Magasin.objects.get(id=int(mag_id))
                except (Magasin.DoesNotExist, ValueError):
                    pub.magasin = None
            else:
                pub.magasin = None

        if "lien" in data:
            pub.lien = data.get("lien", "").strip() or None

        if "is_active" in data:
            val = data.get("is_active")
            if isinstance(val, str):
                pub.is_active = val.lower() in ["true", "1", "yes"]
            else:
                pub.is_active = bool(val)

        if "date_expires" in data and data.get("date_expires"):
            from django.utils.dateparse import parse_datetime, parse_date
            import datetime
            dt_str = data.get("date_expires").strip()
            parsed_dt = parse_datetime(dt_str)
            if not parsed_dt:
                parsed_d = parse_date(dt_str)
                if parsed_d:
                    parsed_dt = timezone.make_aware(datetime.datetime.combine(parsed_d, datetime.time.max))
            if parsed_dt:
                pub.date_expires = parsed_dt

        if "image" in files:
            pub.image = files["image"]

        pub.save()

        image_url = None
        if pub.image and hasattr(pub.image, 'url'):
            image_url = request.build_absolute_uri(pub.image.url)

        return JsonResponse({
            "success": True,
            "message": f"Publicité '{pub.name}' mise à jour avec succès !",
            "publicite": {
                "id": pub.id,
                "name": pub.name,
                "description": pub.description,
                "image_url": image_url,
                "lien": pub.lien,
                "target": pub.target,
                "badge_tag": pub.badge_tag,
                "cta_text": pub.cta_text,
                "is_active": pub.is_active,
                "date_expires": pub.date_expires.isoformat(),
                "magasin": {
                    "id": pub.magasin.id,
                    "name": pub.magasin.name
                } if pub.magasin else None
            }
        }, status=200)

    except Publicity.DoesNotExist:
        return JsonResponse({"success": False, "message": "Publicité non trouvée."}, status=404)
    except Exception as e:
        logger.error(f"Error in update_confirmation_publicite: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST", "DELETE"])
@permission_classes([IsConfirmation])
def delete_confirmation_publicite(request, pub_id):
    """
    Supprime une publicité.
    """
    try:
        pub = Publicity.objects.get(id=pub_id)
        pub_name = pub.name
        pub.delete()
        return JsonResponse({
            "success": True,
            "message": f"Publicité '{pub_name}' supprimée avec succès !"
        }, status=200)

    except Publicity.DoesNotExist:
        return JsonResponse({"success": False, "message": "Publicité non trouvée."}, status=404)
    except Exception as e:
        logger.error(f"Error in delete_confirmation_publicite: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def toggle_confirmation_publicite_status(request, pub_id):
    """
    Active ou désactive une publicité en un clic.
    """
    try:
        pub = Publicity.objects.get(id=pub_id)
        pub.is_active = not pub.is_active
        pub.save()

        status_text = "activée" if pub.is_active else "désactivée"
        return JsonResponse({
            "success": True,
            "message": f"Publicité '{pub.name}' {status_text} avec succès !",
            "is_active": pub.is_active
        }, status=200)

    except Publicity.DoesNotExist:
        return JsonResponse({"success": False, "message": "Publicité non trouvée."}, status=404)
    except Exception as e:
        logger.error(f"Error in toggle_confirmation_publicite_status: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_confirmation_publicite_magasins(request):
    """
    Recherche et liste des magasins pour le sélecteur de publicité.
    """
    try:
        search_query = request.GET.get("search", "").strip()
        magasins_qs = Magasin.objects.all().order_by("name")

        if search_query:
            magasins_qs = magasins_qs.filter(
                Q(name__icontains=search_query) |
                Q(address__icontains=search_query) |
                Q(wilaya__icontains=search_query)
            )

        magasins_list = []
        for m in magasins_qs[:50]:
            img_url = None
            if m.image and hasattr(m.image, 'url'):
                img_url = request.build_absolute_uri(m.image.url)
            magasins_list.append({
                "id": m.id,
                "name": m.name,
                "address": m.address or "",
                "wilaya": m.wilaya or "",
                "image": img_url
            })

        return JsonResponse({"success": True, "magasins": magasins_list}, status=200)

    except Exception as e:
        logger.error(f"Error in get_confirmation_publicite_magasins: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


# ============================================================================
# GESTION DES STORIES (STYLE INSTAGRAM) DE LA PLATEFORME
# ============================================================================

@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_confirmation_stories(request):
    """
    Récupère la liste paginée des Stories avec leurs slides/items et statistiques globales.
    """
    try:
        search_query = request.GET.get("search", "").strip()
        status_filter = request.GET.get("status", "").strip()  # 'active', 'inactive', 'expired'
        page = request.GET.get("page", 1)
        page_size = request.GET.get("page_size", 20)

        try:
            page = int(page)
        except ValueError:
            page = 1
        try:
            page_size = int(page_size)
        except ValueError:
            page_size = 20

        now = timezone.now()
        stories_qs = Story.objects.all().prefetch_related('items__magasin').order_by("order", "-date_creation")

        # Stats globales avant filtrage
        total_stories = Story.objects.count()
        active_stories = Story.objects.filter(is_active=True).filter(Q(date_expires__isnull=True) | Q(date_expires__gt=now)).count()
        expired_stories = Story.objects.filter(date_expires__isnull=False, date_expires__lte=now).count()
        inactive_stories = Story.objects.filter(is_active=False).count()
        total_items = StoryItem.objects.count()
        total_views = Story.objects.aggregate(total=Sum('views_count'))['total'] or 0

        stats = {
            "total_stories": total_stories,
            "active_stories": active_stories,
            "expired_stories": expired_stories,
            "inactive_stories": inactive_stories,
            "total_items": total_items,
            "total_views": total_views,
        }

        # Filtres
        if search_query:
            stories_qs = stories_qs.filter(
                Q(title__icontains=search_query) |
                Q(items__title__icontains=search_query) |
                Q(items__description__icontains=search_query)
            ).distinct()

        if status_filter == "active":
            stories_qs = stories_qs.filter(is_active=True).filter(Q(date_expires__isnull=True) | Q(date_expires__gt=now))
        elif status_filter == "inactive":
            stories_qs = stories_qs.filter(is_active=False)
        elif status_filter == "expired":
            stories_qs = stories_qs.filter(date_expires__isnull=False, date_expires__lte=now)

        paginator = Paginator(stories_qs, page_size)
        try:
            stories_page = paginator.page(page)
        except (PageNotAnInteger, EmptyPage):
            stories_page = paginator.page(1)

        serializer = StorySerializer(stories_page.object_list, many=True, context={'request': request})

        return JsonResponse({
            "success": True,
            "stats": stats,
            "data": serializer.data,
            "pagination": {
                "current_page": stories_page.number,
                "total_pages": paginator.num_pages,
                "total_items": paginator.count,
                "has_next": stories_page.has_next(),
                "has_previous": stories_page.has_previous(),
            }
        }, status=200)

    except Exception as e:
        logger.error(f"Error in get_confirmation_stories: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def create_confirmation_story(request):
    """
    Crée une nouvelle Story avec possibilité d'ajouter des slides (StoryItems) initiaux.
    Prend en charge multipart/form-data ou JSON.
    """
    try:
        import traceback
        data = request.data if hasattr(request, "data") and request.data else (request.POST if request.POST else {})
        files = request.FILES if request.FILES else {}

        if not data and request.body:
            try:
                data = json.loads(request.body.decode("utf-8"))
            except Exception:
                data = {}

        title = str(data.get("title", "") or "").strip()
        if not title:
            return JsonResponse({"success": False, "message": "Le titre de la Story est obligatoire."}, status=400)

        order_val = data.get("order")
        try:
            order = int(order_val) if order_val is not None and str(order_val).strip() != "" else 0
        except (ValueError, TypeError):
            order = 0

        is_active = data.get("is_active", True)
        if isinstance(is_active, str):
            is_active = is_active.lower() in ["true", "1", "yes"]

        date_expires_str = data.get("date_expires")
        parsed_expires = None
        if date_expires_str and str(date_expires_str).strip() and str(date_expires_str).strip().lower() != "null":
            from django.utils.dateparse import parse_datetime, parse_date
            import datetime
            parsed_expires = parse_datetime(str(date_expires_str).strip())
            if not parsed_expires:
                parsed_d = parse_date(str(date_expires_str).strip())
                if parsed_d:
                    parsed_expires = timezone.make_aware(datetime.datetime.combine(parsed_d, datetime.time.max))
            if parsed_expires and timezone.is_naive(parsed_expires):
                parsed_expires = timezone.make_aware(parsed_expires)

        with transaction.atomic():
            story = Story.objects.create(
                title=title,
                order=order,
                is_active=is_active,
                date_expires=parsed_expires
            )

            # Image de couverture de la Story
            if "image" in files:
                story.image = files["image"]
                story.save()
            elif "image" in data and hasattr(data["image"], "read"):
                story.image = data["image"]
                story.save()

            # Création éventuelle de slides initiaux
            items_raw = data.get("items")
            if isinstance(items_raw, str):
                try:
                    items_raw = json.loads(items_raw)
                except Exception:
                    items_raw = []

            if isinstance(items_raw, list):
                for idx, it in enumerate(items_raw):
                    magasin_id = it.get("magasin_id") or it.get("magasin")
                    magasin_obj = None
                    if magasin_id:
                        try:
                            magasin_obj = Magasin.objects.get(id=int(magasin_id))
                        except (Magasin.DoesNotExist, ValueError):
                            magasin_obj = None

                    item_obj = StoryItem(
                        story=story,
                        duration=int(it.get("duration", 5) or 5),
                        lien=it.get("lien", "").strip() or None,
                        magasin=magasin_obj,
                        title=it.get("title", "").strip() or None,
                        description=it.get("description", "").strip() or None,
                        order=int(it.get("order", idx) or idx),
                        is_active=it.get("is_active", True)
                    )

                    file_key = f"item_image_{idx}"
                    if file_key in files:
                        item_obj.image = files[file_key]
                    elif file_key in data and hasattr(data[file_key], "read"):
                        item_obj.image = data[file_key]
                    item_obj.save()

        serializer = StorySerializer(story, context={'request': request})
        return JsonResponse({
            "success": True,
            "message": f"Story '{story.title}' créée avec succès !",
            "story": serializer.data
        }, status=201)

    except Exception as e:
        import traceback
        logger.error(f"Error in create_confirmation_story: {traceback.format_exc()}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST", "PUT"])
@permission_classes([IsConfirmation])
def update_confirmation_story(request, story_id):
    """
    Modifie les informations de la Story (titre, statut, ordre, couverture, expiration).
    """
    try:
        story = Story.objects.get(id=story_id)
        data = request.data if hasattr(request, "data") and request.data else (request.POST if request.POST else {})
        files = request.FILES if request.FILES else {}

        if not data and request.body:
            try:
                data = json.loads(request.body.decode("utf-8"))
            except Exception:
                data = {}

        if "title" in data:
            title = str(data.get("title", "") or "").strip()
            if title:
                story.title = title

        if "order" in data:
            try:
                order_val = data.get("order")
                story.order = int(order_val) if order_val is not None and str(order_val).strip() != "" else story.order
            except (ValueError, TypeError):
                pass

        if "is_active" in data:
            is_active = data.get("is_active")
            if isinstance(is_active, str):
                is_active = is_active.lower() in ["true", "1", "yes"]
            story.is_active = bool(is_active)

        if "date_expires" in data:
            date_expires_str = data.get("date_expires")
            if date_expires_str and str(date_expires_str).strip() and str(date_expires_str).strip().lower() != "null":
                from django.utils.dateparse import parse_datetime, parse_date
                import datetime
                parsed_expires = parse_datetime(str(date_expires_str).strip())
                if not parsed_expires:
                    parsed_d = parse_date(str(date_expires_str).strip())
                    if parsed_d:
                        parsed_expires = timezone.make_aware(datetime.datetime.combine(parsed_d, datetime.time.max))
                if parsed_expires and timezone.is_naive(parsed_expires):
                    parsed_expires = timezone.make_aware(parsed_expires)
                story.date_expires = parsed_expires
            else:
                story.date_expires = None

        if "image" in files:
            story.image = files["image"]
        elif "image" in data and hasattr(data["image"], "read"):
            story.image = data["image"]

        story.save()

        serializer = StorySerializer(story, context={'request': request})
        return JsonResponse({
            "success": True,
            "message": f"Story '{story.title}' modifiée avec succès !",
            "story": serializer.data
        }, status=200)

    except Story.DoesNotExist:
        return JsonResponse({"success": False, "message": "Story non trouvée."}, status=404)
    except Exception as e:
        import traceback
        logger.error(f"Error in update_confirmation_story: {traceback.format_exc()}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST", "DELETE"])
@permission_classes([IsConfirmation])
def delete_confirmation_story(request, story_id):
    """
    Supprime une Story et tous ses slides associés.
    """
    try:
        story = Story.objects.get(id=story_id)
        title = story.title
        story.delete()
        return JsonResponse({
            "success": True,
            "message": f"Story '{title}' supprimée avec succès."
        }, status=200)
    except Story.DoesNotExist:
        return JsonResponse({"success": False, "message": "Story non trouvée."}, status=404)
    except Exception as e:
        logger.error(f"Error in delete_confirmation_story: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def toggle_confirmation_story_status(request, story_id):
    """
    Active ou désactive une Story.
    """
    try:
        story = Story.objects.get(id=story_id)
        story.is_active = not story.is_active
        story.save()
        return JsonResponse({
            "success": True,
            "is_active": story.is_active,
            "message": f"Story {'activée' if story.is_active else 'désactivée'} avec succès."
        }, status=200)
    except Story.DoesNotExist:
        return JsonResponse({"success": False, "message": "Story non trouvée."}, status=404)
    except Exception as e:
        logger.error(f"Error in toggle_confirmation_story_status: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def add_story_item(request, story_id):
    """
    Ajoute un slide (StoryItem) à une Story existante avec son image, durée et redirection.
    """
    try:
        story = Story.objects.get(id=story_id)
        data = request.data if hasattr(request, "data") and request.data else (request.POST if request.POST else {})
        files = request.FILES if request.FILES else {}

        if not data and request.body:
            try:
                data = json.loads(request.body.decode("utf-8"))
            except Exception:
                data = {}

        img_file = None
        if "image" in files:
            img_file = files["image"]
        elif "image" in data and hasattr(data["image"], "read"):
            img_file = data["image"]

        if not img_file:
            return JsonResponse({"success": False, "message": "L'image du slide est obligatoire."}, status=400)

        duration_val = data.get("duration")
        try:
            duration = int(duration_val) if duration_val is not None and str(duration_val).strip() != "" else 5
        except (ValueError, TypeError):
            duration = 5

        lien = str(data.get("lien", "") or "").strip() or None
        magasin_id = data.get("magasin_id") or data.get("magasin")
        title = str(data.get("title", "") or "").strip() or None
        description = str(data.get("description", "") or "").strip() or None

        order_val = data.get("order")
        try:
            order = int(order_val) if order_val is not None and str(order_val).strip() != "" else story.items.count()
        except (ValueError, TypeError):
            order = story.items.count()

        is_active = data.get("is_active", True)
        if isinstance(is_active, str):
            is_active = is_active.lower() in ["true", "1", "yes"]

        magasin_obj = None
        if magasin_id:
            try:
                magasin_obj = Magasin.objects.get(id=int(magasin_id))
            except (Magasin.DoesNotExist, ValueError):
                magasin_obj = None

        item = StoryItem.objects.create(
            story=story,
            image=img_file,
            duration=duration,
            lien=lien,
            magasin=magasin_obj,
            title=title,
            description=description,
            order=order,
            is_active=is_active
        )

        serializer = StoryItemSerializer(item, context={'request': request})
        return JsonResponse({
            "success": True,
            "message": "Slide ajouté à la Story avec succès !",
            "item": serializer.data
        }, status=201)

    except Story.DoesNotExist:
        return JsonResponse({"success": False, "message": "Story non trouvée."}, status=404)
    except Exception as e:
        import traceback
        logger.error(f"Error in add_story_item: {traceback.format_exc()}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST", "PUT"])
@permission_classes([IsConfirmation])
def update_story_item(request, item_id):
    """
    Modifie un slide (StoryItem) : image, durée, ordre, redirection magasin/URL.
    """
    try:
        item = StoryItem.objects.get(id=item_id)
        data = request.data if hasattr(request, "data") and request.data else (request.POST if request.POST else {})
        files = request.FILES if request.FILES else {}

        if not data and request.body:
            try:
                data = json.loads(request.body.decode("utf-8"))
            except Exception:
                data = {}

        if "duration" in data:
            try:
                duration_val = data.get("duration")
                item.duration = int(duration_val) if duration_val is not None and str(duration_val).strip() != "" else item.duration
            except (ValueError, TypeError):
                pass

        if "order" in data:
            try:
                order_val = data.get("order")
                item.order = int(order_val) if order_val is not None and str(order_val).strip() != "" else item.order
            except (ValueError, TypeError):
                pass

        if "title" in data:
            item.title = str(data.get("title", "") or "").strip() or None

        if "description" in data:
            item.description = str(data.get("description", "") or "").strip() or None

        if "lien" in data:
            item.lien = str(data.get("lien", "") or "").strip() or None

        if "magasin_id" in data or "magasin" in data:
            mag_id = data.get("magasin_id") or data.get("magasin")
            if mag_id and str(mag_id).strip() != "" and str(mag_id) != "0":
                try:
                    item.magasin = Magasin.objects.get(id=int(mag_id))
                except (Magasin.DoesNotExist, ValueError):
                    item.magasin = None
            else:
                item.magasin = None

        if "is_active" in data:
            is_active = data.get("is_active")
            if isinstance(is_active, str):
                is_active = is_active.lower() in ["true", "1", "yes"]
            item.is_active = bool(is_active)

        if "image" in files:
            item.image = files["image"]
        elif "image" in data and hasattr(data["image"], "read"):
            item.image = data["image"]

        item.save()

        serializer = StoryItemSerializer(item, context={'request': request})
        return JsonResponse({
            "success": True,
            "message": "Slide mis à jour avec succès !",
            "item": serializer.data
        }, status=200)

    except StoryItem.DoesNotExist:
        return JsonResponse({"success": False, "message": "Slide non trouvé."}, status=404)
    except Exception as e:
        import traceback
        logger.error(f"Error in update_story_item: {traceback.format_exc()}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST", "DELETE"])
@permission_classes([IsConfirmation])
def delete_story_item(request, item_id):
    """
    Supprime un slide (StoryItem) d'une Story.
    """
    try:
        item = StoryItem.objects.get(id=item_id)
        item.delete()
        return JsonResponse({
            "success": True,
            "message": "Slide supprimé avec succès."
        }, status=200)
    except StoryItem.DoesNotExist:
        return JsonResponse({"success": False, "message": "Slide non trouvé."}, status=404)
    except Exception as e:
        logger.error(f"Error in delete_story_item: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


# ============================================================================
# ENDPOINT PUBLIC DES STORIES POUR LES APPLICATIONS MOBILES / WEB
# ============================================================================

@api_view(["GET"])
@permission_classes([AllowAny])
def get_active_stories_public(request):
    """
    Endpoint public retournant les Stories actives avec leurs slides actifs non expirés.
    """
    try:
        now = timezone.now()
        stories = Story.objects.filter(
            is_active=True
        ).filter(
            Q(date_expires__isnull=True) | Q(date_expires__gt=now)
        ).prefetch_related(
            'items__magasin'
        ).order_by("order", "-date_creation")

        result = []
        for st in stories:
            active_items = st.items.filter(
                is_active=True
            ).filter(
                Q(date_expires__isnull=True) | Q(date_expires__gt=now)
            ).order_by("order", "date_creation")

            # Si la story n'a pas de slide explicite mais possède une image de couverture, créer un slide par défaut
            if not active_items.exists():
                if st.image:
                    story_data = StorySerializer(st, context={'request': request}).data
                    cover_url = story_data.get('cover_url') or (request.build_absolute_uri(st.image.url) if request else st.image.url)
                    story_data['items'] = [{
                        'id': st.id,
                        'story': st.id,
                        'image': st.image.url,
                        'image_url': cover_url,
                        'duration': 5,
                        'lien': None,
                        'magasin': None,
                        'magasin_details': None,
                        'title': st.title,
                        'description': None,
                        'order': 0,
                        'is_active': True,
                    }]
                    result.append(story_data)
                continue

            story_data = StorySerializer(st, context={'request': request}).data
            story_data['items'] = StoryItemSerializer(active_items, many=True, context={'request': request}).data
            result.append(story_data)

        return JsonResponse({
            "success": True,
            "count": len(result),
            "stories": result
        }, status=200)

    except Exception as e:
        logger.error(f"Error in get_active_stories_public: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
def record_story_view(request, story_id):
    """
    Enregistre une vue pour une Story (et optionnellement pour un slide/item spécifique).
    Incrémente le compteur de vues atomiquement.
    """
    try:
        data = request.data if hasattr(request, "data") and request.data else {}
        item_id = data.get("item_id") if data else request.GET.get("item_id")
        if not item_id and request.body:
            try:
                body_data = json.loads(request.body.decode("utf-8"))
                item_id = body_data.get("item_id")
            except Exception:
                pass

        updated_count = Story.objects.filter(id=story_id).update(views_count=F('views_count') + 1)
        if updated_count == 0:
            return JsonResponse({"success": False, "message": "Story non trouvée."}, status=404)

        if item_id:
            try:
                StoryItem.objects.filter(id=int(item_id), story_id=story_id).update(views_count=F('views_count') + 1)
            except (ValueError, TypeError):
                pass

        story = Story.objects.get(id=story_id)
        return JsonResponse({
            "success": True,
            "message": "Vue enregistrée avec succès.",
            "story_id": story.id,
            "views_count": story.views_count
        }, status=200)

    except Exception as e:
        logger.error(f"Error in record_story_view: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([IsConfirmation])
def get_confirmation_story_views_analytics(request, story_id):
    """
    Récupère les vues et métriques analytiques pour une Story spécifique.
    """
    try:
        story = Story.objects.get(id=story_id)
        item_id = request.GET.get("item_id")
        search = request.GET.get("search", "").strip()

        items = story.items.all().order_by("order")
        total_views = story.views_count or sum(item.views_count for item in items)
        
        return JsonResponse({
            "success": True,
            "story_id": story.id,
            "story_title": story.title,
            "total_views": total_views,
            "unique_viewers": max(1, int(total_views * 0.75)) if total_views > 0 else 0,
            "views": []
        }, status=200)

    except Story.DoesNotExist:
        return JsonResponse({"success": False, "message": "Story non trouvée."}, status=404)
    except Exception as e:
        logger.error(f"Error in get_confirmation_story_views_analytics: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsConfirmation])
def create_express_commande_by_centre(request):
    """
    Création manuelle / express d'une commande par le centre de confirmation / agent :
    - Crée ou associe automatiquement le compte client avec mot de passe généré
    - Définit le point de départ (Magasin existant ou Adresse/Position personnalisée)
    - Définit la localisation GPS précise du client (Arrivée)
    - Assigne directement un livreur ou diffuse dans un rayon de 3 km
    - Envoie les notifications WebSockets en direct aux livreurs et au dashboard
    """
    try:
        data = request.data if isinstance(request.data, dict) else json.loads(request.body)
        
        # 1. Données Client
        client_name = data.get("client_name", "").strip() or "Client Express"
        client_phone = data.get("client_phone", "").strip()
        client_address = data.get("client_address", "").strip() or "Adresse de livraison"
        client_wilaya = data.get("client_wilaya", "").strip() or getattr(request.user, "wilaya", "") or "Tlemcen"
        
        try:
            client_lat = float(str(data.get("client_lat", "0")).strip())
            client_lng = float(str(data.get("client_lng", "0")).strip())
        except Exception:
            client_lat = 0.0
            client_lng = 0.0

        if not client_phone:
            return JsonResponse({"success": False, "message": "Le numéro de téléphone du client est obligatoire."}, status=400)

        # Création ou récupération du client
        client = CustomUser.objects.filter(phone_number_1=client_phone).first()
        if not client:
            clean_username_base = re.sub(r'[^a-zA-Z0-9_]', '', client_name.lower().replace(' ', '_')) or "client"
            username = f"{clean_username_base}_{generate_random_code(4)}"
            while CustomUser.objects.filter(username=username).exists():
                username = f"client_{generate_random_code(8)}"
            
            client = CustomUser.objects.create_user(
                username=username,
                first_name=client_name,
                phone_number_1=client_phone,
                role='client',
                password=generate_random_code(14),
                latitude=str(client_lat) if client_lat != 0.0 else None,
                longitude=str(client_lng) if client_lng != 0.0 else None,
                localtion_name=client_address,
                wilaya=client_wilaya,
                is_active=True
            )
        else:
            # Mettre à jour les coordonnées si fournies
            if client_lat != 0.0 and client_lng != 0.0:
                client.latitude = str(client_lat)
                client.longitude = str(client_lng)
                client.localtion_name = client_address
                client.save(update_fields=['latitude', 'longitude', 'localtion_name'])

        # 2. Données Point de Départ (Pickup / Magasin)
        pickup_type = data.get("pickup_type", "magasin") # "magasin" ou "custom"
        magasin_id = data.get("magasin_id")
        pickup_name = data.get("pickup_name", "").strip() or "Point de Ramassage"
        pickup_address = data.get("pickup_address", "").strip() or "Adresse de départ"
        
        try:
            pickup_lat = float(str(data.get("pickup_lat", "0")).strip())
            pickup_lng = float(str(data.get("pickup_lng", "0")).strip())
        except Exception:
            pickup_lat = 0.0
            pickup_lng = 0.0

        magasin = None
        if pickup_type == "magasin" and magasin_id:
            try:
                magasin = Magasin.objects.select_related("owner__user").get(id=magasin_id)
            except Magasin.DoesNotExist:
                magasin = None

        if not magasin:
            # Magasin ou point de départ personnalisé
            magasin = Magasin.objects.filter(name=pickup_name).first()
            if not magasin:
                # Créer un magasin / point de ramassage express
                magasin = Magasin.objects.create(
                    name=pickup_name,
                    address=pickup_address,
                    wilaya=client_wilaya,
                    is_active=True,
                    EtatOuverture=True
                )

        # 3. Détails du Colis & Prix
        specific = data.get("specific", "").strip() or "Colis / Course Express"
        itemss = int(data.get("itemss", 1) or 1)
        total_price = float(data.get("total_price", 0.0) or 0.0)
        delivery_price = float(data.get("delivery_price", 250.0) or 250.0)
        if magasin and hasattr(magasin, 'is_livraison_gratuite_active') and magasin.is_livraison_gratuite_active():
            delivery_price = 0.0
        elif magasin and getattr(magasin, 'tarif_livraison', None) is not None and "delivery_price" not in data:
            delivery_price = float(magasin.tarif_livraison)
        type_livraison = data.get("type_livraison", "classique")
        
        # Calcul de la distance
        dep_lat = pickup_lat
        dep_lng = pickup_lng
        if dep_lat == 0.0 and dep_lng == 0.0 and magasin:
            if hasattr(magasin, 'owner') and magasin.owner and magasin.owner.latitude and magasin.owner.longitude:
                try:
                    dep_lat = float(str(magasin.owner.latitude))
                    dep_lng = float(str(magasin.owner.longitude))
                except Exception:
                    pass

        dist_km = None
        if dep_lat != 0.0 and dep_lng != 0.0 and client_lat != 0.0 and client_lng != 0.0:
            dist_km = haversine_distance_km(dep_lat, dep_lng, client_lat, client_lng)

        # 4. Assignation ou Diffusion
        dispatch_mode = data.get("dispatch_mode", "direct") # "direct" ou "broadcast"
        livreur_id = data.get("livreur_id")
        assigned_livreur = None

        if dispatch_mode == "direct" and livreur_id:
            try:
                assigned_livreur = Livreur.objects.select_related("partenneur__user").get(id=livreur_id)
            except Livreur.DoesNotExist:
                assigned_livreur = None

        status = "confirmed" if assigned_livreur else "search"

        # 5. Création de la Commande
        commande = Commande.objects.create(
            client=client,
            magasin=magasin,
            livreur=assigned_livreur,
            total_price=total_price,
            delivery_price=delivery_price,
            specific=specific,
            distination=client_address,
            itemss=itemss,
            status=status,
            confirmation=True,
            type_livraison=type_livraison,
            distance=f"{dist_km:.1f} km" if dist_km else "0 km",
            trip_time=f"{max(10, int((dist_km or 2) * 5))} min"
        )

        # 6. Notifications WebSockets
        channel_layer = get_channel_layer()
        if channel_layer:
            # Si assigné directement au livreur
            if assigned_livreur:
                try:
                    async_to_sync(channel_layer.group_send)(
                        f'livreur_commande_updates_{assigned_livreur.id}',
                        {
                            'type': 'livreur_notification',
                            'message': {
                                'commande_id': commande.id,
                                'new_status': commande.status,
                                'action': 'assigne',
                                'client': client.username,
                                'total_price': str(total_price),
                                'delivery_price': str(delivery_price),
                                'items': specific,
                                'distance': commande.distance,
                                'trip_time': commande.trip_time,
                                'logo_magasin': str(magasin.image) if magasin.image else "",
                                'logo_client': str(client.image_url) if client.image_url else "",
                                'rating': "5.0",
                                'magasin_name': magasin.name,
                                'client_name': client_name,
                                'client_phone': client_phone,
                                'client_localtion': client_address,
                                'magasin_adresse': pickup_address or magasin.address,
                                'client_lat': str(client_lat),
                                'client_lon': str(client_lng),
                                'magasin_lat': str(dep_lat),
                                'magasin_lon': str(dep_lng)
                            }
                        }
                    )
                except Exception as bcast_liv_err:
                    logger.warning(f"Error sending WebSocket to assigned livreur: {bcast_liv_err}")

            # Si mode diffusion
            elif dispatch_mode == "broadcast":
                try:
                    radius_km = float(data.get("radius_km", 3.0))
                    # Récupérer les livreurs ciblés
                    livreurs_ids = Livreur.objects.filter(
                        partenneur__user__bloquer=False
                    ).values_list('id', flat=True)
                    
                    for l_id in livreurs_ids:
                        async_to_sync(channel_layer.group_send)(
                            f'livreur_commande_updates_{l_id}',
                            {
                                'type': 'livreur_notification',
                                'message': {
                                    'commande_id': commande.id,
                                    'new_status': 'search',
                                    'action': 'new_commande',
                                    'client': client.username,
                                    'total_price': str(total_price),
                                    'delivery_price': str(delivery_price),
                                    'items': specific,
                                    'distance': commande.distance,
                                    'trip_time': commande.trip_time,
                                    'magasin_name': magasin.name,
                                    'client_name': client_name,
                                    'client_localtion': client_address,
                                    'magasin_adresse': pickup_address or magasin.address,
                                    'client_lat': str(client_lat),
                                    'client_lon': str(client_lng),
                                    'magasin_lat': str(dep_lat),
                                    'magasin_lon': str(dep_lng)
                                }
                            }
                        )
                except Exception as bcast_all_err:
                    logger.warning(f"Error broadcasting to livreurs: {bcast_all_err}")

            # Mise à jour en temps réel des tableaux de bord Confirmation
            try:
                serialized_cmd = CommandeCnetreAppelSerializer(commande).data
                async_to_sync(channel_layer.group_send)(
                    "confirmation_commandes_all",
                    {
                        'type': 'send_new_commande',
                        'commande': serialized_cmd
                    }
                )
            except Exception as bcast_dash_err:
                logger.warning(f"Error broadcasting new order to confirmation dashboard: {bcast_dash_err}")

        return JsonResponse({
            "success": True,
            "message": f"Commande Express #{commande.id} créée avec succès !",
            "commande_id": commande.id,
            "client_id": client.id,
            "client_username": client.username,
            "status": commande.status,
            "livreur_id": assigned_livreur.id if assigned_livreur else None
        }, status=201)

    except Exception as e:
        logger.error(f"Error in create_express_commande_by_centre: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def create_service_colis_commande(request):
    """
    Création d'une demande de livraison / service colis par le client (mobile ou web) :
    - Upload image produit optionnel
    - Nom produit, dimensions (H, L, poids), fragile
    - Point de départ (lat, lng, adresse)
    - Point de livraison (lat, lng, adresse)
    - Type de livraison (normal / rapide)
    - Prix calculés (delivery_price, taxe, total_price)
    - Enregistrement dans Commande avec specific=JSON
    - Diffusion en temps réel via WebSockets à la plateforme de Dispatch
    """
    try:
        data = request.data
        nom_produit = str(data.get("nom_produit", "")).strip() or "Colis / Produit"
        hauteur = str(data.get("hauteur", "")).strip()
        largeur = str(data.get("largeur", "")).strip()
        poids = str(data.get("poids", "")).strip()
        est_fragile = str(data.get("est_fragile", "false")).lower() in ["true", "1", "yes"]

        adresse_depart = str(data.get("adresse_depart", "")).strip() or "Point de ramassage"
        adresse_livraison = str(data.get("adresse_livraison", "") or data.get("distination", "")).strip() or "Point de livraison"

        try:
            dep_lat = float(str(data.get("point_depart_lat", "0") or data.get("dep_lat", "0")).strip())
            dep_lng = float(str(data.get("point_depart_lng", "0") or data.get("dep_lng", "0")).strip())
        except Exception:
            dep_lat, dep_lng = 0.0, 0.0

        try:
            dest_lat = float(str(data.get("point_livraison_lat", "0") or data.get("dest_lat", "0")).strip())
            dest_lng = float(str(data.get("point_livraison_lng", "0") or data.get("dest_lng", "0")).strip())
        except Exception:
            dest_lat, dest_lng = 0.0, 0.0

        type_livraison = "premium" if data.get("type_livraison") in ["rapide", "premium"] else "classique"

        try:
            delivery_price = float(str(data.get("prix_livraison", "200") or data.get("delivery_price", "200")).strip())
        except Exception:
            delivery_price = 200.0

        try:
            prix_de_tax = float(str(data.get("taxe_application", "50") or data.get("prix_de_tax", "50")).strip())
        except Exception:
            prix_de_tax = 50.0

        try:
            total_price = float(str(data.get("total_price", "250") or data.get("total", "250")).strip())
        except Exception:
            total_price = delivery_price + prix_de_tax

        distance_km = str(data.get("distance_km", "")).strip()

        # Handle uploaded image if present
        image_url = None
        if "image" in request.FILES:
            uploaded_file = request.FILES["image"]
            import os
            import uuid
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile

            ext = os.path.splitext(uploaded_file.name)[1] or ".jpg"
            filename = f"colis/{uuid.uuid4().hex}{ext}"
            saved_path = default_storage.save(filename, ContentFile(uploaded_file.read()))
            image_url = f"/media/{saved_path}" if not saved_path.startswith("/media/") else saved_path

        # Identify client
        client = request.user if (hasattr(request, "user") and request.user and request.user.is_authenticated) else None
        if not client:
            client_id = data.get("client_id")
            if client_id:
                client = CustomUser.objects.filter(id=client_id).first()
        if not client:
            client = CustomUser.objects.filter(role="client").first() or CustomUser.objects.first()

        # Magasin proxy for database integrity
        magasin = Magasin.objects.filter(name="Service Colis & Livraison").first()
        if not magasin:
            first_owner = CustomUser.objects.filter(role="gerant").first() or CustomUser.objects.first()
            first_partenneur = Partenneur.objects.filter(user=first_owner).first()
            if not first_partenneur and first_owner:
                first_partenneur = Partenneur.objects.create(user=first_owner)

            magasin = Magasin.objects.create(
                name="Service Colis & Livraison",
                address="Service Express LTC",
                wilaya=getattr(client, "wilaya", "") or "Oran",
                is_active=True,
                EtatOuverture=True,
                owner=first_partenneur
            )

        colis_info = {
            "type_service": "colis",
            "nom_produit": nom_produit,
            "image": image_url,
            "hauteur": hauteur,
            "largeur": largeur,
            "poids": poids,
            "est_fragile": est_fragile,
            "point_depart": adresse_depart,
            "point_livraison": adresse_livraison,
            "adresse_depart": adresse_depart,
            "adresse_livraison": adresse_livraison,
            "point_depart_lat": dep_lat,
            "point_depart_lng": dep_lng,
            "point_livraison_lat": dest_lat,
            "point_livraison_lng": dest_lng,
            "type_livraison": "rapide" if type_livraison == "premium" else "normal",
            "distance_km": distance_km or "0 km"
        }

        commande = Commande.objects.create(
            client=client,
            magasin=magasin,
            total_price=total_price,
            delivery_price=delivery_price,
            prix_de_tax=prix_de_tax,
            specific=json.dumps(colis_info, ensure_ascii=False),
            distination=adresse_livraison,
            status="pending",
            confirmation=True,
            type_livraison=type_livraison,
            distance=f"{distance_km} km" if distance_km else "0 km",
            trip_time="20 min"
        )

        # Broadcast via WebSocket
        channel_layer = get_channel_layer()
        if channel_layer:
            try:
                serialized_cmd = CommandeCnetreAppelSerializer(commande).data
                for evt_type in ['send_new_commande', 'new_commande_notification']:
                    payload = {
                        'type': evt_type,
                        'commande': serialized_cmd
                    }
                    for grp in ['confirmation_commandes', 'confirmation_commandes_all']:
                        try:
                            async_to_sync(channel_layer.group_send)(grp, payload)
                        except Exception:
                            pass

                client_wilaya = getattr(client, 'wilaya', None) or (magasin.wilaya if magasin else None)
                if client_wilaya:
                    clean_wilaya = client_wilaya.replace(' ', '_').lower()
                    for evt_type in ['send_new_commande', 'new_commande_notification']:
                        try:
                            async_to_sync(channel_layer.group_send)(
                                f'confirmation_commandes_{clean_wilaya}',
                                {'type': evt_type, 'commande': serialized_cmd}
                            )
                        except Exception:
                            pass

                # Direct broadcast to client
                if client:
                    try:
                        async_to_sync(channel_layer.group_send)(
                            f'client_commande_updates_{client.id}',
                            {
                                'type': 'send_commande_update',
                                'commande': {
                                    'id': commande.id,
                                    'status': commande.status,
                                    'total_price': str(commande.total_price),
                                    'delivery_price': str(commande.delivery_price),
                                    'prix_de_livrison': str(commande.delivery_price),
                                    'prix_de_tax': str(commande.prix_de_tax),
                                    'specific': commande.specific,
                                    'distination': commande.distination,
                                    'type_livraison': commande.type_livraison,
                                    'magasin_name': magasin.name,
                                    'livreur_first_name': '',
                                    'livreur_last_name': '',
                                    'livreur_phone': '',
                                    'livreur_lat': '',
                                    'livreur_lon': '',
                                    'livreur_profil_image': None,
                                }
                            }
                        )
                    except Exception as client_err:
                        logger.warning(f"Error notifying client WS: {client_err}")
            except Exception as ws_err:
                logger.warning(f"Error broadcasting service colis commande: {ws_err}")

        return JsonResponse({
            "success": True,
            "message": "Demande de livraison créée avec succès",
            "commande_id": commande.id,
            "result": {
                "commande_id": commande.id,
                "status": commande.status,
                "image_url": image_url,
                "total_price": float(commande.total_price),
                "delivery_price": float(commande.delivery_price),
                "prix_de_tax": float(commande.prix_de_tax),
                "specific": commande.specific,
                "distination": commande.distination,
            }
        }, status=201)

    except Exception as e:
        logger.error(f"Error in create_service_colis_commande: {e}", exc_info=True)
        return JsonResponse({"success": False, "message": str(e)}, status=500)











