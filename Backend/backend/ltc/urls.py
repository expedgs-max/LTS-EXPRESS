from django.contrib import admin
from django.urls import path, include
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="Project API",
        default_version="v1",
        description="API documentation for all apps",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="support@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)


from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [


   #path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),


    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
     
    path('admin/', admin.site.urls),  # Admin interface
    path('', include('employer.urls')),  # Employer app routes
    path('', include('vtc.urls')), 


    path('',include("food.urls")), 


      # Debug toolbar
     # Include vtc app routes
     #swggger documentaion 
  
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

