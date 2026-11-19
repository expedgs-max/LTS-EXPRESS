from django.urls import path
from . import views
from . import confirmation_views
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    # Confirmation Role API endpoints
    path("api/v1/confirmation/stats", confirmation_views.get_confirmation_dashboard_stats),
    path("api/v1/confirmation/stats/", confirmation_views.get_confirmation_dashboard_stats),
    path("api/v1/confirmation/magasins", confirmation_views.get_confirmation_magasins),
    path("api/v1/confirmation/magasins/", confirmation_views.get_confirmation_magasins),
    path("api/v1/confirmation/livreurs", confirmation_views.get_confirmation_livreurs),
    path("api/v1/confirmation/livreurs/", confirmation_views.get_confirmation_livreurs),
    path("api/v1/confirmation/commandes", confirmation_views.get_confirmation_commandes),
    path("api/v1/confirmation/commandes/", confirmation_views.get_confirmation_commandes),
    path("api/v1/confirmation/commande/assign", confirmation_views.assign_or_dispatch_commande),
    path("api/v1/confirmation/commande/assign/", confirmation_views.assign_or_dispatch_commande),
    path("api/v1/confirmation/commande/broadcast", confirmation_views.broadcast_commande_by_centre),
    path("api/v1/confirmation/commande/broadcast/", confirmation_views.broadcast_commande_by_centre),
    path("api/v1/confirmation/commande/create-express", confirmation_views.create_express_commande_by_centre),
    path("api/v1/confirmation/commande/create-express/", confirmation_views.create_express_commande_by_centre),
    path("api/v1/commande/create-service-colis", confirmation_views.create_service_colis_commande),
    path("api/v1/commande/create-service-colis/", confirmation_views.create_service_colis_commande),
    path("api/v1/confirmation/commande/confirm", confirmation_views.confirm_commande_by_centre),
    path("api/v1/confirmation/commande/confirm/", confirmation_views.confirm_commande_by_centre),
    path("api/v1/confirmation/commande/cancel", confirmation_views.cancel_commande_by_centre),
    path("api/v1/confirmation/commande/cancel/", confirmation_views.cancel_commande_by_centre),
    path("api/v1/confirmation/commande/deliver", confirmation_views.mark_commande_delivered_by_centre),
    path("api/v1/confirmation/commande/deliver/", confirmation_views.mark_commande_delivered_by_centre),
    path("api/v1/confirmation/commande/status", confirmation_views.update_commande_status_by_centre),
    path("api/v1/confirmation/commande/status/", confirmation_views.update_commande_status_by_centre),
    path("api/v1/confirmation/commande/trip-time", confirmation_views.update_commande_trip_time_by_centre),
    path("api/v1/confirmation/commande/trip-time/", confirmation_views.update_commande_trip_time_by_centre),
    path("api/v1/confirmation/commande/approve-phone", confirmation_views.approve_or_reject_client_phone),
    path("api/v1/confirmation/commande/approve-phone/", confirmation_views.approve_or_reject_client_phone),
    path("api/v1/confirmation/livreur/toggle-block", confirmation_views.toggle_livreur_bloque_by_centre),
    path("api/v1/confirmation/livreur/toggle-block/", confirmation_views.toggle_livreur_bloque_by_centre),
    path("api/v1/confirmation/livreur/create", confirmation_views.create_confirmation_livreur),
    path("api/v1/confirmation/livreur/create/", confirmation_views.create_confirmation_livreur),
    path("api/v1/confirmation/magasin/create", confirmation_views.create_confirmation_magasin),
    path("api/v1/confirmation/magasin/create/", confirmation_views.create_confirmation_magasin),
    path("api/v1/confirmation/magasin/update", confirmation_views.update_confirmation_magasin),
    path("api/v1/confirmation/magasin/update/", confirmation_views.update_confirmation_magasin),
    path("api/v1/confirmation/livreur/update-profile", confirmation_views.update_confirmation_livreur_profile),
    path("api/v1/confirmation/livreur/update-profile/", confirmation_views.update_confirmation_livreur_profile),
    path("api/v1/centreappel/comptes", confirmation_views.get_centreappel_comptes),
    path("api/v1/centreappel/comptes/", confirmation_views.get_centreappel_comptes),
    path("api/v1/centreappel/toggle-block-user", confirmation_views.toggle_block_user_centreappel),
    path("api/v1/centreappel/toggle-block-user/", confirmation_views.toggle_block_user_centreappel),
    path("api/v1/centreappel/soft-delete", confirmation_views.soft_delete_user_centreappel),
    path("api/v1/centreappel/soft-delete/", confirmation_views.soft_delete_user_centreappel),
    path("api/v1/centreappel/corbeille", confirmation_views.get_corbeille_centreappel),
    path("api/v1/centreappel/corbeille/", confirmation_views.get_corbeille_centreappel),
    path("api/v1/centreappel/restore", confirmation_views.restore_user_centreappel),
    path("api/v1/centreappel/restore/", confirmation_views.restore_user_centreappel),
    path("api/v1/centreappel/send-notification", confirmation_views.send_notification_to_user_centreappel),
    path("api/v1/centreappel/send-notification/", confirmation_views.send_notification_to_user_centreappel),
    path("api/v1/centreappel/update-user", confirmation_views.update_user_centreappel),
    path("api/v1/centreappel/update-user/", confirmation_views.update_user_centreappel),

    # Confirmation Promo Codes API endpoints
    path("api/v1/confirmation/promos", confirmation_views.get_confirmation_promos),
    path("api/v1/confirmation/promos/", confirmation_views.get_confirmation_promos),
    path("api/v1/confirmation/promos/create", confirmation_views.create_confirmation_promo),
    path("api/v1/confirmation/promos/create/", confirmation_views.create_confirmation_promo),
    path("api/v1/confirmation/promos/partners", confirmation_views.get_confirmation_promo_partners),
    path("api/v1/confirmation/promos/partners/", confirmation_views.get_confirmation_promo_partners),
    path("api/v1/confirmation/promos/target-users", confirmation_views.get_confirmation_promo_target_users),
    path("api/v1/confirmation/promos/target-users/", confirmation_views.get_confirmation_promo_target_users),
    path("api/v1/confirmation/promos/target-magasins", confirmation_views.get_confirmation_promo_target_magasins),
    path("api/v1/confirmation/promos/target-magasins/", confirmation_views.get_confirmation_promo_target_magasins),
    path("api/v1/confirmation/promos/validate", confirmation_views.validate_promo_code),
    path("api/v1/confirmation/promos/validate/", confirmation_views.validate_promo_code),
    path("api/v1/promo/validate", confirmation_views.validate_promo_code),
    path("api/v1/promo/validate/", confirmation_views.validate_promo_code),
    path("api/v1/promos/validate", confirmation_views.validate_promo_code),
    path("api/v1/promos/validate/", confirmation_views.validate_promo_code),
    path("api/v1/promo/validation", confirmation_views.validate_promo_code),
    path("api/v1/promo/validation/", confirmation_views.validate_promo_code),
    path("api/v1/confirmation/promos/<int:promo_id>/users", confirmation_views.get_confirmation_promo_users),
    path("api/v1/confirmation/promos/<int:promo_id>/users/", confirmation_views.get_confirmation_promo_users),
    path("api/v1/confirmation/promos/<int:promo_id>/update", confirmation_views.update_confirmation_promo),
    path("api/v1/confirmation/promos/<int:promo_id>/update/", confirmation_views.update_confirmation_promo),
    path("api/v1/confirmation/promos/<int:promo_id>/delete", confirmation_views.delete_confirmation_promo),
    path("api/v1/confirmation/promos/<int:promo_id>/delete/", confirmation_views.delete_confirmation_promo),

    # Confirmation Publicités & Bannières API endpoints
    path("api/v1/confirmation/publicites", confirmation_views.get_confirmation_publicites),
    path("api/v1/confirmation/publicites/", confirmation_views.get_confirmation_publicites),
    path("api/v1/confirmation/publicites/create", confirmation_views.create_confirmation_publicite),
    path("api/v1/confirmation/publicites/create/", confirmation_views.create_confirmation_publicite),
    path("api/v1/confirmation/publicites/magasins", confirmation_views.get_confirmation_publicite_magasins),
    path("api/v1/confirmation/publicites/magasins/", confirmation_views.get_confirmation_publicite_magasins),
    path("api/v1/confirmation/publicites/<int:pub_id>/update", confirmation_views.update_confirmation_publicite),
    path("api/v1/confirmation/publicites/<int:pub_id>/update/", confirmation_views.update_confirmation_publicite),
    path("api/v1/confirmation/publicites/<int:pub_id>/delete", confirmation_views.delete_confirmation_publicite),
    path("api/v1/confirmation/publicites/<int:pub_id>/delete/", confirmation_views.delete_confirmation_publicite),
    path("api/v1/confirmation/publicites/<int:pub_id>/toggle-status", confirmation_views.toggle_confirmation_publicite_status),
    path("api/v1/confirmation/publicites/<int:pub_id>/toggle-status/", confirmation_views.toggle_confirmation_publicite_status),

    # Confirmation Stories (Style Instagram) API endpoints
    path("api/v1/confirmation/stories", confirmation_views.get_confirmation_stories),
    path("api/v1/confirmation/stories/", confirmation_views.get_confirmation_stories),
    path("api/v1/confirmation/stories/create", confirmation_views.create_confirmation_story),
    path("api/v1/confirmation/stories/create/", confirmation_views.create_confirmation_story),
    path("api/v1/confirmation/stories/<int:story_id>/update", confirmation_views.update_confirmation_story),
    path("api/v1/confirmation/stories/<int:story_id>/update/", confirmation_views.update_confirmation_story),
    path("api/v1/confirmation/stories/<int:story_id>/delete", confirmation_views.delete_confirmation_story),
    path("api/v1/confirmation/stories/<int:story_id>/delete/", confirmation_views.delete_confirmation_story),
    path("api/v1/confirmation/stories/<int:story_id>/toggle-status", confirmation_views.toggle_confirmation_story_status),
    path("api/v1/confirmation/stories/<int:story_id>/toggle-status/", confirmation_views.toggle_confirmation_story_status),
    path("api/v1/confirmation/stories/<int:story_id>/items/create", confirmation_views.add_story_item),
    path("api/v1/confirmation/stories/<int:story_id>/items/create/", confirmation_views.add_story_item),
    path("api/v1/confirmation/stories/items/<int:item_id>/update", confirmation_views.update_story_item),
    path("api/v1/confirmation/stories/items/<int:item_id>/update/", confirmation_views.update_story_item),
    path("api/v1/confirmation/stories/<int:story_id>/views", confirmation_views.get_confirmation_story_views_analytics),
    path("api/v1/confirmation/stories/<int:story_id>/views/", confirmation_views.get_confirmation_story_views_analytics),
    path("api/v1/confirmation/stories/items/<int:item_id>/delete", confirmation_views.delete_story_item),
    path("api/v1/confirmation/stories/items/<int:item_id>/delete/", confirmation_views.delete_story_item),

    # Public Stories API for mobile / web clients
    path("api/v1/stories/active", confirmation_views.get_active_stories_public),
    path("api/v1/stories/active/", confirmation_views.get_active_stories_public),
    path("api/v1/stories/<int:story_id>/view", confirmation_views.record_story_view),
    path("api/v1/stories/<int:story_id>/view/", confirmation_views.record_story_view),


    path("api/v1/chefbureux/commandes",views.commande_par_chef_bureux,name="api_get_commande_for_chef"),
    path('api/v1/commande/create', views.create_commande, name='create_commande'),
    path( "api/v1/commande/update", views.chnange_etat_commande),
    path("api/v1/livreur/create",views.create_livreur_solo,name="api fopr create compte livreur "),
    path("api/v1/client/magasins/",views.liste_magasin_par_client,name="la liste de magasin "),
    path("api/v1/magasinbyid",views.get_magasin_by_id,name="get magasin by id"),
    path("api/v1/magasin/produis",views.get_produis_magasin,name="produis de magasin "),
    path('api/v1/produis',views.get_produis_details),
    path("api/v1/magasin/sponsore",views.get_magasin_sponsorise),
    #path("api/v1/produis")
    path("api/v1/magasin/create/produis",views.add_produis,name="ajpouter produis with magasin id "),
    path("api/v1/catalogue/magasins",views.magasin_par_catalogue,name="la lise des magasin par catalogue "),

    path("api/v1/catalogues",views.get_all_catalogue,name="get all catalogue "),
    path("api/v1/catalogues/",views.get_all_catalogue),
    path("api/v1/catalogue/create", views.create_catalogue_api),
    path("api/v1/catalogue/create/", views.create_catalogue_api),
    path("api/v1/magasin/catalogue/add", views.add_catalogue_to_magasin),
    path("api/v1/magasin/catalogue/add/", views.add_catalogue_to_magasin),
    path("api/v1/magasin/catalogue/remove", views.remove_catalogue_from_magasin),
    path("api/v1/magasin/catalogue/remove/", views.remove_catalogue_from_magasin),
    path("api/v1/client/commandearticles/create",views.create_commande_articles,name="api create command i need client id "),
    path("api/v1/magasin/commandes",views.commande_par_magasin,name="tout les commande de magasin specilier "),
    path("api/v1/commande/articles",views.articles_pour_commande,name="details de commande "),
    path("api/v1/emplois/commande/valide",views.valider_le_payment,name='api pour valide le payment par le livreur '),
    path("api/v1/emplois/credi",views.get_credi_emplois,name="credi de emplois que dois payye a entrprise"),
    path('api/v1/chefbureux/livreur/create',views.create_livreur_chefbureux,name='api post for create livrerur '),
    path('api/v1/chefbureuxlivreurs',views.get_all_livreur_de_chef_bu,name='api to get all liverurse cree par le chef bureux by leur id '),
    path("api/v1/chefbureux/commandes/",views.all_commande_par_groupe,name="api to get all commande de liverru de groupe x "),
    path("api/v1/livreur/credi",views.get_credi_de_livreur,name="get credi de livereur "),
    path("api/v1/livreur/tax_tawsil", views.get_tax_tawsil_livreur, name="get_tax_tawsil_livreur"),
    path("api/v1/livreur/tax_tawsil/", views.get_tax_tawsil_livreur),
    path("api/v1/actions",views.get_action_for_chef_bureux_x,name="api to get all action de agengs de bureux x"),
    path("api/v1/platfome/magasin/info", views.get_magasin_info),
    path("api/v1/platfome/magasin/info/", views.get_magasin_info),
    path("api/v1/platfome/magasin/update", views.update_magasin),
    path("api/v1/platfome/magasin/update/", views.update_magasin),
    path("api/v1/platfome/magasin/uploadimages", views.upload_image_magasin),
    path("api/v1/platfome/magasin/uploadimages/", views.upload_image_magasin),
    path("api/v1/produis/delete",views.delete_produit),
    path ("api/v1/produis/update",views.update_produit),
    path("api/v1/produis/reorder", views.reorder_produits),
    path("api/v1/produis/reorder/", views.reorder_produits),
    path("api/v1/magasins/reorder", views.reorder_magasins),
    path("api/v1/magasins/reorder/", views.reorder_magasins),
    path("api/v1/application/magasin/produits",views.get_produis_magasin_application),
    path("api/v1/application/magasins",views.liste_magasin_par_client_application),



    path("api/v1/magasin/livreuses",views.get_livreuves_pour_magasin),
    path("api/v1/commission/livrision",views.get_commision_livraison),
    path("api/v1/commission/livreur", views.get_commissions_livreur, name="get_commissions_livreur"),
    path("api/v1/commission/livreur/", views.get_commissions_livreur),
    path("api/v1/commission/livreur/create", views.create_commission_livreur, name="create_commission_livreur"),
    path("api/v1/commission/livreur/create/", views.create_commission_livreur),
    path("api/v1/commission/livreur/update", views.update_commission_livreur, name="update_commission_livreur"),
    path("api/v1/commission/livreur/update/", views.update_commission_livreur),
    path("api/v1/commission/livreur/delete/<int:id>", views.delete_commission_livreur, name="delete_commission_livreur_with_id"),
    path("api/v1/commission/livreur/delete/<int:id>/", views.delete_commission_livreur),
    path("api/v1/commission/livreur/delete", views.delete_commission_livreur, name="delete_commission_livreur"),
    path("api/v1/commission/livreur/delete/", views.delete_commission_livreur),
    path("api/v1/commission/livreur/taux", views.manage_livreur_commission_rate, name="manage_livreur_commission_rate"),
    path("api/v1/commission/livreur/taux/", views.manage_livreur_commission_rate),

    path ("api/v1/supervisseur/magasin/gbs",views.update_partenneur_par_viseur),
    path("api/v1/reviews/produis/create",views.create_reviews_produis),
     path("api/v1/produis/reviews",views.get_reviews_for_produis),
     path("api/v1/reviews/magasin/create",views.reviews_magasin_create),
     path("api/v1/reviews/magasin",views.get_reviews_magasin),

     path("api/v1/publisites/magasin",views.get_publisites),

     path("api/v1/comtable/actions",views.get_all_actions_for_comptable),
     path("api/v1/client/gbs",views.updtae_lan_log_client),
     path("api/v1/livreur/qr_code",views.verifie_commande_scaned),

     path("api/v1/livreur/commades",views.commades_livreurs),
     path("api/v1/livreur/commandes",views.commades_livreurs),
     path("api/v1/livreur/commandes/",views.commades_livreurs),
     path("api/v1/client/favoritemagasin",views.get_magasin_ids),

     path("api/v1/client/favoriteproduis",views.get_produis_ids),
     path ("api/v1/client/commandes",views.get_commandes_client,name="get_commandes_client"),
     path("api/v1/catalogue/magasin",views.get_catalogue_magasin),
     path("api/v1/produis/hot",views.produis_hot),
     path("api/v1/price_delivery",views.get_prix_de_de_livraison),


     path("api/v1/starshop/products",views.get_all_produis_star_shop),
     path("api/v1/magasin/disponible",views.magasin_disponible),
     path("api/v1/centre/centreappel/commande",views.commande_de_service_cofimation),
     path("api/v1/commande/starshop/client",views.commande_starshop_client),
     path("api/commande/starshop/noconfimated",views.count_commandes_confirmation_centre_appel),
     path("api/v1/livreur/demande_numero_client", views.request_client_phone_livreur),
     path("api/v1/livreur/demande_numero_client/", views.request_client_phone_livreur),
      
     
     





    # path("api/v1/publications/magasin",veiws.)
    
    
    
      # SMS status checking

    
    



]