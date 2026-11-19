from django.contrib import admin
from .models import *
from django.core.exceptions import ValidationError


from django.contrib.auth.hashers import make_password


@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    # Utilisez uniquement les champs du modèle `CustomUser` ici
    # nbr_commandes = champ DB éditable directement dans la liste
    # commandes_auto = comptage automatique depuis la DB (lecture seule)
    list_display = ("id", 'username', 'first_name', 'last_name', 'phone_number_1', 'role', 'wilaya', 'wilaya_code', 'solde', 'nbr_commandes', 'commandes_auto', 'is_activate', "date_joined")
    list_editable = ('solde', 'nbr_commandes')
    search_fields = ['username', "groupe", "first_name", "last_name", "wilaya", "wilaya_code", "email", "phone_number_1", "phone_number_2"]
    list_filter = ["is_active", "role", 'wilaya', "wilaya_code"]
    readonly_fields = ('commandes_auto',)

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
            if 'solde' not in readonly:
                readonly.append('solde')
        return tuple(readonly)

    def get_list_editable(self, request):
        if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
            return tuple(f for f in self.list_editable if f != 'solde')
        return self.list_editable

    def save_model(self, request, obj, form, change):
        # If the password is being changed, hash it
        if 'password' in form.changed_data:
            obj.password = make_password(form.cleaned_data['password'])
        # Protection stricte : seul le superuser ou l'admin peut modifier le solde
        if change and 'solde' in form.changed_data:
            if not (request.user.is_superuser or getattr(request.user, 'role', '') == 'admin'):
                old_obj = CustomUser.objects.get(pk=obj.pk)
                obj.solde = old_obj.solde
        super().save_model(request, obj, form, change)

    def is_activate(self, obj):
        return obj.is_active  
    is_activate.short_description = 'Activated' 
    is_activate.boolean = True

    def commandes_auto(self, obj):
        """Comptage automatique depuis la DB (lecture seule, à titre informatif)."""
        try:
            from food.models import Commande
            client_delivered = Commande.objects.filter(client=obj, status='delivered').count()
            client_total = Commande.objects.filter(client=obj).count()

            livreur_delivered = Commande.objects.filter(livreur__partenneur__user=obj, status='delivered').count()
            livreur_total = Commande.objects.filter(livreur__partenneur__user=obj).count()

            magasin_delivered = Commande.objects.filter(magasin__owner__user=obj, status='delivered').count()
            magasin_total = Commande.objects.filter(magasin__owner__user=obj).count()

            parts = []
            if client_total > 0:
                parts.append(f"{client_delivered}/{client_total} Client")
            if livreur_total > 0:
                parts.append(f"{livreur_delivered}/{livreur_total} Livreur")
            if magasin_total > 0:
                parts.append(f"{magasin_delivered}/{magasin_total} Magasin")

            if parts:
                return " | ".join(parts)
        except Exception:
            pass
        return "-"
    commandes_auto.short_description = 'Cmd Auto (DB)'

@admin.register(Partenneur)
class PartenneurAdmin(admin.ModelAdmin):
    list_display = ("id", 'user__username', "user__first_name", "user__last_name", "user__phone_number_1", 'Nif', "type_compte__name", "nbr_commandes", "is_available", "vihucule__type_vehicule", "user__is_active")
    list_filter = ("user__is_active", "type_compte")  # Removed 'type_compte_partener' as it is not a valid field
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'user__phone_number_1', 'user__phone_number_2', 'Nif']
    readonly_fields = ('nbr_commandes',)

    def nbr_commandes(self, obj):
        try:
            from food.models import Commande
            livreur_delivered = Commande.objects.filter(livreur__partenneur=obj, status='delivered').count()
            livreur_total = Commande.objects.filter(livreur__partenneur=obj).count()
            if livreur_total > 0:
                return f"{livreur_delivered} livrée(s) / {livreur_total}"

            magasin_delivered = Commande.objects.filter(magasin__owner=obj, status='delivered').count()
            magasin_total = Commande.objects.filter(magasin__owner=obj).count()
            if magasin_total > 0:
                return f"{magasin_delivered} livrée(s) / {magasin_total}"
        except Exception:
            pass
        return "0"
    nbr_commandes.short_description = 'Nbr Commandes (Livrées / Total)'
    

    


    # Ici vous pouvez inclure les champs spécifiques à Partenneur
@admin.register(Coursa)
class CoursaAdmin(admin.ModelAdmin):

    list_display = ("id", "client", "partener", "km", "prix", "etat", "paye", 'tax_tawsile', "date_creation")
    list_filter = ("paye","type_coursa","etat", "partener__user__wilaya_code")  # Added filter for 'type_coursa' and 'wilaya_code'
    search_fields = (
    "partener__user__first_name", 
    "partener__user__last_name",
    "partener__user__username"
    "partenneur__user__phone_number_1",
    "client__fisrt_name",
    "client__last_name",
    "client__phone_number_1")
     # Now includes date_creation
    ordering = ('-date_creation',)


class PaymentAdmin(admin.ModelAdmin):
    # Display related fields using methods
    list_display = ('partner_first_name', 'partner_nom_de_magasin', 'total_tax_tawsile', 'paid', 'created_at')
    list_filter = ('paid',)  # Filter payments based on the 'paid' field
    search_fields = ('partner__user__first_name', 'partner__nom_de_magasin')  # Search by partner's first name or store name
    list_editable = ('paid',)  # Allow editing of the 'paid' field directly from the list view
    ordering = ('-created_at',)  # Order by the most recent created_at

    # Custom method to display the partner's first name
    def partner_first_name(self, obj):
        return obj.partner.user.first_name
    partner_first_name.short_description = "Partner First Name"

    # Custom method to display the partner's store name
    def partner_nom_de_magasin(self, obj):
        return obj.partner.nom_de_magasin
    partner_nom_de_magasin.short_description = "Store Name"

admin.site.register(Payment, PaymentAdmin)
class Payment_Par_partenerAdmin(admin.ModelAdmin):
    list_display = ('partner', 'total_tax_tawsile', 'confirmed_by_partner', 'paid', 'created_at', 'course_count')
    search_fields = ('partner__user__username', 'partner__nom_de_magasin')
    list_filter = ('confirmed_by_partner', 'paid', 'created_at')
    readonly_fields = ('total_tax_tawsile',)  # Make total_tax_tawsile read-only in the admin interface

    def course_count(self, obj):
        return obj.courses.count()  # Display the number of courses associated with the payment
    course_count.short_description = 'Number of Courses'

    def save_model(self, request, obj, form, change):
        # You can override this method to perform additional actions when saving a payment
        if not change:  # Only calculate the tax on new payments
            obj.calculate_total_tax()
        super().save_model(request, obj, form, change)

# Register the model with the admin panel
admin.site.register(Payment_Par_partener, Payment_Par_partenerAdmin)

class ComentaireAdmin(admin.ModelAdmin):
    list_display=("id"
    ,"pertener__user__first_name",
    "pertener__user__last_name",
    "pertener__user__phone_number_1",
    "comm","date_de_creation"
    ,"pertener__type_compte__name")
admin.site.register(Comentaire, ComentaireAdmin)

class CassieAdmin(admin.ModelAdmin):
    list_display=('id',"chef_bu__first_name","chef_bu__last_name","chef_bu__phone_number_1",'etat','date_creationn')
admin.site.register(Cassie, CassieAdmin)
class type_compteAdmin(admin.ModelAdmin):
    list_display=('id','name')
class type_compteAdmin(admin.ModelAdmin):
    list_display=('id','name','tax_tawsile')
class type_partenerAdmin(admin.ModelAdmin):
    list_display=("id","name")
admin.site.register(Type_compte_partener,type_compteAdmin) #just pour les detailt de type de compte choffeur ,magasin
admin.site.register(Abonnment_compte,type_partenerAdmin) #pour voir details de abonment de compte gold or basic
class RemiseAdmin(admin.ModelAdmin):
    list_display=("id","partenneur","code_invitation","revunu","pourcentage")
admin.site.register(Remise,RemiseAdmin)

#affichage de table commision dans le pannneux django 
 
class VihiculeAdmin(admin.ModelAdmin):
    list_display=("id","marque","model","type_vehicule") #affichage de vihic
    list_filter= ("type_vehicule","marque",) #filtre par type de vihicule
    search_fields=("marque","model","type_vehicule",) 
admin.site.register(Vihucule,VihiculeAdmin)

@admin.register(Action_Superviseur)
class SuperviseurAdmin(admin.ModelAdmin):
    list_display = ('id', "date",
    'superviseur__first_name', 
    'superviseur__last_name', 
    'superviseur__phone_number_1'
    ,"pertenneur__type_compte",
    "pertenneur__user__is_active",)
    list_filter = ("pertenneur__type_compte","pertenneur__user__wilaya_code",)
    search_fields = ('superviseur__first_name', 'superviseur__last_name', 'superviseur__phone_number_1')
    ordering = ('-id',)

class RapportAdmin(admin.ModelAdmin):
    list_display=("id","message")
admin.site.register(Rapport,RapportAdmin)

    #affichage de commision
#register la table commision dans le pannel django

#admin panel custome for flexy models 
class FlyxsuAdmin (admin.ModelAdmin):
    list_display = ('id', 'superviseur', 'wilaya', 'somme', 'etat')
    list_filter = ('etat', 'wilaya')
    search_fields = ('superviseur__fisrt_name', 'wilaya')
admin.site.register(Flixy,FlyxsuAdmin)
class Action_Centre_APPEl_flyxyADMIN (admin.ModelAdmin):
    list_display = ('id', 'etat', 'data_de_creation', 'centre_appel')
    list_filter = ('etat',)
    search_fields = ('centre_appel__username', 'etat')
    ordering = ('-data_de_creation',)
admin.site.register(Actions_centre_appel_flixy,Action_Centre_APPEl_flyxyADMIN)
 


class CommisionAdmin(admin.ModelAdmin):
    list_filter=("type_course","wilaya",)
    list_display=("id",'type_course',"wilaya","prix_depart","code_wilaya") 
    search_fields=("type_course","code_wilaya","wilaya")
    ordering=("wilaya",)
    


admin.site.register(Commissions, CommisionAdmin)


class NotificationChoffeurAdmin(admin.ModelAdmin):
    list_display=("partenneur__user__first_name","partenneur__user__last_name","read","message","date_creation")
    search_fields =("partenneur__user__first_name", "partenneur__user__last_name","user__name")
    
    list_filter=("read",)
admin.site.register(Notication_choffeur,NotificationChoffeurAdmin)


class VideoTotoInline(admin.TabularInline):
    model = VideoToto
    extra = 1
    fields = ('name', 'time', 'lien',"image")
    readonly_fields = ()
    show_change_link = True


@admin.register(CatalogueVideo)
class CatalogueVideoAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)
    inlines = [VideoTotoInline]


@admin.register(VideoToto)
class VideoTotoAdmin(admin.ModelAdmin):
    list_display = ('name', 'time', 'cataloguevideo', 'lien')
    list_filter = ('cataloguevideo',)
    search_fields = ('name', 'description', 'lien')
    raw_id_fields = ('cataloguevideo',)
    

    # if you want to display a thumbnail in the admin list/detail

@admin.register(HistoriqueCoursa)
class HistoriqueCoursaAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'partenneur', 'client', 'coursa', 'etat', 'previous_etat')
    list_filter = ('etat', 'created_at')
    search_fields = ('partenneur__user__username', 'client__username', 'coursa__id', 'etat', 'previous_etat','partenneur__user__first_name','partenneur__user__last_name',"partenneur__user__phone_number_1")
    ordering = ('-created_at',)
    readonly_fields = ('previous_etat',)

    def get_queryset(self, request):
        # Customize the queryset to include related fields for optimization
        queryset = super().get_queryset(request)
        return queryset.select_related('partenneur', 'client', 'coursa')
@admin.register(OTP)
class OptsAdmin (admin.ModelAdmin):
    list_display=["id","expired","code","phone_number"]
   
    




@admin.register(Objectif)
class ObjectifAdmin(admin.ModelAdmin):
    list_display = ('id', 'titre', 'cible', 'type_objectif', 'valeur_cible', 'prime_montant', 'periode', 'date_debut', 'date_fin', 'wilaya', 'is_active')
    list_filter = ('cible', 'type_objectif', 'periode', 'is_active', 'wilaya')
    search_fields = ('titre', 'description', 'wilaya')
    ordering = ('-created_at',)


@admin.register(ProgressionObjectif)
class ProgressionObjectifAdmin(admin.ModelAdmin):
    list_display = ('id', 'objectif', 'user', 'valeur_actuelle', 'est_atteint', 'date_atteint', 'prime_versee', 'date_versement')
    list_filter = ('est_atteint', 'prime_versee', 'objectif__cible')
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'objectif__titre')
    ordering = ('-updated_at',)
