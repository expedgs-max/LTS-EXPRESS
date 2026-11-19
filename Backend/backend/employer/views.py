from decimal import Decimal
from django.core.mail import EmailMessage
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
import os


from django.core.validators import validate_email

from django.http import FileResponse, Http404
from channels.layers import get_channel_layer
from rest_framework.parsers import MultiPartParser




import smtplib
from django.utils.http import urlsafe_base64_encode
from rest_framework_simplejwt.views import TokenRefreshView


from rest_framework.parsers import JSONParser


from rest_framework.decorators import api_view, parser_classes


from datetime import timedelta
from django.contrib.auth import authenticate
from datetime import date, datetime
from tokenize import TokenError
from django.contrib.auth import authenticate, logout
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.files.storage import FileSystemStorage
from rest_framework.throttling import UserRateThrottle
import json
from smtplib import SMTP_SSL
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.timezone import now
import socket
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework.exceptions import ValidationError
import http.client
from rest_framework.request import Request
from rest_framework.response import Response
from .permission import *
from datetime import date
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Avg, Sum, Q
from rest_framework import status
from django.utils.dateparse import parse_datetime
from datetime import datetime
from .serializer import *
from rest_framework.pagination import PageNumberPagination
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.views.decorators.http import require_http_methods
from .models import *
from django.contrib.auth.hashers import make_password
from django.core.paginator import Paginator
from django.db import transaction
from rest_framework.authentication import TokenAuthentication
import logging
from food.permission import *
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from django.db.models import Q
from django.db import DatabaseError
from food.models import *
import jwt
from food.serializers import *
from django.conf import settings
SECRET_KEY = settings.SECRET_KEY

# Secret key for decoding (use the one configured in your settings)


# CSRF exemption not needed when using JWT for stateless authentication


COOKIE_SECURE = not settings.DEBUG


class CustomPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


@csrf_exempt
def login_view(request):
    if request.method == "OPTIONS":
        return JsonResponse({'message': 'CORS preflight OK'}, status=200)

    if request.method == "POST":
        try:
            # Parse the JSON data from the request body
            data = json.loads(request.body)
            # Username, email, or phone number
            identifier = data.get('username',"").strip()
            password = data.get('password',"").strip()
            print (f"usernename is : {identifier} and password is {password}")
            
            if not identifier or not password:
                return JsonResponse(
                    {'message': 'Username and password are required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Try to find the user by email, phone, or username
            # user = CustomUser.objects.filter(
            #     Q(email=identifier) |
            #     Q(phone_number_1=identifier) |
            #     Q(username=identifier)
            # ).only(
            #     'id', 'password', 'bloquer',
            #     'first_name', 'last_name', 'email', 'role'
            # ).first()

            # Normalize identifier if phone number
            clean_id = identifier.replace(' ', '').replace('-', '')
            if clean_id.startswith('0') and len(clean_id) == 10:
                clean_phone = '+213' + clean_id[1:]
            elif clean_id.startswith('213') and len(clean_id) == 12:
                clean_phone = '+' + clean_id
            else:
                clean_phone = clean_id

            # Try to find user by username, email, or phone
            user_match = CustomUser.objects.filter(
                Q(username__iexact=identifier) |
                Q(email__iexact=identifier) |
                Q(phone_number_1=clean_phone) |
                Q(phone_number_1=identifier)
            ).first()

            if user_match:
                if not user_match.is_active:
                    return JsonResponse(
                        {'message': "Votre compte est inactif et en cours d'examen. Un administrateur va vous contacter pour continuer les procédures d'activation de votre compte."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                if user_match.bloquer:
                    return JsonResponse({
                        'message': 'le compte est suspendu '
                    }, status=status.HTTP_401_UNAUTHORIZED)
                user = authenticate(username=user_match.username, password=password)
            else:
                user = authenticate(username=identifier, password=password)

            if user is None:
                return JsonResponse(
                    {'message': "Nom d'utilisateur ou mot de passe incorrect"},
                    status=status.HTTP_406_NOT_ACCEPTABLE
                )
            
            # Now authenticate the user using the username and password
            if user:  # Check the user's password
                # Create JWT tokens
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token

                # Add custom claims to the tokens
                access_token['role'] = user.role
                access_token['type'] = 'access'
                refresh['type'] = 'refresh'

                
                response_data = {
                    'message': 'Login successful' ,
                    'role': user.role,
                    "active": user.is_active,
                    'id': user.id,
                    'name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'access_token': str(access_token) ,
                    'refresh_token': str(refresh) ,
                }

                # Create JsonResponse
                response = JsonResponse(
                    response_data, status=status.HTTP_200_OK)

                # Set secure cookies with HttpOnly
                # Set access_token cookie
            
                response.set_cookie(
                    key='access_token',
                    value=str(access_token),
                    max_age=3600,
                    httponly=True,
                    samesite='Strict',  # Allow cross-origin cookies
                    secure=False,  # Set to False for HTTP in development
                    domain=None  # Do not restrict domain for local IP
                )
                # Optionally, you can add a custom header or log here if needed

                response.set_cookie(
                    key='refresh_token',
                    value=str(refresh),
                    max_age=7*24*60*60,
                    httponly=True,
                    samesite='Strict',
                    secure=False,
                    domain=None
                )
                

                return response

            # If password is incorrect
            # return JsonResponse(
            #     {'message': 'email ou mot passe incorrect'},
            #     status=status.HTTP_406_NOT_ACCEPTABLE
            # )

        except json.JSONDecodeError:
            return JsonResponse({'message': 'Invalid JSON format'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error: {e}")  # Debugging log
            return JsonResponse({'message': "probleme de connexion"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return JsonResponse({'message': "Method not allowed"}, status=405)

#____________________________auth___________________________par nummmmmmmmmmmm 
@csrf_exempt
def send_message_iconttest (request,phone,otp):
    if request.method =="POST" :
        data=json.loads(request.body)
        
        message=data.get("message")
        
        message = f"votre code de connexion est : {otp}"
        if phone is None :
            return JsonResponse({"message":"phone number is required "},status=400)
        # Example: consume an external API (replace with your actual API endpoint and payload)
        external_api_url = f"https://smsapi.icosnet.com:8443/bulksms/bulksms?username=TAWSILSTAR&password=SMS4781&type=0&dlr=0&destination={phone}&source=ICOTEST&message={message}"
        # Example test URL for Postman (works in Postman, not needed in code):
        # https://smsapi.icosnet.com:8443/bulksms/bulksms?username=TAWSILSTAR&password=SMS4781&type=0&dlr=0&destination=+213672463632&source=ICOTEST&message=TEST
        
        try:
            response = requests.get(external_api_url, timeout=10)
            print(f"response status: {response.status_code}, body: {response.text}")

            if response.status_code == 200 and '1701' in response.text:
                return 1 
            else:
                return 0
        except requests.RequestException as e:
                return 0
    else:
            return 0

# #_________________________________refresh_token______________________________________________________________________

# class CustomTokenRefreshView(TokenRefreshView):
#     def post(self, request, *args, **kwargs):
#         print(request.data)
#         refresh_token = request.data.get('refresh', None)
#         print(refresh_token)
#         if not refresh_token:
#             return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

#         try:
#             # Call the parent class's post method to handle token refresh
#             response = super().post(request, *args, **kwargs)
#             return response
#         except (jwt.InvalidTokenError, TokenError) as e:
#             return Response({"detail": "probleme de connexion"}, status=status.HTTP_401_UNAUTHORIZED)


# _________________________________logout_api______________________________________________________________________
@csrf_exempt  # Disable CSRF protection for this view
def logout_view(request):
    if request.method == "POST":
        # Try to extract the refresh token from cookies
        # refresh_token = request.COOKIES.get('refresh_token')
        data = json.loads(request.body)
        refresh_token = data.get('refresh_token')
        print(f'refresh token :{refresh_token}')
        if refresh_token is None:
            return JsonResponse({'detail': 'No refresh token provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Blacklist the refresh token to prevent it from being used again
            refresh = RefreshToken(refresh_token)
            refresh.blacklist()

            # Delete cookies for both access and refresh tokens
            response = JsonResponse(
                {'detail': 'Successfully logged out'}, status=200)
            response.delete_cookie('access_token')
            response.delete_cookie('refresh_token')

            return response

        except Exception as e:
            return JsonResponse({'detail': f'Error: {"probleme de connexion"}'}, status=500)

    return JsonResponse({'detail': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
# ________________________api_all_users avecpermission consotme _____________________________________________________________________


EMPLOYEE_ROLES = [
    'agent_administratif',
    'centre_appel',
    'gestion_commercial',
    'superviseur',
    'validation_vtc',
    'comptable',
    'confirmation',
]

@api_view(["GET"])
@permission_classes([Iscommerciale | IsOwnerOrAdmin | Ischefbureux | IsEmployeeManager])
def listeuser(request):
    if request.method == "GET":
        try:
            role = request.GET.get('role', None)
            wilaya = request.GET.get("wilaya", None)
            groupe = request.GET.get("groupe", None)
            num = request.GET.get('search', None)
            bloquer = request.GET.get('bloquer', None)

            # Determine the queryset based strictly on employee roles (excluding partners)
            if role == "all" or role == "employees" or not role:
                base_query = CustomUser.objects.filter(role__in=EMPLOYEE_ROLES).exclude(role="partener")
            elif role:
                base_query = CustomUser.objects.filter(role=role).exclude(role="partener")
            else:
                base_query = CustomUser.objects.filter(role__in=EMPLOYEE_ROLES).exclude(role="partener")

            queryset = base_query

            if wilaya:
                try:
                    queryset = queryset.filter(Q(wilaya_code=int(wilaya)) | Q(wilaya__icontains=wilaya))
                except ValueError:
                    queryset = queryset.filter(wilaya__icontains=wilaya)

            if groupe:
                queryset = queryset.filter(groupe__icontains=groupe)

            if num:
                queryset = queryset.filter(
                    Q(phone_number_1__icontains=num) |
                    Q(phone_number_2__icontains=num) |
                    Q(username__icontains=num) |
                    Q(first_name__icontains=num) |
                    Q(last_name__icontains=num) |
                    Q(email__icontains=num)
                )

            if bloquer is not None and bloquer != "":
                if str(bloquer).lower() in ["true", "1", "bloque"]:
                    queryset = queryset.filter(bloquer=True)
                elif str(bloquer).lower() in ["false", "0", "actif"]:
                    queryset = queryset.filter(bloquer=False)

            # Sort by newest
            queryset = queryset.order_by('-id')

            # Calculate stats overview strictly for employee roles
            stats_source = CustomUser.objects.filter(role__in=EMPLOYEE_ROLES).exclude(role="partener")
            total_count = stats_source.count()
            active_count = stats_source.filter(bloquer=False).count()
            blocked_count = stats_source.filter(bloquer=True).count()
            avg_rendement = stats_source.aggregate(avg=Avg('rendement'))['avg'] or 0

            role_counts = {r: stats_source.filter(role=r).count() for r in EMPLOYEE_ROLES}

            stats_overview = {
                "total": total_count,
                "active": active_count,
                "blocked": blocked_count,
                "avg_rendement": round(avg_rendement, 1),
                "role_counts": role_counts,
            }

            # Paginate the queryset
            page_size = request.GET.get('page_size', 20)
            try:
                page_size = int(page_size)
            except ValueError:
                page_size = 20

            paginator = PageNumberPagination()
            paginator.page_size = page_size
            result_page = paginator.paginate_queryset(queryset, request)

            # Serialize the paginated data
            serializer = CustomUserSerializer(result_page, many=True)

            response_data = {
                "count": paginator.page.paginator.count,
                "total_pages": paginator.page.paginator.num_pages,
                "next": paginator.get_next_link(),
                "previous": paginator.get_previous_link(),
                "results": serializer.data,
                "stats_overview": stats_overview,
            }
            return Response(response_data)
        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON format"}, status=400)
        except Exception as e:
            return Response({"error": "probleme de connexion"}, status=500)

    return Response({"error": "Method not allowed"}, status=405)
# ______________________________liste de tout agenegt admin permission de admin (directeur)__________________


@api_view(['GET'])
@permission_classes([IsOwnerOrAdmin, IsAuthenticated])
def liste_employer(request):
    if request.method == "GET":
        queryset = CustomUser.objects.filter(role="agent_administratif")
        paginator = PageNumberPagination()
        paginator.page_size = 50  # You can adjust this as needed
        result_page = paginator.paginate_queryset(queryset, request)

        serializer = CustomUserSerializer(result_page, many=True)

        return paginator.get_paginated_response(serializer.data)
# _____________________________________liste_des_chef_ permision amdin_______________________________________________________


@api_view(["GET"])
@permission_classes([IsOwnerOrAdmin | IsAuthenticated])
def liste_chef_bereux(request):
    if request.method == "GET":
        queryset = CustomUser.objects.filter(role="chef_bureau")
        serializer = CustomUserSerializer(queryset, many=True)
        return JsonResponse(serializer.data, safe=False, status=200)


@csrf_exempt
@api_view(["POST"])
@permission_classes([Ischefbureux | IsOwnerOrAdmin | IsEmployeeManager])
def add_employer(request):

    if request.method == "POST":
        try:
            data = json.loads(request.body)
            first_name = data.get("first_name") or data.get("nom") or ""
            last_name = data.get("last_name") or data.get("prenom") or ""
            raw_password = data.get("password") or "12345678"

            user = CustomUser.objects.create(
                username=data['username'],
                first_name=first_name,
                last_name=last_name,
                role=data.get('role', 'agent_administratif'),
                date_de_naissance=data.get('date_de_naissance') or None,
                email=data.get('email') or None,
                lieux=data.get('lieux') or "",
                groupe=data.get("groupe") or "",
                sexe=data.get('sexe') or data.get('sex') or "homme",
                phone_number_1=data.get('phone_number_1', ''),
                phone_number_2=data.get('phone_number_2') or None,
                wilaya=data.get('wilaya') or "",
                wilaya_code=data.get('wilaya_code') or None,
                permission_vlider=bool(data.get('permission_vlider', False)),
                rendement=float(data.get('rendement', 0)),
                password=make_password(raw_password),
                is_staff=False
            )
            return JsonResponse({"message": "User created successfully", "id": user.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return JsonResponse({'message': f"Erreur lors de la création: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    # Handle GET request (optional, e.g., to return a form or general info)
    elif request.method == "GET":
        return JsonResponse({"message": "GET request is not supported for creating users."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    # Handle other HTTP methods if needed (e.g., PUT, DELETE)
# api _create chef service

@api_view(["POST"])
def add_chef_bureux(request):
    print('enter le api appel ')
    if request.method == "POST":
        try:
            print("enter le api cree ")
            data = json.loads(request.body)
            print(data)
            user = CustomUser.objects.create(
                username=data['username'],
                first_name=data.get("nom"),
                last_name=data.get("prenom"),
                role='chef_bureau',
                date_de_naissance=data.get('date_de_naissance'),
                email=data.get('email'),
                lieux=data.get('lieux'),
                card_number=data.get('card_number'),
                sex=data.get('sex'),
                phone_number_1=data.get('phone_number_1'),
                phone_number_2=data.get('phone_number_2'),
                wilaya=data.get('wilaya'),
                job=data.get('job'),
                password=data.get("password"),
                is_staff=False
            )

            return JsonResponse({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return JsonResponse({'message': "probleme de connexion"}, status=status.HTTP_400_BAD_REQUEST)
# api see profil user


@csrf_exempt
@api_view(["GET"])
@permission_classes([IsAuthenticated])  
def profil(request):
    if request.method == "GET":
        try:
            

            # Access the user based on the authenticated request
            queryset = CustomUser.objects.get(id=request.user.pk)
            

            # Serialize the user data
            serializer = CustomUserSerializer(queryset)
            
                
           
            # Return the serialized data
            return JsonResponse(serializer.data, safe=True, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": "probleme de connexion"}, status=500)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profil_partner(request):
    if request.method == "GET":
        try:

            data = json.loads(request.body)
            user = data.get("user_id")

            # Retrieve the 'Partenneur' instance associated with the user
            queryset = Partenneur.objects.get(user__id=user)

            # Serialize the retrieved data (no need for many=True as it's a single object)
            serializer = PartenneurSerializer(queryset)

            # Return the serialized data
            return JsonResponse(serializer.data, status=200)

        except Partenneur.DoesNotExist:
            return JsonResponse({"error": "Partenneur not found for this user"}, status=404)
        except Exception as e:
            return JsonResponse({"error": "probleme de connexion"}, status=500)
    else:
        return JsonResponse({"error": "method not allow "}, status=405)


@csrf_exempt
@api_view(['PUT'])
@parser_classes([MultiPartParser])
def update_user(request):
    if request.method == "PUT":
        try:
            data=json.loads(request.body)
            # Sécurité : un utilisateur ne peut jamais modifier son propre solde
            data.pop('solde', None)
            # current_password=data.get("current_password")
            user = CustomUser.objects.get(id=request.user.id)

            # if not user.check_password(current_password):
            #     return JsonResponse({"message": "Mot de passe incorrect"},401)
            
            serializer = CustomUserSerializer(
                user, 
                data=data, 
                partial=True,
                context={'request': request}  # Important for file handling
            )
            data["phone_number_1"]=data.get("phone_number_1").strip()
            if serializer.is_valid():
                serializer.save()
                return JsonResponse(
                    {"message": "Information updated successfully"},
                    status=200
                )
            
            # Handle validation errors properly
            first_error = next(iter(serializer.errors.values()))[0]
            print (f"iam here {first_error}")
            return JsonResponse(
                
                {"message": str(first_error)},
                status=400  # Changed from 500 to appropriate status
            )

        except CustomUser.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except Exception as e:
            print(f"Unexpected error: {str(e)}")  # Log unexpected errors
            return JsonResponse(
                {'error': str (e)},
                status=500
            )
    return JsonResponse({"error": "Method not allowed"}, status=405)

# api of chef bereux


@csrf_exempt
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@permission_classes([Ischefbureux])
def add_emplois_par_groupe(request):
    if request.method == "POST":
        try:
            # Parse the incoming JSON data
            data = json.loads(request.body)
            today = timezone.now().date()

            # Get the current user (assumed to be the 'chef')
            chef = CustomUser.objects.get(id=request.user.id)

            # Add chef-specific fields to the data
            data['role'] = 'agent_administratif'  # Hardcoded role
            data['groupe'] = chef.pk
            data['wilaya'] = chef.wilaya
            data["wilaya_code"]=chef.wilaya_code

            cassie_exists = Cassie.objects.filter(
                chef_bu=request.user,
                date_creationn__date=today
            ).exists()
            if cassie_exists:
                if cassie_exists.etat == True:
                    data["permission_vlider"] = True
            else:
                data["permission_vlider"] = False

            # Validate and create the user using the serializer
            username = data["username"]
            if CustomUser.objects.filter(username=username).exists():
                return JsonResponse({"message": "Cet utilisateur existe déjà."}, status=status.HTTP_400_BAD_REQUEST)
            serializer = CustomUserSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return JsonResponse({"message": "User created successfully"}, status=201)
            else:
                errors = serializer.errors
                print(f"eroooorrrrs : {serializer.errors}")
                # Return serializer validation errors
                first_field = next(iter(serializer.errors))
                if 'non_field_errors' in errors:
                    first_error = errors['non_field_errors'][0]
                else:
                    # Get first field error
                    first_field = next(iter(errors))
                    first_error = errors[first_field][0]

                return JsonResponse(
                    {"message": str(first_error)},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON format"}, status=status.HTTP_400_BAD_REQUEST)
        except CustomUser.DoesNotExist:
            return JsonResponse({"message": "Chef not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return JsonResponse({'message': f'An error occurred: {"probleme de connexion"}'}, status=status.HTTP_400_BAD_REQUEST)

    return JsonResponse({'message': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


# api list emplois par groupe
@api_view(["GET"])
@permission_classes([IsAuthenticated])
@permission_classes([Ischefbureux])
def liste_emplois_par_groupe(request):
    if request.method == "GET":
        try:
            # Retrieve the search query from request parameters (if provided)
            search_query = request.GET.get('serch', '')

            # Filter users by group and role, and apply search filter across multiple fields
            queryset = CustomUser.objects.filter(
                role="agent_administratif",
                groupe=request.user.id
            )

            if search_query:
                queryset = queryset.filter(
                    Q(first_name__icontains=search_query) |
                    Q(last_name__icontains=search_query) |
                    Q(phone_number_1__icontains=search_query) |
                    Q(email__icontains=search_query)
                )

            # Pagination parameters
            page = request.GET.get('page', 1)
            items_per_page = int(request.GET.get('items_per_page', 10))

            # Apply pagination
            paginator = Paginator(queryset, items_per_page)
            try:
                paginated_users = paginator.page(page)
            except PageNotAnInteger:
                paginated_users = paginator.page(1)
            except EmptyPage:
                paginated_users = []

            # Serialize the paginated users
            serializer = CustomUserSerializer(paginated_users, many=True)

            return JsonResponse({
                "results": serializer.data,
                "total_pages": paginator.num_pages,
                "total_items": paginator.count,
                "current_page": int(page)
            }, safe=False, status=status.HTTP_200_OK)

        except Exception as e:
            # Catch all other exceptions and return a generic error message
            return JsonResponse({"message": f"An error occurred: {"probleme de connexion"}"}, status=status.HTTP_400_BAD_REQUEST)

    return JsonResponse({"message": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
# api coursa for admin (all course )



@api_view(["GET"])
@permission_classes([Isvtc])
def courses_list_vtc(request):

    valide = request.GET.get('valide', '').lower()
    phone_number = request.GET.get("search", "").lower()
    page_number = request.GET.get('page', 1)
    wilaya = request.GET.get("wilaya", None)
    chauffeur_id = request.GET.get("chauffeur_id", None) or request.GET.get("chauffeur", None) or request.GET.get("partener_id", None)
    page_size = int(request.GET.get("page_size", 50 if chauffeur_id else 20))

    # Fetch courses with full related driver and client details
    filter_query = Coursa.objects.select_related(
        "client", "partener", "partener__user", "agent", "partener__vihucule", "partener__type_partener", "partener__type_compte"
    ).order_by("-id")

    if chauffeur_id:
        filter_query = filter_query.filter(
            Q(partener__id=chauffeur_id) | Q(partener__user__id=chauffeur_id)
        )

    if valide:
        if valide == "true":
            filter_query = filter_query.filter(paye=True)
        elif valide == "false":
            filter_query = filter_query.filter(paye=False)

    if phone_number:
        filter_query = filter_query.filter(
            Q(partener__user__phone_number_1__icontains=phone_number) |
            Q(client__phone_number_1__icontains=phone_number) |
            Q(partener__user__first_name__icontains=phone_number) |
            Q(partener__user__last_name__icontains=phone_number)
        )
    if wilaya:
        filter_query = filter_query.filter(
            Q(wilaya__icontains=wilaya) | Q(partener__user__wilaya__icontains=wilaya)
        )

    paginator = Paginator(filter_query, page_size)
    page_obj = paginator.get_page(page_number)
    serializer = CoursaSerializer(page_obj, many=True)

    return JsonResponse({
        "data": serializer.data,
        "page": paginator.num_pages,
        "count": paginator.count
    }, status=200)


@api_view(["GET"])
@permission_classes([Isvtc])
def chauffeurs_tax_summary(request):
    """
    Récupère la liste des chauffeurs VTC avec leur taxe totale,
    taxe non payée (à valider), nombre de courses et informations de contact.
    """
    try:
        wilaya = request.GET.get("wilaya", "").strip()
        search = request.GET.get("search", "").strip()

        # Partenaires chauffeurs VTC ou ayant déjà des courses
        parteners_qs = Partenneur.objects.select_related("user", "type_compte", "vihucule").filter(
            Q(type_compte__name__icontains="chauf") |
            Q(type_compte__name__icontains="chof") |
            Q(type_compte__name__icontains="vtc") |
            Q(partener__isnull=False)
        ).exclude(
            Q(type_compte__name__icontains="livreur") | Q(type_compte__name__icontains="magasin")
        ).distinct()

        if wilaya:
            parteners_qs = parteners_qs.filter(
                Q(user__wilaya__icontains=wilaya) |
                Q(partener__wilaya__icontains=wilaya)
            )

        if search:
            parteners_qs = parteners_qs.filter(
                Q(user__phone_number_1__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__username__icontains=search) |
                Q(nom_de_magasin__icontains=search)
            )

        parteners_annotated = parteners_qs.annotate(
            tax_totale=Sum('partener__tax_tawsile'),
            tax_non_payee=Sum('partener__tax_tawsile', filter=Q(partener__paye=False)),
            tax_payee=Sum('partener__tax_tawsile', filter=Q(partener__paye=True)),
            courses_total=Count('partener__id'),
            courses_non_valide=Count('partener__id', filter=Q(partener__paye=False)),
        ).order_by('-tax_non_payee', '-tax_totale')

        data = []
        for p in parteners_annotated:
            u = p.user
            first = u.first_name if u else ""
            last = u.last_name if u else ""
            full_name = f"{first} {last}".strip() or (p.nom_de_magasin or (u.username if u else f"Chauffeur #{p.id}"))
            phone = (u.phone_number_1 if u else "") or "—"
            user_wilaya = (u.wilaya if u else "") or ""
            rating = float(u.rating if u and hasattr(u, 'rating') and u.rating is not None else 5.0)

            data.append({
                "partener_id": p.id,
                "user_id": u.id if u else None,
                "name": full_name,
                "phone": phone,
                "wilaya": user_wilaya,
                "tax_totale": round(float(p.tax_totale or 0), 2),
                "tax_non_payee": round(float(p.tax_non_payee or 0), 2),
                "tax_payee": round(float(p.tax_payee or 0), 2),
                "courses_total": p.courses_total or 0,
                "courses_non_valide": p.courses_non_valide or 0,
                "rating": rating,
                "matricule": p.vihucule.matricule if p.vihucule else "",
                "type_vehicule": p.vihucule.type_vehicule if p.vihucule else "",
            })

        return JsonResponse({
            "success": True,
            "data": data,
            "count": len(data)
        }, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([Isvtc])
def liste_coursa_par_groupe(request):
    if request.method == "GET":
        try:
            # Parse query parameters
            valide = request.GET.get('valide', 'false').lower() == 'true'


            
            wilaya = request.GET.get("wilaya")
            search = request.GET.get("search")
            page_number = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 20))
            

            # Base queryset
            queryset = Coursa.objects.all().select_related("client","partener","agent").values(
                "partener__user__id",
                "partener__id",
                'partener__user__first_name',
                'partener__user__last_name',
                'partener__user__phone_number_1',
                "paye",
                "partener__user__wilaya"
            ).annotate(
                total_tax_wi=Sum('tax_tawsile')
            ).order_by('-partener__user__id')

            # Apply filters
            if wilaya:
                queryset = queryset.filter(partener__user__wilaya__icontains=wilaya)
            if search:
                queryset = queryset.filter(
                    partener__user__phone_number_1__icontains=search
                )
            if bool(valide) ==True :
                queryset = queryset.filter(paye=True)
            if bool(valide) ==False :
                queryset=queryset.filter(paye=False)

            # Pagination
            paginator = Paginator(queryset, page_size)
            
            try:
                page_obj = paginator.page(page_number)
            except EmptyPage:
                page_obj = paginator.page(paginator.num_pages)

            # Build response data
            response_data = {
                'data': list(page_obj.object_list),
                'pagination': {
                    'total_items': paginator.count,
                    'total_pages': paginator.num_pages,
                    'current_page': page_obj.number,
                    'page_size': page_size,
                    'has_next': page_obj.has_next(),
                    'has_previous': page_obj.has_previous()
                }
            }

            return JsonResponse(response_data, safe=False)

        except ValueError as e:
            return JsonResponse({'error': f'Invalid parameter value: {"Probleme de connexion"}'}, status=400)
        except Exception as e:
            return JsonResponse({'error': "Probleme de connexion"}, status=500)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
@permission_classes([IsAgentAdmin or Ischefbureux])
def liste_coursa_par_user(request):

    if request.method == "GET":
        try:
            # Retrieve the user based on the given user_id
            user = CustomUser.objects.get(id=request.user.id)

            # Query all 'Coursa' objects related to the user's group
            coursaa = Coursa.objects.filter(partener__user__groupe=user.groupe) .select_related(
                "agent", "partener", "client").order_by("-order_date_creat")
            # Paginate the queryset
            paginator = PageNumberPagination()
            paginator.page_size = 50  # Set pagination to 20 items per page
            result_page = paginator.paginate_queryset(coursaa, request)

            # Serialize the paginated data
            serializer = CoursaSerializer(result_page, many=True)

            # Return the paginated response
            return paginator.get_paginated_response(serializer.data)

        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

        except Exception as e:
            return JsonResponse({"error": "Probleme de connexion"}, status=500)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def registre_client(request):
    if request.method == "POST":
        try:
            # Parse the incoming JSON data
            data = JSONParser().parse(request)
            data["role"] = "client"

            # Map 'sex' to 'sexe' if present in input
            if "sex" in data and "sexe" not in data:
                data["sexe"] = data["sex"]

            # Safely handle wilaya_code
            if "wilaya_code" in data and data["wilaya_code"] is not None:
                try:
                    data["wilaya_code"] = int(data["wilaya_code"])
                except (ValueError, TypeError):
                    data["wilaya_code"] = None

            # Initialize the serializer with the parsed data
            serializer = CustomUserSerializer(data=data)

            # Check if the data is valid
            if serializer.is_valid():
                serializer.save()
                return JsonResponse({"message": "User created successfully"}, status=201)
            else:
                errors = serializer.errors
                first_error = "Données invalides"
                if 'non_field_errors' in errors and errors['non_field_errors']:
                    first_error = errors['non_field_errors'][0]
                elif errors:
                    first_field = next(iter(errors))
                    val = errors[first_field]
                    if isinstance(val, list) and len(val) > 0:
                        first_error = val[0]
                    else:
                        first_error = str(val)

                return JsonResponse({"message": str(first_error), "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            import logging
            logging.getLogger(__name__).exception("Erreur registre_client: %s", str(e))
            return JsonResponse({"message": f"Erreur serveur: {str(e)}"}, status=500)

    else:
        return JsonResponse({"message": "Method not allowed"}, status=405)



@csrf_exempt
@api_view(["POST"])
def registre_partener(request):
    if request.method == "POST":
        try:
            # Parse the request body data
            data = json.loads(request.body)

            # Step 1: Validate user data
            user_data = {
                "username": data.get("username"),
                "first_name": data.get("first_name"),
                "last_name": data.get("last_name"),
                "email": data.get("email"),
                "role": data.get("role"),
                "phone_number_1": data.get("phone_number_1"),
                "phone_number_2": data.get("phone_number_2", ""),
                "image_url": data.get("image_url", ""),
                "wilaya": data.get("wilaya", ""),
                "sexe": data.get("sexe", "homme"),
                "groupe": request.user.groupe.id if request.user.groupe else None,
                "password": data.get("password"),
                "date_de_naissance": data.get("date_de_naissance", None),
            }

            custom_user_serializer = CustomUserSerializer(data=user_data)

            if not custom_user_serializer.is_valid():
                return JsonResponse({"error": custom_user_serializer.errors}, status=400)

            # Save the user
            user = custom_user_serializer.save()

            # Step 2: Validate and fetch Type_compte_partener instance
            type_compte_id = data.get("type_compte")
            try:
                type_compte_instance = Type_compte_partener.objects.get(
                    id=type_compte_id)
            except Type_compte_partener.DoesNotExist:
                return JsonResponse({"error": "Invalid type_compte id"}, status=400)

            # Step 3: Validate card number length
            card_number = data.get("card_number", "")
            if card_number and len(card_number) != 18:
                return JsonResponse({"error": {"card_number": "Card number must be 18 characters long."}}, status=400)

            # Step 4: Validate the remaining partner data
            partener_data = {
                'user': user.id,  # Link the newly created user
                'type_compte': type_compte_instance.id,  # Link the type_compte
                'nom_de_magasin': data.get("nom_de_magasin", ""),
                'adresse': data.get("adresse", ""),
                'RC': data.get("RC", ""),
                'Nif': data.get("Nif", ""),
                'numero_act': data.get("numero_act", ""),
                'latitude': data.get("latitude", None),
                'longitude': data.get("longitude", None),
                'card_number': card_number,
                'tax_a_payer': data.get("tax_a_payer", None),
                'tax_global': data.get("tax_global", None),
                'chiffre_affaires': data.get("chiffre_affaires", None),
                'consement': data.get("consement", None),
                'num_de_matricule': data.get("num_de_matricule", ""),
                'randement': data.get("randement", None),  # New field
            }

            partener_serializer = PartenneurSerializer(data=partener_data)

            if not partener_serializer.is_valid():
                return JsonResponse({"error": partener_serializer.errors}, status=400)

            # Save the partner
            partener_serializer.save()

            return JsonResponse({"message": "Partner successfully registered"}, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {"Probleme de connexion"}"}, status=400)

    return JsonResponse({'message': 'Method not allowed'}, status=405)

# api pour activer le compte user pour un pertener


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
# permission il doit etre connecter et a le role CHEF BUREUX OR AGENT_admin
@permission_classes([IssuperVisseur | IsCentreappel])
def valide_compte_partener(request):
    if request.method == "PATCH":
        try:
            data = json.loads(request.body)
            id_user = data.get("user_id")
            partener = CustomUser.objects.get(id=id_user)
            partenneur=Partenneur.objects.get(user__id=id_user)
            if partener.is_active:
                return JsonResponse({"message": 'le pertener est deja active'}, status=200)
            partener.is_active = True
            partener.save()
            Action_Superviseur.objects.create(superviseur=request.user,pertenneur=partenneur)

            return JsonResponse({"messsage": "le partener est active "}, status=200)
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": 'User not found '}, status=404)
        except Exception as e:
            return JsonResponse({"eroor": "Probleme de connexion"}, status=500)
    else:
        return JsonResponse({"eroor": "method not allow "}, status=405)


logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@permission_classes([Ischefbureux or IsAgentAdmin])
# liste des partuner par groupe
def liste_partener_par_groupe(request):
    if request.method == "GET":
        try:
            # Filter partners by user's group
            partners_query = Partenneur.objects.filter(
                user__groupe=request.user.id).select_related("user")

            # Apply filter if 'is_active' is specified
            is_active = request.GET.get('is_active', None)
            if is_active is not None:
                is_active = is_active.lower() == 'true'
                partners_query = partners_query.filter(
                    user__is_active=is_active)

            # Search functionality
            search_query = request.GET.get('search', None)
            if search_query:
                partners_query = partners_query.filter(
                    Q(user__username__icontains=search_query) |
                    Q(user__phone_number_1__icontains=search_query) |
                    Q(user__first_name__icontains=search_query)
                )

            # Pagination
            page = request.GET.get('page', 1)
            per_page = request.GET.get('per_page', 50)
            paginator = Paginator(partners_query, per_page)

            try:
                partners_page = paginator.page(page)
            except PageNotAnInteger:
                return JsonResponse({"error": "Invalid page number."}, status=400)
            except EmptyPage:
                return JsonResponse({"error": "Page out of range."}, status=400)

            # Serialize paginated results
            partners_serializer = PartenneurSerializer(
                partners_page, many=True)

            return JsonResponse({
                "partners": partners_serializer.data,
                "pagination": {
                    "current_page": partners_page.number,
                    "total_pages": paginator.num_pages,
                    "total_items": paginator.count,
                }
            }, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Employee not found."}, status=404)
        except Exception as e:
            logger.error(f"Error: {"Probleme de connexion"}")
            return JsonResponse({"error": "Probleme de connexion"}, status=500)

    else:
        return JsonResponse({"error": "Invalid HTTP method."}, status=405)


@api_view(["GET"])
@permission_classes([IsOwnerOrAdmin])
# api de voir tout les course par dirceteur
def liste_coursa_all(request):
    if request.method == "GET":
        try:
            queryset = Coursa.objects.all().select_related("client", "agent", "partener")

            # Search functionality
            search_query = request.GET.get('search', None)
            if search_query:
                queryset = queryset.filter(
                    Q(partener__user_phone_number_1__icontains=search_query) |
                    Q(partener__user__first_name__icontains=search_query) |
                    Q(partener__user__last_name__icontains=search_query)
                )

            # Pagination
            page = request.GET.get('page', 1)
            # Default to 50 items per page
            per_page = request.GET.get('per_page', 50)
            paginator = Paginator(queryset, per_page)

            try:
                coursa_page = paginator.page(page)
            except PageNotAnInteger:
                return JsonResponse({"error": "Invalid page number."}, status=400)
            except EmptyPage:
                return JsonResponse({"error": "Page out of range."}, status=400)

            # Serialize the paginated data
            serializer = CoursaSerializer(coursa_page, many=True)

            # Return response with paginated courses and pagination info
            return JsonResponse({
                "message": "Here is the list of courses for the user's wilaya",
                "courses": serializer.data,
                "pagination": {
                    "current_page": coursa_page.number,
                    "total_pages": paginator.num_pages,
                    "total_items": paginator.count,
                    "per_page": per_page  # Include number of items per page
                }
            }, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse({"message": "User not found"}, status=404)

        except Exception as e:
            return JsonResponse({"message": "Probleme de connexion"}, status=500)

    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


@api_view(["POST"])
def create_coursa(request, partener_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            print(f'request comming from django : {request.user} ')

            # Fetch the client and partner objects
            client_cible = CustomUser.objects.get(id=request.user.id)

            partener_cible = CustomUser.objects.get(id=partener_id)

            # Use the correct parameter here
            partener_object = Partenneur.objects.get(user=partener_cible)

            # Create the Coursa object
            Coursa.objects.create(
                client=client_cible,
                partener=partener_object,
                km=data.get('km'),
                prix=data.get('prix'),
                point_gbs_localisation_aller=data.get("aller"),
                point_gbs_localisation_arrive=data.get('arrive'),
                wilaya=client_cible.wilaya,
                tax_tawsile=20
            )
            return JsonResponse({"message": "The course was created successfully"}, status=201)

        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Client or partner not found"}, status=404)

        except Partenneur.DoesNotExist:
            return JsonResponse({"error": "Partner object not found"}, status=404)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)

        except Exception as e:
            return JsonResponse({'error': "Probleme de connexion"}, status=500)
    else:
        return JsonResponse({'error': "Method not allowed"}, status=405)


@csrf_exempt
def static_for_emplois(request, user_id):
    # You might have permission handling here
    permission_classes = [IsAuthenticated]
    user_cible = CustomUser.objects.get(id=user_id)

    if request.method == "GET":
        # Aggregate statistics for Coursa (Courses)
        total_prix = Coursa.objects.aggregate(
            total_prix=Sum('prix'))['total_prix']

        course_stats = {
            "total_courses": Coursa.objects.filter(wilaya=user_cible.wilaya).count(),
            "average_km": Coursa.objects.aggregate(avg_km=Avg('km'))['avg_km'],
            "total_revenue": Coursa.objects.aggregate(total_prix=Sum('prix'))['total_prix'],
            "course_status_distribution": list(Coursa.objects.values('etat').annotate(count=Count('id'))),
            "prix_tawsile": total_prix*25/100
        }

        # Aggregate statistics for Partenneur (Partners)
        partner_stats = {
            "total_partners": Partenneur.objects.count(),
            "active_partners": Partenneur.objects.filter(is_available=True).count(),
            "inactive_partners": Partenneur.objects.filter(is_available=False).count(),
            "average_rating": Partenneur.objects.aggregate(avg_rating=Avg('rating'))['avg_rating']
        }

        return JsonResponse({
            "courses": course_stats,
            "partners": partner_stats,

        })

    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)

# Helper functions for stats


def get_user_stats():
    return list(CustomUser.objects.values('role').annotate(total=Count('id')))


def get_partner_stats():
    return {
        "partners_count": Partenneur.objects.count(),
        "avg_partner_rating": Partenneur.objects.aggregate(avg_rating=Sum('rating'))['avg_rating'] or 0
    }


def get_coursas_stats():
    coursas = Coursa.objects.all()
    coursas_stats = list(coursas.values('etat').annotate(total=Count('id')))
    total_km = coursas.aggregate(total_km=Sum('km'))['total_km'] or 0
    total_prix = coursas.aggregate(total_prix=Sum('prix'))['total_prix'] or 0
    return {
        "coursas_stats": coursas_stats,
        "total_km": total_km,
        "total_prix": total_prix
    }


def get_payment_stats():
    total_tax = Payment.objects.aggregate(
        total_tax=Sum('total_tax_tawsile'))['total_tax'] or 0
    total_paid = Payment.objects.filter(paid=True).aggregate(
        total_paid=Sum('total_tax_tawsile'))['total_paid'] or 0
    return {
        "total_tawsile_tax": total_tax,
        "total_paid": total_paid
    }
def get_total_commentaire ():
    commentaire =Comentaire.objects.all().count()

# Main view for dashboard


def commerciel_dashboard_view_admin(request):
    try:
        # Retrieve statistics
        context = {

            "total_courses": Coursa.objects.count(),
            "total_users_chef_bureux": CustomUser.objects.filter(role="chef_bureau").count(),
            "tolat_users_agents": CustomUser.objects.filter(role="agent_administratif").count(),
            "total_users_centre_appel": CustomUser.objects.filter(role="centre_appel").count(),
            "total_users_superviseurs": CustomUser.objects.filter(role="superviseur").count(),
            "total_users_validation": CustomUser.objects.filter(role="validation_vtc").count(),
            "total_users_superviseurs": CustomUser.objects.filter(role='superviseur').count(),
            "total_users_with_group": CustomUser.objects.filter(groups__isnull=False).count(),

            "total_partners__choffeur": Partenneur.objects.filter(Q(type_compte__name='choffeur')).count(),
            "total_partners__magasin": Partenneur.objects.filter(Q(type_compte__name='magasin')).count(),
            "total_partners__livreur": Partenneur.objects.filter(Q(type_compte__name="livreur")).count(),
            "total_partners__sans_type": Partenneur.objects.filter(type_compte__isnull=True).count(),
            "paretnneur_en_attend": Partenneur.objects.filter(user__is_active=False,user__role="partener",user__groupe=None,pre_en_charge=False
            
              ).count(),
            "partennneur_groupe": Partenneur.objects.filter(user__groupe__isnull=False, user__is_active=False).count(),
            "partenneur_active": Partenneur.objects.filter(user__is_active=True).count(),
            "total_partenneur": Partenneur.objects.all().count(),
            "partenneur_commente": Partenneur.objects.filter(user__is_active=False,pre_en_charge=True,user__groupe=None).count(),

        }
        return JsonResponse({"message": "Statistics ready", "context": context}, status=200)
    except DatabaseError as e:
        return JsonResponse(
            {"message": "Error retrieving data", "error": "Probleme de connexion"},
            status=500
        )
    # Optional: Only needed if you want to bypass CSRF for testing


class PaymentPagination(PageNumberPagination):
    page_size = 10  # Default page size
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET'])
def all_payment(request):
    try:
        partner_name = request.query_params.get('partner_name', None)
        paid_status = request.query_params.get('paid', None)

        payments = Payment.objects.all()

        # Filter by partner name
        if partner_name:
            payments = payments.filter(
                partner__user__first_name__icontains=partner_name
            ) | payments.filter(
                partner__user__last_name__icontains=partner_name
            )

        # Filter by payment status
        if paid_status is not None:
            paid_status = paid_status.lower() == 'true'
            payments = payments.filter(paid=paid_status)

        # Pagination
        paginator = PaymentPagination()
        result_page = paginator.paginate_queryset(payments, request)
        serializer = PaymentSerrializer(result_page, many=True)

        return paginator.get_paginated_response(serializer.data)

    except Exception as e:
        return JsonResponse({"error": "Probleme de connexion"}, status=500)


@csrf_exempt
@api_view(["PATCH"])
def pay_course(request):
    if request.method == "PATCH":
        try:
            # Get course IDs from the request body
            body = json.loads(request.body)
            course_ids = body.get('courseIds', [])

            if not course_ids:
                return JsonResponse({'error': 'No course IDs provided'}, status=400)

            courses = Coursa.objects.filter(id__in=course_ids)
            some = courses.aggregate(total_tax=Sum('tax_tawsile'))['total_tax']

            # Validate if courses exist
            if not courses.exists():
                return JsonResponse({'message': 'Un ou plusieurs cours non trouvés'}, status=404)
            if courses.filter(paye=True).exists():
                return JsonResponse({'message': 'Un ou plusieurs cours paye'}, status=400)
            partener = courses.first().partener  # Assuming courses has only one partener
            remise = Remise.objects.filter(inviteurs=partener).first()
            
            if remise:
                remise.revunu += some * 0.02  # Assuming 'amount' is the field to update
                remise.save()


            # Mark the courses as paid
            courses.update(paye=True, agent=request.user)
            return JsonResponse({"message": "The courses have been paid successfully."}, status=200)

        except Exception as e:
            return JsonResponse({'message': "probleme de connexion"}, status=500)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
@api_view(["POST"])
def change_password(request, user_id):
    if request.method == "PATCH":
        try:
            data = json.loads(request.body)
            user_cible = CustomUser.objects.get(id=user_id)
            oldpassword = data.get("oldpassword")
            password1 = data.get("password1")
            password2 = data.get("password2")
            if make_password(oldpassword) != user_cible.password:

                return JsonResponse({'eroor': "Wrong old password "}, status=404)
            if password1 != password2:
                return JsonResponse({'eroor': "password dotn match "}, status=404)
            user_cible.password = make_password(password1)
            user_cible.save()
            return JsonResponse({'message ': "you change your password succces   "}, status=200)
        except CustomUser.DoesNotExist:
            return JsonResponse({'eroor': "user not fund  "}, status=404)
        except Exception as e:
            return JsonResponse({'eroor': "Probleme de connexion"}, status=500)
    else:
        return JsonResponse({'eroor': "method not allow  "}, status=405)


# couses of petner
@api_view(["GET"])
@permission_classes([IsPertener])
def couses_partener(request):
    if request.method == "GET":
        try:
            # Retrieve page number from request
            page_number = request.GET.get('page', 1)

            # Fetch user and partner objects

            user_cible = CustomUser.objects.get(id=request.user.id)
            partener_cible = Partenneur.objects.get(user=user_cible)

            # Get queryset for partner's courses
            queryset = Coursa.objects.filter(partener=partener_cible).select_related(
                "client", "agent", "partener")

            # Paginate the queryset
            paginator = Paginator(queryset, 50)
            try:
                paginated_queryset = paginator.page(page_number)
            except PageNotAnInteger:
                paginated_queryset = paginator.page(1)
            except EmptyPage:
                return JsonResponse({"error": "Page number out of range"}, status=404)

            # Serialize the paginated queryset
            serializer = CoursaSerializer(paginated_queryset, many=True)

            return JsonResponse({
                "data": serializer.data,
                "total_pages": paginator.num_pages,
                "current_page": page_number,
            }, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        except Partenneur.DoesNotExist:
            return JsonResponse({"error": "Partner not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": "Probleme de connexion"}, status=500)

    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def create_payment(request, user_id):
    if request.method == "POST":
        try:
            # Get partner from user
            userr = CustomUser.objects.get(id=user_id)
            partner = Partenneur.objects.get(user=userr)

            # Get course_ids from POST data (from FormData)
            course_ids = json.loads(request.POST.get(
                'course_ids', '[]'))  # Form data
            courses = Coursa.objects.filter(id__in=course_ids)
        
            if not courses.exists():
                return JsonResponse({"error": "No valid courses found."}, status=404)

            # Check if payment already exists for this partner
            payment = Payment_Par_partener.objects.create(partner=partner)

            # Handle file upload (optional)
            if 'piece_jointure' in request.FILES:
                file = request.FILES['piece_jointure']
                fs = FileSystemStorage()
                filename = fs.save(file.name, file)
                payment.piece_jointure = fs.url(filename)

            payment.confirmed_by_partner = True

            # Mark courses as paid
            total_price = 0  # Initialize the total price
            for course in courses:
                course.paye_par_partener = True  # Mark as paid
                total_price += course.prix  # Add course price to total price
                course.save()

            # Calculate total tax (20%)
            total_tax = total_price * 0.20

            # Store the calculated total tax in the payment
            payment.total_tax_tawsile = total_tax
            # Print the calculated tax
            print(f"Payment Total Tax: {payment.total_tax_tawsile}")

            payment.save()

            return JsonResponse({"message": "Payment created successfully.", "payment_id": payment.id}, status=201)

        except Exception as e:
            return JsonResponse({"error": "Probleme de connexion"}, status=500)


@api_view(['GET'])
def all_payment_par_partener(request):
    """
    Retrieve all Payment_Par_partener objects with pagination.
    """
    # Fetch all payment records
    payments = Payment_Par_partener.objects.all()

    # Paginate the queryset
    paginator = PageNumberPagination()
    paginator.page_size = request.query_params.get(
        'page_size', 10)  # Default to 10 if not provided
    result_page = paginator.paginate_queryset(payments, request)

    # Serialize the paginated data
    serializer = PaymentParPartenerSerializer(result_page, many=True)

    # Return the paginated response
    return paginator.get_paginated_response(serializer.data)


@csrf_exempt
def get_totale_tax_a_payer(request, user_id):
    try:
        if request.method == "GET":
            partenerr = get_object_or_404(Partenneur, user__id=user_id)
            payment_total = Payment.objects.filter(partner=partenerr)
            serializer = PaymentSerrializer(payment_total, many=True)
            return JsonResponse({
                "message": "You have received the list of payments.",
                "data": serializer.data
            })
        else:
            return JsonResponse({"error": "Method not allowed"}, status=405)
    except Partenneur.DoesNotExist:
        return JsonResponse({"error": "Partner does not exist"}, status=404)


@csrf_exempt
def partner_dashboard(request, partner_id):
    partenerr = get_object_or_404(Partenneur, user__id=partner_id)

    # Get all completed courses for the partner
    completed_courses = Coursa.objects.filter(
        partener=partenerr, etat='terminee')

    # Aggregate data
    total_courses = completed_courses.count()
    total_price = completed_courses.aggregate(total=Sum('prix'))['total'] or 0
    total_km = completed_courses.aggregate(total=Sum('km'))['total'] or 0

    # Calculate total credit (sum of total_tax_tawsile)
    total_credit = Payment.objects.filter(partner=partenerr).aggregate(
        total=Sum('total_tax_tawsile'))['total'] or 0

    # Calculate tax (assuming 25% as mentioned in your model)
    total_price_with_tax = total_price
    total_price_without_tax = total_price / \
        Decimal(1.25) if total_price > 0 else 0

    data = {
        "partner_name": partenerr.nom_de_magasin or partenerr.user.username,
        "total_courses": total_courses,
        "total_price_with_tax": round(total_price_with_tax, 2),
        "total_price_without_tax": round(total_price_without_tax, 2),
        "total_km": total_km,
        "credi": round(total_credit, 2),  # Total credit calculated
    }
    return JsonResponse(data)


@csrf_exempt
def get_payment_id_partner(request, user_id):
    if request.method == "GET":
        try:
            # Get the partner payments based on the user_id
            payments = Payment_Par_partener.objects.filter(
                partner__user__id=user_id)

            # Serialize the queryset, passing many=True to handle multiple instances
            serializer = PaymentParPartenerSerializer(payments, many=True)

            # Return the serialized data
            return JsonResponse({"message": "You got the payment history of the partner", "data": serializer.data}, status=200)
        except Payment_Par_partener.DoesNotExist:
            return JsonResponse({"error": "Payment not found"}, status=404)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def refuse_payment(request, payment_id):
    if request.method == "PATCH":
        try:
            # Get the payment object
            payment = get_object_or_404(Payment_Par_partener, id=payment_id)

            # Update the payment status
            payment.etat = "refuse"
            payment.save()

            # Update the related courses' paye_par_partner field to False
            payment.courses.update(paye_par_partener=False)

            return JsonResponse({"message": "Payment refused and courses updated successfully."}, status=200)

        except Exception as e:
            return JsonResponse({"error": "Probleme de connexion"}, status=400)
    else:
        return JsonResponse({"error": "Invalid HTTP method."}, status=405)


@api_view(["PATCH"])
def Accepter_payment(request, payment_id):
    if request.method == "PATCH":
        try:
            payment = get_object_or_404(Payment_Par_partener, id=payment_id)
            payment.etat = "accepte"
            payment.save()
            payment.courses.update(paye=True)
            return JsonResponse({"message": "Payment accepted and courses updated successfully."}, status=200)
        except Exception as e:
            return JsonResponse({"error": "Probleme de connexion"}, status=400)
    else:
        return JsonResponse({"error": "Invalid HTTP method."}, status=405)


@api_view(["GET"])
def get_all_partner(request):
    if request.method == "GET":
        # print(f'id = {request.user.groupe}')
        # Search query from request
        search_query = request.GET.get('search', '')

        groupe=request.GET.get("groupe")

        
            

        # Filter queryset based on the search query
        queryset = Partenneur.objects.filter(user__is_active=False,user__role="partener",user__bloquer=False).order_by("-id").select_related(
                "user", "type_partener", "type_compte","vihucule")
        if search_query:
            queryset = queryset.filter(
                Q(user__phone_number_1__icontains=search_query)).order_by("-id")
        if groupe :
            if groupe =="True" :
                queryset=queryset.filter(
                    user__groupe__isnull=False
                ).order_by("-id")
            else :
                queryset = queryset.filter(
                    user__groupe__isnull=True
                ).order_by("-id")
                
                

        # Paginate results
        paginator = PageNumberPagination()
        paginator.page_size = 20
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        # Serialize the data
        serializer = PartenneurSerializer(paginated_queryset, many=True)

        # Return paginated response
        return paginator.get_paginated_response(serializer.data)
    else:
        return JsonResponse({"error": "method not allowed"}, status=405)


@api_view(["GET"])
def get_all_partner_groupeX(request):
    if request.method == "GET":

        # Get search and groupe filters from the request
        search_query = request.GET.get('search', '').strip()

        # Base queryset for inactive users
        queryset = Partenneur.objects.filter(user__groupe=request.user.groupe).select_related(
            "user", "vihucule", "type_partener", "type_compte").order_by("-id")

        # Apply filters
        # if groupe_filter:
        #     queryset = queryset.filter(user__groupe=groupe_filter)
        if search_query:
            queryset = queryset.filter(
                Q(user__phone_number_1__icontains=search_query))

        # Check if the queryset is empty
        # if not queryset.exists():
        #     return JsonResponse({"message": "No results found for the given filters."}, status=406)

        # Paginate the queryset
        paginator = PageNumberPagination()
        paginator.page_size = 50
        paginated_queryset = paginator.paginate_queryset(
            queryset, request, view=None)

        # Serialize the data
        serializer = PartenneurSerializer(paginated_queryset, many=True)

        # Return paginated response
        return paginator.get_paginated_response(serializer.data)

    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
@api_view(["GET"])
@permission_classes([IsCentreappel])
def get_partner_comments(request):
    if request.method == 'GET':
        try:
            # print(f"request :{request.user.id}")
            partener_id = request.GET.get('id', '')

            partener_cible = Partenneur.objects.get(id=partener_id)

            commentaires = Comentaire.objects.filter(
                pertener=partener_cible,
                
            ).order_by("-id").select_related("centre_appel", "pertener")

            # Pagination

            serializer = ComentaireSerializer(commentaires, many=True)

            return JsonResponse({
                "message": "Commentaires du partenaire récupérés avec succès",
                "data": serializer.data,

            }, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "Centre d'appel non trouvé"}, status=404)
        except Partenneur.DoesNotExist:
            return JsonResponse({"error": "Partenaire non trouvé"}, status=404)
        except Exception as e:
            return JsonResponse({"error": "Probleme de connexion"}, status=500)
    else:
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)


@csrf_exempt
@api_view(["POST"])
@permission_classes([IsCentreappel])
def add_commentaire(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            partener_id = data.get("partener_id")
            print(f"partner id :{partener_id}")
            partener_cible = Partenneur.objects.get(id=partener_id)

            appel_id = CustomUser.objects.get(id=request.user.id)
            data = json.loads(request.body)
            comm = data.get('commentaire')
            if not comm or not partener_id:
                return JsonResponse({"message": "you forget to enter comentaire "}, status=400)
            """
            if faut une condition quand le partener pres en charge par auttre centre appel il affiche une message de error
            """

            if partener_cible.pre_en_charge:
                if Comentaire.objects.filter(pertener=partener_cible).exclude(centre_appel=appel_id).exists():
                    return JsonResponse({"message": "Le partenaire est déjà en charge"}, status=406)

            Comentaire_cible = Comentaire.objects.create(
                pertener=partener_cible, comm=comm, centre_appel=appel_id)

            partener_cible.pre_en_charge = True
            partener_cible.save()
            Comentaire_cible.comm = comm
            Comentaire_cible.centre_appel = appel_id
            Comentaire_cible.save()
            return JsonResponse({"message": 'vous avez ajouter a commentaire '}, status=201)
        except Partenneur.DoesNotExist:
            return JsonResponse({"eroor": "partener id not valide "}, status=406)
        except CustomUser.DoesNotExist:
            return JsonResponse({"eroor": "le customer user id not valide "}, status=404)
    else:
        return JsonResponse({"eroor": "method not aallow "}, status=405)


@csrf_exempt
# api to complere dosssie partener
#  Ensure permission class is correctly defined
@api_view(['PUT'])
def compete_dossier_partener(request):
    try:
        # Parse the JSON data from the request
        data = request.data
        user_id = data.get("id")
        partenneur_id = data.get("partener_id")
        type_id = data.get("type_id")
        print(f"user id is :{user_id}")
        print(f"parner id is :{partenneur_id}")

        try:
            type_compte = Type_compte_partener.objects.get(id=type_id)
        except Type_compte_partener.DoesNotExist:
            return JsonResponse({"message": "Invalid type compte id "}, status=400)

        if not user_id:
            print("idddd user eroooor ")
            return Response({"error": "User ID is required"}, status=400)

        user = CustomUser.objects.get(id=user_id)
        customer_user_serializer = CustomUserSerializer(
            user, data=data, partial=True)
        if customer_user_serializer.is_valid():

            user.is_active = False
            user.save()
            customer_user_serializer.save()
        else:
            errors = customer_user_serializer.errors
            # Return serializer validation errors
            first_field = next(iter(customer_user_serializer.errors))
            if 'non_field_errors' in errors:
                first_error = errors['non_field_errors'][0]
            else:
                # Get first field error
                first_field = next(iter(errors))
                first_error = errors[first_field][0]

            return JsonResponse(
                {"message": str(first_error)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the Partenneur instance by ID
        partenneur_id = partenneur_id
        if not partenneur_id:
            print(f'erooor de partennneur ')
            return Response({'error': 'ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch the Partenneur object
        partenneur = get_object_or_404(Partenneur, pk=partenneur_id)

        # Update the Partenneur object with the provided data
        partenneur_serializer = PartenneurSerializer(
            partenneur, data=data, partial=True)

        if partenneur_serializer.is_valid():
            partenneur_serializer.save()

            # Update the type_compte field
            partenneur.type_compte = type_compte
            partenneur.save()

            # Check if vihucule exists and update it, only if type_compte is not "magasin"
            if type_compte.name.lower() != "magasin":
                vihucule_data = data.get('vihucule')
                print(f" Vihicule de parther {partenneur.vihucule.pk} vihicule {partenneur.vihucule}")

                if vihucule_data:
                    # If there's no associated Vihucule, create a new one
                    if not partenneur.vihucule:
                        # Create and associate a new Vihucule if it's missing
                        # You can add defaults or specific fields here
                        vihucule = Vihucule.objects.create(**vihucule_data)
                        partenneur.vihucule = vihucule
                        partenneur.save()

                    # Now update the Vihucule with the provided data
                    vihucule = partenneur.vihucule  # Now we know vihucule exists
                    vihucule_serializer = VihuculeSerializer(
                        vihucule, data=vihucule_data, partial=True)
                    if vihucule_serializer.is_valid():
                        vihucule_serializer.save()
                    else:
                        print(f"vihucule")
                        return Response(vihucule_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            return Response({'message': 'Partenneur and associated Vihucule updated successfully'}, status=status.HTTP_200_OK)

        else:
            print(f"partennneur erooooss : {partenneur_serializer.errors}")
            return Response(partenneur_serializer.errors, status=406)

    except Exception as e:
        print(f"eroooooor de saaaa3d : {"Probleme de connexion"}")
        return Response({"error": "vous avez un problème de connexion, essayez plus tard"}, status=407)


@csrf_exempt
@api_view(["POST"])
@permission_classes([Ischefbureux | IsAgentAdmin])
def valider_payment_commande(request):
    if request.method == "POST":
        try:

            user = CustomUser.objects.get(id=request.user.id)
            if not user.permission_vlider:
                return JsonResponse({"message": "Le cas est arrêté"}, status=404)
            data = json.loads(request.body)
            selected_commandes_ids = data.get('id', [])

            # Validate input
            if not selected_commandes_ids or not isinstance(selected_commandes_ids, list):
                return JsonResponse({'error': 'Invalid input, expected a list of commande IDs'}, status=400)

            # Fetch the selected commandes
            commandes = Commande.objects.filter(id__in=selected_commandes_ids)
            if commandes.filter(valide_payment=True).exists():
                return JsonResponse({'message': 'ces commandes est deja validé'}, status=400)

            prix_action = 0
            # Example of performing updates (update logic should be customized)
            updated_commandes = []

            for commande in commandes:
                # Example update: change the status to 'Updated'
                commande.valide_payment = True
                commande.emp_val = user
                prix_action += commande.prix_de_tax
                commande.save()
                updated_commandes.append(commande.id)
            Actions.objects.create(
                agent=commande.emp_val, total_amount=prix_action, livreur=commande.livreur)

            return JsonResponse({'message': 'Commandes updated successfully', 'updated_commandes': updated_commandes}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
        except Exception as e:
            return JsonResponse({'error': "Probleme de connexion"}, status=500)
        except CustomUser.DoesNotExist:
            return JsonResponse({"eroor": "id user not valid"}, status=404)
    else:
        return JsonResponse({"eroor": "method not allow"}, status=405)


@api_view(["POST"])
@permission_classes([Ischefbureux])
def arret_casse(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            chef_bureux = CustomUser.objects.get(id=request.user.id)
            prix = data.get("prix")
            acompte = data.get("acompte")
            today = timezone.now().date()

            # Validation du prix
            if not prix:
                return JsonResponse({"message": "Le prix est requis"}, status=400)
            try:
                prix = Decimal(prix)
            except:
                return JsonResponse({"message": "Prix invalide"}, status=400)

            # Vérification de la caisse existante
            try:
                cassie_ajour = Cassie.objects.get(
                    chef_bu=chef_bureux,
                    date_creationn__date=today

                )
                if not cassie_ajour.etat:
                    return JsonResponse({"message": "La caisse est déjà fermée"}, status=409)
            except Cassie.DoesNotExist:
                return JsonResponse({"message": "Aucune caisse ouverte trouvée"}, status=404)

            # Logique de fermeture
            with transaction.atomic():
                # Calcul des résultats
                # livreurs = Livreur.objects.filter(
                #     partenneur__user__groupe=chef_bureux.groupe).first()
               
                # type = livreurs.partenneur.type_compte.name
                # if not livreurs.exists():
                #     return JsonResponse({"message": "Aucun livreur trouvé"}, status=404)

                # total = Commande.objects.filter(
                #     livreur__in=livreurs,
                #     valide_payment=True,

                # ).aggregate(total=Sum('delivery_price'))['total'] or 0

                prix_total = 0
                action = Actions.objects.filter(
                    agent__groupe=chef_bureux.id, date_action__icontains=today)
                for a in action:
                    prix_total += a.total_amount

                # # Mise à jour de la caisse
                # if livreurs.exists():
                #     tax_tawsile = livreurs.first().partenneur.type_compte.tax_tawsile
                #     cassie_ajour.resut = total * tax_tawsile / 100
                

                cassie_ajour.resut = prix_total
                cassie_ajour.etat = False
                cassie_ajour.prix_reale = prix
                cassie_ajour.a_compte = acompte
                cassie_ajour.manque = prix-prix_total
                cassie_ajour.save()

                # Révoquer les permissions
                CustomUser.objects.filter(groupe=chef_bureux.groupe).update(
                    permission_vlider=False)

            return JsonResponse({"message": "Caisse fermée avec succès"}, status=200)

        except Exception as e:
            return JsonResponse({"message": "Probleme de connexion"}, status=500)

    return JsonResponse({"message": "Méthode non autorisée"}, status=405)


@api_view(['GET'])
@permission_classes([IsComtable])
def get_all_casses(request):
    if request.method == "GET":
        try:
            # Get the queryset (including related `chef_bu`)
            queryset = Cassie.objects.select_related(
                "chef_bu").all().order_by("-id")
            date = request.GET.get("date", "")
            phone_number = request.GET.get("search", "")
            chef = request.GET.get("chef", "")
            approvie=request.GET.get("approvie", None)
            wilaya=request.GET.get("wilaya",None)
            groupe =request.GET.get("groupe", None)
           
            

            if date:
                queryset = queryset.filter(date_creationn__date=date)
            if phone_number:
                queryset = queryset.filter(
                    chef_bu__phone_number_1__icontains=phone_number)
            if chef:
                queryset = queryset.filter(chef_bu__id=chef)
            if approvie=="True":
                queryset = queryset.filter(approuve=True)
            if approvie=="False":
                
                queryset = queryset.filter(approuve=False)
            if wilaya : 
                queryset=queryset.filter(chef_bu__wilaya_code=wilaya)
            if groupe :
                queryset=queryset.filter (chef_bu__groupe__icontains=groupe)
            

            # Set up pagination with a default page size of 50
            paginator = PageNumberPagination()
            paginator.page_size = 20
            # Allow client to specify page size
            paginator.page_size_query_param = 'page_size'
            paginator.max_page_size = 100  # Max page size allowed

            # Ensure we pass the correct type of request
            if isinstance(request, Request):
                result_page = paginator.paginate_queryset(queryset, request)
            else:
                result_page = paginator.paginate_queryset(
                    queryset, request._request)

            # Serialize the paginated data
            serializer = CassierSerializer(result_page, many=True)

            # Return paginated response
            return paginator.get_paginated_response(serializer.data)

        except Cassie.DoesNotExist:
            # If no Cassie objects exist, return a 204 No Content response
            return Response({"message": "Cassies are empty"}, status=status.HTTP_204_NO_CONTENT)

        except Exception as e:
            # Handle any other errors that might occur
            print (f"eroooooor : {e}")
            return Response({"error": "Probleme de connexion"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Handle cases where the request method is not GET
    else:
        return Response({"error": "Method Not Allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(["PATCH"])
@csrf_exempt
@permission_classes([Ischefbureux])
def ouvri_la_casse(request):
    if request.method == "PATCH":
        try:
            today = timezone.now().date()
            chef = CustomUser.objects.get(id=request.user.id)

            # Vérifier s'il existe déjà une caisse pour aujourd'hui
            existing = Cassie.objects.filter(
                chef_bu=chef,
                date_creationn__date=today
            ).first()

            if existing:
                if existing.etat:
                    return JsonResponse({"message": "Une caisse est déjà ouverte"}, status=409)
                return JsonResponse({"message": "Une caisse fermée existe déjà pour aujourd'hui"}, status=409)

            # Création d'une nouvelle caisse
            Cassie.objects.create(
                chef_bu=chef,
                date_creationn=timezone.now(),
                etat=True,
                resut=0
            )

            # Mise à jour des permissions
            CustomUser.objects.filter(groupe=chef.groupe).update(
                permission_vlider=True)

            return JsonResponse({"message": "Caisse ouverte avec succès"}, status=200)
        except Exception as e:
            return JsonResponse({"message": "Probleme de connexion"}, status=500)


@csrf_exempt
@api_view(["GET"])
@permission_classes([Ischefbureux])
def commande_valide_payment_par_id_ajourduit(request):
    """
    View to fetch validated payments for a given group ID.
    """
    today = datetime.today().date()  # Get the current date

    if request.method == "GET":  # Correct method for JSON body parsing
        try:

            # Fetch associated Livreur objects
            livreurs = Livreur.objects.filter(
                partenneur__user__groupe=request.user.id)
            print(f"livreurs: {livreurs}")

            # Fetch Commande objects
            commandes = Commande.objects.filter(
                livreur__in=livreurs, valide_payment=True, created_at__date=today
            ).select_related("client").select_related("livreur").select_related('magasin').select_related("emp_val")

            # Serialize the data
            serializer = CommandeSerializer(commandes, many=True)
            return JsonResponse(serializer.data, safe=False, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data"}, status=400)

        except Exception as e:
            return JsonResponse({"error": f"An unexpected error occurred: {"Probleme de connexion"}"}, status=500)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


def inviattion(request):
    pass


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def decode_token(request):
    try:
        # Extract token and type from headers
        # Typically in format: "Bearer <token>"
        token = request.headers.get("Authorization")
        token_type = request.headers.get("Type")

        if not token or not token_type:
            return JsonResponse({"detail": "Token and token type are required"}, status=400)

        # Strip "Bearer " prefix if present
        if token.startswith("Bearer "):
            token = token.split(" ")[1]

        if token_type not in ["access", "refresh"]:
            return JsonResponse({"detail": "Invalid token type"}, status=400)

        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

        # Check the token type in the payload (for refresh tokens)
        if token_type == "refresh" and payload.get("type") != "refresh":
            return JsonResponse({"detail": "Invalid refresh token type"}, status=400)
        user_cible = CustomUser.objects.get(id=payload.get("user_id"))

        # Serialize the user data (no 'many=True' for a single object)
        serializer = CustomUserSerializer(user_cible)

        # Return the serialized user data
        return JsonResponse(serializer.data, status=200)

    except jwt.ExpiredSignatureError:
        return JsonResponse({"detail": "Token has expired"}, status=401)
    except jwt.InvalidTokenError:
        return JsonResponse({"detail": "Invalid token"}, status=401)
    except Exception as e:
        return JsonResponse({"detail": "probleme de connexion"}, status=500)
# historique des cassse par hcef de bureux



@api_view(['GET'])
@permission_classes([Ischefbureux])
def historique_de_cassie_par_chef_bureux(request):
    if request.method == "GET":
        try:
            if request.user.groupe is None or request.user.groupe =="" :
                return JsonResponse({"message":"you dont have permission "},status=404)
            # Retrieve Cassie objects filtered by the chef_bu's ID
            cassies = Cassie.objects.filter(chef_bu__id=request.user.groupe).select_related(
                "chef_bu").order_by("-date_creationn")
            # Expected format: YYYY-MM-DD
            search_date = request.GET.get('search_date')
            if search_date:
                try:
                    # Try parsing the date with both formats
                    if '-' in search_date:
                        search_date_obj = datetime.strptime(
                            search_date, '%Y-%m-%d').date()
                    else:
                        search_date_obj = datetime.strptime(
                            search_date, '%Y-%m-%d').date()

                    # Filter objects by the specified date
                    cassies = cassies.filter(
                        date_creationn__date=search_date_obj)
                except ValueError:
                    return Response({'error': 'Invalid date format. Use YYYY-MM-DD or YYYY/MM/DD.'}, status=status.HTTP_400_BAD_REQUEST)

            # Set up pagination: 50 items per page
            paginator = Paginator(cassies, 20)

            # Get the page number from the query parameters (defaults to 1 if not provided)
            page_number = request.GET.get('page', 1)
            page_obj = paginator.get_page(page_number)

            # Serialize the data
            serializer = CassierSerializer(page_obj, many=True)

            # Return the paginated response
            return Response({
                'count': paginator.count,
                'total_pages': paginator.num_pages,
                'current_page': page_obj.number,
                'results': serializer.data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'message': "probleme de connexion"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([Ischefbureux])
def liste_emplois_groupe_x(request):
    try:
        # Filter users based on the group
        
        emploiyers = CustomUser.objects.filter(
            Q(role="agent_administratif") | Q(role="chef_bureau"),
            groupe=request.user.id,
            bloquer=False
        )

        # Search query for filtering based on phone numbers
        search_query = request.query_params.get('search', '')
        if search_query:
            emploiyers = emploiyers.filter(
                Q(phone_number_1__icontains=search_query))

        # Paginate the results
        paginator = CustomPagination()
        paginated_emploiyers = paginator.paginate_queryset(emploiyers, request)

        # Serialize the data
        serializer = CustomUserSerializer(paginated_emploiyers, many=True)

        # Return paginated response
        return paginator.get_paginated_response(serializer.data)

    except CustomUser.DoesNotExist:
        return Response({"message": "Group not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["PATCH"])
@permission_classes([Ischefbureux | IsCentreappel])
def desactiver_account(request):
    try:
        if request.method == "PATCH":
            data = json.loads(request.body)
            id = data.get("id")
            etat=data.get("bloque")
            print(f"user id :{id}")
            customer = CustomUser.objects.get(id=id)
            if customer.bloquer == True:
                return JsonResponse({"message": "account est deja bloquer "}, status=404)
            customer.bloquer = True
            customer.save()
            return JsonResponse({"mesage": "account is desactivate "}, status=200)
    except CustomUser.DoesNotExist:
        return JsonResponse({"error": "user id not valide"}, status=404)
    else:
        return JsonResponse({"eroor": "method not allow"}, status=405)


@csrf_exempt
@api_view(["PUT"])
def put_customeruser(request):
    if request.method == "PUT":
        try:
            # Parse JSON body
            data = json.loads(request.body)
            # Sécurité : solde modifiable UNIQUEMENT par l'administrateur
            data.pop('solde', None)
            data.pop('confirm_password', None)
            data.pop('pass', None)
            user_id = data.get("id")

            if not user_id:
                return JsonResponse(
                    {"message": "User ID is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                user = CustomUser.objects.get(pk=user_id)
            except CustomUser.DoesNotExist:
                return JsonResponse(
                    {"error": "User not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Gestion sécurisée du mot de passe si fourni
            password = data.pop('password', None)
            if password:
                user.set_password(password)
                user.save()

            # Serialize and validate data
            serializer = CustomUserSerializer(user, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return JsonResponse(
                    {"message": "Utilisateur mis à jour avec succès", "user": serializer.data},
                    status=status.HTTP_200_OK
                )
            else:
                errors = serializer.errors
                first_field = next(iter(errors))
                if 'non_field_errors' in errors:
                    first_error = errors['non_field_errors'][0]
                else:
                    first_error = errors[first_field][0]

            return JsonResponse(
                {"message": str(first_error)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except json.JSONDecodeError:
            return JsonResponse(
                {"message": "Invalid JSON data."},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        return JsonResponse(
            {"message": "Method not allowed."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )


@api_view(["PATCH"])
@permission_classes([IsCentreappel])
def ajouter_groupe_pour_user(request):
    if request.method == "PATCH":
        try:
            data = json.loads(request.body)
            groupe = data.get("groupe", None)
            user_id = data.get("id")
            wilaya = data.get("wilaya", None)
            code_wilaya = data.get("code", None)

            # Temp logging to file
            try:
                with open(r"C:\Users\SMAHI\Documents\GitHub\frontend\debug_payload.json", "w") as df:
                    df.write(request.body.decode('utf-8'))
            except Exception as le:
                pass

            if not groupe or not user_id or not wilaya or not code_wilaya:
                # Add details of what was missing to the message for troubleshooting
                missing = []
                if not groupe: missing.append("groupe")
                if not user_id: missing.append("id")
                if not wilaya: missing.append("wilaya")
                if not code_wilaya: missing.append("code")
                return JsonResponse({"message": f"code et groupe et wilaya obligatoire. Missing: {', '.join(missing)}"}, status=400)

            try:
                user_groupe = CustomUser.objects.get(id=groupe)
            except (CustomUser.DoesNotExist, ValueError):
                return JsonResponse({"message": "groupe (chef bureau) non valide"}, status=404)

            try:
                user = CustomUser.objects.get(pk=user_id)
            except CustomUser.DoesNotExist:
                return JsonResponse({"message": "utilisateur non valide"}, status=404)

            user.groupe = str(groupe)
            user.wilaya = wilaya
            user.wilaya_code = code_wilaya
            user.groupe_name = user_groupe.groupe_name if user_groupe.groupe_name else f"Groupe {user_groupe.first_name or ''} {user_groupe.last_name or ''}".strip()

            user.save()
            return JsonResponse({"message": "vous avez ajouter le groupe a utilisateur"}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({"message": "Format JSON invalide"}, status=400)
        except Exception as e:
            return JsonResponse({"message": "Une erreur est survenue"}, status=500)
    else:
        return JsonResponse({"message": "method not allow"}, status=405)




@api_view(["GET"])
@permission_classes([IsCentreappel])
def get_all_chef_bureux(request):
    if request.method == "GET":
        try:
            chef_bureux = CustomUser.objects.filter(role="chef_bureau",is_active=True).only(
                "id", "first_name", "last_name", "email", "phone_number_1", "groupe")
            groupe=request.GET.get("groupe",None)
            wilaya=request.GET.get("wilaya",None)
            num=request.GET.get("search",None)
            if groupe :
                chef_bureux=chef_bureux.filter(groupe=groupe)
            if wilaya :
                chef_bureux=chef_bureux.filter(wilaya_code=wilaya)
            if num :
                chef_bureux=chef_bureux.filter(phone_number_1__icontains=num)
            
            # Pagination
            
            paginator = PageNumberPagination()
            paginator.page_size = 20  # Default page size
            paginated_chef_bureux = paginator.paginate_queryset(chef_bureux, request)
            
            serializer = CustomUserSerializer(paginated_chef_bureux, many=True)
            return paginator.get_paginated_response(serializer.data)
        except CustomUser.DoesNotExist:
            return JsonResponse({"message": "chef bureux not found "}, status=404)

    else:
        return JsonResponse({"message": "method not allow "}, status=405)


def generate_otp():
    return str(random.randint(100000, 999999))


@csrf_exempt
def send_sms(phone_number, message):
    # Ensure the method is POST

    try:
        # Parse JSON body from the request

        # Retrieve phone number and message from the request data

        # Ensure both 'num' and 'message' are present in the request
        if not phone_number or not message:
            return JsonResponse({"error": "Missing phone number or message"}, status=400)

        # Create connection to Infobip API
        conn = http.client.HTTPSConnection(
            "qdqrqq.api.infobip.com")  # Replace with your region

        # Construct the SMS payload
        payload = json.dumps({
            "from": "hamzaoui",  # Optional: Your sender ID
            "to": phone_number,
            "text": message
        })

        # Set up headers with API key for authorization
        headers = {
            # Replace with your Infobip API key
            'Authorization': 'App 15cac0e91ba1b1f1945553198610343d-f1247a49-f514-4bc6-978b-cfe8399deb7c',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        # Make the POST request to Infobip API to send the SMS
        conn.request("POST", "/sms/2/text/single", payload, headers)
        res = conn.getresponse()
        response_data = res.read().decode("utf-8")

        # Return the API response to the client
        return JsonResponse({"status": "success", "response": response_data}, status=200)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "probleme de connexion"}, status=500)


def check_sms_status(request, message_id):
    conn = http.client.HTTPSConnection(
        "qdqrqq.api.infobip.com")  # Replace with your region

    # Make the GET request to Infobip API to check message status
    conn.request("GET", f"/sms/2/text/advanced/status/{message_id}")

    headers = {
        # Replace with your Infobip API key
        'Authorization': 'App 15cac0e91ba1b1f1945553198610343d-f1247a49-f514-4bc6-978b-cfe8399deb7c',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    res = conn.getresponse()
    data = res.read().decode("utf-8")

    # Parse the response data
    response_data = json.loads(data)

    # Return the status of the message
    return JsonResponse({"status": "success", "response": response_data}, status=200)


@csrf_exempt
def auth_par_num(request):
    if request.method == "POST":
        try:
            # Parse the incoming JSON body
            data = json.loads(request.body)
            num = data.get("num")

            if not num:
                return JsonResponse({"error": "Phone number is required."}, status=400)

            # Generate OTP (One-Time Password)
            otp = generate_otp()
            print (f"otp is : {otp}")

            # Send the OTP to the user's phone number via SMS
            # Make sure your send_sms function is set up to send the OTP
            # send_sms(num, otp)
            send =send_message_iconttest(request,num,otp)
            # if send ==False :
            #     return JsonResponse({"message":"probleme de connexion "},status=500)
            
            OTP.objects.create(
                phone_number=num,
                code=otp,
                expired=timezone.now() + timedelta(minutes=5)
            )
            # Store OTP temporarily (e.g., in the session 
            # request.session['otp'] = otp
            # request.session['phone_number'] = num
            # # Set OTP expiry time (e.g., 5 minutes from now)
            # request.session['otp_expiry'] = (timezone.now() + timedelta(minutes=5)).isoformat()

            # Respond to the user that the OTP has been sent
            return JsonResponse({"message": "OTP sent to your phone number."}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format."}, status=400)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Only POST method is allowed."}, status=405)


@csrf_exempt
def verify_otp(request):
    if request.method == "POST":
        try:
            # Parse the incoming JSON body
            data = json.loads(request.body)
            user_otp = data.get("otp")
            phone_number = data.get("num")

            if not user_otp or not phone_number:
                return JsonResponse({"message": "OTP and phone number are required."}, status=400)
            
            try:
                opt = OTP.objects.filter(phone_number=phone_number).order_by('-expired').first()
            except OTP.DoesNotExist:
                return JsonResponse({"message": "OTP not found."}, status=400)

            # Check if the phone number and OTP match the stored values
            if opt.code and opt.phone_number and opt.expired:
                # Check if OTP is expired
                if timezone.now() > opt.expired:
                    return JsonResponse({"message": "OTP has expired."}, status=400)

                if user_otp == opt.code and phone_number == opt.phone_number:
                    # Find the user by phone number
                    try:
                        user = CustomUser.objects.get(phone_number_1=opt.phone_number)
                        for outstanding_token in OutstandingToken.objects.filter(user=user):
                            try:
                                BlacklistedToken.objects.get_or_create(token=outstanding_token)
                            except Exception:
                                pass
                    except CustomUser.DoesNotExist:
                        # Generate a unique 4-digit code
                        code = str(random.randint(1000, 9999))
                        username = f"tawsilstar{code}"
                        email = f"tawsilstar{code}@tawsilstar.dz"
                        password = f"tawsilstar{code}"

                        user = CustomUser.objects.create(
                            username=username,
                            email=email,
                            phone_number_1=opt.phone_number,
                            password=make_password(password),
                            role ='client',
                        )

                    # Blacklist all existing refresh tokens for this user
                      # Ignore if already blacklisted

                    # Create new tokens
                    refresh = RefreshToken.for_user(user)
                    access_token = refresh.access_token

                    access_token['role'] = user.role
                    access_token['type'] = 'access'
                    refresh['type'] = 'refresh'

                    response = JsonResponse({
                        "message": "OTP verified successfully.",
                        "access_token": str(access_token),
                        "refresh_token": str(refresh),
                        "user_id": user.id,
                        "role": user.role,
                        "name": user.first_name,
                        "last_name": user.last_name,
                        "email": user.email,
                    }, status=200)
                    
                    
                    return response

                return JsonResponse({"error": "Invalid OTP or phone number."}, status=400)

            return JsonResponse({"error": "OTP not found."}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format."}, status=400)

        except Exception as e:
            print (f"probleme is : {e}")
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Only POST method is allowed."}, status=405)


@api_view(["GET"])
@permission_classes([Iscommerciale])
def get_all_type_de_compte(request):
    if request.method == "GET":
        try:
            catalogue = Type_compte_partener.objects.all()
            serializer = TypeComptePartenerSerializer(catalogue, many=True)
            return JsonResponse(serializer.data, safe=False, status=200)
        except Type_compte_partener.DoesNotExist:
            return JsonResponse({"message": "catalogue not found "}, status=404)
    else:
        return JsonResponse({"message": "catalogue not found "}, status=405)


@api_view(["POST"])
@permission_classes([Iscommerciale])
def ajouter_type_compte(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            nom = data.get("nom")
            desc = data.get("descrption")
            tax = data.get("tax")

            if not nom or not desc or not tax:
                return JsonResponse({"message": "tout les infomations obliger  is required"}, status=400)

            Type_compte_partener.objects.create(
                name=nom, description=desc, tax_tawsile=tax)
            return JsonResponse({"message": "type compte is create"}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON format"}, status=400)
        except Exception as e:
            return JsonResponse({"error": "probleme de connexion"}, status=500)
    else:
        return JsonResponse({"message": "method not allow "}, status=405)


@api_view(["POST"])
@permission_classes([Iscommerciale])
def create_super_viseur(request):
    if request.method == "POST":
        try:
            data = request.data
            # Extract required data from query parameters
            
            # Create the serializer instance with the data
            data["role"]="superviseur"
            serializer = CustomUserSerializer(data=data)

            # Validate and save the user
            if serializer.is_valid():
                # Save the user, it will automatically create a superuser due to is_superuser=True
                serializer.save()
                return Response({
                    "message": "Super viseuur  created successfully.",

                }, status=status.HTTP_201_CREATED)
            else:
                errors = serializer.errors
                # Return serializer validation errors
                first_field = next(iter(serializer.errors))
                if 'non_field_errors' in errors:
                    first_error = errors['non_field_errors'][0]
                else:
                    # Get first field error
                    first_field = next(iter(errors))
                    first_error = errors[first_field][0]

                # If serializer validation fails
                    return Response({"message": str(first_error)}, status=status.HTTP_400_BAD_REQUEST)

        except ValidationError as e:
            return Response({"message": f"Validation error: {"probleme de connexion"}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # Catch any other unexpected errors
            return Response({"message": f"An unexpected error occurred: {"probleme de connexion"}"}, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response({'message': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(['GET'])
@permission_classes([Iscommerciale])
def all_livreur_account(request):
    if request.method == "GET":
        try:
            queryset = Livreur.objects.all().select_related("partenneur")
            serializer = LivreurSerializer(queryset, many=True)
            return JsonResponse(serializer.data, safe=False, status=200)

        except Livreur.DoesNotExist:
            return JsonResponse({"message": "livreur not foundd "}, status=404)
    else:
        return JsonResponse({"message": "method not allow "}, status=405)


@api_view(["PATCH"])
@permission_classes([Ischefbureux | IssuperVisseur | Iscommerciale | IsCentreappel])
def desactive_compte(request):
    try:
        if request.method == "PATCH":
            data = json.loads(request.body)
            user_id = data.get("id")
            

            # Vérifiez si l'utilisateur existe dans la base de données
            utilisateur_cible = CustomUser.objects.get(id=user_id)
            utilisateur_cible.is_active = False
            utilisateur_cible.save()
            Action_Superviseur.objects.create(
                superviseur=request.user,

            )  # Assurez-vous d'enregistrer les modifications

            return JsonResponse({"message": "Le compte est desactivé"}, status=200)

        else:
            return JsonResponse({"message": "Méthode non autorisée"}, status=405)

    except CustomUser.DoesNotExist:
        return JsonResponse({"message": "L'ID de l'utilisateur n'est pas valide"}, status=404)


class DailyUserRateThrottle(UserRateThrottle):
    rate = '5/day'



@api_view(["POST"])
@throttle_classes([DailyUserRateThrottle])
def send_confirmation_email(request):
    if request.method == "POST":
        try:
            # Parse the JSON data from the request body
            data = json.loads(request.body)

            # Extract the subject (obj) and message from the request data
            obj = data.get("obj")
            message = data.get("message")

            # If any required fields are missing, return an error response
            if not obj or not message:
                return JsonResponse({"message": "Both 'obj' and 'message' are required."}, status=400)

            # Prepare the email subject and body
            subject = f'{obj} '
            body = (
                f"Message from user:\n\n"
                f"{message}\n\n"
                f"Sender Details:\n"
                f"Email: {request.user.email}\n"
                f"Phone: {request.user.phone_number_1 or 'N/A'}"
            )

            # Recipient email list
            recipient_list = ["SupportDeveloppement@tawsilstar.dz"]

            # DNS resolution check (check if SMTP server is reachable)

            # Send the email using Django's send_mail function
            send_mail(
                subject,
                body,
                # Sender's email (configured in settings.py)
                settings.EMAIL_HOST_USER,
                recipient_list,
                fail_silently=False,
            )

            # Return a success response
            return JsonResponse({"message": "Email sent successfully."}, status=200)

        except Exception as e:
            # Catch any unexpected errors and return an error response
            return JsonResponse({"message": "probleme de connexion"}, status=500)

    # If the method is not POST, return a method not allowed response
    return JsonResponse({"message": "Invalid request method."}, status=405)


@csrf_exempt
def password_reset_request(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON format"}, status=status.HTTP_400_BAD_REQUEST)

        email = data.get("email")

        # Validate from_email

        if not email:
            return JsonResponse({"message": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return JsonResponse({"message": "Email does not exist"}, status=status.HTTP_404_NOT_FOUND)

        # Generate token and URL
        token = default_token_generator.make_token(user)
        uid = user.id
        frontend_url = getattr(


            settings, "FRONTEND_RESET_URL", "https://platforme.tawsilstar.dz/")


        reset_url = f"{frontend_url}/reset-password/?uid={uid}&token={token}"

        # Send email
        try:
            send_mail(
                subject="Password Reset Request",
                message=f"Click here to reset your password: {reset_url}",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return JsonResponse({"message": "Password reset email sent successfully"}, status=200)
        except Exception as e:
            print (f"proble is {str(e)}")
            return JsonResponse({"message":str(e)}, status=500)

    return JsonResponse({"message": "Method not allowed"}, status=405)

@csrf_exempt
def password_reset_request_otp(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")

            if not email:
                return JsonResponse({"message": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                return JsonResponse({"message": "Email does not exist"}, status=status.HTTP_404_NOT_FOUND)

            # Generate OTP
            otp = generate_otp()
            # request.session['otp'] = otp
            # request.session['email'] = email
            print (f"opt is {otp}")
            user.otp_code=otp
            user.otp_expiry = timezone.now() + timedelta(hours=1)
            user.save()

            # Send OTP via email
            send_mail(
                subject="Password Reset OTP",
                message=f"Your OTP for password reset is: {otp}",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=False,
            )
            return JsonResponse({"message": "OTP sent to your email successfully"}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON format"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return JsonResponse({"message": "An error occurred"}, status=500)

    return JsonResponse({"message": "Method not allowed"}, status=405)
@csrf_exempt
def verfie_otp(request):
    if request.method=="POST":
        try :
            data=json.loads(request.body)
            otp=data.get("otp")
            email=data.get("email")
            user =CustomUser.objects.get(email=email)

            if user.otp_code != otp:
                return JsonResponse({"message": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

            # Check if OTP is expired
            if timezone.now() > timezone.localtime(user.otp_expiry):
                print(f'time zone is : {timezone.localtime(timezone.now())}')
                return JsonResponse({"message": "OTP has expired"}, status=status.HTTP_400_BAD_REQUEST)
          
        except CustomUser.DoesNotExist :
            return JsonResponse({"message":'email not valide'},status=404)
        return JsonResponse({"message":"otp is valide"},status=200)
    else :
        return JsonResponse({"message":"method not allow "},status=405)
        

@csrf_exempt
def update_password_by_otp(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            otp=data.get("otp")
            email = data.get("email")
            new_password = data.get("new_password")
            confirm_password = data.get("confirm_password")
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                return JsonResponse({"message": "Email does not exist"}, status=status.HTTP_404_NOT_FOUND)
            if otp!=user.otp_code or timezone.now() > timezone.localtime(user.otp_expiry) :
                return JsonResponse({"message":"otp not valide "} ,status=400)
            
            # Ensure all required fields are present
            if  not new_password or not confirm_password:
                return JsonResponse({"message": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

            # Check if the passwords match
            if new_password != confirm_password:
                return JsonResponse({"message": "Passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)

            

            # Check if OTP is valid
            

            # Reset password
            user.set_password(new_password)  # This hashes the password
            user.otp_code = ""  # Clear the OTP after successful reset
            user.otp_expiry = None  # Clear the OTP expiry time
            user.save()

            return JsonResponse({"message": "Password reset successfully"}, status=200)

        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON format"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return JsonResponse({"message": "An error occurred: " + str(e)}, status=500)

    return JsonResponse({"message": "Method not allowed"}, status=405)



@csrf_exempt
def reset_password(request):

    data = json.loads(request.body)
    token = data.get('token')
    uid = data.get("uid")

    new_password = data.get('new_password')

    if not all([token, uid, new_password]):
        return JsonResponse({"message": "lient invalide ou expiré"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = CustomUser.objects.get(pk=uid)
    except CustomUser.DoesNotExist:
        return JsonResponse({"message": "Utilisateur pas valide"}, status=status.HTTP_404_NOT_FOUND)

    token_generator = PasswordResetTokenGenerator()
    if not token_generator.check_token(user, token):
        return JsonResponse({"message": "lient invalide ou expiré"}, status=status.HTTP_400_BAD_REQUEST)

    # Reset password
    user.set_password(new_password)
    user.save()

    return JsonResponse({"message": "Le mot de passe a été réinitialisé avec succès"}, status=status.HTTP_200_OK)


@csrf_exempt
def verifie_token(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            token = data.get("token")
            uid = data.get("uid")
            if token is None or uid is None :
                return JsonResponse({"message":"lien incorrect"},status=404)


            try:
                user = CustomUser.objects.get(id=uid)
            except CustomUser.DoesNotExist:
                return JsonResponse(
            {"message": "user id not found or invalide"},
            status=404
                    )



            token_generator = PasswordResetTokenGenerator()
            user = CustomUser.objects.get(id=uid)
            
            if not token_generator.check_token(user, token):
                return JsonResponse({"message": "token invalide or expried"}, status=404)
            return JsonResponse({"message": "token is valide "}, status=200)
        except Exception as e:
            return JsonResponse({"message": "probleme de connexion"}, status=500)


        


    else:
        return JsonResponse({"message": "method not allow "}, status=405)


@api_view(['GET'])
@permission_classes([Iscommerciale])
def liste_super_viseur(request):
    try:

        emploiyers = CustomUser.objects.filter(role="superviseur")

        # Search query for filtering based on phone numbers
        search_query = request.query_params.get('search', '')
        if search_query:
            emploiyers = emploiyers.filter(
                Q(phone_number_1__icontains=search_query))

        # Paginate the results
        paginator = CustomPagination()
        paginated_emploiyers = paginator.paginate_queryset(emploiyers, request)

        # Serialize the data
        serializer = CustomUserSerializer(paginated_emploiyers, many=True)

        # Return paginated response
        return paginator.get_paginated_response(serializer.data)

    except CustomUser.DoesNotExist:
        return Response({"error": "Group not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([Iscommerciale | IssuperVisseur |IsCentreappel])
def get_all_partner_superviseur(request):
    if request.method == "GET":

        # Retrieve the search query, wilaya, and is_active filter values
        # Search text for phone number
        search_query = request.GET.get('search', '')
        wilaya = request.GET.get('wilaya', '')  # Filter by wilaya (region)
        is_active = request.GET.get('is_active', None)
        type_compte = request.GET.get("type_compte", None)
        groupe = request.GET.get("groupe", None)
        print(f'type de account is :{type_compte}')
        # Filter by is_active status (True/False)
        

        # Start with a base queryset

        queryset = Partenneur.objects.all().select_related("user","vihucule","type_partener","type_compte").order_by("-id")



        # Filter based on search query if provided
        if search_query:
            queryset = queryset.filter(
                Q(user__phone_number_1__icontains=search_query))

        # Filter by wilaya if provided
        if wilaya:
            wilaya = wilaya.lower()
            # Assuming you have a wilaya field
            queryset = queryset.filter(Q(user__wilaya_code=wilaya))

        # Filter by is_active status if provided
        if is_active is not None:
            # Convert string 'true'/'false' to boolean
            is_active = is_active.lower() == 'true'
            queryset = queryset.filter(user__is_active=is_active)
        if type_compte is not None and type_compte != "":
            print(f'type de account is :{type_compte}')
            queryset = queryset.filter(type_compte=type_compte)
        if groupe:
            queryset = queryset.filter(user__groupe=groupe)

        # Paginate results
        paginator = PageNumberPagination()
        paginator.page_size = 20  # Adjust page size as needed
        paginated_queryset = paginator.paginate_queryset(queryset, request)

        # Serialize the data
        serializer = PartenneurSerializer(paginated_queryset, many=True)

        # Return paginated response
        return paginator.get_paginated_response(serializer.data)

    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)


@api_view(['POST'])
@permission_classes([IssuperVisseur])
def create_rapport(request):
    """
    Create a new Rapport record.
    Assumes that the request body includes 'superviseur', 'parteneur', and 'description'.
    """
    if request.method == "POST":
        # Get the data from the request

        parteneur_data = request.data.get('parteneur', None)
        message = request.data.get("message")

        # Check if the required data is provided
        if not parteneur_data or not message:
            return JsonResponse({"message": "Données requises manquantes"}, status=400)

        # Get the superviseur (CustomUser) and parteneur objects
        try:

            parteneur = get_object_or_404(Partenneur, pk=parteneur_data['id'])
        except CustomUser.DoesNotExist:
            return JsonResponse({"message": "Superviseur not found"}, status=404)
        except Partenneur.DoesNotExist:
            return JsonResponse({"message": "Parteneur not found"}, status=404)

        # Create the new Rapport object
        rapport = Rapport.objects.create(
            superviseur=request.user,
            parteneur=parteneur,
            message=message
        )

        # Serialize the created Rapport object to return the response
        serializer = RaportSerilzer(rapport)

        # Return the created object data
        return JsonResponse({"message": "le rapport est creé"}, status=201)

    return JsonResponse({"error": "Invalid method"}, status=405)


@api_view(['GET'])
@permission_classes([IssuperVisseur])
def liste_rapport_pour_super_visssur(request):
    """
    List reports for the logged-in superviseur with pagination and search by date.
    """
    try:
        if request.method == "GET":
            # Get query parameters for date filtering
            start_date = request.GET.get('start_date', None)
            end_date = request.GET.get('end_date', None)

            # Filter reports based on supervisor (logged-in user)
            query_set = Rapport.objects.filter(superviseur=request.user).select_related(
                "parteneur", "superviseur").order_by("-id")

            # Apply date filter if provided
            if start_date:
                start_date = parse_datetime(start_date)
                if start_date:
                    query_set = query_set.filter(date__gte=start_date)

            if end_date:
                end_date = parse_datetime(end_date)
                if end_date:
                    query_set = query_set.filter(date__lte=end_date)

            # Pagination setup
            paginator = PageNumberPagination()
            paginator.page_size = 20  # You can adjust the page size here
            paginated_queryset = paginator.paginate_queryset(
                query_set, request)
            
            

            # Serialize the data
            serializer = RaportSerilzer(paginated_queryset, many=True)

            # Return paginated response
            return paginator.get_paginated_response(serializer.data)
    except Exception as e:
        return JsonResponse({"error": "probleme de connexion"})


@api_view(['PUT'])
@permission_classes([Iscommerciale])
def update_type_compte_partener(request):
    try:
        # Retrieve the instance by primary key
        data = json.loads(request.body)
        id = data.get("id")
        partner_type = Type_compte_partener.objects.get(id=id)
    except Type_compte_partener.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    # Serialize and validate the input data
    serializer = TypeComptePartenerSerializer(
        partner_type, data=request.data, partial=False)

    if serializer.is_valid():
        serializer.save()  # Save the updated instance
        return Response({"message": "Type de compte mis à jour avec succès"}, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)





@api_view(["GET"])
@permission_classes([Iscommerciale])
def get_all_partner_for_commerciale(request):
    """
    Récupérer tous les partenaires pour un utilisateur commercial.

    Cette fonction gère les requêtes GET pour récupérer tous les partenaires pour un utilisateur commercial.
    Elle applique des filtres pour la recherche, le type_partenaire, valide et le groupe.
    La fonction utilise l'ORM Django pour interroger la base de données et pagine les résultats.

    Paramètres:
    request (HttpRequest): L'objet de requête HTTP contenant les paramètres de filtres et de pagination.

    Retourne:
    JsonResponse: Une réponse paginée contenant les données sérialisées des partenaires filtrés.
    """
    if request.method == "GET":
        # Récupérer les filtres de recherche et type_partenaire de la requête
        search_query = request.GET.get('search', '').strip()
        type_partener_filter = request.GET.get('type_partener', '').strip()
        valide = request.GET.get("valide", "").strip()
        # Récupérer le type_partenaire de la requête
        groupe = request.GET.get("groupe", "").strip()

        print(f'ID utilisateur : {request.user.id}')

        # Base queryset pour Partenneur



        queryset = Partenneur.objects.all().select_related(
            "user", "vihucule", "type_partener", "type_compte"
        ).order_by("-id")



        if search_query:
            queryset = queryset.filter(
                Q(user__phone_number_1__icontains=search_query))

        if type_partener_filter:
            queryset = queryset.filter(type_compte__id=type_partener_filter)
        if groupe:
            queryset = queryset.filter(user__groupe=groupe)


        paginator = PageNumberPagination()
        paginator.page_size = 20
        paginated_queryset = paginator.paginate_queryset(
            queryset, request, view=None)



        # Sérialiser les données
        serializer = PartenneurSerializer(paginated_queryset, many=True)

        # Retourner la réponse paginée
        return paginator.get_paginated_response(serializer.data)

    else:
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)






@api_view(["GET"])
@permission_classes([IsCentreappel | IsComtable | IsOwnerOrAdmin | Iscommerciale])
def get_all_groupe_par_tlemcen(request):
    if request.method == "GET":
        try:
            wilaya = ""
            if request.body:
                try:
                    data = json.loads(request.body)
                    wilaya = data.get("wilaya", "")
                except json.JSONDecodeError:
                    pass
            if not wilaya:
                wilaya = request.GET.get("wilaya", "")

            if not wilaya:
                return JsonResponse({"message": "wilaya code obligatoire"}, status=400)

            queryset = CustomUser.objects.filter(
                wilaya_code=wilaya, role="chef_bureau", is_active=True
            )

            groupes = []
            for user in queryset:
                g_id = user.groupe if user.groupe else str(user.id)
                g_name = user.groupe_name if user.groupe_name else f"Groupe {user.first_name or ''} {user.last_name or ''}".strip()
                groupes.append({
                    "groupe": g_id,
                    "wilaya": user.wilaya,
                    "groupe_name": g_name
                })

            # Deduplicate by group identifier
            seen = set()
            unique_groupes = []
            for g in groupes:
                if g["groupe"] not in seen:
                    seen.add(g["groupe"])
                    unique_groupes.append(g)

            return JsonResponse({"message": "success", "data": unique_groupes}, status=200)

        except Exception as e:
            return JsonResponse({"message": "Probleme de connexion"}, status=500)
    else:
        return JsonResponse({"message": "Method not allowed"}, status=405)








@csrf_exempt
def send_contact_email(request):
    """
    Cette fonction envoie un e-mail à un destinataire spécifié en utilisant les données fournies.


    Paramètres:
    request (HttpRequest): L'objet de requête HTTP contenant les données de l'e-mail.


    Retourne:
    JsonResponse: Une réponse JSON indiquant le succès ou l'échec du processus d'envoi de l'e-mail.
    """
    if request.method == "POST":
        try:
            # Analyser les données JSON du corps de la requête
            data = json.loads(request.body)

            # Extraire les champs requis



            name = data.get("name")
            email = data.get("email")
            obj = data.get("object")
            message = data.get("message")


            # Si des champs requis sont manquants, renvoyer une réponse d'erreur
            if not obj or not message or not email or not name:
                return JsonResponse(
                    {"message": "Les champs 'object', 'message', 'email' et 'name' sont obligatoires."},
                    status=400,
                )

            # Préparer le sujet et le corps de l'e-mail
            subject = f"{obj}"
            body = f"Nom: {name}\nEmail: {email}\n\nMessage:\n{message}"

            # Liste des destinataires
            recipient_list = ["contact@tawsilstar.dz","wailammar651@gmail.com"]

            # Créer l'e-mail


            email_message = EmailMessage(
                subject=subject,
                body=body,
                from_email="contact@tawsilstar.dz",
                to=recipient_list,
            )


            print(f"{os.getenv("DEFAULT_FROM_EMAIL_2")}")
            print(f"{os.getenv("EMAIL_HOST_PASSWORD_2")}")
            try :
                # Utiliser les paramètres SMTP personnalisés pour le deuxième e-mail

                with smtplib.SMTP_SSL("mail.tawsilstar.dz", 465) as connection:
                    connection.login("contact@tawsilstar.dz",
                                    os.getenv("EMAIL_HOST_PASSWORD_2"))
                    email_message.send(fail_silently=False)
                  
            except Exception as e :
                return JsonResponse({"message": "probleme de connexion"}, status=500)


            # Renvoyer une réponse de succès
            return JsonResponse({"message": "E-mail envoyé avec succès "}, status=200)

        except Exception as e:
            # Capturer toutes les erreurs inattendues et renvoyer une réponse d'erreur
            return JsonResponse({"message": "probleme de connexion"}, status=500)

    # Si la méthode n'est pas POST, renvoyer une réponse de méthode non autorisée
    return JsonResponse({"message": "Méthode de requête invalide."}, status=405)






@api_view(['PATCH'])
@permission_classes([IsComtable])
def appruvie_la_casse(request):
    """
    Approuve un objet Cassie.

    Cette fonction gère les requêtes PATCH pour approuver un objet Cassie. Elle extrait l'ID Cassie à partir du corps de la requête,
    récupère l'objet Cassie de la base de données, définit son champ 'approuve' à True, et enregistre les modifications.

    Paramètres:
    request (HttpRequest): L'objet de requête HTTP contenant l'ID Cassie dans son corps.

    Retourne:
    JsonResponse: Une réponse JSON indiquant le résultat de l'opération.
        - Si l'opération réussit, retourne un code de statut 200 avec un message indiquant que la Cassie est approuvée.
        - Si l'objet Cassie n'est pas trouvé, retourne un code de statut 404 avec un message indiquant que la Cassie n'a pas été trouvée.
        - Si il y a un problème avec le format JSON dans le corps de la requête, retourne un code de statut 400 avec un message indiquant que le format JSON est incorrect.
        - Si la méthode de requête n'est pas PATCH, retourne un code de statut 405 avec un message indiquant que la méthode n'est pas valide.
    """
    if request.method == "PATCH":
        try:
            data = json.loads(request.body)
            cassie_id = data.get("cassie_id")
            cassie = Cassie.objects.get(id=cassie_id)
            cassie.approuve = True
            cassie.save()
            return JsonResponse({"message": "Cassie approuvée"}, status=200)
        except Cassie.DoesNotExist:
            return JsonResponse({"message": "Cassie introuvable"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"message": "Format JSON non valide dans le corps de la requête"}, status=400)
        except Exception as e:
            return JsonResponse({"message": "probleme de connexion"}, status=500)
    else:
        return JsonResponse({"message": "Méthode non valide"}, status=405)


@api_view(['GET'])
@permission_classes([IssuperVisseur])
def get_all_demmandeflixy_de_superviseur(request):
    """
    Récupérer toutes les demandes Flixy non approuvées pour le superviseur.

    Cette fonction gère les requêtes GET pour récupérer toutes les demandes Flixy non approuvées pour le superviseur.
    Elle filtre le queryset en fonction du superviseur, de l'état et de la date_de_creation.
    La fonction configure également la pagination avec une taille de page par défaut de 20.

    Paramètres:
    request (HttpRequest): L'objet de requête HTTP contenant les paramètres de filtrage et de pagination.

    Retourne:
    JsonResponse: Une réponse JSON contenant les données paginées des demandes Flixy non approuvées.
        - Si aucune demande Flixy non approuvée n'est trouvée, elle retourne un code de statut 404 avec un message indiquant qu'aucune demande Flixy non approuvée n'a été trouvée.
        - Si une erreur se produit pendant le processus de récupération, elle retourne un code de statut 500 avec le message d'erreur.
        - Si la méthode de requête n'est pas GET, elle retourne un code de statut 405 avec un message indiquant que la méthode n'est pas valide.
    """
    if request.method == "GET":
        try:
            queryset = Flixy.objects.filter(superviseur=request.user).select_related(
                "superviseur").order_by("-id")
            etat = request.GET.get("etat")
            date = request.GET.get("date")
            if etat is not None:
                queryset = queryset.filter(etat=etat)
            if date is not None:
                queryset = queryset.filter(date_de_creation__icontains=date)

            # Configuration de la pagination avec une taille de page par défaut de 20
            paginator = PageNumberPagination()
            paginator.page_size = 20
            paginator.page_size_query_param = 'page_size'
            paginator.max_page_size = 100

            # Assurez-vous de passer le bon type de requête
            if isinstance(request, Request):
                result_page = paginator.paginate_queryset(queryset, request)
            else:
                result_page = paginator.paginate_queryset(
                    queryset, request._request)

            # Sérialiser les données paginées
            serializer = FlixySelezers(result_page, many=True)

            # Retourner la réponse paginée
            return paginator.get_paginated_response(serializer.data)

        except Flixy.DoesNotExist:
            return JsonResponse({"message": "Aucune demande Flixy non approuvée trouvée"}, status=404)

        except Exception as e:
            return JsonResponse({"message": "probleme de connexion"}, status=500)

    else:
        return JsonResponse({"message": "Méthode non valide"}, status=405)


@api_view(['PATCH'])
@permission_classes([IsComtable])
def approuver_cassie(request):
    """
    Approuve un objet Cassie.

    Cette fonction gère les requêtes PATCH pour approuver un objet Cassie. Elle extrait l'ID Cassie à partir du corps de la requête,
    récupère l'objet Cassie de la base de données, définit son champ 'approuve' à True, et enregistre les modifications.

    Paramètres:
    request (HttpRequest): L'objet de requête HTTP contenant l'ID Cassie dans son corps.

    Retourne:
    JsonResponse: Une réponse JSON indiquant le résultat de l'opération.
        - Si l'opération réussit, retourne un code de statut 200 avec un message indiquant que la Cassie est approuvée.
        - Si l'objet Cassie n'est pas trouvé, retourne un code de statut 404 avec un message indiquant que la Cassie n'a pas été trouvée.
        - Si il y a un problème avec le format JSON dans le corps de la requête, retourne un code de statut 400 avec un message indiquant que le format JSON est incorrect.
        - Si une erreur se produit pendant l'opération, retourne un code de statut 500 avec le message d'erreur.
    """
    if request.method == "PATCH":
        try:
            data = json.loads(request.body)
            cassie_id = data.get("cassie_id")
            cassie = Cassie.objects.get(id=cassie_id)
            cassie.approuve = True
            cassie.save()
            return JsonResponse({"message": "Cassie approuvée"}, status=200)
        except Cassie.DoesNotExist:
            return JsonResponse({"message": "Cassie introuvable"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"message": "Format JSON non valide dans le corps de la requête"}, status=400)
        except Exception as e:
            return JsonResponse({"message": "probleme de connexion"}, status=500)
    else:
        return JsonResponse({"message": "Méthode non valide"}, status=405)


@api_view(["PATCH"])
@permission_classes([Isvtc |IssuperVisseur])
def Change_etat_flyxy(request):
    """
    Met à jour l'état d'un objet Flixy.

    Cette fonction gère les requêtes PATCH pour mettre à jour l'état d'un objet Flixy. Elle extrait l'ID Flixy, le nouvel état et le montant optionnel à envoyer à partir du corps de la requête. Elle met ensuite à jour l'objet Flixy avec le nouvel état et le montant.

    Paramètres:
    request (HttpRequest): L'objet de requête HTTP contenant l'ID Flixy, le nouvel état et le montant optionnel à envoyer dans le corps de la requête.

    Retourne:
    JsonResponse: Une réponse JSON indiquant le résultat de l'opération.
        - Si l'opération réussit, elle retourne un code de statut 200 avec un message indiquant que l'état du Flixy a été mis à jour.
        - Si l'objet Flixy n'est pas trouvé, elle retourne un code de statut 404 avec un message indiquant que le Flixy n'a pas été trouvé.
        - Si il y a un problème avec le format JSON dans le corps de la requête, elle retourne un code de statut 400 avec un message indiquant que le format JSON est incorrect.
        - Si la méthode de requête n'est pas PATCH, elle retourne un code de statut 405 avec un message indiquant que la méthode n'est pas valide.
    """
    if request.method == "PATCH":
        try:
            data = json.loads(request.body)
            flixy_id = data.get("flixy_id")
            etat = data.get("etat")
            some_a_envoye = data.get("some_a_envoye", 0)
            flixy = Flixy.objects.get(id=flixy_id)
            flixy.etat = etat
            if request.user.role =="validation_vtc" :
                flixy.centre_appel=request.user
            
            
            
            flixy.somme_a_envoye = some_a_envoye
            flixy.save()
            return JsonResponse({"message": "État du demmande modifié"}, status=200)

        except Flixy.DoesNotExist:
            return JsonResponse({"message": "demmande id  introuvable"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"message": "Format JSON non valide dans le corps de la requête"}, status=400)
    else:
        return JsonResponse({"message": "Méthode non valide"}, status=405)


@api_view(['POST'])
@permission_classes([IssuperVisseur])
def demande_flyxsi(request):
    """
    Crée une demande Flixy pour le superviseur connecté. Cette fonction gère les demandes POST pour créer une nouvelle demande Flixy pour le superviseur connecté. Si une demande Flixy est déjà en attente pour ce superviseur, une erreur 400 est retournée.
    Paramètres:
    request (HttpRequest): L'objet de requête HTTP contenant les données de la demande Flixy sous forme de JSON. Les données attendues sont décrites dans la documentation de la classe de sérialisation FlixySelezers.
    Retourne:
    JsonResponse: Une réponse JSON indiquant le résultat de l'opération. En cas de succès, retourne un code de statut 201 avec l'ID de la demande Flixy créée et un message de confirmation. En cas d'échec, retourne un code de statut 400 avec un message d'erreur indiquant que le superviseur a déjà une demande Flixy en attente.
    Lève:
    json.JSONDecodeError: S'il y a un problème de décodage du JSON dans le corps de la requête.
    """
    if request.method == "POST":
        try:
            data=json.loads(request.body)
            somme=data.get("somme",None)
            last_flixy = Flixy.objects.filter(
                superviseur=request.user).order_by('-date_de_creation').first()
            if last_flixy and last_flixy.etat == "en_attente":
                return JsonResponse({"message": "Vous avez déjà une demande Flyxy en attente"}, status=400)
            if somme is None :
                return JsonResponse({"message":"enter la somme "},status=404)
            Flixy.objects.create(superviseur=request.user,somme=somme)
            return JsonResponse({"message": "Demande Flyxy créée avec succès"}, status=201)
           
            
        except Exception as e:
            return JsonResponse({"message": "Probleme de connexion"}, status=500)
    else:
        return JsonResponse({"message": "Invalid method"}, status=405)


@api_view(['GET'])
@permission_classes([Isvtc])
def get_all_demmandeflixy_de_cetre_appel(request):
    """
    Récupère toutes les demandes Flixy pour le centre d'appel avec un filtrage optionnel par état et date.

    Cette fonction gère les requêtes GET pour récupérer toutes les demandes Flixy, filtrées optionnellement par leur état et date de création.
    Les résultats sont paginés et retournés sous forme de réponse JSON.

    Paramètres:
    request (HttpRequest): L'objet de requête HTTP contenant les paramètres de requête optionnels 'etat' et 'date' pour le filtrage.

    Retourne:
    JsonResponse: Une réponse JSON paginée contenant les demandes Flixy sérialisées.
        - En cas de succès, retourne un code de statut 200 avec les données paginées.
        - Si aucune demande Flixy n'est trouvée, retourne un code de statut 404 avec un message d'erreur.
        - En cas d'erreur, retourne un code de statut 500 avec le message d'erreur.
        - Si la méthode de requête n'est pas GET, retourne un code de statut 405 avec un message d'erreur.
    """
    if request.method == "GET":
        try:
            queryset = Flixy.objects.all().select_related(
                "superviseur").order_by("-id")
            etat = request.GET.get("etat")
            date = request.GET.get("date")

            tel = request.GET.get("search")
            if etat :
                queryset = queryset.filter(etat=etat)
            if date :
                queryset = queryset.filter(date_de_creation__icontains=date)
            if tel :

                queryset= queryset.filter(superviseur__phone_number_1__icontains=tel)



            # Configuration de la pagination avec une taille de page par défaut de 20
            paginator = PageNumberPagination()
            paginator.page_size = 20
            paginator.page_size_query_param = 'page_size'
            paginator.max_page_size = 100

            # Assurez-vous de passer le bon type de requête
            if isinstance(request, Request):
                result_page = paginator.paginate_queryset(queryset, request)
            else:
                result_page = paginator.paginate_queryset(
                    queryset, request._request)

            # Sérialiser les données paginées

            serializer = FlixySelezers(result_page, many=True)

            # Retourner la réponse paginée
            return paginator.get_paginated_response(serializer.data)

        except Flixy.DoesNotExist:
            return JsonResponse({"message": "Aucune demande Flixy non approuvée trouvée"}, status=404)

        except Exception as e:
            return JsonResponse({"message": "probleme de connexion"}, status=500)

    else:
        return JsonResponse({"message": "Méthode non valide"}, status=405)


@api_view(["PATCH"])
@permission_classes([IssuperVisseur])
def approvie_flixy(request):
    """
    Approuve une demande Flixy par un superviseur.

    Cette fonction gère l'approbation d'une demande Flixy. Elle met à jour le champ 'appouvie_par_super_v'
    de l'objet Flixy à True, indiquant qu'il a été approuvé par un superviseur.

    Paramètres:
    request (HttpRequest): L'objet de requête HTTP contenant l'ID Flixy dans son corps.

    Retourne:
    JsonResponse: Une réponse JSON indiquant le résultat de l'opération.
        - En cas de succès, retourne un code de statut 200 avec un message de réussite.
        - Si l'objet Flixy n'est pas trouvé, retourne un code de statut 404 avec un message d'erreur.
        - S'il y a un problème avec l'analyse JSON, retourne un code de statut 400 avec un message d'erreur.
        - Si la méthode HTTP n'est pas POST, retourne un code de statut 405 avec un message d'erreur.


    Flixy.DoesNotExist: Si l'objet Flixy avec l'ID donné n'est pas trouvé.
    json.JSONDecodeError: S'il y a un problème de décodage du JSON dans le corps de la requête.
    """
    if request.method == "PATCH":
        try:
            data = json.loads(request.body)
            flixy_id = data.get("flixy_id")

            flixy = Flixy.objects.get(id=flixy_id)
            flixy.appouvie_par_super_v = True
            flixy.save()
            return JsonResponse({"message": "le demande est approvie"}, status=200)
        except Flixy.DoesNotExist:
            return JsonResponse({"message": "la demmande  id pas valide"}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON format in request body"}, status=400)
    else:
        return JsonResponse({"message": "method pas valide"}, status=405)

@api_view(["GET"])
@permission_classes([Isvtc])
def get_number_action_de_centre_appel (request) :
    if request.method == "GET":
        try:
            queryset = Flixy.objects.filter(etat="en_attente").select_related("centre_appel")
            
            
            return JsonResponse({"message": "Nombre d'action en attente :", "number":queryset.count()}, status=200)
        except Exception as e:
            return JsonResponse({"message": "probleme de connexion"}, status=500)
    else :
        return JsonResponse({"message":"method pas valide "},status=405)
@api_view(["GET"])
@permission_classes([Isvtc])
def get_actions_ce_centre_appel_centre_appel(request): 
 if request.method == "GET":
        try:
            queryset = Actions_centre_appel_flixy.objects.all().select_related(
                "centre_appel","superviseur").order_by("-id")
            etat = request.GET.get("etat")
            date = request.GET.get("date")
            phone=request.GET.get("search")
            print (f"")
            if etat :
                queryset = queryset.filter(etat=etat)
            if date :
                queryset = queryset.filter(data_de_creation__icontains=date)
              
            if phone :

                queryset = queryset.filter(superviseur__phone_number_1__icontains=phone)


            # Configuration de la pagination avec une taille de page par défaut de 20
            paginator = PageNumberPagination()
            paginator.page_size = 20
            paginator.page_size_query_param = 'page_size'
            paginator.max_page_size = 100

            # Assurez-vous de passer le bon type de requête
            
            result_page = paginator.paginate_queryset(queryset, request)
           

            # Sérialiser les données paginées

            serializer = Action_flixySelezers(result_page,many=True)

            # Retourner la réponse paginée
            return paginator.get_paginated_response(serializer.data)

        except Flixy.DoesNotExist:
            return JsonResponse({"message": "Aucune demande Flixy non approuvée trouvée"}, status=404)

        except Exception as e:
            return JsonResponse({"message": "probleme de connexion"}, status=500)

 else:

        return JsonResponse({"message": "Méthode non valide"}, status=405)

from asgiref.sync import async_to_sync
from django.db.models.functions import TruncMonth, TruncDay
from calendar import monthrange
import requests
import random
from datetime import timedelta
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

def check_redis(request):
    try:
        # Try sending a test message to the Redis channel layer
        channel_layer = get_channel_layer()
        
        # Sending a test message to a random channel (optional for testing)
        async_to_sync(channel_layer.send)("test_channel", {"type": "chat.message", "message": "Test message"})
        
        return JsonResponse({"status": "success", "message": "Redis connection successful!"})
    except Exception as e:
        return JsonResponse({"status": "error", "message": f"Failed to connect to Redis: {"probleme de connexion"}"})
def download_file(request, file_name):
    # Construct the absolute file path; ensure that file_name is sanitized in a real app
    file_path = os.path.join(settings.MEDIA_ROOT, file_name)
    
    if os.path.exists(file_path):
        # Open the file in binary mode and create a FileResponse.
        # The 'as_attachment=True' flag instructs the browser to download the file rather than display it.
        response = FileResponse(open(file_path, 'rb'), as_attachment=True, filename=file_name)
        # Optionally, you can set the content type (for an APK, use 'application/vnd.android.package-archive'
        # and for common images, e.g. 'image/jpeg', etc.)
        # response['Content-Type'] = 'application/vnd.android.package-archive'
        return response
    else:
         return JsonResponse({"message":"eroor"},status=400)
@csrf_exempt
def register_magasin(request):
    if request.method == "POST":
        try:
            with transaction.atomic():
                data = json.loads(request.body)

                # 1. Create User
                user_serializer = CustomUserSerializer(data={
                    'username': data.get('username'),
                    'password': data.get('password'),
                    'email': data.get('email'),
                    'phone_number_1': data.get('phone_number_1'),
                    'role': 'partener',
                    'is_active': False
                })
                
                if not user_serializer.is_valid():
                    transaction.set_rollback(True)


                    errors = user_serializer.errors
                # Return serializer validation errors
                    first_field = next(iter(user_serializer.errors))
                    if 'non_field_errors' in errors:
                        first_error = errors['non_field_errors'][0]
                    else:
                        # Get first field error
                        first_field = next(iter(errors))
                        first_error = errors[first_field][0]

                # If serializer validation fails
                    return JsonResponse({"message": str(first_error)}, status=status.HTTP_400_BAD_REQUEST)


                
                user = user_serializer.save()

                # 2. Get Type_compte_partener
                try:
                    type_account = Type_compte_partener.objects.get(name__icontains="magasin")
                except Type_compte_partener.DoesNotExist:
                    transaction.set_rollback(True)
                    return JsonResponse({"message": "Type de compte magasin introuvable"}, status=404)

                # 3. Create Partenneur
                partenneur_serializer = PartenneurSerializer(data={
                    'user_id': user.id,
                    'type_compte_id': type_account.id,
                    'nom_de_magasin': data.get('nom_de_magasin',"magasin"),
                    'adresse': data.get('adresse',"adressse "),
                    'RC': data.get('RC'),
                    'Nif': data.get('Nif'),
                    'numero_act': data.get('numero_act')
                })
                
                if not partenneur_serializer.is_valid():
                    transaction.set_rollback(True)
                    return JsonResponse({
                        "message": "Partenaire validation failed",
                        "errors": partenneur_serializer.errors
                    }, status=400)
                
                partenneur = partenneur_serializer.save()

                # 4. Create Magasin
                magasin_serializer = MagasinSerializer(data={
                    'owner_id': partenneur.id,
                    'name': data.get('name',"magasin"),
                    'descprition': data.get('description',"descprition"),
                    'latitude': data.get('latitude'),
                    'longitude': data.get('longitude'),
                    'address': data.get('address',"adresse"),
                    "adresse": data.get("adresse","adresse"),
                    "EtatOuverture": False
                    
                })
                
                if not magasin_serializer.is_valid():
                    transaction.set_rollback(True)
                    return JsonResponse({
                        "message": "Magasin validation failed",
                        "errors": magasin_serializer.errors
                    }, status=400)
                
                magasin = magasin_serializer.save()

                return JsonResponse({
                    "message": "Magasin enregistré avec succès",
                    
                }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"message": "Données JSON invalides"}, status=400)
        except Exception as e:
            transaction.set_rollback(True)
            return JsonResponse({"message": f"Erreur serveur: {str(e)}"}, status=500)
    
    return JsonResponse({"message": "Méthode non autorisée"}, status=405)
@csrf_exempt
def register_starshop(request):
    if request.method == "POST":
        try:
            with transaction.atomic():
                data = json.loads(request.body)

                # 1. Create User
                user_serializer = CustomUserSerializer(data={
                    'username': data.get('username'),
                    'password': data.get('password'),
                    'email': data.get('email'),
                    'phone_number_1': data.get('phone_number_1'),
                    'role': 'partener',

                    'is_active': False,
                    "confirmation":False

                })
                
                if not user_serializer.is_valid():
                    transaction.set_rollback(True)


                    errors = user_serializer.errors
                # Return serializer validation errors
                    first_field = next(iter(user_serializer.errors))
                    if 'non_field_errors' in errors:
                        first_error = errors['non_field_errors'][0]
                    else:
                        # Get first field error
                        first_field = next(iter(errors))
                        first_error = errors[first_field][0]

                # If serializer validation fails
                    return JsonResponse({"message": str(first_error)}, status=status.HTTP_400_BAD_REQUEST)


                
                user = user_serializer.save()

                # 2. Get Type_compte_partener
                try:
                    type_account, _ = Type_compte_partener.objects.get_or_create(name="starshop")
                except Type_compte_partener.DoesNotExist:
                    transaction.set_rollback(True)
                    return JsonResponse({"message": "Type de compte magasin introuvable"}, status=404)

                # 3. Create Partenneur
                partenneur_serializer = PartenneurSerializer(data={
                    'user_id': user.id,
                    'type_compte_id': type_account.id,
                    'nom_de_magasin': data.get('nom_de_magasin',"magasin"),
                    'adresse': data.get('adresse',"adressse "),
                    'RC': data.get('RC'),
                    'Nif': data.get('Nif'),
                    'numero_act': data.get('numero_act')
                })
                
                if not partenneur_serializer.is_valid():
                    transaction.set_rollback(True)
                    return JsonResponse({
                        "message": "Partenaire validation failed",
                        "errors": partenneur_serializer.errors
                    }, status=400)
                
                partenneur = partenneur_serializer.save()

                # 4. Create Magasin
                magasin_serializer = MagasinSerializer(data={
                    'owner_id': partenneur.id,
                    'name': data.get('name',"magasin"),
                    'w': data.get('description'),
                    'latitude': data.get('latitude'),
                    'longitude': data.get('longitude'),
                    'address': data.get('address',"adresse"),
                    "adresse": data.get("adresse","adresse"),

                    "EtatOuverture": False


                    
                })
                
                if not magasin_serializer.is_valid():
                    transaction.set_rollback(True)
                    return JsonResponse({
                        "message": "Magasin validation failed",
                        "errors": magasin_serializer.errors
                    }, status=400)
                
                magasin = magasin_serializer.save()

                return JsonResponse({
                    "message": "starshop enregistré avec succès",
                    
                }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"message": "Données JSON invalides"}, status=400)
        except Exception as e:
            transaction.set_rollback(True)
            return JsonResponse({"message": f"Erreur serveur: {str(e)}"}, status=500)
    
    return JsonResponse({"message": "Méthode non autorisée"}, status=405)
@csrf_exempt
def register_choffeur(request):
   if request.method == "POST":
        try:
            
            with transaction.atomic():
                data = json.loads(request.body)
                
                code =data.get("code",None)
                


                # 1. Create User
                user_serializer = CustomUserSerializer(data={
                    'username': data.get('username'),
                    'password': data.get('password'),
                    'email': data.get('email'),
                    'phone_number_1': data.get('phone_number_1'),
                    'role': 'partener',
                    'is_active': False
                })
                
                if not user_serializer.is_valid():
                    transaction.set_rollback(True)
                    errors = user_serializer.errors
                    first_error = "Données invalides"
                    if 'non_field_errors' in errors and errors['non_field_errors']:
                        first_error = errors['non_field_errors'][0]
                    elif errors:
                        first_field = next(iter(errors))
                        val = errors[first_field]
                        first_error = val[0] if isinstance(val, list) and len(val) > 0 else str(val)
                    return JsonResponse({"message": str(first_error), "errors": errors}, status=status.HTTP_400_BAD_REQUEST)


                
                user = user_serializer.save()

                # 2. Get Type_compte_partener
                type_account = Type_compte_partener.objects.filter(
                    Q(name__icontains="chauf") | Q(name__icontains="chof") | Q(name__icontains="vtc")
                ).first()
                if not type_account:
                    type_account = Type_compte_partener.objects.create(
                        name="chauffeur",
                        description="Compte chauffeur VTC",
                        tax_tawsile=15
                    )

                # 3. Create Partenneur
                

                # 4. Create Vihivulr 
                vihicule_data = VihuculeSerializer(data={
                'modele': data.get('modele'),
                'marque': data.get('marque'),
                'matricule': data.get('matricule'),
                'num_assurance': data.get('num_assurance') or None,
                'num_scanner': data.get('num_scanner') or None,
                'Date_expiration_assurance': data.get('date_expiration_assurance') or None,
                'Date_expiration_scanner': data.get('date_expiration_scanner') or None,
                'type_vehicule': data.get('type_vehicule', 'Classique')  # Default to 'Classique' if not provided
                })
                
                
                if not vihicule_data.is_valid():
                    transaction.set_rollback(True)
                    return JsonResponse({
                        "message": "choffeur validation failed",
                        "errors": vihicule_data.errors
                    }, status=400)
                
                vihicule =vihicule_data.save()
                partenneur_serializer = PartenneurSerializer(data={
                    'user_id': user.id,
                    'type_compte_id': type_account.id,
                    "card_number": data.get("card_number"),
                    'RC': data.get('RC'),
                    'Nif': data.get('Nif'),
                    'numero_act': data.get('numero_act') or None,
                    'vihucule_id': vihicule.id  # Associate the vihicule with the partenneur
                })
                
                if not partenneur_serializer.is_valid():
                    transaction.set_rollback(True)
                    return JsonResponse({
                        "message": "Partenaire validation failed",
                        "errors": partenneur_serializer.errors
                    }, status=400)
                
                p=partenneur_serializer.save()
                if code :
                    try:
                        remise = Remise.objects.get(code_invitation=code)
                        print ("i amm here ")
                        remise.inviteurs.add(p)
                        remise.save()
                    except Remise.DoesNotExist:
                        
                        return JsonResponse({"message": "Invalid invitation code"}, status=400)


                return JsonResponse({
                    "message": "choffeur enregistré avec succès",
                    
                }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({"message": "Données JSON invalides"}, status=400)
        except Exception as e:
            transaction.set_rollback(True)
            return JsonResponse({"message": f"Erreur serveur: {str(e)}"}, status=500)
   else :
     return JsonResponse({"message": "Méthode non autorisée"}, status=405)
@csrf_exempt
def register_livreur(request):
    if request.method == "POST":
        try:
            # transaction.atomic permet de tout annuler si une erreur survient au milieu
            with transaction.atomic():
                data = json.loads(request.body)

                # Préparation propre des données de l'utilisateur
                user_data = {
                    'username': data.get('username'),
                    'password': data.get('password'),
                    'email': data.get('email'),
                    'phone_number_1': data.get('phone_number_1'),
                    'wilaya': data.get('wilaya'),
                    'wilaya_code': data.get('wilaya_code'),
                    'role': 'partener',
                    'is_active': False
                }

                selezers = CustomUserSerializer(data=user_data)
                if selezers.is_valid():
                    user = selezers.save()
                else:
                    errors = selezers.errors
                    # Récupération de la première erreur de validation
                    if 'non_field_errors' in errors:
                        first_error = errors['non_field_errors'][0]
                    else:
                        first_field = next(iter(errors))
                        first_error = errors[first_field][0]

                    return JsonResponse({"message": str(first_error)}, status=status.HTTP_400_BAD_REQUEST)

                # Récupère le type de compte livreur, ou le crée s'il n'existe pas en base de données
                try:
                    type_accountt = Type_compte_partener.objects.get(name__icontains="livreur")
                except Type_compte_partener.DoesNotExist:
                    type_accountt = Type_compte_partener.objects.create(name="livreur", tax_tawsile=0)

                # Création du véhicule (Moto par défaut ou avec les données fournies)
                vihicule_data = VihuculeSerializer(data={
                    'modele': data.get('modele'),
                    'marque': data.get('marque'),
                    'matricule': data.get('matricule'),
                    'num_assurance': data.get('num_assurance') or None,
                    'num_scanner': data.get('num_scanner') or None,
                    'Date_expiration_assurance': data.get('date_expiration_assurance') or None,
                    'Date_expiration_scanner': data.get('date_expiration_scanner') or None,
                    'type_vehicule': data.get('type_vehicule', 'Moto')
                })
                if vihicule_data.is_valid():
                    v = vihicule_data.save()
                else:
                    v = Vihucule.objects.create(
                        type_vehicule=data.get('type_vehicule', 'Moto'),
                        modele=data.get('modele'),
                        marque=data.get('marque'),
                        matricule=data.get('matricule'),
                        num_assurance=data.get('num_assurance') or None,
                        num_scanner=data.get('num_scanner') or None,
                        Date_expiration_assurance=data.get('date_expiration_assurance') or None,
                        Date_expiration_scanner=data.get('date_expiration_scanner') or None
                    )

                # Création du Partenaire
                partenneur_serializer = PartenneurSerializer(data={
                    'user_id': user.id,
                    'type_compte_id': type_accountt.id,
                    'card_number': data.get('card_number'),
                    'numero_act': data.get('numero_act') or None,
                    'RC': data.get('RC'),
                    'Nif': data.get('Nif'),
                    'vihucule_id': v.id
                })
                if partenneur_serializer.is_valid():
                    P = partenneur_serializer.save()
                else:
                    P = Partenneur.objects.create(
                        user=user, 
                        type_compte=type_accountt, 
                        vihucule=v,
                        card_number=data.get('card_number'),
                        numero_act=data.get('numero_act') or None,
                        RC=data.get('RC'),
                        Nif=data.get('Nif')
                    )

                # Création de l'objet Livreur avec sa wilaya
                Livreur.objects.create(partenneur=P, wilaya=data.get('wilaya'))
                
                return JsonResponse({"message": "livreur enregistré avec succès"}, status=200)
            
        except Exception as e:
            print(f"Error registering livreur: {str(e)}")  # Pour voir l'erreur dans la console backend
            return JsonResponse({"message": "vous avez un problème de connexion, essayez plus tard"}, status=500)
    else:
        return JsonResponse({"message": "method pas valide"}, status=405)




@api_view(['PUT'])
@parser_classes([MultiPartParser])
def upload_image(request):
    if request.method == 'PUT':
        try:
            user = CustomUser.objects.get(id=request.user.id)

            
            image_file = request.FILES.get('image_url')  
            
            if not image_file:
                return JsonResponse({"message": "Aucun fichier téléchargé"}, status=400)

            # Validate the file type
            filename = image_file.name.lower()
            
            if not filename.endswith(('.jpg', '.jpeg', '.png',".webp")):
                return JsonResponse(
                    {'message': 'Seuls les fichiers JPG, JPEG, PNG et webp  sont autorisés'}, 
                    status=400
                )
            
            if image_file.size > 5 * 1024 * 1024:  # 5MB
                return JsonResponse(
                    {'message': 'La taille de l\'image ne doit pas dépasser 5MB'}, 
                    status=400
                )
         
            
            # Save the image to the user's profile
            user.image_url = image_file
            user.save()

            return JsonResponse({"message": "Image téléchargée avec succès"}, status=200)

        except CustomUser.DoesNotExist:
            return JsonResponse({'message': 'Probleme de connexion'}, status=404)


        except Exception as e:


            

            return JsonResponse({'message': 'Probleme de connexion'}, status=500)


    return JsonResponse({"message": "Probleme de connexion"}, status=405)
# @api_view(["GET"])
# @permission_classes([IsPertener | IsAuthenticated])
@api_view(["GET"])
@permission_classes([IsPertener | IsAuthenticated])
def get_code_remise (request):
    if request.method == "GET":
        try:
            
            
            remise = Remise.objects.get(partenneur__user__id=request.user.id)
            selezers=RemiseSelezers(remise)
            return JsonResponse({"data": selezers.data}, status=200)
        except Remise.DoesNotExist:
            return JsonResponse({}, status=200)
    else:
        return JsonResponse({"message": "Probleme de connexion"}, status=405)


@api_view(["GET"])
@permission_classes([IsPertener | IsAuthenticated])
def get_type_partener(request):
    if request.method == "GET":
        try:
            partener = Partenneur.objects.filter(user__id=request.user.id).first()
            if partener and partener.type_compte:
                return JsonResponse({"type": partener.type_compte.name}, status=200)
            return JsonResponse({"type": "chauffeur"}, status=200)
        except Exception:
            return JsonResponse({"message": "Probleme de connexion"}, status=400)
    else:
        return JsonResponse({"message": "probleme de connexion"}, status=405)
    
@api_view(["GET"])
def get_version_last(request):
    if request.method == "GET":
        try:
            # Get the LATEST SINGLE object
            version = DeviceApp.objects.latest("create_at")
            
            # Serialize the SINGLE object (no many=True)
            serializer = DeviceAppSerializer(version)
            
            return JsonResponse({"data": serializer.data}, status=200)
        
        except DeviceApp.DoesNotExist:
            return JsonResponse({"message": "Probleme de connexion"}, status=404)

    
    else:
        return JsonResponse({"message": "Probleme de connexion"}, status=405)
@api_view(["GET"])
@permission_classes([IsCentreappel & IsAuthenticated])
def get_all_pertenneur_no_groupe (request):
    if request.method=="GET" :
        try : 

            pertennneur = Partenneur.objects.filter(user__groupe=None,user__is_active=False,user__role="partener",user__bloquer=False)
            return JsonResponse({"count":len(pertennneur)},status=200)
        except Exception as e :
            return JsonResponse({"meessage":"Probleme de connexion"})
    else:
        return JsonResponse({"message":"method pas valide "},status=405)
@api_view(["POST"])
@permission_classes([Isvtc])
def validate_coursa_par_user_groupe(request):
    if request.method=="POST" :
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"message": "Invalid JSON"}, status=400)

        chauffeur_id = data.get("id")  # Use consistent naming
        if not chauffeur_id:
            return JsonResponse({"message": "Missing chauffeur_id"}, status=400)

        try:
            partner = Partenneur.objects.get(pk=chauffeur_id)
            courses = Coursa.objects.filter(partener__id=chauffeur_id)  # Fixed field name
            
            if not courses.exists():
                return JsonResponse({"message": "Aucune course trouvée", "success": False}, status=200)

            # Add your processing logic here
            courses.update(paye=True)
            return JsonResponse({
                "message": "Validation réussie",
                "count": courses.count(),
                
                "success": True
            })
        
        except Partenneur.DoesNotExist:
            return JsonResponse({"message": "Partenaire introuvable", "success": False}, status=404)
        except Exception as e:
            logger.error(f"Error: {"Probleme de connexion"}")  # Add proper logging
            return JsonResponse({"message": "Probleme de connexion"}, status=500)
    else :
        return JsonResponse({"messgae":"method not allow "},status=405)
@api_view(["GET"])
def get_chef_bureux_par_wilaya(request):
    if request.method == "GET":
        try:
            # Group chefs by wilaya and count them, ordering by wilaya_code (correct field name)
            chefs_p_wilaya = (
                CustomUser.objects.filter(role="chef_bureau")
                .values('wilaya')
                .annotate(count=Count('id'))
                .order_by('wilaya_code')
            )
            # Return the aggregated data
            return JsonResponse({"data": list(chefs_p_wilaya)}, status=200)
        except Exception as e:
            return JsonResponse({"message": "probleme de connexion"}, status=500)
    else:
        return JsonResponse({"message": "method not allowed"}, status=405)


# @csrf_exempt
# def get_notification_choffeur (request) :
#     if request.method=="GET" :
#         try :
#             notifications=Notication_choffeur.objects.filter (partenneur__user=request.user).select_related("partenneur").order_by("-id")
#             selezer=Notification_choffeurSelezers(notifications,many=True)
#             return JsonResponse({"data":selezer.data},status=200)
#         except Notication_choffeur.DoesNotExist :
#             return JsonResponse({"message":"Notification does not existe "},status=404)
#         except Exception as e  :
#             return JsonResponse({"message":"probleme de connexion "},status=500)
#     else :
#         return JsonResponse({"message":"method not allow "},status=405)
@api_view(["GET"])
@permission_classes([IsOwnerOrAdmin])
def get_commande_by_date(request):
    try:
            year = request.GET.get("anne", None)
            month = request.GET.get("month", None)
            paye = request.GET.get("paye")
            print (f"paye is {paye}")

            # Validate and set default values for year and month
            try:
                year = int(year) if year else datetime.now().year
                month = int(month) if month else datetime.now().month
            except ValueError:
                return JsonResponse({"message": "Invalid year or month parameter"}, status=400)
            print (f"year is {year} and type year is {type(year)} and month is {month} and {type(month) } and month is {paye} and type is {type(paye) }")  # Default to current month if not provided

            # Get commandes grouped by day
            commandes_queryset = Commande.objects.filter(created_at__year=int(year), created_at__month=int(month))
            
        
            if paye == "true":
                    commandes_queryset = commandes_queryset.filter(valide_payment=True)
                    
            elif paye == "false":
                    commandes_queryset = commandes_queryset.filter(valide_payment=False)
                    
        
            commandes_by_day = (
                commandes_queryset
                .annotate(day=TruncDay("created_at"))
                .values("day")
                .annotate(count=Count("id"))
                .order_by("day")
            )

            # Create a dictionary with all months initialized to 0
            days_in_month = monthrange(int(year), int(month))[1]
            days_data = {f"{year}-{str(month).zfill(2)}-{str(day).zfill(2)}": 0 for day in range(1, days_in_month + 1)}

            # Update the dictionary with actual counts
            for course in commandes_by_day:
                    day_str = course["day"].strftime("%Y-%m-%d")
                    days_data[day_str] = course["count"]

            # Convert the dictionary to a list of dictionaries
            result = [{"day": day, "count": count} for day, count in days_data.items()]

            return JsonResponse({"data": result}, status=200)
    except Coursa.DoesNotExist:
        return JsonResponse({"message": "Coursa not valid"}, status=404)

    
@api_view(["GET"])
@permission_classes([IsOwnerOrAdmin ])
def get_coursa_by_day(request):
    try:
        year = request.GET.get("anne", "2025")
        month = request.GET.get("month", datetime.now().month)
        paye=request.GET.get("paye")  # Default to current month if not provided
        print (f"paye is {paye}")
        try:
            year = int(year) if year else datetime.now().year
            month = int(month) if month else datetime.now().month
        except ValueError:
            return JsonResponse({"message": "Invalid year or month parameter"}, status=400)
        

        # Get courses grouped by day
        courses_by_day = (
            Coursa.objects.filter(date_creation__year=year, date_creation__month=month)
            .annotate(day=TruncDay("date_creation"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )
        if paye == "true":
            courses_by_day = courses_by_day.filter(paye=True)
        if paye == "false":
            courses_by_day = courses_by_day.filter(paye=False)

        # Convert the queryset to a list of dictionaries
        # Create a dictionary with all days of the month initialized to 0
        days_in_month = monthrange(int(year), int(month))[1]
        days_data = {f"{year}-{str(month).zfill(2)}-{str(day).zfill(2)}": 0 for day in range(1, days_in_month + 1)}

        # Update the dictionary with actual counts
        for course in courses_by_day:
            day_str = course["day"].strftime("%Y-%m-%d")
            days_data[day_str] = course["count"]

        # Convert the dictionary to a list of dictionaries
        result = [{"day": day, "count": count} for day, count in days_data.items()]

        return JsonResponse({"data": result}, status=200)
    except Coursa.DoesNotExist:
        return JsonResponse({"message": "Coursa not valid"}, status=404)


@csrf_exempt
def get_video_toto(request):
    if request.method=="GET" :
     try :
        videototos=VideoToto.objects.all().select_related("cataloguevideo")
        selezers=VideoTotoSerializer(videototos,many=True)
        return JsonResponse({"data":selezers.data},status=200)
     except VideoToto.DoesNotExist :
         return JsonResponse({"message":"video toto do not existe "},status=404)
    else :
        return JsonResponse({"message":"method not allow "},status=405)
    
@api_view(["GET"])
@permission_classes([Ischefbureux | IsAgentAdmin])
def get_all_catalogue_totovide (request):
    if request.method=="GET" :
        try :
            cataloguevideo=CatalogueVideo.objects.all()
            selezers=CatalogueVideoSerializer(cataloguevideo,many=True)
            return JsonResponse({"data":selezers.data},status=200)
        except VideoToto.DoesNotExist :
            return JsonResponse({"message":"catalogue video do not existe"},status=404)
    else :
        return JsonResponse({"message":"method not allow "},status=405)
@csrf_exempt
def verifie_code (request):
    if request.method=="POST" :
        try:
            data=json.loads(request.body)
            code = data.get ("code",None)
            if code :
                if Remise.objects.filter(code_invitation=code).select_related("code_invitation").exists():
                    return JsonResponse({"message":"code valide"},status=200)
                else :
                    return JsonResponse({"message":"code non valide"},status=404)
            else :
                return JsonResponse({"message":"code empty "},status=400)
        except Exception as e :
            return JsonResponse({"message":str(e)})
    else :
        return JsonResponse({"message":"method not allow "},status=405)





@api_view(["GET"])
@permission_classes([IsCentreappel])
def partner_bloquer(request):
    if request.method == "GET":
        search = request.GET.get("search")
        queryset = Partenneur.objects.filter(
            user__is_active=False,
            user__role="partener",
            user__bloquer=True
        ).order_by("-id").select_related(
            "type_compte", "type_partener", "user", "vihucule"
        )
        if search:
            queryset = queryset.filter(user__phone_number_1__icontains=search)


        # Pagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        serializer = PartenneurSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)
            
        
@api_view(["PATCH"])
@permission_classes([ IsCentreappel])
def desactiver_account_centre_appel(request):
    try:
        if request.method == "PATCH":
            data = json.loads(request.body)
            id = data.get("id")
            etat=data.get("bloque")
            print(f"user id :{id}")
            customer = CustomUser.objects.get(id=id)
            
            customer.bloquer = bool(etat)
            customer.save()
            return JsonResponse({"mesage": "account is desactivate "}, status=200)
    except CustomUser.DoesNotExist:
        return JsonResponse({"error": "user id not valide"}, status=404)
    else:
        return JsonResponse({"eroor": "method not allow"}, status=405)
@api_view(["GET"])
def get_all_starshop(request):
    if request.method == "GET":
        try:
            magasins = Magasin.objects.filter(
                owner__type_compte__name__icontains="starshop"
            ).select_related("owner").prefetch_related("cataloguqe")




            # Add pagination
            paginator = PageNumberPagination()
            paginator.page_size = 20
            paginated_magasins = paginator.paginate_queryset(magasins, request)

            serializer = MagasinSerializer(paginated_magasins, many=True)
            return paginator.get_paginated_response(serializer.data)
        except Magasin.DoesNotExist:
            return JsonResponse({"message": "magasin does not existe"}, status=404)
    else:
        return JsonResponse({"message": "method not allow "}, status=405)

def test_connexion_serveur (request):
    if request.method =="GET" :
        return JsonResponse({"message": "Connexion serveur OK"}, status=200)
    else:
        return JsonResponse({"message": "Method not allowed"}, status=405)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def register_token(request):
    try:
        data = json.loads(request.body)
        token = data.get('token')
        device_type = data.get('device_type')
        user_info = request.user.username if request.user and request.user.is_authenticated else "Anonymous"
        print(f"Registering FCM token: {token} for user: {user_info} ({device_type})")
        return JsonResponse({"message": "Token registered successfully"}, status=201)
    except Exception as e:
        print(f"FCM token registration error: {e}")
        return JsonResponse({"message": "Token registered successfully"}, status=201)

def get_all_catalogue_starshop(request):
    if request.method=="GET":
        try :
            catalogue = Catlogue.objects.filter(type__name="starshop").select_related("type")
            selezers =CatalogueSerializer(catalogue,many=True)
            return JsonResponse({"data":selezers.data},status=200)
        except Catlogue.DoesNotExist :
            return JsonResponse({"message":"probleme de connexion "},status=404)
    else :
        return JsonResponse({"message":"method not allow "},status=500)


# ==============================================================================
# MODULE GROUPE CAISSE : CAISSE VTC & CAISSE LIVREUR
# ==============================================================================

@csrf_exempt
@api_view(['GET'])
def get_caisse_vtc_chauffeurs(request):
    """
    Retourne la liste des chauffeurs VTC pour la caisse avec :
    - KPIs globaux (CA, Bénéfice chauffeurs, Taxes LTC, Total Encaissé, Dettes restantes)
    - Statistiques individuelles (courses terminées, CA, Bénéfice chauffeur, Taxes LTC, Solde restant dû)
    - Dernier versement enregistré
    """
    try:
        search = request.GET.get('search', '').strip()
        wilaya = request.GET.get('wilaya', '').strip()
        status_filter = request.GET.get('status', 'all').strip()
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))

        chauffeurs = Partenneur.objects.filter(
            type_compte__name__icontains="chof",
            user__deleted=False
        ).select_related('user', 'vihucule')

        if search:
            chauffeurs = chauffeurs.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__username__icontains=search) |
                Q(user__phone_number_1__icontains=search) |
                Q(vihucule__matricule__icontains=search)
            )

        if wilaya:
            chauffeurs = chauffeurs.filter(
                Q(user__wilaya__icontains=wilaya) |
                Q(adresse__icontains=wilaya)
            )

        items = []
        for ch in chauffeurs:
            courses = Coursa.objects.filter(partener=ch, etat='terminee')
            total_courses = courses.count()
            ca = courses.aggregate(total=Sum('prix'))['total'] or 0
            tax_ltc = courses.aggregate(total=Sum('tax_tawsile'))['total'] or 0
            benefice = ca - tax_ltc

            unpaid_courses = courses.filter(paye_par_partener=False)
            solde_a_payer = unpaid_courses.aggregate(total=Sum('tax_tawsile'))['total'] or 0

            last_v = VersementCaisse.objects.filter(chauffeur=ch, type_caisse='VTC').order_by('-created_at').first()

            item = {
                'id': ch.id,
                'user_id': ch.user.id if ch.user else None,
                'name': f"{ch.user.first_name} {ch.user.last_name}".strip() if ch.user else "Chauffeur inconnu",
                'username': ch.user.username if ch.user else "",
                'phone': ch.user.phone_number_1 if ch.user else "",
                'wilaya': ch.user.wilaya or ch.adresse or "",
                'image_url': ch.user.image_url.url if ch.user and ch.user.image_url else None,
                'vehicule': {
                    'marque': ch.vihucule.marque if ch.vihucule else "",
                    'modele': ch.vihucule.modele if ch.vihucule else "",
                    'matricule': ch.vihucule.matricule if ch.vihucule else "",
                    'type': ch.vihucule.type_vehicule if ch.vihucule else "",
                } if ch.vihucule else None,
                'total_courses': total_courses,
                'chiffre_affaires': float(ca),
                'benefice_chauffeur': float(benefice),
                'tax_ltc_total': float(tax_ltc),
                'solde_a_payer': float(solde_a_payer),
                'statut_solde': 'debt' if solde_a_payer > 0 else 'settled',
                'dernier_versement': {
                    'id': last_v.id,
                    'montant': float(last_v.montant),
                    'date': last_v.created_at.strftime('%Y-%m-%d %H:%M'),
                    'mode_paiement': last_v.mode_paiement,
                    'reference': last_v.reference or ""
                } if last_v else None
            }

            if status_filter == 'debt' and solde_a_payer <= 0:
                continue
            if status_filter == 'settled' and solde_a_payer > 0:
                continue

            items.append(item)

        items.sort(key=lambda x: (x['solde_a_payer'], x['total_courses']), reverse=True)

        all_vtc_courses = Coursa.objects.filter(etat='terminee', partener__type_compte__name__icontains="chof")
        total_ca_global = all_vtc_courses.aggregate(t=Sum('prix'))['t'] or 0
        total_tax_ltc_global = all_vtc_courses.aggregate(t=Sum('tax_tawsile'))['t'] or 0
        total_benefice_global = total_ca_global - total_tax_ltc_global
        total_solde_impaye_global = all_vtc_courses.filter(paye_par_partener=False).aggregate(t=Sum('tax_tawsile'))['t'] or 0
        total_encaisse_global = VersementCaisse.objects.filter(type_caisse='VTC').aggregate(t=Sum('montant'))['t'] or 0

        total_items = len(items)
        paginator = Paginator(items, page_size)
        try:
            page_items = paginator.page(page).object_list
        except (EmptyPage, PageNotAnInteger):
            page_items = []

        return JsonResponse({
            'success': True,
            'kpis': {
                'total_ca': float(total_ca_global),
                'total_benefice_chauffeurs': float(total_benefice_global),
                'total_tax_ltc': float(total_tax_ltc_global),
                'total_solde_impaye': float(total_solde_impaye_global),
                'total_encaisse': float(total_encaisse_global),
                'total_chauffeurs': len(items),
                'chauffeurs_en_dette': sum(1 for x in items if x['solde_a_payer'] > 0),
                'chauffeurs_a_jour': sum(1 for x in items if x['solde_a_payer'] == 0),
            },
            'results': page_items,
            'total': total_items,
            'page': page,
            'total_pages': paginator.num_pages
        }, status=200)

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
def solder_compte_chauffeur(request):
    """
    Enregistre un versement à la caisse pour un chauffeur VTC et solde ses courses.
    """
    try:
        data = request.data if hasattr(request, 'data') else json.loads(request.body)
        chauffeur_id = data.get('chauffeur_id')
        montant = float(data.get('montant', 0))
        mode_paiement = data.get('mode_paiement', 'especes')
        reference = data.get('reference', '').strip()
        observation = data.get('observation', '').strip()

        chauffeur = get_object_or_404(Partenneur, id=chauffeur_id)

        unpaid_courses = Coursa.objects.filter(
            partener=chauffeur,
            etat='terminee',
            paye_par_partener=False
        ).order_by('date_creation')

        solde_avant = float(unpaid_courses.aggregate(t=Sum('tax_tawsile'))['t'] or 0.0)

        if montant <= 0:
            montant = solde_avant

        if montant <= 0:
            return JsonResponse({'success': False, 'message': "Le chauffeur n'a aucune dette à régler"}, status=400)

        if montant >= solde_avant:
            unpaid_courses.update(paye_par_partener=True)
            solde_apres = 0.0
            chauffeur.tax_a_payer = 0
            chauffeur.save(update_fields=['tax_a_payer'])
        else:
            rem = montant
            for c in unpaid_courses:
                tax = float(c.tax_tawsile or 0.0)
                if rem >= tax:
                    c.paye_par_partener = True
                    c.save(update_fields=['paye_par_partener'])
                    rem -= tax
                else:
                    break
            solde_apres = max(0.0, solde_avant - montant)
            chauffeur.tax_a_payer = int(solde_apres)
            chauffeur.save(update_fields=['tax_a_payer'])

        versement = VersementCaisse.objects.create(
            type_caisse='VTC',
            chauffeur=chauffeur,
            montant=montant,
            solde_avant=solde_avant,
            solde_apres=solde_apres,
            mode_paiement=mode_paiement,
            reference=reference,
            observation=observation,
            agent=request.user if request.user.is_authenticated else None
        )

        return JsonResponse({
            'success': True,
            'message': f"Versement de {montant:,.2f} DA enregistré avec succès ! Solde restant : {solde_apres:,.2f} DA",
            'versement_id': versement.id,
            'solde_avant': solde_avant,
            'solde_apres': solde_apres
        }, status=200)

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@api_view(['GET'])
def get_versements_chauffeur(request, chauffeur_id):
    """
    Retourne l'historique des versements effectués par un chauffeur VTC.
    """
    try:
        versements = VersementCaisse.objects.filter(
            type_caisse='VTC',
            chauffeur_id=chauffeur_id
        ).select_related('agent').order_by('-created_at')

        data = [{
            'id': v.id,
            'montant': float(v.montant),
            'solde_avant': float(v.solde_avant),
            'solde_apres': float(v.solde_apres),
            'mode_paiement': v.mode_paiement,
            'reference': v.reference or "",
            'observation': v.observation or "",
            'agent_name': f"{v.agent.first_name} {v.agent.last_name}".strip() if v.agent else (v.agent.username if v.agent else "Système"),
            'date': v.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for v in versements]

        return JsonResponse({'success': True, 'versements': data}, status=200)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@api_view(['GET'])
def get_caisse_livreur_livreurs(request):
    """
    Retourne la liste des livreurs pour la caisse avec :
    - KPIs globaux de livraison
    - Statistiques individuelles (commandes livrées, total livraison, bénéfice livreur, taxes LTC, solde restant dû)
    - Dernier versement enregistré
    """
    try:
        search = request.GET.get('search', '').strip()
        wilaya = request.GET.get('wilaya', '').strip()
        status_filter = request.GET.get('status', 'all').strip()
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))

        livreurs = Livreur.objects.filter(
            partenneur__user__deleted=False
        ).select_related('partenneur__user', 'partenneur__vihucule')

        if search:
            livreurs = livreurs.filter(
                Q(partenneur__user__first_name__icontains=search) |
                Q(partenneur__user__last_name__icontains=search) |
                Q(partenneur__user__username__icontains=search) |
                Q(partenneur__user__phone_number_1__icontains=search)
            )

        if wilaya:
            livreurs = livreurs.filter(
                Q(wilaya__icontains=wilaya) |
                Q(partenneur__user__wilaya__icontains=wilaya)
            )

        items = []
        for liv in livreurs:
            u = liv.partenneur.user if liv.partenneur else None
            orders = Commande.objects.filter(livreur=liv, status='delivered')
            total_orders = orders.count()
            total_deliv = orders.aggregate(t=Sum('delivery_price'))['t'] or 0
            tax_ltc = orders.aggregate(t=Sum('prix_de_tax'))['t'] or 0
            benefice = total_deliv - tax_ltc

            unpaid_orders = orders.filter(paye_par_livreur=False)
            solde_a_payer = unpaid_orders.aggregate(t=Sum('prix_de_tax'))['t'] or 0

            last_v = VersementCaisse.objects.filter(livreur=liv, type_caisse='LIVREUR').order_by('-created_at').first()

            item = {
                'id': liv.id,
                'user_id': u.id if u else None,
                'name': f"{u.first_name} {u.last_name}".strip() if u else "Livreur inconnu",
                'username': u.username if u else "",
                'phone': u.phone_number_1 if u else "",
                'wilaya': liv.wilaya or (u.wilaya if u else "") or "",
                'image_url': u.image_url.url if u and u.image_url else None,
                'vehicule': {
                    'marque': liv.partenneur.vihucule.marque if liv.partenneur and liv.partenneur.vihucule else "",
                    'type': liv.partenneur.vihucule.type_vehicule if liv.partenneur and liv.partenneur.vihucule else "",
                    'matricule': liv.partenneur.vihucule.matricule if liv.partenneur and liv.partenneur.vihucule else ""
                } if liv.partenneur and liv.partenneur.vihucule else None,
                'total_commandes': total_orders,
                'total_livraison': float(total_deliv),
                'benefice_livreur': float(benefice),
                'tax_ltc_total': float(tax_ltc),
                'solde_a_payer': float(solde_a_payer),
                'statut_solde': 'debt' if solde_a_payer > 0 else 'settled',
                'dernier_versement': {
                    'id': last_v.id,
                    'montant': float(last_v.montant),
                    'date': last_v.created_at.strftime('%Y-%m-%d %H:%M'),
                    'mode_paiement': last_v.mode_paiement,
                    'reference': last_v.reference or ""
                } if last_v else None
            }

            if status_filter == 'debt' and solde_a_payer <= 0:
                continue
            if status_filter == 'settled' and solde_a_payer > 0:
                continue

            items.append(item)

        items.sort(key=lambda x: (x['solde_a_payer'], x['total_commandes']), reverse=True)

        all_delivered = Commande.objects.filter(status='delivered', livreur__isnull=False)
        total_deliv_global = all_delivered.aggregate(t=Sum('delivery_price'))['t'] or 0
        total_tax_ltc_global = all_delivered.aggregate(t=Sum('prix_de_tax'))['t'] or 0
        total_benefice_global = total_deliv_global - total_tax_ltc_global
        total_solde_impaye_global = all_delivered.filter(paye_par_livreur=False).aggregate(t=Sum('prix_de_tax'))['t'] or 0
        total_encaisse_global = VersementCaisse.objects.filter(type_caisse='LIVREUR').aggregate(t=Sum('montant'))['t'] or 0

        total_items = len(items)
        paginator = Paginator(items, page_size)
        try:
            page_items = paginator.page(page).object_list
        except (EmptyPage, PageNotAnInteger):
            page_items = []

        return JsonResponse({
            'success': True,
            'kpis': {
                'total_commandes': all_delivered.count(),
                'total_livraison': float(total_deliv_global),
                'total_benefice_livreurs': float(total_benefice_global),
                'total_tax_ltc': float(total_tax_ltc_global),
                'total_solde_impaye': float(total_solde_impaye_global),
                'total_encaisse': float(total_encaisse_global),
                'total_livreurs': len(items),
                'livreurs_en_dette': sum(1 for x in items if x['solde_a_payer'] > 0),
                'livreurs_a_jour': sum(1 for x in items if x['solde_a_payer'] == 0),
            },
            'results': page_items,
            'total': total_items,
            'page': page,
            'total_pages': paginator.num_pages
        }, status=200)

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
def solder_compte_livreur(request):
    """
    Enregistre un versement à la caisse pour un livreur et solde ses commandes livrées.
    """
    try:
        data = request.data if hasattr(request, 'data') else json.loads(request.body)
        livreur_id = data.get('livreur_id')
        montant = float(data.get('montant', 0))
        mode_paiement = data.get('mode_paiement', 'especes')
        reference = data.get('reference', '').strip()
        observation = data.get('observation', '').strip()

        livreur = get_object_or_404(Livreur, id=livreur_id)

        unpaid_orders = Commande.objects.filter(
            livreur=livreur,
            status='delivered',
            paye_par_livreur=False
        ).order_by('created_at')

        solde_avant = float(unpaid_orders.aggregate(t=Sum('prix_de_tax'))['t'] or 0.0)

        if montant <= 0:
            montant = solde_avant

        if montant <= 0:
            return JsonResponse({'success': False, 'message': "Le livreur n'a aucune dette à régler"}, status=400)

        if montant >= solde_avant:
            unpaid_orders.update(paye_par_livreur=True)
            solde_apres = 0.0
        else:
            rem = montant
            for o in unpaid_orders:
                tax = float(o.prix_de_tax or 0.0)
                if rem >= tax:
                    o.paye_par_livreur = True
                    o.save(update_fields=['paye_par_livreur'])
                    rem -= tax
                else:
                    break
            solde_apres = max(0.0, solde_avant - montant)

        versement = VersementCaisse.objects.create(
            type_caisse='LIVREUR',
            livreur=livreur,
            montant=montant,
            solde_avant=solde_avant,
            solde_apres=solde_apres,
            mode_paiement=mode_paiement,
            reference=reference,
            observation=observation,
            agent=request.user if request.user.is_authenticated else None
        )

        return JsonResponse({
            'success': True,
            'message': f"Versement de {montant:,.2f} DA enregistré avec succès ! Solde restant : {solde_apres:,.2f} DA",
            'versement_id': versement.id,
            'solde_avant': solde_avant,
            'solde_apres': solde_apres
        }, status=200)

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@api_view(['GET'])
def get_versements_livreur(request, livreur_id):
    """
    Retourne l'historique des versements effectués par un livreur.
    """
    try:
        versements = VersementCaisse.objects.filter(
            type_caisse='LIVREUR',
            livreur_id=livreur_id
        ).select_related('agent').order_by('-created_at')

        data = [{
            'id': v.id,
            'montant': float(v.montant),
            'solde_avant': float(v.solde_avant),
            'solde_apres': float(v.solde_apres),
            'mode_paiement': v.mode_paiement,
            'reference': v.reference or "",
            'observation': v.observation or "",
            'agent_name': f"{v.agent.first_name} {v.agent.last_name}".strip() if v.agent else (v.agent.username if v.agent else "Système"),
            'date': v.created_at.strftime('%Y-%m-%d %H:%M:%S')
        } for v in versements]

        return JsonResponse({'success': True, 'versements': data}, status=200)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
@api_view(['GET'])
def get_caisse_globale_analytics(request):
    """
    Retourne les statistiques financières complètes de la Caisse Globale :
    - CA VTC, CA Food (Livraison), CA Global, Bénéfices nets plateforme LTC
    - Filtrage dynamique par période : 'day' (Jour), 'week' (Semaine), 'month' (Mois), 'year' (Année)
    - Comparaison et pourcentage d'avancement par rapport à la période précédente
    - Évolution quotidienne et comparaison avec les jours passés (14 derniers jours)
    - Répartition VTC vs Food et historique des versements récents
    """
    try:
        from datetime import datetime, timedelta, time as dtime
        import calendar

        period = request.GET.get('period', 'day').lower()
        if period not in ['day', 'week', 'month', 'year']:
            period = 'day'

        date_ref_str = request.GET.get('date_ref', '').strip()
        now = timezone.now()

        if date_ref_str:
            try:
                ref_date = datetime.strptime(date_ref_str, '%Y-%m-%d').date()
            except ValueError:
                ref_date = now.date()
        else:
            ref_date = now.date()

        # Calcul des plages (période courante vs période précédente)
        if period == 'day':
            curr_start = ref_date
            curr_end = ref_date
            prev_start = ref_date - timedelta(days=1)
            prev_end = ref_date - timedelta(days=1)
            label_current = f"Aujourd'hui ({ref_date.strftime('%d/%m/%Y')})"
            label_previous = f"Hier ({(ref_date - timedelta(days=1)).strftime('%d/%m/%Y')})"

        elif period == 'week':
            curr_start = ref_date - timedelta(days=ref_date.weekday())
            curr_end = curr_start + timedelta(days=6)
            prev_start = curr_start - timedelta(days=7)
            prev_end = curr_start - timedelta(days=1)
            label_current = f"Cette semaine ({curr_start.strftime('%d/%m')} - {curr_end.strftime('%d/%m')})"
            label_previous = f"Semaine dernière ({prev_start.strftime('%d/%m')} - {prev_end.strftime('%d/%m')})"

        elif period == 'month':
            curr_start = ref_date.replace(day=1)
            last_day = calendar.monthrange(ref_date.year, ref_date.month)[1]
            curr_end = ref_date.replace(day=last_day)

            if ref_date.month == 1:
                prev_year = ref_date.year - 1
                prev_month = 12
            else:
                prev_year = ref_date.year
                prev_month = ref_date.month - 1

            prev_start = ref_date.replace(year=prev_year, month=prev_month, day=1)
            prev_last_day = calendar.monthrange(prev_year, prev_month)[1]
            prev_end = ref_date.replace(year=prev_year, month=prev_month, day=prev_last_day)

            month_names = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
            label_current = f"{month_names[ref_date.month]} {ref_date.year}"
            label_previous = f"{month_names[prev_month]} {prev_year}"

        elif period == 'year':
            curr_start = ref_date.replace(month=1, day=1)
            curr_end = ref_date.replace(month=12, day=31)
            prev_start = ref_date.replace(year=ref_date.year - 1, month=1, day=1)
            prev_end = ref_date.replace(year=ref_date.year - 1, month=12, day=31)
            label_current = f"Année {ref_date.year}"
            label_previous = f"Année {ref_date.year - 1}"

        # Helper d'agrégation sur une plage
        def compute_range_stats(start_d, end_d):
            dt_s = timezone.make_aware(datetime.combine(start_d, dtime.min))
            dt_e = timezone.make_aware(datetime.combine(end_d, dtime.max))

            # VTC
            vtc_qs = Coursa.objects.filter(
                etat='terminee',
                partener__type_compte__name__icontains="chof",
                date_creation__range=(dt_s, dt_e)
            )
            ca_vtc = float(vtc_qs.aggregate(t=Sum('prix'))['t'] or 0.0)
            tax_vtc = float(vtc_qs.aggregate(t=Sum('tax_tawsile'))['t'] or 0.0)
            courses_count = vtc_qs.count()

            # Food (Commandes livrées)
            food_qs = Commande.objects.filter(
                status='delivered',
                created_at__range=(dt_s, dt_e)
            )
            ca_food_livraison = float(food_qs.aggregate(t=Sum('delivery_price'))['t'] or 0.0)
            tax_food = float(food_qs.aggregate(t=Sum('prix_de_tax'))['t'] or 0.0)
            valeur_marchandise = float(food_qs.aggregate(t=Sum('total_price'))['t'] or 0.0)
            commandes_count = food_qs.count()

            # Versements réels en caisse
            versements_qs = VersementCaisse.objects.filter(created_at__range=(dt_s, dt_e))
            total_versements = float(versements_qs.aggregate(t=Sum('montant'))['t'] or 0.0)
            versements_vtc = float(versements_qs.filter(type_caisse='VTC').aggregate(t=Sum('montant'))['t'] or 0.0)
            versements_livreur = float(versements_qs.filter(type_caisse='LIVREUR').aggregate(t=Sum('montant'))['t'] or 0.0)

            ca_global = ca_vtc + ca_food_livraison
            benefice_global = tax_vtc + tax_food

            return {
                'ca_global': ca_global,
                'benefice_global': benefice_global,
                'ca_vtc': ca_vtc,
                'benefice_vtc': tax_vtc,
                'part_chauffeurs': max(0.0, ca_vtc - tax_vtc),
                'courses_count': courses_count,
                'ca_food_livraison': ca_food_livraison,
                'benefice_food': tax_food,
                'part_livreurs': max(0.0, ca_food_livraison - tax_food),
                'valeur_marchandise_food': valeur_marchandise,
                'commandes_count': commandes_count,
                'total_versements': total_versements,
                'versements_vtc': versements_vtc,
                'versements_livreur': versements_livreur
            }

        # Stats période courante & période précédente
        current_stats = compute_range_stats(curr_start, curr_end)
        previous_stats = compute_range_stats(prev_start, prev_end)

        # Calcul du taux de variation en pourcentage
        def calc_growth(curr, prev):
            if prev > 0:
                return round(((curr - prev) / prev) * 100.0, 1)
            elif curr > 0:
                return 100.0
            return 0.0

        growth = {
            'ca_global': calc_growth(current_stats['ca_global'], previous_stats['ca_global']),
            'benefice_global': calc_growth(current_stats['benefice_global'], previous_stats['benefice_global']),
            'ca_vtc': calc_growth(current_stats['ca_vtc'], previous_stats['ca_vtc']),
            'benefice_vtc': calc_growth(current_stats['benefice_vtc'], previous_stats['benefice_vtc']),
            'courses_count': calc_growth(current_stats['courses_count'], previous_stats['courses_count']),
            'ca_food': calc_growth(current_stats['ca_food_livraison'], previous_stats['ca_food_livraison']),
            'benefice_food': calc_growth(current_stats['benefice_food'], previous_stats['benefice_food']),
            'commandes_count': calc_growth(current_stats['commandes_count'], previous_stats['commandes_count']),
            'total_versements': calc_growth(current_stats['total_versements'], previous_stats['total_versements']),
        }

        # Répartition VTC vs Food
        total_ca_g = current_stats['ca_global']
        vtc_percent = round((current_stats['ca_vtc'] / total_ca_g * 100.0), 1) if total_ca_g > 0 else 50.0
        food_percent = round((current_stats['ca_food_livraison'] / total_ca_g * 100.0), 1) if total_ca_g > 0 else 50.0

        # Historique quotidien des jours passés (les 14 derniers jours jusqu'à ref_date)
        daily_trends = []
        french_days = {
            'Monday': 'Lundi', 'Tuesday': 'Mardi', 'Wednesday': 'Mercredi',
            'Thursday': 'Jeudi', 'Friday': 'Vendredi', 'Saturday': 'Samedi', 'Sunday': 'Dimanche'
        }

        prev_day_ca = None
        for i in range(13, -1, -1):
            day_d = ref_date - timedelta(days=i)
            day_stats = compute_range_stats(day_d, day_d)

            # Comparaison avec la veille de ce jour
            day_growth = calc_growth(day_stats['ca_global'], prev_day_ca) if prev_day_ca is not None else 0.0
            prev_day_ca = day_stats['ca_global']

            day_name_en = day_d.strftime('%A')
            day_name_fr = french_days.get(day_name_en, day_name_en)

            daily_trends.append({
                'date': day_d.strftime('%Y-%m-%d'),
                'date_display': day_d.strftime('%d/%m'),
                'date_full': day_d.strftime('%d/%m/%Y'),
                'day_name': day_name_fr,
                'ca_global': day_stats['ca_global'],
                'benefice_global': day_stats['benefice_global'],
                'ca_vtc': day_stats['ca_vtc'],
                'benefice_vtc': day_stats['benefice_vtc'],
                'courses_count': day_stats['courses_count'],
                'ca_food': day_stats['ca_food_livraison'],
                'benefice_food': day_stats['benefice_food'],
                'commandes_count': day_stats['commandes_count'],
                'total_versements': day_stats['total_versements'],
                'growth_vs_previous': day_growth,
                'is_today': day_d == now.date()
            })

        # Derniers versements récents enregistrés
        recent_versements = VersementCaisse.objects.select_related('agent', 'chauffeur__user', 'livreur__partenneur__user').order_by('-created_at')[:8]
        versements_list = []
        for v in recent_versements:
            person_name = ""
            if v.type_caisse == 'VTC' and v.chauffeur and v.chauffeur.user:
                person_name = f"{v.chauffeur.user.first_name} {v.chauffeur.user.last_name}".strip()
            elif v.type_caisse == 'LIVREUR' and v.livreur and v.livreur.partenneur and v.livreur.partenneur.user:
                person_name = f"{v.livreur.partenneur.user.first_name} {v.livreur.partenneur.user.last_name}".strip()

            versements_list.append({
                'id': v.id,
                'type_caisse': v.type_caisse,
                'person_name': person_name or "Non spécifié",
                'montant': float(v.montant),
                'mode_paiement': v.mode_paiement,
                'reference': v.reference or "",
                'date': v.created_at.strftime('%d/%m/%Y %H:%M'),
                'agent_name': f"{v.agent.first_name} {v.agent.last_name}".strip() if v.agent else "Système"
            })

        return JsonResponse({
            'success': True,
            'period': period,
            'date_ref': ref_date.strftime('%Y-%m-%d'),
            'labels': {
                'current': label_current,
                'previous': label_previous,
                'curr_range': f"{curr_start.strftime('%d/%m/%Y')} - {curr_end.strftime('%d/%m/%Y')}",
                'prev_range': f"{prev_start.strftime('%d/%m/%Y')} - {prev_end.strftime('%d/%m/%Y')}",
            },
            'current': current_stats,
            'previous': previous_stats,
            'growth': growth,
            'ratios': {
                'vtc_percent': vtc_percent,
                'food_percent': food_percent,
            },
            'daily_trends': daily_trends,
            'recent_versements': versements_list
        }, status=200)

    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_update_client_solde(request, user_id):
    """
    Endpoint sécurisé réservé EXCLUSIVEMENT aux administrateurs / superutilisateurs
    pour définir, créditer ou débiter le portefeuille d'un client.
    """
    if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
        return JsonResponse({"error": "Accès refusé. Action réservée exclusivement aux administrateurs."}, status=403)
    
    try:
        target_user = CustomUser.objects.get(pk=user_id)
    except CustomUser.DoesNotExist:
        return JsonResponse({"error": "Utilisateur non trouvé."}, status=404)
    
    try:
        data = json.loads(request.body) if request.body else request.data
    except Exception:
        data = request.data
    
    action = data.get("action", "set")  # 'set' (fixer), 'credit' (ajouter), 'debit' (déduire)
    try:
        montant = Decimal(str(data.get("montant", 0)))
        if montant < 0:
            return JsonResponse({"error": "Le montant ne peut pas être négatif."}, status=400)
    except Exception:
        return JsonResponse({"error": "Montant invalide."}, status=400)
    
    solde_avant = target_user.solde or Decimal('0.00')
    if action == "credit":
        target_user.solde = solde_avant + montant
    elif action == "debit":
        if solde_avant < montant:
            return JsonResponse({"error": f"Solde insuffisant ({solde_avant} DA) pour un débit de {montant} DA."}, status=400)
        target_user.solde = solde_avant - montant
    elif action == "set":
        target_user.solde = montant
    else:
        return JsonResponse({"error": "Action invalide. Utilisez 'set', 'credit', ou 'debit'."}, status=400)
    
    target_user.save(update_fields=['solde'])
    
    return JsonResponse({
        "success": True,
        "message": f"Portefeuille mis à jour avec succès : {float(target_user.solde):,.2f} DA",
        "user_id": target_user.id,
        "username": target_user.username,
        "solde_avant": float(solde_avant),
        "solde_actuel": float(target_user.solde),
        "action": action,
        "montant": float(montant),
    }, status=200)



# ==============================================================================
# GESTION DES OBJECTIFS & PRIMES (CHAUFFEURS VTC & LIVREURS)
# ==============================================================================

@api_view(["GET"])
@permission_classes([AllowAny])
def get_objectifs_admin(request):
    """
    Récupère la liste des objectifs avec filtres et statistiques globales.
    """
    try:
        from employer.models import Objectif, ProgressionObjectif
        from employer.serializer import ObjectifSerializer
        from django.utils import timezone
        from django.db.models import Sum, Count, Q

        now = timezone.now()
        cible = request.GET.get('cible', '').strip().lower()
        statut = request.GET.get('statut', '').strip().lower()
        search = request.GET.get('search', '').strip()
        wilaya = request.GET.get('wilaya', '').strip()

        qs = Objectif.objects.all()

        if cible in ['vtc', 'livreur']:
            qs = qs.filter(Q(cible=cible) | Q(cible='tous'))

        if wilaya and wilaya != 'Toutes':
            qs = qs.filter(Q(wilaya=wilaya) | Q(wilaya='Toutes'))

        if search:
            qs = qs.filter(Q(titre__icontains=search) | Q(description__icontains=search))

        if statut == 'actif':
            qs = qs.filter(is_active=True, date_debut__lte=now, date_fin__gte=now)
        elif statut == 'expire':
            qs = qs.filter(date_fin__lt=now)
        elif statut == 'inactif':
            qs = qs.filter(is_active=False)

        # Calcul des statistiques globales
        all_objectifs = Objectif.objects.all()
        active_qs = all_objectifs.filter(is_active=True, date_debut__lte=now, date_fin__gte=now)
        
        total_primes_budget = float(active_qs.aggregate(t=Sum('prime_montant'))['t'] or 0.0)
        
        total_primes_versees = float(
            ProgressionObjectif.objects.filter(prime_versee=True).aggregate(
                t=Sum('objectif__prime_montant')
            )['t'] or 0.0
        )
        
        total_participants = ProgressionObjectif.objects.values('user').distinct().count()
        total_completions = ProgressionObjectif.objects.filter(est_atteint=True).count()

        serializer = ObjectifSerializer(qs, many=True)

        stats = {
            "total_objectifs": all_objectifs.count(),
            "active_vtc_count": active_qs.filter(Q(cible='vtc') | Q(cible='tous')).count(),
            "active_livreur_count": active_qs.filter(Q(cible='livreur') | Q(cible='tous')).count(),
            "total_primes_budget": total_primes_budget,
            "total_primes_versees": total_primes_versees,
            "total_participants": total_participants,
            "total_completions": total_completions,
        }

        return JsonResponse({"success": True, "objectifs": serializer.data, "stats": stats}, status=200)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
def create_objectif(request):
    """
    Crée un nouvel objectif pour VTC, Livreur ou Tous.
    """
    try:
        from employer.models import Objectif
        from employer.serializer import ObjectifSerializer
        import json

        data = json.loads(request.body) if request.body else request.data

        titre = data.get("titre", "").strip()
        if not titre:
            return JsonResponse({"error": "Le titre est obligatoire"}, status=400)

        cible = data.get("cible", "vtc")
        type_objectif = data.get("type_objectif", "courses")
        valeur_cible = float(data.get("valeur_cible", 1))
        prime_montant = Decimal(str(data.get("prime_montant", 0)))
        periode = data.get("periode", "weekend")
        date_debut = data.get("date_debut")
        date_fin = data.get("date_fin")
        wilaya = data.get("wilaya", "Toutes")
        is_active = bool(data.get("is_active", True))
        description = data.get("description", "").strip()

        if not date_debut or not date_fin:
            return JsonResponse({"error": "Les dates de début et de fin sont obligatoires"}, status=400)

        from django.utils.dateparse import parse_datetime
        from django.utils import timezone
        if isinstance(date_debut, str):
            p_deb = parse_datetime(date_debut)
            if p_deb:
                if timezone.is_naive(p_deb):
                    p_deb = timezone.make_aware(p_deb)
                date_debut = p_deb

        if isinstance(date_fin, str):
            p_fin = parse_datetime(date_fin)
            if p_fin:
                if timezone.is_naive(p_fin):
                    p_fin = timezone.make_aware(p_fin)
                date_fin = p_fin

        objectif = Objectif.objects.create(
            titre=titre,
            description=description,
            cible=cible,
            type_objectif=type_objectif,
            valeur_cible=valeur_cible,
            prime_montant=prime_montant,
            periode=periode,
            date_debut=date_debut,
            date_fin=date_fin,
            wilaya=wilaya,
            is_active=is_active,
        )

        serializer = ObjectifSerializer(objectif)
        return JsonResponse({"success": True, "message": "Objectif créé avec succès", "data": serializer.data}, status=201)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(["PUT", "POST"])
@permission_classes([AllowAny])
def update_objectif(request, id):
    """
    Met à jour un objectif existant.
    """
    try:
        from employer.models import Objectif
        from employer.serializer import ObjectifSerializer
        import json

        objectif = Objectif.objects.get(pk=id)
        data = json.loads(request.body) if request.body else request.data

        if "titre" in data:
            objectif.titre = data["titre"].strip()
        if "description" in data:
            objectif.description = data["description"].strip()
        if "cible" in data:
            objectif.cible = data["cible"]
        if "type_objectif" in data:
            objectif.type_objectif = data["type_objectif"]
        if "valeur_cible" in data:
            objectif.valeur_cible = float(data["valeur_cible"])
        if "prime_montant" in data:
            objectif.prime_montant = Decimal(str(data["prime_montant"]))
        if "periode" in data:
            objectif.periode = data["periode"]
        from django.utils.dateparse import parse_datetime
        from django.utils import timezone
        if "date_debut" in data:
            d_val = data["date_debut"]
            if isinstance(d_val, str):
                p_deb = parse_datetime(d_val)
                if p_deb:
                    if timezone.is_naive(p_deb):
                        p_deb = timezone.make_aware(p_deb)
                    d_val = p_deb
            objectif.date_debut = d_val

        if "date_fin" in data:
            f_val = data["date_fin"]
            if isinstance(f_val, str):
                p_fin = parse_datetime(f_val)
                if p_fin:
                    if timezone.is_naive(p_fin):
                        p_fin = timezone.make_aware(p_fin)
                    f_val = p_fin
            objectif.date_fin = f_val
        if "wilaya" in data:
            objectif.wilaya = data["wilaya"]
        if "is_active" in data:
            objectif.is_active = bool(data["is_active"])

        objectif.save()
        serializer = ObjectifSerializer(objectif)
        return JsonResponse({"success": True, "message": "Objectif mis à jour avec succès", "data": serializer.data}, status=200)
    except Objectif.DoesNotExist:
        return JsonResponse({"error": "Objectif non trouvé"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(["DELETE", "POST"])
@permission_classes([AllowAny])
def delete_objectif(request, id):
    """
    Supprime un objectif.
    """
    try:
        from employer.models import Objectif
        objectif = Objectif.objects.get(pk=id)
        objectif.delete()
        return JsonResponse({"success": True, "message": "Objectif supprimé avec succès"}, status=200)
    except Objectif.DoesNotExist:
        return JsonResponse({"error": "Objectif non trouvé"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
def toggle_objectif_status(request, id):
    """
    Active ou désactive un objectif.
    """
    try:
        from employer.models import Objectif
        objectif = Objectif.objects.get(pk=id)
        objectif.is_active = not objectif.is_active
        objectif.save(update_fields=['is_active'])
        return JsonResponse({"success": True, "is_active": objectif.is_active, "message": f"Statut modifié : {'Actif' if objectif.is_active else 'Inactif'}"}, status=200)
    except Objectif.DoesNotExist:
        return JsonResponse({"error": "Objectif non trouvé"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_objectif_progressions(request, id):
    """
    Récupère et synchronise dynamiquement la progression des chauffeurs/livreurs pour un objectif donné.
    """
    try:
        from employer.models import Objectif, ProgressionObjectif, Partenneur, Coursa, CustomUser
        from employer.serializer import ProgressionObjectifSerializer
        from food.models import Livreur, Commande
        from django.utils import timezone
        from django.db.models import Sum

        objectif = Objectif.objects.get(pk=id)
        now = timezone.now()

        # 1. Si VTC ou TOUS
        if objectif.cible in ['vtc', 'tous']:
            vtc_partners = Partenneur.objects.filter(type_compte__name__icontains="chof").select_related('user')
            if objectif.wilaya and objectif.wilaya != 'Toutes':
                vtc_partners = vtc_partners.filter(user__wilaya=objectif.wilaya)

            for partner in vtc_partners:
                user = partner.user
                if not user:
                    continue

                if objectif.type_objectif == 'courses':
                    val = Coursa.objects.filter(
                        partener=partner,
                        etat='terminee',
                        date_creation__gte=objectif.date_debut,
                        date_creation__lte=objectif.date_fin
                    ).count()
                elif objectif.type_objectif == 'chiffre_affaires':
                    val = float(Coursa.objects.filter(
                        partener=partner,
                        etat='terminee',
                        date_creation__gte=objectif.date_debut,
                        date_creation__lte=objectif.date_fin
                    ).aggregate(t=Sum('prix'))['t'] or 0.0)
                else:
                    val = 0.0

                prog, _ = ProgressionObjectif.objects.get_or_create(
                    objectif=objectif,
                    user=user,
                    defaults={'partenaire': partner, 'valeur_actuelle': float(val)}
                )
                prog.valeur_actuelle = float(val)
                prog.partenaire = partner
                if prog.valeur_actuelle >= objectif.valeur_cible and not prog.est_atteint:
                    prog.est_atteint = True
                    prog.date_atteint = now
                prog.save()

        # 2. Si LIVREUR ou TOUS
        if objectif.cible in ['livreur', 'tous']:
            livreurs = Livreur.objects.select_related('partenneur__user')
            if objectif.wilaya and objectif.wilaya != 'Toutes':
                livreurs = livreurs.filter(wilaya=objectif.wilaya)

            for liv in livreurs:
                partner = liv.partenneur
                user = partner.user if partner else None
                if not user:
                    continue

                if objectif.type_objectif == 'courses':
                    val = Commande.objects.filter(
                        livreur=liv,
                        status='delivered',
                        created_at__gte=objectif.date_debut,
                        created_at__lte=objectif.date_fin
                    ).count()
                elif objectif.type_objectif == 'chiffre_affaires':
                    val = float(Commande.objects.filter(
                        livreur=liv,
                        status='delivered',
                        created_at__gte=objectif.date_debut,
                        created_at__lte=objectif.date_fin
                    ).aggregate(t=Sum('delivery_price'))['t'] or 0.0)
                else:
                    val = 0.0

                prog, _ = ProgressionObjectif.objects.get_or_create(
                    objectif=objectif,
                    user=user,
                    defaults={'partenaire': partner, 'valeur_actuelle': float(val)}
                )
                prog.valeur_actuelle = float(val)
                prog.partenaire = partner
                if prog.valeur_actuelle >= objectif.valeur_cible and not prog.est_atteint:
                    prog.est_atteint = True
                    prog.date_atteint = now
                prog.save()

        progressions = ProgressionObjectif.objects.filter(objectif=objectif).select_related('user', 'objectif')
        serializer = ProgressionObjectifSerializer(progressions, many=True)
        return JsonResponse({"success": True, "progressions": serializer.data}, status=200)
    except Objectif.DoesNotExist:
        return JsonResponse({"error": "Objectif non trouvé"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([AllowAny])
def valider_prime_objectif(request, progression_id):
    """
    Valide le versement de la prime pour un participant ayant complété l'objectif.
    Crédite également le solde du chauffeur/livreur.
    """
    try:
        from employer.models import ProgressionObjectif
        from django.utils import timezone

        prog = ProgressionObjectif.objects.select_related('objectif', 'user').get(pk=progression_id)

        if not prog.est_atteint:
            return JsonResponse({"error": "L'objectif n'a pas encore été atteint par ce participant"}, status=400)

        if prog.prime_versee:
            return JsonResponse({"error": "La prime a déjà été versée pour cet objectif"}, status=400)

        montant = prog.objectif.prime_montant or Decimal('0.00')

        user = prog.user
        solde_avant = user.solde or Decimal('0.00')
        user.solde = solde_avant + montant
        user.save(update_fields=['solde'])

        prog.prime_versee = True
        prog.date_versement = timezone.now()
        prog.save(update_fields=['prime_versee', 'date_versement'])

        return JsonResponse({
            "success": True,
            "message": f"Prime de {montant} DA validée et créditée avec succès au solde de {user.username}",
            "nouveau_solde": float(user.solde),
            "progression_id": prog.id
        }, status=200)
    except ProgressionObjectif.DoesNotExist:
        return JsonResponse({"error": "Progression introuvable"}, status=404)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_driver_objectifs(request):
    """
    Endpoint pour les chauffeurs VTC et livreurs (Application mobile Flutter).
    Retourne les objectifs actifs avec la progression personnelle du chauffeur/livreur connecté.
    """
    try:
        from employer.models import Objectif, ProgressionObjectif, Partenneur, Coursa
        from food.models import Livreur, Commande
        from django.utils import timezone
        from django.db.models import Q, Sum

        now = timezone.now()
        target = request.GET.get('target', 'chauffeur').strip().lower()  # 'chauffeur' ou 'livreur'
        wilaya = request.GET.get('wilaya', '').strip()
        user_id = request.GET.get('user_id')

        user = None
        if user_id:
            try:
                user = CustomUser.objects.get(pk=user_id)
            except CustomUser.DoesNotExist:
                pass
        elif request.user.is_authenticated:
            user = request.user

        cible_db = 'vtc' if target in ['chauffeur', 'vtc'] else 'livreur'

        qs = Objectif.objects.filter(
            is_active=True,
            date_debut__lte=now,
            date_fin__gte=now
        ).filter(Q(cible=cible_db) | Q(cible='tous'))

        if wilaya and wilaya != 'Toutes':
            qs = qs.filter(Q(wilaya=wilaya) | Q(wilaya='Toutes'))

        result = []
        for obj in qs:
            valeur_actuelle = 0.0
            est_atteint = False
            prime_versee = False

            if user:
                if cible_db == 'vtc':
                    try:
                        partner = Partenneur.objects.get(user=user)
                        if obj.type_objectif == 'courses':
                            valeur_actuelle = float(Coursa.objects.filter(
                                partener=partner,
                                etat='terminee',
                                date_creation__gte=obj.date_debut,
                                date_creation__lte=obj.date_fin
                            ).count())
                        elif obj.type_objectif == 'chiffre_affaires':
                            valeur_actuelle = float(Coursa.objects.filter(
                                partener=partner,
                                etat='terminee',
                                date_creation__gte=obj.date_debut,
                                date_creation__lte=obj.date_fin
                            ).aggregate(t=Sum('prix'))['t'] or 0.0)
                    except Partenneur.DoesNotExist:
                        pass
                else:
                    try:
                        liv = Livreur.objects.get(partenneur__user=user)
                        if obj.type_objectif == 'courses':
                            valeur_actuelle = float(Commande.objects.filter(
                                livreur=liv,
                                status='delivered',
                                created_at__gte=obj.date_debut,
                                created_at__lte=obj.date_fin
                            ).count())
                        elif obj.type_objectif == 'chiffre_affaires':
                            valeur_actuelle = float(Commande.objects.filter(
                                livreur=liv,
                                status='delivered',
                                created_at__gte=obj.date_debut,
                                created_at__lte=obj.date_fin
                            ).aggregate(t=Sum('delivery_price'))['t'] or 0.0)
                    except Livreur.DoesNotExist:
                        pass

                prog = ProgressionObjectif.objects.filter(objectif=obj, user=user).first()
                if prog:
                    prime_versee = prog.prime_versee
                    if prog.est_atteint:
                        est_atteint = True

                if valeur_actuelle >= obj.valeur_cible:
                    est_atteint = True

            pct = 0.0
            if obj.valeur_cible > 0:
                pct = round(min(100.0, max(0.0, (valeur_actuelle / obj.valeur_cible) * 100.0)), 1)

            delta = obj.date_fin - now
            hours_left = max(0, int(delta.total_seconds() // 3600))
            days_left = hours_left // 24

            result.append({
                "id": obj.id,
                "titre": obj.titre,
                "description": obj.description or "",
                "cible": obj.cible,
                "cible_label": obj.get_cible_display(),
                "type_objectif": obj.type_objectif,
                "valeur_cible": obj.valeur_cible,
                "valeur_actuelle": valeur_actuelle,
                "pourcentage": pct,
                "prime_montant": float(obj.prime_montant),
                "est_atteint": est_atteint,
                "prime_versee": prime_versee,
                "periode": obj.periode,
                "periode_label": obj.get_periode_display(),
                "date_fin": obj.date_fin.isoformat(),
                "heures_restantes": hours_left,
                "jours_restants": days_left,
                "wilaya": obj.wilaya
            })

        return JsonResponse({"success": True, "objectifs": result}, status=200)
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
