from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

def trigger_error(request):
    division_by_zero = 1 / 0
urlpatterns = [
    path('api/v1/login', views.login_view, name='login'),  # testé
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    #path("api/v1/ecotest/sendmessage",views.send_message_iconttest),

    path("api/v1/decode/token", views.decode_token,
         name="api to decripte token "),
    path("api/v1/logout", views.logout_view, name="logout"),  # testé
    path('api/v1/users', views.listeuser, name="litse_user"),  # testé
    path('api/v1/users/employer', views.liste_employer,
         name="litse_employer"),  # testé
    path("api/v1/centreappel/parteners", views.get_all_partner,
         name="get_all_partner"),  # testé
    path("api/v1/centreappelgroupe/pertener", views.get_all_partner_groupeX,
         name="get_all_partener_groupe_x"),  # testé
    path("api/v1/chefbureux/employers", views.liste_emplois_groupe_x,
         name="liste_des_employer_par_chef_bureux_x"),
    path("api/v1/account/desactiver",
         views.desactiver_account, name="desactiver_accountt"),
    path("api/v1/centreappel/bloque/partener",views.desactiver_account_centre_appel),

    path("api/v1/update/user", views.put_customeruser, name="update user"),
    path("api/v1/centreappel/demendesflyxsy",
         views.get_all_demmandeflixy_de_cetre_appel),

     path("api/v1/centre_appel/enattends",views.get_number_action_de_centre_appel,name="notification_centre_appel"),
     path('api/v1/centreappel/actions/flexy',views.get_actions_ce_centre_appel_centre_appel),



    path('v1/users/chefbureau', views.liste_chef_bereux, name="liste_de_bureau"),
    path('v1/users/employer/create/', views.add_employer, name="create_employer"),
    path('v1/users/chef_b/create', views.add_chef_bureux, name="create_chef_de_br"),
    path("api/v1/user", views.profil, name="profil"),
    path("api/v1/partener", views.profil_partner),
    path("api/v1/user/update", views.update_user,
         name="modifier utlistaeur cess infomation  "),
     path ("api/v1/uploaduser",views.upload_image),
    path("api/v1/users/chef_bureux/agent/create",
         views.add_emplois_par_groupe, name="create emplois pour chaque wilaya "),
    path("api/v1/user/chef_bureux/emplois", views.liste_emplois_par_groupe,
         name="la liste emplayeur par wilaya "),
    path("api/v1/vtc/courses", views.courses_list_vtc,
         name=" tout la liste coursa "),
    path("api/v1/vtc/chauffeurs/tax_summary", views.chauffeurs_tax_summary,
         name="chauffeurs_tax_summary"),
    path("api/v1/user/courses", views.liste_coursa_par_user,
         name="l liste coursa par wilaya "),
    path('api/v1/user/partener/registre', views.registre_partener,
         name="api of partener with type compte magasin "),
    path("api/v1/user/client/registre/",
         views.registre_client, name="api of client create"),
    path("api/v1/user/activate", views.valide_compte_partener,
         name="api activer les compte partener "),
    path("api/v1/emplois/parteners", views.liste_partener_par_groupe,
         name="liste de partener pour epmlois de meme wilaya "),
    path("api/v1/courses", views.liste_coursa_all,
         name="liste_de_courses_par_wilaya"),
    path('v1/statistics/<int:user_id>/',
         views.static_for_emplois, name='statistics'),
    path("api/v1/commercial/static", views.commerciel_dashboard_view_admin,
         name="static pour directeur "),
    path("v1/payments/", views.all_payment,
         name="api of getting all payments"),
    path("api/v1/user/changepassword", views.change_password,
         name="api_to_change_password_user"),
    path("api/v1/vtc/course/valide", views.pay_course,
         name="api pour valide le course "),
    path('v1/course/partener/<int:partener_id>/create/',
         views.create_coursa, name="api create coursa "),
    path("api/v1/user/partener/courses", views.couses_partener,
         name="les couses de partener "),
    path('v1/user/<int:user_id>/payment/create/', views.create_payment,
         name="api pour create payment on pc et android "),
    path('v1/payments/partener', views.all_payment_par_partener,
         name="tout les payment affectuer par le partenr "),
    path("v1/partener/<int:user_id>/paymenttotal", views.get_totale_tax_a_payer,
         name="api for gettong toitale partner to paye us "),
    path("v1/partener/<int:partner_id>/dahsbord", views.partner_dashboard,
         name="dahsbord static pour le partner "),
    path('v1/user/<int:user_id>/historique/payment', views.get_payment_id_partner,
         name="historique de payment de un seul partenr id "),
    path("v1/payment/<int:payment_id>/refuse",
         views.refuse_payment, name="api pour refuse le payments"),
    path("v1/payment/<int:payment_id>/accepter", views.Accepter_payment,
         name="api pour accepter   le payments"),
    path("api/v1/centre_appel/Comentaires/partener",
         views.get_partner_comments, name="get_partner_comments"),
    path("api/v1/centre_appel/comentaire/add", views.add_commentaire),
    path("api/v1/centre_appel/etat/demmande", views.Change_etat_flyxy),
    path("api/v1/chefbureux/completedossie",
         views.compete_dossier_partener, name="api to coomplete le dooosie "),
    path('api/v1/user/commandes/valider', views.valider_payment_commande,
         name="valider_payment_commande"),#teste
    path("api/v1/chefbureux/arretcasse", views.arret_casse,
         name="arret_casse_chef"),# testé
    path('api/v1/comtable/cassies', views.get_all_casses,
         name="get_all_cassier_comtable"),#teste
    path("api/v1/cassie/chef/ouvrir", views.ouvri_la_casse,
         name="api_ouvrir_la_casse_comptable"),#teste
    path("api/v1/chef/commandes/today", views.commande_valide_payment_par_id_ajourduit,
         name="commande_valide_payment_par_id_ajourduit"),#teste
    path("api/v1/chef/cassies", views.historique_de_cassie_par_chef_bureux,
         name="historique_de_cassie_par_chef_bureux"),#teste
    path("api/v1/user/add/groupe", views.ajouter_groupe_pour_user,
         name="ajouter_groupe_pour_user"),#teste
    path("api/v1/user/chefbureux", views.get_all_chef_bureux,
    name="get_all_chef_bureux"),#teste
    path("api/v1/sendmessage", views.send_sms, name="api for send message "),
    path('status/<str:message_id>/',
         views.check_sms_status, name='check_sms_status'),
    path("api/v1/auth/num", views.auth_par_num, name="auth_par_num"),#teste
    path("api/v1/auth/verifie/otp", views.verify_otp, name="verifie_otp"),
    path("api/v1/commerciale/typecomptes",


         views.get_all_type_de_compte, name="get_all_type_compte"),##testé
    path("api/v1/commerciale/typecompte/add", #testé
         views.ajouter_type_compte, name="ajouter_type_compte"),#testé "
    path("api/v1/commerciale/superviseur/create", #testé
         views.create_super_viseur, name="create_superviseur_commercial"),#testé
    path("api/v1/commerciale/supperviseurs", 


         views.liste_super_viseur, name="liste_user_suppers"),#teste
    path("api/v1/commerciale/typepertenneur/update",
         views.update_type_compte_partener,name="update_type_compte_partener"),#testé


    path('api/v1/commercial/perteners', views.get_all_partner_for_commerciale,name="get_all_partner_for_commerciale"),#testé


    path("api/v1/commercialer/groups", views.get_all_groupe_par_tlemcen,name="get_all_groupe_par_tlemcen"),#testé

    path("api/v1/commerciale/Livreurs",
         views.all_livreur_account, name="get_all_livreures"),#testé
    path("api/v1/user/desactiver", views.desactive_compte,
         name="desactiver_account"), #testé



    path("api/v1/send/email/support/dev", views.send_confirmation_email),
    path("api/v1/resetpassword", views.password_reset_request),


    path("api/v1/conatctme", views.send_contact_email,name="send_contact_email"),#testé



    path("api/v1/user/chnagepassword", views.reset_password,
         name="reset-password"), 
     path("api/v1/request/otp", views.password_reset_request_otp, name="request-otp"),#testé
     path("api/v1/resetpassword/otp", views.update_password_by_otp, name="reset-password-otp"),#testé
     path("api/v1/resetpassword/otp/verfie", views.verfie_otp, name="confirm-password-reset-otp"),#testé
    path("api/v1/verifie/token", views.verifie_token, name="verify-token"),#testé


    # endpoints of superviseur
    path("api/v1/supervisseur/pertenneurs", views.get_all_partner_superviseur,name="get_all_partner_superviseur"),#teste
    path("api/v1/suppervisseur/rapport/create", views.create_rapport,
         name="create_rapport_supervisseur"),  # testé
    path("api/v1/superviseur/demmandes/flixsy",
         views.get_all_demmandeflixy_de_superviseur, name="demmandes_superviseur"),#testé
    path("api/v1/superviseur/apprpvie/flyxy", views.approvie_flixy,name="approvie_flixy"),#testé

    path("api/v1/superviseur/rapports", views.liste_rapport_pour_super_visssur,
         name="liste_rapport_pour_super"),  # testé

    path("api/v1/superviseur/demande/flyxsi",

         views.demande_flyxsi, name="demande_flyxsi"),#testé






    path("api/v1/comtable/cassie/approvie", views.appruvie_la_casse,
         name="approuvie_la_casse_comptable"),  # testé
    


     path('download/<str:file_name>/', views.download_file, name='download_file'),# on fait instalation au cote front end 
     path("api/v1/user/restaurant/registre/",views.register_magasin, name="register_magasin"),#testé mais jai probleme de migrations 
     path("api/v1/user/starshop/registre/",views.register_starshop, name="register_partener"),
     path("api/v1/user/choffeur/registre/",views.register_choffeur,name="register_choffeur"),#testé


     path("api/v1/user/livreur/registre/", views.register_livreur,name="register_livreur"),#testé



     path("api/v1/user/code_invetation", views.get_code_remise,name="get_code_remise"),#testé
     path("api/v1/verfiecode",views.verifie_code),
     path ("api/v1/pertener/type_compte",views.get_type_partener,name="get_type_partener"),#testé
     path("api/v1/version/leates",views.get_version_last,name="get_version_last"),#teste #eroor the model


     path("api/v1/pertenneur/account",views.get_all_pertenneur_no_groupe,name="get_all_pertenneur_no_groupe"),#teste
     path("api/v1/groupe/partener/vtc",views.liste_coursa_par_groupe,name="liste_coursa_par_groupe"),#testé
     path("api/v1/courses/validation",views.validate_coursa_par_user_groupe,name="validate_coursa_par_user_groupe"),#testé 
     path("api/v1/chefbureux/count",views.get_chef_bureux_par_wilaya,name="get_chef_bureux_par_wilaya"),#tester
     path("api/v1/admin/commande/month",views.get_commande_by_date,name="get_coursa_par_monthe"),#testé
     path("api/v1/admin/coursa/month",views.get_coursa_by_day,name="get_commande_par_year"),#testé

     path("api/v1/videototos",views.get_video_toto),
     path("api/v1/cataloguevideo",views.get_all_catalogue_totovide),
     path("api/v1/partener/bloquers",views.partner_bloquer),
     path("api/v1/starshops",views.get_all_starshop),

     path("api/v1/starshop/catalogue",views.get_all_catalogue_starshop),
     
     path("api/v1/health",views.test_connexion_serveur),
     path('sentry-debugg/', trigger_error),
     





     path("api/v1/starshop/catalogue",views.get_all_catalogue_starshop),
     
     path("api/v1/health",views.test_connexion_serveur),
     path('sentry-debug/', trigger_error),
     path('api/v1/register/token', views.register_token, name='register_token'),
     





     
     

     
















     # Admin - Portefeuille Client
     path("api/v1/admin/user/<int:user_id>/solde", views.admin_update_client_solde, name="admin_update_client_solde"),
     path("api/v1/admin/user/<int:user_id>/solde/", views.admin_update_client_solde),


     # =========================================================================
     # OBJECTIFS & PRIMES (CHAUFFEURS VTC & LIVREURS)
     # =========================================================================
     path("api/v1/objectifs", views.get_objectifs_admin, name="get_objectifs_admin"),
     path("api/v1/objectifs/", views.get_objectifs_admin),
     path("api/v1/objectifs/create", views.create_objectif, name="create_objectif"),
     path("api/v1/objectifs/create/", views.create_objectif),
     path("api/v1/objectifs/<int:id>/update", views.update_objectif, name="update_objectif"),
     path("api/v1/objectifs/<int:id>/update/", views.update_objectif),
     path("api/v1/objectifs/<int:id>/delete", views.delete_objectif, name="delete_objectif"),
     path("api/v1/objectifs/<int:id>/delete/", views.delete_objectif),
     path("api/v1/objectifs/<int:id>/toggle", views.toggle_objectif_status, name="toggle_objectif_status"),
     path("api/v1/objectifs/<int:id>/toggle/", views.toggle_objectif_status),
     path("api/v1/objectifs/<int:id>/progressions", views.get_objectif_progressions, name="get_objectif_progressions"),
     path("api/v1/objectifs/<int:id>/progressions/", views.get_objectif_progressions),
     path("api/v1/objectifs/progression/<int:progression_id>/valider_prime", views.valider_prime_objectif, name="valider_prime_objectif"),
     path("api/v1/objectifs/progression/<int:progression_id>/valider_prime/", views.valider_prime_objectif),
     path("api/v1/objectifs/driver", views.get_driver_objectifs, name="get_driver_objectifs"),
     path("api/v1/objectifs/driver/", views.get_driver_objectifs),

     # =========================================================================
     # CAISSE (GLOBALE, VTC, LIVREUR)
     # =========================================================================
     path("api/v1/caisse/globale/analytics", views.get_caisse_globale_analytics, name="caisse_globale_analytics"),
     path("api/v1/caisse/globale/analytics/", views.get_caisse_globale_analytics),
     path("api/v1/caisse/vtc/chauffeurs", views.get_caisse_vtc_chauffeurs, name="caisse_vtc_chauffeurs"),
     path("api/v1/caisse/vtc/chauffeurs/", views.get_caisse_vtc_chauffeurs),
     path("api/v1/caisse/vtc/solder", views.solder_compte_chauffeur, name="solder_compte_chauffeur"),
     path("api/v1/caisse/vtc/solder/", views.solder_compte_chauffeur),
     path("api/v1/caisse/vtc/versements/<int:chauffeur_id>", views.get_versements_chauffeur, name="get_versements_chauffeur"),
     path("api/v1/caisse/vtc/versements/<int:chauffeur_id>/", views.get_versements_chauffeur),
     path("api/v1/caisse/livreur/livreurs", views.get_caisse_livreur_livreurs, name="caisse_livreur_livreurs"),
     path("api/v1/caisse/livreur/livreurs/", views.get_caisse_livreur_livreurs),
     path("api/v1/caisse/livreur/solder", views.solder_compte_livreur, name="solder_compte_livreur"),
     path("api/v1/caisse/livreur/solder/", views.solder_compte_livreur),
     path("api/v1/caisse/livreur/versements/<int:livreur_id>", views.get_versements_livreur, name="get_versements_livreur"),
     path("api/v1/caisse/livreur/versements/<int:livreur_id>/", views.get_versements_livreur),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
