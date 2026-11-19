from datetime import timedelta
from django.utils import timezone
from employer.models import *
from employer.serializer import * 
from rest_framework.decorators import api_view
from rest_framework.response import Response 
import json
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from .models import *
from django.shortcuts import get_object_or_404
from employer.permission import *
from .serializer import *
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Sum, Q, Avg
from django.db import transaction


@api_view(['PATCH'])
def update_partenneur(request):
    if request.method == "PATCH":
        try:
            # Parse le JSON depuis le corps de la requête
            data = json.loads(request.body)
            
            
            long = data.get("long")
            lat = data.get("lat")
            wilaya=data.get("wilaya","")
            wilaya_code=data.get("wilaya_code")
            ignore_terms = ['provider', 'city', 'wilaya', 'province', 'region','de','la','les','des','du','Wilaya','Province',"d'"]
            cleaned_wilaya = " ".join([word for word in wilaya.split() if word not in ignore_terms])
            print(f"validated wilaya for partener update is {cleaned_wilaya}")
            
            # Récupère le Partenneur ciblé
            partener_cible = Partenneur.objects.get(user=request.user)
            
            # Met à jour les coordonnées
            partener_cible.longitude = long
            partener_cible.latitude = lat
            partener_cible.is_available = True
            partener_cible.user.wilaya = cleaned_wilaya.lower()
            partener_cible.user.wilaya_code = wilaya_code
            partener_cible.user.latitude = lat
            partener_cible.user.longitude = long
            partener_cible.user.save()
            partener_cible.save()
            
            return JsonResponse({"message": "Partner updated successfully"}, status=200)

        except json.JSONDecodeError:
            # Erreur de format JSON
            return JsonResponse({"error": "Invalid JSON format"}, status=400)
        
        except Partenneur.DoesNotExist:
            # Si le partenaire avec l'ID donné n'existe pas
            return JsonResponse({"error": "Partner ID not valid"}, status=404)
        
        except Exception as e:
            # Gestion des erreurs inattendues
            return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)

    # Si la méthode HTTP n'est pas PATCH
    return JsonResponse({"error": "Method not allowed"}, status=405)


@api_view(["PATCH"])
def update_wilaya_for_user (request):
    if request.method=="PATCH":
        try :
            user=CustomUser.objects.get(id=request.user.id)
            data=json.loads(request.body)
            wilaya=data.get("wilaya")
            wilaya_code=data.get("wilaya_code")
            ignore_terms = ['provider', 'city', 'wilaya', 'province', 'region','de','la','les','des','du','Wilaya','Province',"d'"]
            lat=data.get("lat")
            long=data.get("long")

            cleaned_wilaya = " ".join([word for word in wilaya.split() if word not in ignore_terms])
            print(f"validated wilaya for user update is {cleaned_wilaya}")
            user.wilaya=cleaned_wilaya.lower()
            user.wilaya_code=wilaya_code
            user.latitude=lat
            user.longitude=long
            user.save()

            return JsonResponse({"message":"utilisateur est update "},status=200)
        except CustomUser.DoesNotExist :
            return JsonResponse({"message":"user id not valide "},status=404)
    else :
        return JsonResponse({"message":"method not allow "},status=405)




@csrf_exempt
@api_view(["GET"])
def get_courses_user(request):
    if request.method != "GET":
        return JsonResponse({'error': 'Method not allowed'}, status=405)
      
    try:
        user = request.user
        order_direction = request.GET.get('order_direction', "ascending")
        if user.role == "client":
            # Fetch courses for the client
            if order_direction =="ascending" :
             courses = Coursa.objects.filter(client=user).select_related("client", "partener", "agent").order_by("-id")
            else :
                courses = Coursa.objects.filter(client=user).select_related("client", "partener", "agent").order_by("id")
        else:
            # Fetch courses for the partner
            if order_direction =="ascending" :
             partener = Partenneur.objects.get(user=user)
             courses = Coursa.objects.filter(partener=partener).select_related('client', 'partener', 'agent').order_by("-id")
            else :
                partener = Partenneur.objects.get(user=user)
                courses = Coursa.objects.filter(partener=partener).select_related('client', 'partener', 'agent').order_by("id")

        # Extract and validate pagination parameters
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
        paginator = Paginator(courses, page_size)
        
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
        
        # Serialize the current page's data
        serializer = CustomerCoursaSerializer(current_page.object_list, many=True)

        # Build response with pagination metadata
        response_data = {
            'data': serializer.data,
            
                'total': paginator.count,
                'page': current_page.number,
                'page_size': page_size,
                'total_pages': paginator.num_pages,
                
            
        }



        try:
            page_size = int(page_size)
            if page_size < 1:
                page_size = 10  # Ensure page size is at least 1
        except ValueError:
            page_size = 10

        # Paginate the queryset
        paginator = Paginator(courses, page_size)
        
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
        
        # Serialize the current page's data
        serializer = CustomerCoursaSerializer(current_page.object_list, many=True)

        # Build response with pagination metadata
        response_data = {
            'data': serializer.data,
            
                'total': paginator.count,
                'page': current_page.number,
                'page_size': page_size,
                'total_pages': paginator.num_pages,
                
            
        }


        return JsonResponse(response_data, status=200)

    except Partenneur.DoesNotExist:
        return JsonResponse({'error': 'Partner not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def get_commission(request):
    if request.method == "GET":
        try:
            wilaya = request.GET.get("wilaya")
            search = request.GET.get("search")
            type_course = request.GET.get("type_course")
            code_wilaya = request.GET.get("code_wilaya")

            # Fallback to reading body if query params not present and body exists
            if not wilaya and not search and not type_course and not code_wilaya:
                if request.body:
                    try:
                        data = json.loads(request.body)
                        wilaya = data.get("wilaya")
                        type_course = data.get("type_course") or data.get("type")
                        code_wilaya = data.get("code_wilaya")
                    except Exception:
                        pass

            commissions = Commissions.objects.all()

            if wilaya:
                wilaya_lower = wilaya.strip().lower()
                ignore_terms = ['provider', 'city', 'wilaya', 'province', 'region', 'de', 'la', 'les', 'des', 'du', 'wilaya', 'province', "d'"]
                cleaned_wilaya = " ".join([word for word in wilaya_lower.split() if word not in ignore_terms])
                if cleaned_wilaya:
                    commissions = commissions.filter(wilaya__icontains=cleaned_wilaya)

            if search:
                search_term = search.strip()
                from django.db.models import Q
                commissions = commissions.filter(
                    Q(wilaya__icontains=search_term) |
                    Q(type_course__icontains=search_term) |
                    Q(description__icontains=search_term)
                )

            if type_course:
                commissions = commissions.filter(type_course__icontains=type_course.strip())

            if code_wilaya:
                try:
                    commissions = commissions.filter(code_wilaya=int(code_wilaya))
                except (ValueError, TypeError):
                    pass

            commissions = commissions.order_by('code_wilaya', 'wilaya', 'type_course')
            serializer = CammisionSerilize(commissions, many=True)
            return Response(serializer.data, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    else:
        return Response({"message": "Method not allowed"}, status=405)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def create_commission(request):
    if request.method == "POST":
        try:
            if isinstance(request.data, dict) and request.data:
                data = request.data
            else:
                data = json.loads(request.body)

            wilaya = data.get("wilaya")
            type_course = data.get("type_course", "classique")
            prix_depart = float(data.get("prix_depart", 0)) if data.get("prix_depart") is not None else 0.0
            prix_second = float(data.get("prix_second", 0)) if data.get("prix_second") is not None else 0.0
            prix_km = float(data.get("prix_km", 0)) if data.get("prix_km") is not None else 0.0
            prix_km_long = float(data.get("prix_km_long", 0)) if data.get("prix_km_long") is not None else 0.0
            prix_nuit_second = float(data.get("prix_nuit_second", 0)) if data.get("prix_nuit_second") is not None else 0.0
            code_wilaya = data.get("code_wilaya")
            if code_wilaya is not None and str(code_wilaya).strip() != "":
                try:
                    code_wilaya = int(code_wilaya)
                except (ValueError, TypeError):
                    code_wilaya = None
            else:
                code_wilaya = None

            description = data.get("description", "")

            commission = Commissions.objects.create(
                wilaya=wilaya,
                type_course=type_course,
                prix_depart=prix_depart,
                prix_second=prix_second,
                prix_km=prix_km,
                prix_km_long=prix_km_long,
                prix_nuit_second=prix_nuit_second,
                code_wilaya=code_wilaya,
                description=description
            )

            serializer = CammisionSerilize(commission)
            return Response({"message": "Commission créée avec succès", "data": serializer.data}, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
    return Response({"message": "Method not allowed"}, status=405)


@csrf_exempt
@api_view(['PUT', 'PATCH'])
@permission_classes([AllowAny])
def update_commission(request):
    if request.method in ["PUT", "PATCH"]:
        try:
            if isinstance(request.data, dict) and request.data:
                data = request.data
            else:
                data = json.loads(request.body)

            commission_id = data.get("id")
            if not commission_id:
                return Response({"error": "ID de commission requis"}, status=400)

            commission = get_object_or_404(Commissions, id=commission_id)

            if "wilaya" in data:
                commission.wilaya = data["wilaya"]
            if "type_course" in data:
                commission.type_course = data["type_course"]
            if "prix_depart" in data and data["prix_depart"] is not None:
                commission.prix_depart = float(data["prix_depart"])
            if "prix_second" in data and data["prix_second"] is not None:
                commission.prix_second = float(data["prix_second"])
            if "prix_km" in data and data["prix_km"] is not None:
                commission.prix_km = float(data["prix_km"])
            if "prix_km_long" in data and data["prix_km_long"] is not None:
                commission.prix_km_long = float(data["prix_km_long"])
            if "prix_nuit_second" in data and data["prix_nuit_second"] is not None:
                commission.prix_nuit_second = float(data["prix_nuit_second"])
            if "code_wilaya" in data:
                cw = data["code_wilaya"]
                commission.code_wilaya = int(cw) if cw is not None and str(cw).strip() != "" else None
            if "description" in data:
                commission.description = data["description"]

            commission.save()
            serializer = CammisionSerilize(commission)
            return Response({"message": "Commission mise à jour avec succès", "data": serializer.data}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
    return Response({"message": "Method not allowed"}, status=405)


@csrf_exempt
@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_commission(request, id=None):
    if request.method == "DELETE":
        try:
            if not id:
                if request.body:
                    try:
                        data = json.loads(request.body)
                        id = data.get("id")
                    except Exception:
                        pass
                if not id:
                    id = request.GET.get("id")

            if not id:
                return Response({"error": "ID de commission requis"}, status=400)

            commission = get_object_or_404(Commissions, id=id)
            commission.delete()
            return Response({"message": "Commission supprimée avec succès"}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
    return Response({"message": "Method not allowed"}, status=405)


@csrf_exempt
@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([AllowAny])
def manage_chauffeur_commission_rate(request):
    """
    Gère le taux de commission prélevé par la plateforme sur chaque course VTC (tax_tawsile).
    Stocké dans Type_compte_partener sous name='choffeur' (ou similaire).
    """
    try:
        type_compte = Type_compte_partener.objects.filter(
            Q(name__icontains="chauf") | Q(name__icontains="chof") | Q(name__icontains="vtc")
        ).first()
        if not type_compte:
            type_compte = Type_compte_partener.objects.create(
                name="chauffeur",
                description="Commission plateforme chauffeur VTC",
                tax_tawsile=15
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

            tax_val = data.get("tax_tawsile")
            if tax_val is not None:
                type_compte.tax_tawsile = int(tax_val)
            if "description" in data:
                type_compte.description = data["description"]
            type_compte.save()

            return Response({
                "message": "Taux de commission chauffeur mis à jour avec succès",
                "id": type_compte.id,
                "name": type_compte.name,
                "tax_tawsile": type_compte.tax_tawsile,
                "description": type_compte.description
            }, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(["POST"])
def create_reviews(request):
    if request.method == 'POST':
        try:
            # Parse the request body as JSON
            data = json.loads(request.body)
            user_id=data.get("user")
            commentaire=data.get("comm")
            rate=data.get("star")
            user = get_object_or_404(CustomUser, id=user_id)
            Review.objects.create(user=user,stars=rate,comment=commentaire)
            return JsonResponse({"message":"reviews successfully created"},status=200)
        
        except Exception as e :
            return JsonResponse({"message":"probleme de connexion "},status=500)
    else :
        return JsonResponse({'message':"method not alllow "},status=405) 
@api_view(['PATCH'])
@permission_classes([IsPertener])
def update_etat_coursa(request):
    if request.method == 'PATCH':
        try:
            # Parse the request body as JSON
            data = json.loads(request.body)
            id_coursa=data.get("id_coursa")
            etat=data.get("etat")
            coursa = get_object_or_404(Coursa, id=id_coursa)
            coursa.etat=etat
            coursa.save()
            return JsonResponse({"message":"etat coursa est update "},status=200)
        
        except Exception as e :
            return JsonResponse({"erooor":str(e)},status=500)
    else :
        return JsonResponse({'eroor':"method not alllow "},status=405)  
    
def get_prix_pour_wilaya(request):
    if request.method == "GET":
        try:
            # Parse the request body as JSON
            data=json.loads(request.body)
            wilaya = data.get("wilaya")
            
            ignore_terms = ['provider', 'city', 'wilaya', 'province', 'region','de','la','les','des','du','Wilaya','Province',"d'"]

            cleaned_wilaya = " ".join([word for word in wilaya.split() if word not in ignore_terms])
            print(f"Cleaned wilaya: {cleaned_wilaya}")
            
            
            # Fetch prix by wilaya
            prix = Commissions.objects.filter(wilaya__icontains=cleaned_wilaya)
            print(f"prix is {prix}")
            
            # Serialize the prix object
            serializer = CommissionPrixParWilaya(prix,many=True)
            return JsonResponse(serializer.data,status=200,safe=False)
        except Commissions.DoesNotExist:
            return JsonResponse({"message": "prix not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else :
        return JsonResponse({"message": "Method not allowed"}, status=405)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_commission_par_type(request):
    if request.method == "GET":
        try:
            # Safely extract data from request.data, request.query_params or request.body
            data = {}
            if hasattr(request, 'data') and isinstance(request.data, dict) and request.data:
                data = request.data
            elif request.body:
                try:
                    data = json.loads(request.body.decode('utf-8') if isinstance(request.body, bytes) else request.body)
                except Exception:
                    data = {}

            type_raw = str(data.get("type") or request.GET.get("type") or request.query_params.get("type") or "").strip().lower()
            code_wilaya_raw = data.get("code_wilaya") or request.GET.get("code_wilaya") or request.query_params.get("code_wilaya")

            code_wilaya = None
            if code_wilaya_raw is not None:
                try:
                    code_wilaya = int(code_wilaya_raw)
                except (ValueError, TypeError):
                    code_wilaya = None

            # Mapping for language and naming variations between mobile app, frontend and DB
            type_aliases = {
                "black": ["noir", "black"],
                "noir": ["noir", "black"],
                "comfort": ["confort", "comfort"],
                "confort": ["confort", "comfort"],
                "harim": ["harime", "harim"],
                "harime": ["harime", "harim"],
                "classique": ["classique", "classic"],
                "classic": ["classique", "classic"],
                "xxl": ["xxl"],
                "utilitaire": ["utilitaire"],
                "moto": ["moto"],
                "famille": ["famille", "xxl"],
                "livraison": ["livraison", "voiture_livreur", "utilitaire"],
                "voiture_livreur": ["voiture_livreur", "livraison", "classique"],
            }

            candidate_types = list(type_aliases.get(type_raw, [type_raw]))
            if type_raw and type_raw not in candidate_types:
                candidate_types.append(type_raw)
            if not candidate_types or candidate_types == [""]:
                candidate_types = ["classique"]

            # Build Q query for candidate types
            type_q = Q()
            for cand in candidate_types:
                if cand:
                    type_q |= Q(type_course__iexact=cand) | Q(type_course__icontains=cand)

            commission = None

            # 1. Look for matching commission in requested wilaya
            if code_wilaya and type_q:
                commission = Commissions.objects.filter(Q(code_wilaya=code_wilaya) & type_q).first()

            # 2. Fallback to wilaya 13 (Tlemcen) with candidate types
            if not commission and type_q:
                commission = Commissions.objects.filter(Q(code_wilaya=13) & type_q).first()

            # 3. Fallback to any wilaya with candidate types
            if not commission and type_q:
                commission = Commissions.objects.filter(type_q).first()

            # 4. Fallback to 'classique' for requested wilaya
            if not commission and code_wilaya:
                commission = Commissions.objects.filter(code_wilaya=code_wilaya, type_course__icontains="classique").first()

            # 5. Fallback to 'classique' for wilaya 13
            if not commission:
                commission = Commissions.objects.filter(code_wilaya=13, type_course__icontains="classique").first()

            # 6. Fallback to any commission in the database
            if not commission:
                commission = Commissions.objects.first()

            # 7. Fallback default if table is empty
            if not commission:
                return JsonResponse({
                    "id": 0,
                    "wilaya": "Tlemcen",
                    "type_course": type_raw or "classique",
                    "prix_depart": 150.0,
                    "prix_second": 0.15,
                    "code_wilaya": code_wilaya or 13,
                    "prix_km": 15.0,
                    "prix_km_long": 22.0,
                    "prix_nuit_second": 0.25,
                    "description": "Tarif par défaut",
                }, status=200)

            serializer = CammisionSerilize(commission)
            return JsonResponse(serializer.data, status=200)

        except Exception as e:
            return JsonResponse({
                "id": 0,
                "wilaya": "Tlemcen",
                "type_course": "classique",
                "prix_depart": 150.0,
                "prix_second": 0.15,
                "code_wilaya": 13,
                "prix_km": 15.0,
                "prix_km_long": 22.0,
                "prix_nuit_second": 0.25,
                "description": f"Tarif par défaut (fallback: {str(e)})",
            }, status=200)
    else:
        return Response({"message": "Method not allowed"}, status=405)

@api_view(['GET'])
@permission_classes([IsPertener])
def calculate_total_price(request):
            if request.method == "GET":
                try:
                    
                    courses = Coursa.objects.filter(partener__user=request.user, paye=False, etat="terminee").select_related("client", 'agent', "partener").order_by("-id")
                    if courses.exists():
                        data = courses.last()
                        date_expiration = data.date_creation + timedelta(days=30)  # Add 30 days for one month
                    else:
                        date_expiration = None
                    
                    total_price = sum(course.tax_tawsile for course in courses)
                    return JsonResponse({"tax_tawsile": total_price,"date_expiration":date_expiration }, status=200)
                except Exception as e:
                    return JsonResponse({"error": str(e)}, status=500)
                except Coursa.DoesNotExist :
                    return JsonResponse({"tax_tawsile":0,"date_expiration":"ya pad de date "},status=204)
            else:
                return JsonResponse({"message": "Method not allowed"}, status=405)  
            
def get_rides_partener (request):
    if request.method == "GET":
        try:
            queryset =Coursa.objects.filter(user=request.user)
            serializer=taxtawsilepartener(queryset,many=True)
            return JsonResponse(serializer.data,status=200)
        except Coursa.DoesNotExist :
            return JsonResponse({"message": "coursa not found"}, status=404)
    else :
        return JsonResponse({"message": "Method not allowed"}, status=405)


@api_view(['GET'])
@permission_classes([AllowAny])
def search_places(request):
    search_query = request.GET.get('search', '').strip()
    limit = int(request.GET.get('limit', 20))
    
    queryset = VtcPlace.objects.all()
    if search_query:
        from django.db.models import Q
        queryset = queryset.filter(
            Q(name__icontains=search_query) |
            Q(city__icontains=search_query) |
            Q(state__icontains=search_query) |
            Q(formatted_address__icontains=search_query)
        )
    
    places = queryset[:limit]
    data = []
    for place in places:
        data.append({
            'id': place.id,
            'place_id': f"backend_{place.id}",
            'name': place.name,
            'formatted_address': place.formatted_address or f"{place.name}, {place.city}, {place.state}, Algérie",
            'city': place.city,
            'state': place.state,
            'state_short': place.state_short or place.state,
            'lat': place.latitude,
            'lng': place.longitude,
        })
    return Response(data, status=200)


# -------------------------------------------------------------
# GESTION DES TYPES DE COURSE VTC
# -------------------------------------------------------------

DEFAULT_COURSE_TYPES = [
    {"name": "Classique", "code": "classique", "description": "Course standard berline ou citadine", "icon": "FaCar"},
    {"name": "Confort", "code": "confort", "description": "Véhicule haut de gamme spacieux et climatisé", "icon": "FaCrown"},
    {"name": "Moto", "code": "moto", "description": "Course rapide en deux-roues pour 1 passager", "icon": "FaMotorcycle"},
    {"name": "Famille / 7 places", "code": "famille", "description": "Véhicule grand format pour 4 à 7 passagers", "icon": "FaUsers"},
    {"name": "Livraison VTC", "code": "livraison", "description": "Transport de colis et plis express en VTC", "icon": "FaBox"},
]

@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def get_type_courses(request):
    """
    Récupère la liste des types de courses VTC.
    Auto-initialise les types par défaut si la table est vide.
    """
    try:
        if TypeCourse.objects.count() == 0:
            for item in DEFAULT_COURSE_TYPES:
                TypeCourse.objects.get_or_create(
                    code=item["code"],
                    defaults={
                        "name": item["name"],
                        "description": item["description"],
                        "icon": item["icon"],
                        "is_active": True
                    }
                )

        types = TypeCourse.objects.all().order_by("id")
        serializer = TypeCourseSerializer(types, many=True)
        return Response(serializer.data, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=400)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def create_type_course(request):
    """
    Crée un nouveau type de course.
    """
    if request.method == "POST":
        try:
            data = request.data if isinstance(request.data, dict) and request.data else json.loads(request.body)
            name = data.get("name", "").strip()
            code = data.get("code", "").strip().lower()
            description = data.get("description", "").strip()
            icon = data.get("icon", "FaCar").strip()
            is_active = data.get("is_active", True)

            if not name:
                return Response({"error": "Le nom du type de course est requis."}, status=400)
            if not code:
                import re
                code = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower()).strip('_')

            if TypeCourse.objects.filter(code=code).exists():
                return Response({"error": f"Le code '{code}' existe déjà pour un autre type de course."}, status=400)

            type_course = TypeCourse.objects.create(
                name=name,
                code=code,
                description=description,
                icon=icon,
                is_active=is_active
            )
            serializer = TypeCourseSerializer(type_course)
            return Response({"message": "Type de course créé avec succès", "data": serializer.data}, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
    return Response({"message": "Method not allowed"}, status=405)


@csrf_exempt
@api_view(["PUT", "PATCH"])
@permission_classes([AllowAny])
def update_type_course(request):
    """
    Met à jour un type de course existant.
    """
    if request.method in ["PUT", "PATCH"]:
        try:
            data = request.data if isinstance(request.data, dict) and request.data else json.loads(request.body)
            type_id = data.get("id")
            if not type_id:
                return Response({"error": "L'identifiant (id) est requis."}, status=400)

            type_course = get_object_or_404(TypeCourse, id=type_id)

            if "name" in data and data["name"]:
                type_course.name = data["name"].strip()
            if "code" in data and data["code"]:
                new_code = data["code"].strip().lower()
                if new_code != type_course.code and TypeCourse.objects.filter(code=new_code).exclude(id=type_id).exists():
                    return Response({"error": f"Le code '{new_code}' est déjà utilisé."}, status=400)
                if new_code != type_course.code:
                    Commissions.objects.filter(type_course=type_course.code).update(type_course=new_code)
                type_course.code = new_code
            if "description" in data:
                type_course.description = data["description"]
            if "icon" in data and data["icon"]:
                type_course.icon = data["icon"]
            if "is_active" in data:
                type_course.is_active = bool(data["is_active"])

            type_course.save()
            serializer = TypeCourseSerializer(type_course)
            return Response({"message": "Type de course mis à jour avec succès", "data": serializer.data}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
    return Response({"message": "Method not allowed"}, status=405)


@csrf_exempt
@api_view(["DELETE"])
@permission_classes([AllowAny])
def delete_type_course(request, id=None):
    """
    Supprime un type de course s'il n'est pas utilisé.
    """
    if request.method == "DELETE":
        try:
            if not id:
                id = request.GET.get("id")
            if not id:
                return Response({"error": "L'identifiant (id) est requis."}, status=400)

            type_course = get_object_or_404(TypeCourse, id=id)

            used_count = Commissions.objects.filter(type_course__iexact=type_course.code).count()
            force_delete = request.GET.get("force", "").lower() in ["true", "1"]

            if used_count > 0 and not force_delete:
                return Response({
                    "error": f"Ce type de course est utilisé par {used_count} règle(s) de commission. Veuillez modifier ces règles au préalable ou désactiver ce type.",
                    "used_count": used_count
                }, status=400)

            type_course.delete()
            return Response({"message": "Type de course supprimé avec succès"}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
    return Response({"message": "Method not allowed"}, status=405)


@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def get_vtc_chauffeurs(request):
    """
    Récupère la liste des chauffeurs VTC avec filtres, compteurs globaux et détails complets.
    """
    try:
        search = request.GET.get("search", "").strip()
        wilaya = request.GET.get("wilaya", "").strip()
        status_filter = request.GET.get("status", "").strip().lower()
        type_vehicule = request.GET.get("type_vehicule", "").strip()
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 20))

        # Base: Strictement les partenaires de type chauffeur VTC (pas de livreurs ni magasins)
        qs = Partenneur.objects.select_related("user", "vihucule", "type_compte").filter(
            Q(type_compte__name__icontains="chauf") | Q(type_compte__name__icontains="chof") | Q(type_compte__name__icontains="vtc")
        ).exclude(
            Q(type_compte__name__icontains="livreur") | Q(type_compte__name__icontains="magasin")
        ).distinct().order_by("-id")

        # Compteurs globaux avant filtres de recherche
        total_chauffeurs = qs.count()
        online_count = qs.filter(is_available=True, user__bloquer=False).count()
        active_count = qs.filter(user__is_active=True, user__bloquer=False).count()
        blocked_count = qs.filter(user__bloquer=True).count()

        # Filtrage par recherche texte
        if search:
            qs = qs.filter(
                Q(user__username__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__phone_number_1__icontains=search) |
                Q(vihucule__matricule__icontains=search) |
                Q(vihucule__marque__icontains=search) |
                Q(vihucule__modele__icontains=search)
            )

        # Filtrage par wilaya
        if wilaya:
            qs = qs.filter(
                Q(user__wilaya__iexact=wilaya) |
                Q(user__wilaya_code__iexact=wilaya) |
                Q(user__wilaya__icontains=wilaya)
            )

        # Filtrage par statut
        if status_filter in ["online", "en_ligne"]:
            qs = qs.filter(is_available=True, user__bloquer=False)
        elif status_filter in ["offline", "hors_ligne"]:
            qs = qs.filter(is_available=False, user__bloquer=False)
        elif status_filter in ["active", "actif"]:
            qs = qs.filter(user__is_active=True, user__bloquer=False)
        elif status_filter in ["blocked", "bloque", "bloqué"]:
            qs = qs.filter(user__bloquer=True)
        elif status_filter in ["inactive", "inactif"]:
            qs = qs.filter(user__is_active=False)

        # Filtrage par type de véhicule
        if type_vehicule:
            qs = qs.filter(vihucule__type_vehicule__iexact=type_vehicule)

        paginator = Paginator(qs, page_size)
        try:
            current_page = paginator.page(page)
        except (PageNotAnInteger, EmptyPage):
            current_page = paginator.page(1) if paginator.num_pages > 0 else []

        results = []
        for p in (current_page if hasattr(current_page, '__iter__') else []):
            u = p.user
            v = p.vihucule
            
            courses_count = Coursa.objects.filter(partener=p).count()
            completed_courses = Coursa.objects.filter(partener=p, etat="terminee").count()
            
            reviews_avg = Review.objects.filter(user=u).aggregate(Avg('stars'))['stars__avg']
            rating = round(float(reviews_avg), 1) if reviews_avg else 5.0

            results.append({
                "id": p.id,
                "user_id": u.id if u else None,
                "username": u.username if u else "",
                "first_name": u.first_name if u else "",
                "last_name": u.last_name if u else "",
                "full_name": f"{u.first_name or ''} {u.last_name or ''}".strip() or (u.username if u else "Chauffeur"),
                "phone_number_1": u.phone_number_1 if u else "",
                "email": u.email if u else "",
                "wilaya": u.wilaya if u else "",
                "wilaya_code": str(u.wilaya_code or "") if u else "",
                "image_url": str(u.image_url.url if hasattr(u.image_url, "url") else u.image_url) if (u and hasattr(u, "image_url") and u.image_url) else "",
                "is_active": bool(u.is_active) if u else False,
                "is_blocked": bool(u.bloquer) if u else False,
                "is_available": bool(p.is_available and not (u and u.bloquer)),
                "latitude": float(p.latitude) if p.latitude is not None else None,
                "longitude": float(p.longitude) if p.longitude is not None else None,
                "vehicule": {
                    "id": v.id if v else None,
                    "marque": v.marque if v else "",
                    "modele": v.modele if v else "",
                    "matricule": v.matricule if v else "",
                    "type_vehicule": v.type_vehicule if v else "Classique",
                    "num_assurance": v.num_assurance if v else "",
                    "num_scanner": v.num_scanner if v else "",
                    "date_expiration_assurance": str(v.Date_expiration_assurance) if v and v.Date_expiration_assurance else None,
                    "date_expiration_scanner": str(v.Date_expiration_scanner) if v and v.Date_expiration_scanner else None,
                } if v else None,
                "documents": {
                    "card_number": p.card_number or "",
                    "RC": p.RC or "",
                    "Nif": p.Nif or "",
                    "numero_act": p.numero_act or "",
                },
                "stats": {
                    "total_courses": courses_count,
                    "completed_courses": completed_courses,
                    "chiffre_affaires": p.chiffre_affaires or 0,
                    "tax_a_payer": p.tax_a_payer or 0,
                    "tax_global": p.tax_global or 0,
                    "rating": rating,
                }
            })

        return Response({
            "success": True,
            "data": {
                "results": results,
                "total": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": page,
                "stats_overview": {
                    "total": total_chauffeurs,
                    "online": online_count,
                    "active": active_count,
                    "blocked": blocked_count
                }
            }
        }, status=200)

    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def create_vtc_chauffeur(request):
    """
    Crée un nouveau compte chauffeur VTC avec son utilisateur, son véhicule et son profil partenaire.
    """
    try:
        data = request.data if isinstance(request.data, dict) else json.loads(request.body)
        
        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        phone_number_1 = data.get("phone_number_1", "").strip()
        
        if not username or len(username) < 3:
            return Response({"success": False, "message": "Le nom d'utilisateur est trop court (min 3 caractères)"}, status=400)
        
        if not password or len(password) < 6:
            return Response({"success": False, "message": "Le mot de passe doit contenir au moins 6 caractères"}, status=400)
            
        if CustomUser.objects.filter(username=username).exists():
            return Response({"success": False, "message": "Ce nom d'utilisateur existe déjà"}, status=400)

        with transaction.atomic():
            # 1. Créer CustomUser
            user = CustomUser.objects.create_user(
                username=username,
                password=password,
                email=data.get("email", ""),
                first_name=data.get("first_name", ""),
                last_name=data.get("last_name", ""),
                phone_number_1=phone_number_1,
                phone_number_2=data.get("phone_number_2", ""),
                wilaya=data.get("wilaya", "").lower(),
                wilaya_code=data.get("wilaya_code", ""),
                role="partener",
                is_active=True,
                bloquer=False
            )

            # 2. Créer Véhicule
            date_exp_assur = data.get("date_expiration_assurance") or None
            date_exp_scan = data.get("date_expiration_scanner") or None
            
            vehicule = Vihucule.objects.create(
                marque=data.get("marque", ""),
                modele=data.get("modele", ""),
                matricule=data.get("matricule", ""),
                type_vehicule=data.get("type_vehicule", "Classique"),
                num_assurance=data.get("num_assurance", ""),
                num_scanner=data.get("num_scanner", ""),
                Date_expiration_assurance=date_exp_assur,
                Date_expiration_scanner=date_exp_scan
            )

            # 3. Récupérer ou créer Type_compte_partener pour chauffeur
            type_account = Type_compte_partener.objects.filter(
                Q(name__icontains="chauf") | Q(name__icontains="chof") | Q(name__icontains="vtc")
            ).first()
            if not type_account:
                type_account = Type_compte_partener.objects.create(
                    name="chauffeur",
                    description="Compte chauffeur VTC",
                    tax_tawsile=15
                )

            # 4. Créer Partenneur
            partner = Partenneur.objects.create(
                user=user,
                vihucule=vehicule,
                type_compte=type_account,
                card_number=data.get("card_number", ""),
                RC=data.get("RC", ""),
                Nif=data.get("Nif", ""),
                numero_act=data.get("numero_act", ""),
                is_available=False,
                tax_a_payer=0,
                chiffre_affaires=0
            )

            return Response({
                "success": True,
                "message": f"Chauffeur VTC '{user.username}' créé avec succès !",
                "data": {
                    "id": partner.id,
                    "user_id": user.id,
                    "username": user.username
                }
            }, status=201)

    except Exception as e:
        return Response({"success": False, "message": f"Erreur serveur: {str(e)}"}, status=500)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def toggle_vtc_chauffeur_status(request):
    """
    Active/désactive ou bloque/débloque un chauffeur VTC.
    """
    try:
        data = request.data if isinstance(request.data, dict) else json.loads(request.body)
        chauffeur_id = data.get("id")
        action = data.get("action")  # "block", "unblock", "activate", "deactivate"

        partner = Partenneur.objects.select_related("user").get(pk=chauffeur_id)
        user = partner.user

        if action == "block":
            user.bloquer = True
            partner.is_available = False
            partner.save()
            msg = f"Chauffeur {user.username} bloqué avec succès."
        elif action == "unblock":
            user.bloquer = False
            msg = f"Chauffeur {user.username} débloqué avec succès."
        elif action == "activate":
            user.is_active = True
            msg = f"Compte de {user.username} activé avec succès."
        elif action == "deactivate":
            user.is_active = False
            partner.is_available = False
            partner.save()
            msg = f"Compte de {user.username} désactivé avec succès."
        else:
            return Response({"success": False, "message": "Action non reconnue"}, status=400)

        user.save()
        return Response({
            "success": True,
            "message": msg,
            "is_blocked": user.bloquer,
            "is_active": user.is_active,
            "is_available": partner.is_available
        }, status=200)

    except Partenneur.DoesNotExist:
        return Response({"success": False, "message": "Chauffeur introuvable"}, status=404)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)


@csrf_exempt
@api_view(["POST", "PUT", "PATCH"])
@permission_classes([AllowAny])
def update_vtc_chauffeur(request):
    """
    Met à jour les informations du profil et du véhicule d'un chauffeur VTC.
    Prend en charge le multipart (photo de profil) et la création de véhicule si inexistant.
    """
    try:
        data = request.data
        chauffeur_id = data.get("id") or data.get("chauffeur_id")

        if not chauffeur_id:
            return Response({"success": False, "message": "ID du chauffeur requis"}, status=400)

        partner = Partenneur.objects.select_related("user", "vihucule").get(pk=chauffeur_id)
        user = partner.user
        vehicule = partner.vihucule

        if "first_name" in data: user.first_name = data.get("first_name", "")
        if "last_name" in data: user.last_name = data.get("last_name", "")
        if "email" in data: user.email = data.get("email", "")
        if "phone_number_1" in data: user.phone_number_1 = data.get("phone_number_1", "")
        if "phone_number_2" in data: user.phone_number_2 = data.get("phone_number_2", "")
        if "wilaya" in data: user.wilaya = str(data.get("wilaya", "")).lower()
        if "wilaya_code" in data: user.wilaya_code = str(data.get("wilaya_code", ""))
        if "password" in data and data.get("password"):
            user.set_password(data.get("password"))
        if "image" in request.FILES:
            user.image_url = request.FILES["image"]
        user.save()

        # Véhicule : mise à jour ou création si non existant
        if not vehicule and any(k in data for k in ["marque", "modele", "matricule", "type_vehicule"]):
            date_exp_assur = data.get("date_expiration_assurance") or None
            date_exp_scan = data.get("date_expiration_scanner") or None
            vehicule = Vihucule.objects.create(
                marque=data.get("marque", ""),
                modele=data.get("modele", ""),
                matricule=data.get("matricule", ""),
                type_vehicule=data.get("type_vehicule", "Classique"),
                num_assurance=data.get("num_assurance", ""),
                num_scanner=data.get("num_scanner", ""),
                Date_expiration_assurance=date_exp_assur,
                Date_expiration_scanner=date_exp_scan
            )
            partner.vihucule = vehicule
        elif vehicule:
            if "marque" in data: vehicule.marque = data.get("marque", "")
            if "modele" in data: vehicule.modele = data.get("modele", "")
            if "matricule" in data: vehicule.matricule = data.get("matricule", "")
            if "type_vehicule" in data: vehicule.type_vehicule = data.get("type_vehicule", "Classique")
            if "num_assurance" in data: vehicule.num_assurance = data.get("num_assurance", "")
            if "num_scanner" in data: vehicule.num_scanner = data.get("num_scanner", "")
            if "date_expiration_assurance" in data:
                vehicule.Date_expiration_assurance = data.get("date_expiration_assurance") or None
            if "date_expiration_scanner" in data:
                vehicule.Date_expiration_scanner = data.get("date_expiration_scanner") or None
            vehicule.save()

        if "card_number" in data: partner.card_number = data.get("card_number", "")
        if "RC" in data: partner.RC = data.get("RC", "")
        if "Nif" in data: partner.Nif = data.get("Nif", "")
        if "numero_act" in data: partner.numero_act = data.get("numero_act", "")
        partner.save()

        new_image_url = ""
        if hasattr(user, "image_url") and user.image_url:
            try:
                new_image_url = user.image_url.url
            except Exception:
                new_image_url = str(user.image_url)

        return Response({
            "success": True,
            "message": "Informations du chauffeur mises à jour avec succès !",
            "image_url": new_image_url
        }, status=200)

    except Partenneur.DoesNotExist:
        return Response({"success": False, "message": "Chauffeur introuvable"}, status=404)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)


# -------------------------------------------------------------
# GESTION DES TRANSPORTEURS (PARTENAIRES DE TYPE 'TRANSPORT')
# -------------------------------------------------------------

DEFAULT_TRANSPORTEURS = [
    {
        "username": "mohamed_hilux",
        "first_name": "Mohamed",
        "last_name": "Amine",
        "phone_number_1": "0550 12 34 56",
        "wilaya": "alger",
        "wilaya_code": "16",
        "rating": 4.9,
        "vehicle_marque": "Toyota",
        "vehicle_modele": "Hilux Double Cabine",
        "vehicle_year": 2023,
        "matricule": "16-12345-00",
        "categories": "hilux,utilitaire",
        "category_label": "Hilux / Pick-up",
        "price_estimate": "Dès 800 DA",
        "eta_minutes": 4,
        "description": "Benne spacieuse • Tout-terrain • Transport matériel & charges",
        "badge": "Robuste 4x4",
        "badge_color": "#D97706",
        "reviews_count": 184,
    },
    {
        "username": "sofiane_camion",
        "first_name": "Sofiane",
        "last_name": "Belkacem",
        "phone_number_1": "0661 23 45 67",
        "wilaya": "alger",
        "wilaya_code": "16",
        "rating": 4.88,
        "vehicle_marque": "Camion Fourgon",
        "vehicle_modele": "Caisse 20m³",
        "vehicle_year": 2024,
        "matricule": "16-54321-00",
        "categories": "camion,utilitaire",
        "category_label": "Camion Fret & Transport",
        "price_estimate": "Dès 2 500 DA",
        "eta_minutes": 10,
        "description": "Fret lourd, palettes & déménagement volumineux toute distance",
        "badge": "Gros Fret",
        "badge_color": "#2563EB",
        "reviews_count": 142,
    },
    {
        "username": "yacine_dokker",
        "first_name": "Yacine",
        "last_name": "Kaddour",
        "phone_number_1": "0770 34 56 78",
        "wilaya": "blida",
        "wilaya_code": "09",
        "rating": 4.92,
        "vehicle_marque": "Dacia",
        "vehicle_modele": "Dokker Express",
        "vehicle_year": 2023,
        "matricule": "09-67890-00",
        "categories": "utilitaire,classique",
        "category_label": "Fourgonnette Express",
        "price_estimate": "Dès 450 DA",
        "eta_minutes": 5,
        "description": "Coffre 3m³ • Transport rapide en ville • Meubles & outillage",
        "badge": "Utilitaire Rapide",
        "badge_color": "#059669",
        "reviews_count": 320,
    },
    {
        "username": "karim_sedan",
        "first_name": "Karim",
        "last_name": "Mansouri",
        "phone_number_1": "0560 45 67 89",
        "wilaya": "oran",
        "wilaya_code": "31",
        "rating": 4.95,
        "vehicle_marque": "Mercedes-Benz",
        "vehicle_modele": "Classe C",
        "vehicle_year": 2023,
        "matricule": "31-98765-00",
        "categories": "confort",
        "category_label": "Confort VIP",
        "price_estimate": "Dès 650 DA",
        "eta_minutes": 3,
        "description": "Intérieur cuir • Climatisation bizone • Trajet VIP & déplacements pro",
        "badge": "VIP Confort",
        "badge_color": "#7C3AED",
        "reviews_count": 242,
    },
    {
        "username": "brahim_hilux",
        "first_name": "Brahim",
        "last_name": "Touati",
        "phone_number_1": "0555 56 78 90",
        "wilaya": "setif",
        "wilaya_code": "19",
        "rating": 4.88,
        "vehicle_marque": "Toyota",
        "vehicle_modele": "Hilux Simple Cabine",
        "vehicle_year": 2022,
        "matricule": "19-24680-00",
        "categories": "hilux,utilitaire",
        "category_label": "Hilux Benne Ouverte",
        "price_estimate": "Dès 750 DA",
        "eta_minutes": 6,
        "description": "Grande benne arrière ouverte • Idéal matériaux, caisses & chantiers",
        "badge": "Charge Utile",
        "badge_color": "#EA580C",
        "reviews_count": 95,
    },
    {
        "username": "abdelkader_master",
        "first_name": "Abdelkader",
        "last_name": "Mesbah",
        "phone_number_1": "0662 67 89 01",
        "wilaya": "constantine",
        "wilaya_code": "25",
        "rating": 4.92,
        "vehicle_marque": "Renault",
        "vehicle_modele": "Master Grand Volume",
        "vehicle_year": 2023,
        "matricule": "25-13579-00",
        "categories": "camion,utilitaire",
        "category_label": "Camion Inter-Wilayas",
        "price_estimate": "Dès 3 000 DA",
        "eta_minutes": 12,
        "description": "Transport longue distance & inter-wilayas • Sécurisation et arrimage",
        "badge": "Inter-Wilayas",
        "badge_color": "#1E40AF",
        "reviews_count": 88,
    },
]


def _ensure_type_transport():
    type_t = Type_compte_partener.objects.filter(name__iexact="Transport").first()
    if not type_t:
        type_t = Type_compte_partener.objects.create(
            name="Transport",
            description="Compte partenaire Transporteur (marchandises, hilux, camion, fret)"
        )
    return type_t


def _seed_transporteurs_if_empty():
    type_t = _ensure_type_transport()
    existing_count = Partenneur.objects.filter(type_compte=type_t).count()
    if existing_count > 0:
        return

    for item in DEFAULT_TRANSPORTEURS:
        uname = item["username"]
        if CustomUser.objects.filter(username=uname).exists():
            continue

        user = CustomUser.objects.create_user(
            username=uname,
            password="password123",
            first_name=item["first_name"],
            last_name=item["last_name"],
            phone_number_1=item["phone_number_1"],
            wilaya=item["wilaya"],
            wilaya_code=item["wilaya_code"],
            role="partener",
            rating=item["rating"],
            is_active=True,
            bloquer=False
        )

        vehicule = Vihucule.objects.create(
            marque=item["vehicle_marque"],
            modele=item["vehicle_modele"],
            matricule=item["matricule"],
            type_vehicule="Utilitaire"
        )

        partner = Partenneur.objects.create(
            user=user,
            vihucule=vehicule,
            type_compte=type_t,
            is_available=True,
            chiffre_affaires=0,
            tax_a_payer=0
        )

        TransporteurProfile.objects.create(
            partenaire=partner,
            categories=item["categories"],
            category_label=item["category_label"],
            price_estimate=item["price_estimate"],
            eta_minutes=item["eta_minutes"],
            description=item["description"],
            badge=item["badge"],
            badge_color=item["badge_color"],
            vehicle_year=item["vehicle_year"]
        )


@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def get_transporteurs(request):
    """
    Récupère la liste des transporteurs (partenaires type 'Transport')
    avec support des filtres : search, wilaya, category, status.
    Compatible Flutter (TransportItem) et Frontend Admin.
    """
    try:
        _seed_transporteurs_if_empty()
        type_t = _ensure_type_transport()

        search = request.GET.get("search", "").strip()
        wilaya = request.GET.get("wilaya", "").strip()
        category = request.GET.get("category", "").strip().lower()
        status_filter = request.GET.get("status", "").strip().lower()
        page = int(request.GET.get("page", 1))
        page_size = int(request.GET.get("page_size", 50))

        base_qs = Partenneur.objects.select_related(
            "user", "vihucule", "type_compte", "transport_profile"
        ).filter(type_compte=type_t)

        trash_count = base_qs.filter(transport_profile__is_deleted=True).count()
        total_count = base_qs.filter(Q(transport_profile__is_deleted=False) | Q(transport_profile__isnull=True)).count()
        online_count = base_qs.filter(Q(transport_profile__is_deleted=False) | Q(transport_profile__isnull=True), is_available=True, user__bloquer=False).count()
        active_count = base_qs.filter(Q(transport_profile__is_deleted=False) | Q(transport_profile__isnull=True), user__is_active=True, user__bloquer=False).count()
        blocked_count = base_qs.filter(Q(transport_profile__is_deleted=False) | Q(transport_profile__isnull=True), user__bloquer=True).count()

        is_trash = status_filter in ["trash", "corbeille"] or request.GET.get("is_deleted", "").lower() in ["true", "1"]

        if is_trash:
            qs = base_qs.filter(transport_profile__is_deleted=True).order_by("-transport_profile__deleted_at", "-id")
        else:
            qs = base_qs.filter(Q(transport_profile__is_deleted=False) | Q(transport_profile__isnull=True)).order_by("-id")

        if search:
            qs = qs.filter(
                Q(user__username__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__phone_number_1__icontains=search) |
                Q(user__lieux__icontains=search) |
                Q(vihucule__matricule__icontains=search) |
                Q(vihucule__marque__icontains=search) |
                Q(vihucule__modele__icontains=search) |
                Q(transport_profile__category_label__icontains=search) |
                Q(transport_profile__badge__icontains=search)
            )

        if wilaya:
            qs = qs.filter(
                Q(user__wilaya__iexact=wilaya) |
                Q(user__wilaya_code__iexact=wilaya) |
                Q(user__wilaya__icontains=wilaya)
            )

        if category and category != "all":
            qs = qs.filter(transport_profile__categories__icontains=category)

        if not is_trash:
            if status_filter in ["online", "en_ligne"]:
                qs = qs.filter(is_available=True, user__bloquer=False)
            elif status_filter in ["offline", "hors_ligne"]:
                qs = qs.filter(is_available=False, user__bloquer=False)
            elif status_filter in ["active", "actif"]:
                qs = qs.filter(user__is_active=True, user__bloquer=False)
            elif status_filter in ["blocked", "bloque", "bloqué"]:
                qs = qs.filter(user__bloquer=True)
            elif status_filter in ["inactive", "inactif", "desactive", "désactivé"]:
                qs = qs.filter(Q(user__is_active=False) | Q(user__bloquer=True))

        paginator = Paginator(qs, page_size)
        try:
            current_page = paginator.page(page)
        except (PageNotAnInteger, EmptyPage):
            current_page = paginator.page(1) if paginator.num_pages > 0 else []

        results = []
        for p in (current_page if hasattr(current_page, '__iter__') else []):
            u = p.user
            v = p.vihucule
            prof = getattr(p, "transport_profile", None)

            driver_photo_url = ""
            if u and hasattr(u, "image_url") and u.image_url:
                try:
                    driver_photo_url = request.build_absolute_uri(u.image_url.url)
                except Exception:
                    driver_photo_url = str(u.image_url)

            vehicle_img_url = ""
            if prof and hasattr(prof, "vehicle_image") and prof.vehicle_image:
                try:
                    vehicle_img_url = request.build_absolute_uri(prof.vehicle_image.url)
                except Exception:
                    vehicle_img_url = str(prof.vehicle_image)

            raw_cats = prof.categories if prof else "utilitaire"
            categories_list = [c.strip().lower() for c in raw_cats.split(",") if c.strip()]
            if not categories_list:
                categories_list = ["utilitaire"]

            veh_name = ""
            if v:
                veh_name = f"{v.marque or ''} {v.modele or ''}".strip()
            if not veh_name:
                veh_name = "Véhicule Transport"

            rating = round(float(u.rating or 5.0), 1) if u else 5.0
            rev_count = 120 # Default count if no separate table
            if u:
                rev_count_db = Review.objects.filter(user=u).count()
                if rev_count_db > 0:
                    rev_count = rev_count_db

            results.append({
                "id": p.id,
                "user_id": u.id if u else None,
                "username": u.username if u else "",
                "first_name": u.first_name if u else "",
                "last_name": u.last_name if u else "",
                "driver_name": f"{u.first_name or ''} {u.last_name or ''}".strip() or (u.username if u else "Transporteur"),
                "phone_number_1": u.phone_number_1 if u else "",
                "phone_number_2": u.phone_number_2 if u else "",
                "email": u.email if u else "",
                "wilaya": u.wilaya if u else "",
                "wilaya_code": str(u.wilaya_code or "") if u else "",
                "commune": u.lieux if (u and u.lieux) else "",
                "driver_photo": driver_photo_url,
                "driver_rating": rating,
                "reviews_count": rev_count,
                "is_active": bool(u.is_active and not u.bloquer) if u else False,
                "is_blocked": bool(u.bloquer) if u else False,
                "is_available": bool(not (u and u.bloquer)) if u else False,
                "is_deleted": bool(prof and prof.is_deleted),
                "deleted_at": prof.deleted_at.isoformat() if (prof and prof.deleted_at) else None,
                "latitude": float(p.latitude) if p.latitude is not None else None,
                "longitude": float(p.longitude) if p.longitude is not None else None,
                # Vehicle data
                "vehicle": {
                    "id": v.id if v else None,
                    "marque": v.marque if v else "",
                    "modele": v.modele if v else "",
                    "matricule": v.matricule if v else "",
                    "type_vehicule": v.type_vehicule if v else "Utilitaire",
                    "num_assurance": v.num_assurance if v else "",
                    "num_scanner": v.num_scanner if v else "",
                } if v else None,
                "vehicle_name": veh_name,
                "vehicle_year": prof.vehicle_year if prof else 2023,
                "vehicle_image": vehicle_img_url,
                # Transport specific profile data
                "categories": categories_list,
                "categories_raw": raw_cats,
                "category_label": prof.category_label if prof else "Utilitaire",
                "price_estimate": prof.price_estimate if prof else "Dès 800 DA",
                "eta_minutes": prof.eta_minutes if prof else 5,
                "description": prof.description if prof else "Service de transport et de livraison rapide",
                "badge": prof.badge if prof else "Transport",
                "badge_color": prof.badge_color if prof else "#D97706",
                "card_number": p.card_number or "",
                "RC": p.RC or "",
                "Nif": p.Nif or "",
                "numero_act": p.numero_act or "",
            })

        return Response({
            "success": True,
            "data": {
                "results": results,
                "total": paginator.count,
                "total_pages": paginator.num_pages,
                "current_page": page,
                "stats_overview": {
                    "total": total_count,
                    "online": online_count,
                    "active": active_count,
                    "blocked": blocked_count,
                    "trash": trash_count,
                    "corbeille": trash_count
                }
            }
        }, status=200)

    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def create_transporteur(request):
    """
    Crée un nouveau transporteur (compte Partenneur type 'Transport')
    avec son utilisateur, son véhicule et son profil étendu.
    """
    try:
        data = request.data if isinstance(request.data, dict) else json.loads(request.body)

        username = data.get("username", "").strip()
        password = data.get("password", "").strip()
        phone_number_1 = data.get("phone_number_1", "").strip()

        if not username or len(username) < 3:
            return Response({"success": False, "message": "Nom d'utilisateur requis (min 3 caractères)"}, status=400)

        if not password or len(password) < 4:
            password = "transport123"

        if CustomUser.objects.filter(username=username).exists():
            return Response({"success": False, "message": f"Le nom d'utilisateur '{username}' existe déjà"}, status=400)

        type_t = _ensure_type_transport()

        with transaction.atomic():
            # 1. CustomUser
            user = CustomUser.objects.create_user(
                username=username,
                password=password,
                email=data.get("email", ""),
                first_name=data.get("first_name", ""),
                last_name=data.get("last_name", ""),
                phone_number_1=phone_number_1,
                phone_number_2=data.get("phone_number_2", ""),
                wilaya=str(data.get("wilaya", "")).lower(),
                wilaya_code=str(data.get("wilaya_code", "")),
                lieux=str(data.get("commune", "") or data.get("lieux", "")),
                role="partener",
                is_active=True,
                bloquer=False
            )
            if "driver_photo" in request.FILES:
                user.image_url = request.FILES["driver_photo"]
                user.save()
            elif "image" in request.FILES:
                user.image_url = request.FILES["image"]
                user.save()

            # 2. Vihucule
            vehicule = Vihucule.objects.create(
                marque=data.get("marque", ""),
                modele=data.get("modele", ""),
                matricule=data.get("matricule", ""),
                type_vehicule=data.get("type_vehicule", "Utilitaire"),
                num_assurance=data.get("num_assurance", ""),
                num_scanner=data.get("num_scanner", ""),
            )

            # 3. Partenneur (type_compte = Transport)
            partner = Partenneur.objects.create(
                user=user,
                vihucule=vehicule,
                type_compte=type_t,
                is_available=True,
                card_number=data.get("card_number", ""),
                RC=data.get("RC", ""),
                Nif=data.get("Nif", ""),
                numero_act=data.get("numero_act", ""),
            )

            # 4. TransporteurProfile
            raw_cats = data.get("categories", "hilux,utilitaire")
            if isinstance(raw_cats, list):
                raw_cats = ",".join(raw_cats)

            profile = TransporteurProfile.objects.create(
                partenaire=partner,
                categories=raw_cats,
                category_label=data.get("category_label", "Hilux / Pick-up"),
                price_estimate=data.get("price_estimate", "Dès 800 DA"),
                eta_minutes=int(data.get("eta_minutes", 5) or 5),
                description=data.get("description", "Service de transport disponible"),
                badge=data.get("badge", "Robuste 4x4"),
                badge_color=data.get("badge_color", "#D97706"),
                vehicle_year=int(data.get("vehicle_year", 2023) or 2023),
            )
            if "vehicle_image" in request.FILES:
                profile.vehicle_image = request.FILES["vehicle_image"]
                profile.save()

        return Response({
            "success": True,
            "message": "Transporteur créé avec succès !",
            "data": {"id": partner.id, "username": user.username}
        }, status=201)

    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def update_transporteur(request, id=None):
    """
    Met à jour les informations d'un transporteur (user, véhicule, profil).
    """
    try:
        transporteur_id = id or request.data.get("id")
        if not transporteur_id:
            return Response({"success": False, "message": "ID transporteur requis"}, status=400)

        data = request.data if isinstance(request.data, dict) else json.loads(request.body)
        partner = Partenneur.objects.select_related("user", "vihucule", "transport_profile").get(pk=transporteur_id)
        user = partner.user
        vehicule = partner.vihucule
        profile = getattr(partner, "transport_profile", None)

        if not profile:
            profile = TransporteurProfile.objects.create(partenaire=partner)

        # Update User
        if "first_name" in data: user.first_name = data.get("first_name", "")
        if "last_name" in data: user.last_name = data.get("last_name", "")
        if "email" in data: user.email = data.get("email", "")
        if "phone_number_1" in data: user.phone_number_1 = data.get("phone_number_1", "")
        if "phone_number_2" in data: user.phone_number_2 = data.get("phone_number_2", "")
        if "wilaya" in data: user.wilaya = str(data.get("wilaya", "")).lower()
        if "wilaya_code" in data: user.wilaya_code = str(data.get("wilaya_code", ""))
        if "commune" in data or "lieux" in data:
            user.lieux = str(data.get("commune") or data.get("lieux", ""))
        if "password" in data and data.get("password"):
            user.set_password(data.get("password"))
        if "driver_photo" in request.FILES:
            user.image_url = request.FILES["driver_photo"]
        elif "image" in request.FILES:
            user.image_url = request.FILES["image"]
        user.save()

        # Update Vehicule
        if vehicule:
            if "marque" in data: vehicule.marque = data.get("marque", "")
            if "modele" in data: vehicule.modele = data.get("modele", "")
            if "matricule" in data: vehicule.matricule = data.get("matricule", "")
            if "type_vehicule" in data: vehicule.type_vehicule = data.get("type_vehicule", "Utilitaire")
            if "num_assurance" in data: vehicule.num_assurance = data.get("num_assurance", "")
            if "num_scanner" in data: vehicule.num_scanner = data.get("num_scanner", "")
            vehicule.save()

        # Update Transport Profile
        if "categories" in data:
            raw_cats = data.get("categories")
            if isinstance(raw_cats, list):
                raw_cats = ",".join(raw_cats)
            profile.categories = raw_cats
        if "category_label" in data: profile.category_label = data.get("category_label", "")
        if "price_estimate" in data: profile.price_estimate = data.get("price_estimate", "")
        if "eta_minutes" in data and data.get("eta_minutes"): profile.eta_minutes = int(data.get("eta_minutes"))
        if "description" in data: profile.description = data.get("description", "")
        if "badge" in data: profile.badge = data.get("badge", "")
        if "badge_color" in data: profile.badge_color = data.get("badge_color", "")
        if "vehicle_year" in data and data.get("vehicle_year"): profile.vehicle_year = int(data.get("vehicle_year"))
        if "vehicle_image" in request.FILES:
            profile.vehicle_image = request.FILES["vehicle_image"]
        profile.save()

        # Update Partner
        if "card_number" in data: partner.card_number = data.get("card_number", "")
        if "RC" in data: partner.RC = data.get("RC", "")
        if "Nif" in data: partner.Nif = data.get("Nif", "")
        if "numero_act" in data: partner.numero_act = data.get("numero_act", "")
        partner.save()

        return Response({
            "success": True,
            "message": "Informations du transporteur mises à jour avec succès !"
        }, status=200)

    except Partenneur.DoesNotExist:
        return Response({"success": False, "message": "Transporteur introuvable"}, status=404)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)


@csrf_exempt
@api_view(["DELETE", "POST"])
@permission_classes([AllowAny])
def delete_transporteur(request, id=None):
    """
    Déplace un transporteur dans la corbeille (Soft delete).
    """
    try:
        transporteur_id = id or request.data.get("id") or request.GET.get("id")
        if not transporteur_id:
            return Response({"success": False, "message": "ID transporteur requis"}, status=400)

        partner = Partenneur.objects.select_related("user", "transport_profile").get(pk=transporteur_id)
        profile = getattr(partner, "transport_profile", None)
        if not profile:
            profile = TransporteurProfile.objects.create(partenaire=partner)

        profile.is_deleted = True
        profile.deleted_at = timezone.now()
        profile.save()

        partner.is_available = False
        partner.save()
        if partner.user:
            partner.user.is_active = False
            partner.user.save()

        return Response({
            "success": True,
            "message": "Transporteur déplacé dans la corbeille avec succès"
        }, status=200)
    except Partenneur.DoesNotExist:
        return Response({"success": False, "message": "Transporteur introuvable"}, status=404)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def restore_transporteur(request, id=None):
    """
    Restaure un transporteur depuis la corbeille.
    """
    try:
        transporteur_id = id or request.data.get("id") or request.GET.get("id")
        if not transporteur_id:
            return Response({"success": False, "message": "ID transporteur requis"}, status=400)

        partner = Partenneur.objects.select_related("user", "transport_profile").get(pk=transporteur_id)
        profile = getattr(partner, "transport_profile", None)
        if profile:
            profile.is_deleted = False
            profile.deleted_at = None
            profile.save()

        partner.is_available = True
        partner.save()
        if partner.user:
            partner.user.is_active = True
            partner.user.bloquer = False
            partner.user.save()

        return Response({
            "success": True,
            "message": "Transporteur restauré depuis la corbeille"
        }, status=200)
    except Partenneur.DoesNotExist:
        return Response({"success": False, "message": "Transporteur introuvable"}, status=404)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)


@csrf_exempt
@api_view(["DELETE", "POST"])
@permission_classes([AllowAny])
def hard_delete_transporteur(request, id=None):
    """
    Supprime définitivement un transporteur de la base de données.
    """
    try:
        transporteur_id = id or request.data.get("id") or request.GET.get("id")
        if not transporteur_id:
            return Response({"success": False, "message": "ID transporteur requis"}, status=400)

        partner = Partenneur.objects.select_related("user", "vihucule", "transport_profile").get(pk=transporteur_id)
        user = partner.user
        vehicule = partner.vihucule

        partner.delete()
        if vehicule:
            vehicule.delete()
        if user:
            user.delete()

        return Response({
            "success": True,
            "message": "Transporteur supprimé définitivement"
        }, status=200)
    except Partenneur.DoesNotExist:
        return Response({"success": False, "message": "Transporteur introuvable"}, status=404)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)


@csrf_exempt
@api_view(["POST", "DELETE"])
@permission_classes([AllowAny])
def empty_trash_transporteurs(request):
    """
    Vide complètement la corbeille des transporteurs.
    """
    try:
        type_t = _ensure_type_transport()
        trashed_partners = list(Partenneur.objects.filter(type_compte=type_t, transport_profile__is_deleted=True))
        count = len(trashed_partners)
        for p in trashed_partners:
            u = p.user
            v = p.vihucule
            p.delete()
            if v:
                v.delete()
            if u:
                u.delete()

        return Response({
            "success": True,
            "message": f"Corbeille vidée : {count} transporteur(s) supprimé(s) définitivement"
        }, status=200)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def toggle_transporteur_status(request):
    """
    Bascule la disponibilité ou l'état actif/bloqué d'un transporteur.
    """
    try:
        data = request.data if isinstance(request.data, dict) else json.loads(request.body)
        transporteur_id = data.get("id")
        action = data.get("action")

        if not transporteur_id or not action:
            return Response({"success": False, "message": "Paramètres id et action requis"}, status=400)

        partner = Partenneur.objects.select_related("user").get(pk=transporteur_id)
        user = partner.user

        if action == "available":
            partner.is_available = True
            partner.save()
        elif action == "unavailable":
            partner.is_available = False
            partner.save()
        elif action == "block":
            if user:
                user.bloquer = True
                user.save()
            partner.is_available = False
            partner.save()
        elif action == "unblock":
            if user:
                user.bloquer = False
                user.save()
            partner.is_available = True
            partner.save()
        elif action == "activate":
            if user:
                user.is_active = True
                user.save()
        elif action == "deactivate":
            if user:
                user.is_active = False
                user.save()
            partner.is_available = False
            partner.save()

        return Response({
            "success": True,
            "message": "Statut mis à jour avec succès",
            "is_available": partner.is_available,
            "is_blocked": user.bloquer if user else False,
            "is_active": user.is_active if user else False
        }, status=200)

    except Partenneur.DoesNotExist:
        return Response({"success": False, "message": "Transporteur introuvable"}, status=404)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)


def _ensure_default_transport_categories():
    defaults = [
        {"slug": "hilux", "name": "Hilux / Pick-up", "icon": "🛻", "color": "#D97706"},
        {"slug": "camion", "name": "Camion & Fret", "icon": "🚛", "color": "#2563EB"},
        {"slug": "utilitaire", "name": "Utilitaire & Dokker", "icon": "📦", "color": "#059669"},
        {"slug": "confort", "name": "Confort VIP", "icon": "👑", "color": "#7C3AED"},
        {"slug": "classique", "name": "Classique Éco", "icon": "🚗", "color": "#0D9488"},
    ]
    for d in defaults:
        TransportCategory.objects.get_or_create(
            slug=d["slug"],
            defaults={"name": d["name"], "icon": d["icon"], "color": d["color"], "is_active": True}
        )


@csrf_exempt
@api_view(["GET"])
@permission_classes([AllowAny])
def get_transport_categories(request):
    """
    Retourne toutes les catégories de transport (actives).
    """
    try:
        _ensure_default_transport_categories()
        categories = TransportCategory.objects.filter(is_active=True).order_by("id")
        results = [
            {
                "id": c.id,
                "slug": c.slug,
                "name": c.name,
                "icon": c.icon or "🛻",
                "color": c.color or "#D97706",
                "is_active": c.is_active,
            }
            for c in categories
        ]
        return Response({"success": True, "data": results}, status=200)
    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def create_transport_category(request):
    """
    Crée une nouvelle catégorie de transport personnalisée.
    """
    import re, time
    try:
        data = request.data if isinstance(request.data, dict) else json.loads(request.body)
        name = data.get("name", "").strip()
        if not name:
            return Response({"success": False, "message": "Le nom de la catégorie est requis"}, status=400)

        slug = data.get("slug", "").strip().lower()
        if not slug:
            slug = re.sub(r'[^a-z0-9]+', '_', name.lower().strip()).strip('_')
        if not slug:
            slug = f"cat_{int(time.time())}"

        icon = data.get("icon", "🛻").strip() or "🛻"
        color = data.get("color", "#D97706").strip() or "#D97706"

        cat, created = TransportCategory.objects.get_or_create(
            slug=slug,
            defaults={"name": name, "icon": icon, "color": color, "is_active": True}
        )
        if not created:
            cat.name = name
            cat.icon = icon
            cat.color = color
            cat.is_active = True
            cat.save()

        return Response({
            "success": True,
            "message": "Catégorie de transport enregistrée avec succès !",
            "data": {
                "id": cat.id,
                "slug": cat.slug,
                "name": cat.name,
                "icon": cat.icon,
                "color": cat.color,
                "is_active": cat.is_active
            }
        }, status=201 if created else 200)

    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)


@csrf_exempt
@api_view(["DELETE"])
@permission_classes([AllowAny])
def delete_transport_category(request, id=None):
    """
    Supprime une catégorie de transport (ou la désactive).
    """
    try:
        category_id = id or request.GET.get("id")
        if not category_id:
            return Response({"success": False, "message": "ID catégorie requis"}, status=400)

        cat = TransportCategory.objects.get(pk=category_id)
        cat.is_active = False
        cat.save()
        return Response({"success": True, "message": "Catégorie supprimée avec succès"}, status=200)
    except TransportCategory.DoesNotExist:
        return Response({"success": False, "message": "Catégorie introuvable"}, status=404)
    except Exception as e:
        return Response({"success": False, "message": str(e)}, status=500)


