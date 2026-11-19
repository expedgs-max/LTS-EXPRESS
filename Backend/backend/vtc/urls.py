from django.urls import path
from . import views  # Import views from the vtc app

urlpatterns = [
     path('api/v1/partenneur/update', views.update_partenneur, name='update_partenneur'),# nous pas tochier 
     path('api/v1/coures',views.get_courses_user,name="get all course with id user(client or partenner choffeur )"),
     path("api/v1/commission", views.get_commission, name="get_commission"),
     path("api/v1/commission/create", views.create_commission, name="create_commission"),
     path("api/v1/commission/update", views.update_commission, name="update_commission"),
     path("api/v1/commission/delete/<int:id>", views.delete_commission, name="delete_commission_with_id"),
     path("api/v1/commission/delete", views.delete_commission, name="delete_commission"),
     path("api/v1/commission/chauffeur/taux", views.manage_chauffeur_commission_rate, name="manage_chauffeur_commission_rate"),
     path("api/v1/type_course", views.get_type_courses, name="get_type_courses"),
     path("api/v1/type_course/create", views.create_type_course, name="create_type_course"),
     path("api/v1/type_course/update", views.update_type_course, name="update_type_course"),
     path("api/v1/type_course/delete/<int:id>", views.delete_type_course, name="delete_type_course_with_id"),
     path("api/v1/type_course/delete", views.delete_type_course, name="delete_type_course"),
     path("api/v1/review/create", views.create_reviews),
     path("api/v1/user/wilaya/update", views.update_wilaya_for_user, name="update wilaya user "),
     path("api/v1/partner/coursa/update", views.update_etat_coursa, name="update coursas for partner"),
     path("api/v1/Comission/wilaya", views.get_prix_pour_wilaya),
     path("api/v1/commission/veh/type", views.get_commission_par_type),

     path("api/v1/partener/tax_tawsil", views.calculate_total_price),
     path("api/v1/vtc/places", views.search_places, name="search_places"),

     # Chauffeurs VTC endpoints
     path("api/v1/vtc/chauffeurs", views.get_vtc_chauffeurs, name="get_vtc_chauffeurs"),
     path("api/v1/vtc/chauffeurs/", views.get_vtc_chauffeurs, name="get_vtc_chauffeurs_slash"),
     path("api/v1/vtc/chauffeurs/create", views.create_vtc_chauffeur, name="create_vtc_chauffeur"),
     path("api/v1/vtc/chauffeurs/toggle_status", views.toggle_vtc_chauffeur_status, name="toggle_vtc_chauffeur_status"),
     path("api/v1/vtc/chauffeurs/update", views.update_vtc_chauffeur, name="update_vtc_chauffeur"),

     # Transporteurs (Partenaires type Transport) endpoints
     path("api/v1/vtc/transporteurs", views.get_transporteurs, name="get_transporteurs"),
     path("api/v1/vtc/transporteurs/", views.get_transporteurs, name="get_transporteurs_slash"),
     path("api/v1/vtc/transporteurs/create", views.create_transporteur, name="create_transporteur"),
     path("api/v1/vtc/transporteurs/update/<int:id>", views.update_transporteur, name="update_transporteur_with_id"),
     path("api/v1/vtc/transporteurs/update", views.update_transporteur, name="update_transporteur"),
     path("api/v1/vtc/transporteurs/delete/<int:id>", views.delete_transporteur, name="delete_transporteur_with_id"),
     path("api/v1/vtc/transporteurs/delete", views.delete_transporteur, name="delete_transporteur"),
     path("api/v1/vtc/transporteurs/restore/<int:id>", views.restore_transporteur, name="restore_transporteur_with_id"),
     path("api/v1/vtc/transporteurs/restore", views.restore_transporteur, name="restore_transporteur"),
     path("api/v1/vtc/transporteurs/hard_delete/<int:id>", views.hard_delete_transporteur, name="hard_delete_transporteur_with_id"),
     path("api/v1/vtc/transporteurs/hard_delete", views.hard_delete_transporteur, name="hard_delete_transporteur"),
     path("api/v1/vtc/transporteurs/empty_trash", views.empty_trash_transporteurs, name="empty_trash_transporteurs"),
     path("api/v1/vtc/transporteurs/toggle_status", views.toggle_transporteur_status, name="toggle_transporteur_status"),

     # Catégories de transport dynamiques
     path("api/v1/vtc/transport_categories", views.get_transport_categories, name="get_transport_categories"),
     path("api/v1/vtc/transport_categories/", views.get_transport_categories, name="get_transport_categories_slash"),
     path("api/v1/vtc/transport_categories/create", views.create_transport_category, name="create_transport_category"),
     path("api/v1/vtc/transport_categories/delete/<int:id>", views.delete_transport_category, name="delete_transport_category_with_id"),
     path("api/v1/vtc/transport_categories/delete", views.delete_transport_category, name="delete_transport_category"),
]


