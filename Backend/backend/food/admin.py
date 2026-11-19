from django.contrib import admin  # Ensure the admin module is imported
from .models import *

# Register your models here.

@admin.register(Magasin)
class MagasinAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "ordre_sponsor", "ordre", 'owner__user__username', 'address', 'wilaya', 'is_active')
    list_editable = ('ordre_sponsor', 'is_active')
    list_filter = ('ordre_sponsor', 'is_active', 'wilaya')
    search_fields = ('name', 'owner__user__first_name', 'owner__user__last_name', "owner__user__phone_number_1", 'address')

@admin.register(Produis)
class ProduisAdmin(admin.ModelAdmin):
    list_display = ("id",'name', 'magasin', 'price',"disponibilite" )
    list_filter = ('disponibilite', 'magasin')
    search_fields = ('name', 'magasin__name')
    list_editable = ('disponibilite',)

@admin.register(Livreur)
class LivreurAdmin(admin.ModelAdmin):
    list_display = ("id",  'is_available',"partenneur__user__first_name", 'partenneur__user__username', 'partenneur__user__last_name', 'partenneur__user__phone_number_1', 'partenneur__user__email')
    list_filter = ('is_available',)
    search_fields = ("id","partenneur__user__first_name", 'partenneur__user__username', 'partenneur__user__last_name', 'partenneur__user__phone_number_1', 'partenneur__user__email')

@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'magasin', 'livreur', 'total_price', 'status', 'created_at',"delivery_price")
    list_filter = ('status', 'created_at', 'magasin')
    search_fields = ('client__username', 'magasin__name', 'livreur__user__username')
    ordering = ('-created_at',)
    list_editable = ('status',)

@admin.register(CommandeArticle)
class CommandeArticleAdmin(admin.ModelAdmin):
    list_display = ('commande', 'article', 'quantity', 'subtotal')
    search_fields = ('commande__id', 'article__name')
    list_filter = ('commande__status',)

@admin.register(Payment_de_livreur)
class PaymentDeLivreurAdmin(admin.ModelAdmin):
    list_display = ('get_livreur_name', 'total_fees', 'application_fee')
    list_filter = ('livreur',)
    search_fields = (
        'livreur__partenneur__user__first_name',
        'livreur__partenneur__user__last_name',
    )
    ordering = ('-total_fees',)

    def get_livreur_name(self, obj):
        # Ensure livreur has a partenneur and that partenneur has a user
        if obj.livreur and obj.livreur.partenneur and hasattr(obj.livreur.partenneur, 'user') and obj.livreur.partenneur.user:
            return f"{obj.livreur.partenneur.user.first_name} {obj.livreur.partenneur.user.last_name}"
        return "Livreur non assigné"
    get_livreur_name.short_description = "Livreur"
@admin.register(Catlogue)
class CatlogueAdmin(admin.ModelAdmin):
    list_display=("id","name","description")
    search_fields=("name",)
@admin.register(PaymentEmplois)
class PaymentEemplois (admin.ModelAdmin):
       list_display=('emplois',"total_paid","service_fee")
@admin.register(Actions)
class Actions (admin.ModelAdmin):
    list_display=("id","agent","date_action","total_amount")


@admin.register(Publicity)
class Publicity (admin.ModelAdmin):
    list_display=("id","name","description","magasin","date_creation","date_expires")
    search_fields=("name",)
    list_filter=("magasin",)
    list_editable=("name","description","magasin","date_expires")
    ordering=("-date_creation",)


@admin.register(ReviewsProduis)
class ReviewsProduisAdmin(admin.ModelAdmin):
    list_display=("id","article","client","commentaire","star")
    search_fields=("produit__name","client__username")


@admin.register(CommissionLivreur)
class CommissionLivreurAdmin(admin.ModelAdmin):
    list_display=("id","km","prix")


     
@admin.register(ReviewsMagasin)
class ReviewsMagasinAdmin(admin.ModelAdmin):
    list_display=("id","magasin","client","commentaire","star")
    search_fields=("produit__name","client__username")


    
@admin.register(DeviceApp)
class DeviceAppAdmin(admin.ModelAdmin):
    list_display = ('id', 'version', 'description', 'app' )
    search_fields=("version",)


class StoryItemInline(admin.TabularInline):
    model = StoryItem
    extra = 1
    fields = ('image', 'duration', 'magasin', 'lien', 'title', 'order', 'is_active')


@admin.register(Story)
class StoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'is_active', 'order', 'date_creation', 'date_expires', 'get_items_count')
    list_filter = ('is_active', 'date_creation')
    search_fields = ('title',)
    list_editable = ('is_active', 'order')
    inlines = [StoryItemInline]

    def get_items_count(self, obj):
        return obj.items.count()
    get_items_count.short_description = "Nombre de slides"


@admin.register(StoryItem)
class StoryItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'story', 'duration', 'magasin', 'lien', 'order', 'is_active', 'date_creation')
    list_filter = ('is_active', 'story')
    search_fields = ('title', 'story__title', 'description')
    list_editable = ('duration', 'order', 'is_active')



admin.site.register (testMigrations)



@admin.register(Historique_annuler_commande)
class Historique_annuler_commandeAdmin(admin.ModelAdmin):
    list_display=("id","user_annulie__first_name","user_annulie__last_name","date_creation")
admin.site.register(PrixStarshop)





