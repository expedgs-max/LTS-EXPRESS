from rest_framework import serializers
from .models import *
from employer.serializer import *

class CatalogueSerializer(serializers.ModelSerializer):

    class Meta :
        model=Catlogue
        fields="__all__"
class PeretnneurMgasinSelezes(serializers.ModelSerializer):
    id=serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    phone_number_1 = serializers.CharField(source='user.phone_number_1', read_only=True)
    latitude = serializers.DecimalField(max_digits=20, decimal_places=15, read_only=True)
    longitude = serializers.DecimalField(max_digits=20, decimal_places=15, read_only=True)
    type_compte=TypeComptePartenerSerializer(read_only=True)

    class Meta:
        model = Partenneur
        fields = ["id","latitude", "longitude", "first_name", 'last_name', "phone_number_1","type_compte"]

class MagasinSerializer(serializers.ModelSerializer):


    cataloguqe = CatalogueSerializer(many=True, read_only=True)
    owner = PeretnneurMgasinSelezes(required=False, allow_null=True,read_only=True)
    owner_id=serializers.PrimaryKeyRelatedField(queryset=Partenneur.objects.all(),source='owner', write_only=True)
    adresse = serializers.CharField(
        source='address',  
        required=False,
        allow_blank=False,
        
        error_messages={'required': 'Le champ adresse est obligatoire'}
    )
    

    class Meta:
        model = Magasin
        fields = '__all__'
        extra_kwargs = {
            'address': {'write_only': True}  
        }
class PrixStarshopSerializer (serializers.ModelSerializer):
    class Meta :
        model=PrixStarshop
        fields="__all__"
# Serializer for the Produis model
class ProduisSerializer(serializers.ModelSerializer):
    prixstar_shop=PrixStarshopSerializer(read_only=True,required=False,many=True)
    prixstar_ids = serializers.PrimaryKeyRelatedField(
        queryset=PrixStarshop.objects.all(),
        source="prixstar_shop",
        write_only=True,
        required=False,
        many=True
        
    )

    magasin=MagasinSerializer(read_only=True,required=False)
    magasin_id=serializers.PrimaryKeyRelatedField(queryset=Magasin.objects.all(), source='magasin', write_only=True, required=True)
    catalogue_name=serializers.CharField(source='catalogue.name', read_only=True,required=False)
    
    

    
    
    
    
    
    class Meta:
        model = Produis
        fields = '__all__'
        extra_kwargs = {
            'image': {'required': False},
        }

    def add_to_quantity_stock(self, value):
        """
        Adds the given value to the current stock quantity.
        """
        if not hasattr(self, 'instance') or self.instance is None:
            raise serializers.ValidationError("Instance is required to add stock.")
        print (f"value : {value}")
        print (f"instane is : {self.instance.quantity_stock}")
        self.instance.quantity_stock += value
        self.instance.save()
        return self.instance
        

        

        
    

    # def validate_prix(self, value):
    #     if value is None :
    #         raise serializers.ValidationError("Le prix est obligatoire.")
    #     if value <= 0  :
    #         raise serializers.ValidationError("Le prix ne peut pas être négatif ou égal à zéro.")
    #     return value
    
    """def validate_image(self, value):
        max_size = 5 * 1024 * 1024  
        # 5MB in bytes
        
        if value.size > max_size:
            raise serializers.ValidationError(
                "La taille de l'image doit être inférieure à 5 Mo. "
                f"Taille actuelle : {value.size/1024/1024:.1f} Mo"
            )
        return value"""
    # def validate_catalogue(self, value):
    #     if value is None :
    #         raise serializers.ValidationError("Le catalogue est obligatoire.")
    #     return value

    def validate_name(self, value):
        if len(value) > 100 :
            raise serializers.ValidationError("Le nom ne peut pas dépasser 100 caractères.")
        if len(value)<1 :
            raise serializers.ValidationError("Le nom doit avoir au moins 5 caractères.")
        return value
    
    
            
    

# Serializer for the Livreur model
class LivreurSerializer(serializers.ModelSerializer):
    partenneur = PartenneurSerializer()
    delivered_orders_count = serializers.SerializerMethodField()
    nbr_commandes = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Livreur
        fields = '__all__'

    def get_is_available(self, obj):
        if not obj or not getattr(obj, 'id', None):
            return False
        try:
            from .consumers import get_online_livreur_ids
            online_ids = get_online_livreur_ids()
            is_blocked = False
            if hasattr(obj, 'partenneur') and obj.partenneur and hasattr(obj.partenneur, 'user') and obj.partenneur.user:
                is_blocked = bool(obj.partenneur.user.bloquer)
            return bool(obj.id in online_ids and not is_blocked)
        except Exception:
            return False

    def get_delivered_orders_count(self, obj):
        if not obj or not getattr(obj, 'id', None):
            return 0
        try:
            if hasattr(obj, 'partenneur') and obj.partenneur and hasattr(obj.partenneur, 'user') and obj.partenneur.user:
                u = obj.partenneur.user
                raw_nbr = getattr(u, 'nbr_commandes', None)
                if raw_nbr is not None:
                    return raw_nbr
            from django.db.models import Q
            delivered_statuses = ['delivered', 'livree', 'livrée', 'DELIVERED', 'LIVREE']
            q = Q(livreur_id=obj.id)
            if hasattr(obj, 'partenneur') and obj.partenneur and hasattr(obj.partenneur, 'user') and obj.partenneur.user:
                q |= Q(livreur__partenneur__user=obj.partenneur.user)
            return Commande.objects.filter(q, status__in=delivered_statuses).distinct().count()
        except Exception:
            return 0

    def get_nbr_commandes(self, obj):
        return self.get_delivered_orders_count(obj)

# Serializer for the Commande model with nested relationships
class CommandeSerializer(serializers.ModelSerializer):
    # Use PrimaryKeyRelatedField for nested relationships to simplify creation and updates
    client = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all())
    magasin = serializers.PrimaryKeyRelatedField(queryset=Magasin.objects.all())
    livreur = LivreurSerializer(required=False, allow_null=True)
    client_info = CustomUserSerializer(source='client', read_only=True)
    client_delivered_count = serializers.SerializerMethodField()
    livreur_delivered_count = serializers.SerializerMethodField()
    nbr_commandes = serializers.SerializerMethodField()

    # Custom field for product IDs that will be added to the commande
    id_produis = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        help_text="List of products with 'product_id' and 'quantity'."
    )

    class Meta:
        model = Commande
        fields = '__all__'

    def get_client_delivered_count(self, obj):
        try:
            client = getattr(obj, 'client', None)
            if client:
                raw_nbr = getattr(client, 'nbr_commandes', None)
                if raw_nbr is not None:
                    return raw_nbr
            client_id = getattr(obj, 'client_id', None) or (client.id if client else None)
            if client_id:
                delivered_statuses = ['delivered', 'livree', 'livrée', 'DELIVERED', 'LIVREE']
                return Commande.objects.filter(
                    Q(client_id=client_id) | Q(client__id=client_id),
                    status__in=delivered_statuses
                ).distinct().count()
        except Exception:
            pass
        return 0

    def get_livreur_delivered_count(self, obj):
        try:
            if hasattr(obj, 'livreur') and obj.livreur and hasattr(obj.livreur, 'partenneur') and obj.livreur.partenneur and hasattr(obj.livreur.partenneur, 'user') and obj.livreur.partenneur.user:
                u = obj.livreur.partenneur.user
                raw_nbr = getattr(u, 'nbr_commandes', None)
                if raw_nbr is not None:
                    return raw_nbr
            livreur_id = getattr(obj, 'livreur_id', None) or (obj.livreur.id if obj and hasattr(obj, 'livreur') and obj.livreur else None)
            if livreur_id:
                delivered_statuses = ['delivered', 'livree', 'livrée', 'DELIVERED', 'LIVREE']
                q = Q(livreur_id=livreur_id)
                if hasattr(obj, 'livreur') and obj.livreur and hasattr(obj.livreur, 'partenneur') and obj.livreur.partenneur and hasattr(obj.livreur.partenneur, 'user') and obj.livreur.partenneur.user:
                    q |= Q(livreur__partenneur__user=obj.livreur.partenneur.user)
                return Commande.objects.filter(q, status__in=delivered_statuses).distinct().count()
        except Exception:
            pass
        return 0

    def get_nbr_commandes(self, obj):
        return self.get_client_delivered_count(obj)


    def validate_client(self, value):
        """Ensure the client role is 'client'."""
        if value.role != "client":
            raise serializers.ValidationError("Le rôle du client doit être 'client'.")
        return value

    def validate_magasin(self, value):
        """Ensure magasin is not empty."""
        if not value:
            raise serializers.ValidationError("Le magasin ne peut pas être vide.")
        return value

    def validate_delivery_price(self, value):
        """Ensure delivery price is greater than 0."""
        if value <= 0:
            raise serializers.ValidationError("Le prix de livraison doit être supérieur à 0.")
        return value

    def validate_total_price(self, value):
        """Ensure total price is greater than 0."""
        if value <= 0:
            raise serializers.ValidationError("Le prix total doit être supérieur à 0.")
        return value
    status_choices = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('delivered', 'Livrée'),
        ('canceled', 'Annulée'),
    ]
    
    def validate_status(self, value):
        if value not in dict(self.status_choices).keys():
            raise serializers.ValidationError("Le statut n'est pas validate.")
        return value
    
    def create(self, validated_data):
        validated_data['prix_de_tax'] = 50
        
        id_produis = validated_data.pop('id_produis', [])
        
        # Pre-calculate subtotal for all articles and calculate total_price before creating Commande
        total = 0
        articles_to_create = []

        for item in id_produis:
            product_id = item['product_id']
            quantity = item.get('quantity', 1)
            speficat = item.get('specific', None)
            
            prix_star_id = item.get('prix_star_id') or None
            
            if prix_star_id: 
                try:
                    prix_star: PrixStarshop = PrixStarshop.objects.get(id=prix_star_id)
                    prix = prix_star.prix
                    validated_data['prix_de_tax'] = 0
                except PrixStarshop.DoesNotExist:
                    continue
            else:
                prix = None
            
            product: Produis = Produis.objects.get(id=product_id)
            
            if prix:
                subtotal = prix * quantity
                product.quantity_stock = product.quantity_stock - quantity
                if product.quantity_stock < 0:
                    raise serializers.ValidationError("out of stock ")
                product.save()
            else:
                subtotal = quantity * product.price

                if product.quantity_stock is not None and product.quantity_stock > 0:
                    product.quantity_stock = product.quantity_stock - quantity
                    product.save()

            total += subtotal
            articles_to_create.append({
                'article': product,
                'quantity': quantity,
                'subtotal': subtotal,
                'specific': speficat,
            })

        validated_data['total_price'] = total

        # Check if free delivery is active for the magasin
        mag = validated_data.get('magasin')
        if mag and hasattr(mag, 'is_livraison_gratuite_active') and mag.is_livraison_gratuite_active():
            validated_data['delivery_price'] = 0.00
        elif mag and getattr(mag, 'tarif_livraison', None) is not None and ('delivery_price' not in validated_data or not validated_data.get('delivery_price')):
            validated_data['delivery_price'] = mag.tarif_livraison

        # Create Commande with the calculated total_price so post_save signals receive the correct amount
        commande = Commande.objects.create(**validated_data)
        
        for art in articles_to_create:
            CommandeArticle.objects.create(
                commande=commande,
                article=art['article'],
                quantity=art['quantity'],
                subtotal=art['subtotal'],
                specific=art['specific'],
            )

        return commande
    def update(self, instance, validated_data):
        # Handle id_produis if it is provided in the update data
        id_produis = validated_data.pop('id_produis', None)

        # Update the Commande instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # If id_produis is provided, update the related CommandeArticle entries
        if id_produis is not None:
            # Clear existing CommandeArticle entries for this commande
            CommandeArticle.objects.filter(commande=instance).delete()

            # Create new CommandeArticle entries for each product ID
            for product_id in id_produis:
                product = Produis.objects.get(id=product_id)
                CommandeArticle.objects.create(commande=instance, article=product, quantity=1, subtotal=product.price)

        return instance
#cette class responsable a serlizer le table action au json data pour envoyer et affciher infomation dans next js 
class ActionsSerlaizers(serializers.ModelSerializer):
    agent=CustomUserSerializer() #selizaeer tout les infomation de agent (id,username , etc )
    livreur=LivreurSerializer()
     # Serialize only the id of the Commande
    class Meta :
        model=Actions
        fields="__all__"
    def validate_commade(self, value): 
        # Manually check if the 'commade' ID exists in the database #validate the commande id if existe in database or non after that we engistre
        if not Commande.objects.get(id=value).exists():
            raise serializers.ValidationError("Commande with this ID does not exist.")
        return value
    

   
        



# Serializer for the CommandeArticle model with nested relationships
class CommandeArticleSerializer(serializers.ModelSerializer):
    # Use nested representation only for read operations
    article = ProduisSerializer(read_only=True)
    commande = CommandeSerializer(read_only=True)
   

    class Meta:
        model = CommandeArticle
        fields = "__all__"
#payment par emplois seraliz data into json 
class PaymentEmploisSerializer(serializers.ModelSerializer):
    emplois=CustomUserSerializer()
    class Meta :
     model =PaymentEmplois
     fields='__all__'
class PyamentLivreurSerialize(serializers.ModelSerializer):
    livreur=LivreurSerializer()
    class Meta :
        model=Livreur
        fields="__all__"



class MagasinPublicationSeralize (serializers.ModelSerializer):
    class Meta :
        model=Magasin
        fields=["id","name","image"]
class PublicattionSerializer(serializers.ModelSerializer):
    magasin = MagasinPublicationSeralize(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Publicity
        fields = ['id', 'name', 'description', 'magasin', 'image', 'image_url',
                  'lien', 'target', 'badge_tag', 'cta_text', 'is_active', 'date_creation', 'date_expires']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
class SelectionLivreurSerializer(serializers.ModelSerializer):
    partenneur_first_name = serializers.CharField(source='partenneur.user.first_name', read_only=True)
    partenneur_last_name = serializers.CharField(source='partenneur.user.last_name', read_only=True)
    partenneur_phone_number_1 = serializers.CharField(source='partenneur.user.phone_number_1', read_only=True)
    

    class Meta:
        model = Livreur
        fields = ["id", "is_available", "partenneur_first_name","partenneur_last_name","partenneur_phone_number_1"]

    
class CommisionLivreurSerializer(serializers.ModelSerializer):
    class Meta :
        model=CommissionLivreur
        fields='__all__'


class CustomerUserReviewsProduct(serializers.ModelSerializer):
    class Meta :
        model=CustomUser
        fields=['id','username','first_name','last_name',"email","phone_number_1",'image_url']
class ReviewsProduisSerializer(serializers.ModelSerializer):
    client = CustomerUserReviewsProduct(read_only=True)
    article = serializers.PrimaryKeyRelatedField(queryset=Produis.objects.all())
    star = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    commentaire = serializers.CharField(allow_blank=True, required=False)
    
    class Meta:
        model = ReviewsProduis
        fields = ["id", "star", "article", "commentaire", "client", "created_at"]
    def validate_client(self,value):
        if not value :
            raise serializers.ValidationError("client must be provided")
    def validate_commentaire(self,value):
        if len(value)<10 :
            raise serializers.ValidationError("commentaire must be at least 10 characters long")
        
        if value is None :
            raise serializers.ValidationError("commentaire must be provided")
        
    def validate_star(self, value):
        if value<=1 or value>=5 :
            raise serializers.ValidationError("la not doit etre entre  1 et 5")
        if value is None :
            raise serializers.ValidationError("star must be provided")
        if not value :
            raise serializers.ValidationError("star est obligatoire ")




class ReviewsMagasinSerializers(serializers.ModelSerializer):
    client = CustomerUserReviewsProduct(read_only=True)
    

    class Meta:
        model = ReviewsMagasin
        fields = ["id", "star", "commentaire", "client", "magasin","created_at"]

    def validate_client(self, value):
        if not value:
            raise serializers.ValidationError("client doit exist")
        return value

    def validate_commentaire(self, value):
        if len(value) < 10:
            raise serializers.ValidationError("le text doit etre plus 10")
        if value is None:
            raise serializers.ValidationError("le commentaire doit exist")
        return value

    def validate_star(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("star doit etre entre 1 et 5")
        if value is None:
            raise serializers.ValidationError("star est obligatoire")
        return value

    def validate_magasin(self, value):
        if not value:
            raise serializers.ValidationError("magasin doit exist")
        return value    
        

class DeviceAppSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceApp
        fields = '__all__'  
        
    
class CommandeClientSelezers(serializers.ModelSerializer) :
    total_price = serializers.DecimalField(read_only=True,max_digits=10, decimal_places=2)
    distination = serializers.CharField(read_only=True)
    client_id = serializers.IntegerField(source="client__id", read_only=True)

    class Meta :
        model = Commande
        fields = ["id", "total_price", "distination", "client_id"]

    
class MagasinConfirmationSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    adresse = serializers.CharField(source='address', read_only=True, required=False, allow_null=True)
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    class Meta:
        model = Magasin
        fields = [
            "id", "name", "image", "address", "adresse", "contact", 
            "wilaya", "EtatOuverture", "rating", "is_active", 
            "owner_name", "phone", "latitude", "longitude"
        ]

    def get_latitude(self, obj):
        try:
            if obj.owner and obj.owner.latitude is not None and str(obj.owner.latitude).strip():
                return float(str(obj.owner.latitude))
            if obj.owner and obj.owner.user and obj.owner.user.latitude is not None and str(obj.owner.user.latitude).strip():
                return float(str(obj.owner.user.latitude))
        except Exception:
            pass
        return None

    def get_longitude(self, obj):
        try:
            if obj.owner and obj.owner.longitude is not None and str(obj.owner.longitude).strip():
                return float(str(obj.owner.longitude))
            if obj.owner and obj.owner.user and obj.owner.user.longitude is not None and str(obj.owner.user.longitude).strip():
                return float(str(obj.owner.user.longitude))
        except Exception:
            pass
        return None

    def get_owner_name(self, obj):
        if obj.owner and obj.owner.user:
            return f"{obj.owner.user.first_name} {obj.owner.user.last_name}".strip() or obj.owner.user.username
        return "N/A"

    def get_phone(self, obj):
        if obj.contact:
            return obj.contact
        if obj.owner and obj.owner.user:
            return obj.owner.user.phone_number_1 or obj.owner.user.phone_number_2
        return "N/A"


class CommandeArticleSerializerPhoneapp(serializers.ModelSerializer):
    # Use nested representation only for read operations
    article = ProduisSerializer(read_only=True)

    class Meta:
        model = CommandeArticle
        fields = "__all__"


class CommandeCnetreAppelSerializer(serializers.ModelSerializer):
    # Use PrimaryKeyRelatedField for nested relationships to simplify creation and updates
    client = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all())
    magasin = serializers.PrimaryKeyRelatedField(queryset=Magasin.objects.all())
    magasin_info = MagasinConfirmationSerializer(read_only=True, source="magasin") 
    livreur = LivreurSerializer(required=False, allow_null=True)
    client_info = CustomUserSerializer(source='client', read_only=True)
    articles_commandes = CommandeArticleSerializerPhoneapp(many=True, read_only=True)
    client_delivered_count = serializers.SerializerMethodField()
    livreur_delivered_count = serializers.SerializerMethodField()
    nbr_commandes = serializers.SerializerMethodField()
    is_colis = serializers.SerializerMethodField()
    type_service = serializers.SerializerMethodField()
    colis_info = serializers.SerializerMethodField()

    id_produis = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="List of products with 'product_id' and 'quantity'."
    )

    class Meta:
        model = Commande
        fields = '__all__'

    def get_client_delivered_count(self, obj):
        try:
            client = getattr(obj, 'client', None)
            if client:
                raw_nbr = getattr(client, 'nbr_commandes', None)
                if raw_nbr is not None:
                    return raw_nbr
            client_id = getattr(obj, 'client_id', None) or (client.id if client else None)
            if client_id:
                delivered_statuses = ['delivered', 'livree', 'livrée', 'DELIVERED', 'LIVREE']
                return Commande.objects.filter(
                    Q(client_id=client_id) | Q(client__id=client_id),
                    status__in=delivered_statuses
                ).distinct().count()
        except Exception:
            pass
        return 0

    def get_livreur_delivered_count(self, obj):
        try:
            if hasattr(obj, 'livreur') and obj.livreur and hasattr(obj.livreur, 'partenneur') and obj.livreur.partenneur and hasattr(obj.livreur.partenneur, 'user') and obj.livreur.partenneur.user:
                u = obj.livreur.partenneur.user
                raw_nbr = getattr(u, 'nbr_commandes', None)
                if raw_nbr is not None:
                    return raw_nbr
            livreur_id = getattr(obj, 'livreur_id', None) or (obj.livreur.id if obj and hasattr(obj, 'livreur') and obj.livreur else None)
            if livreur_id:
                delivered_statuses = ['delivered', 'livree', 'livrée', 'DELIVERED', 'LIVREE']
                q = Q(livreur_id=livreur_id)
                if hasattr(obj, 'livreur') and obj.livreur and hasattr(obj.livreur, 'partenneur') and obj.livreur.partenneur and hasattr(obj.livreur.partenneur, 'user') and obj.livreur.partenneur.user:
                    q |= Q(livreur__partenneur__user=obj.livreur.partenneur.user)
                return Commande.objects.filter(q, status__in=delivered_statuses).distinct().count()
        except Exception:
            pass
        return 0

    def get_nbr_commandes(self, obj):
        return self.get_client_delivered_count(obj)

    def get_is_colis(self, obj):
        try:
            if obj.specific and '"type_service": "colis"' in obj.specific:
                return True
        except Exception:
            pass
        return False

    def get_type_service(self, obj):
        try:
            if obj.specific and '"type_service": "colis"' in obj.specific:
                return 'service_colis'
        except Exception:
            pass
        return 'food'

    def get_colis_info(self, obj):
        try:
            if obj.specific and str(obj.specific).strip().startswith('{'):
                import json
                parsed = json.loads(obj.specific)
                if parsed.get('type_service') == 'colis':
                    return parsed
        except Exception:
            pass
        return None


class StoryItemSerializer(serializers.ModelSerializer):
    magasin_details = serializers.SerializerMethodField(read_only=True)
    image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StoryItem
        fields = [
            'id',
            'story',
            'image',
            'image_url',
            'duration',
            'lien',
            'magasin',
            'magasin_details',
            'title',
            'description',
            'order',
            'is_active',
            'views_count',
            'date_creation',
            'date_expires',
        ]
        read_only_fields = ['id', 'date_creation', 'views_count']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_magasin_details(self, obj):
        if obj.magasin:
            mag = obj.magasin
            img_url = None
            if mag.image:
                request = self.context.get('request')
                img_url = request.build_absolute_uri(mag.image.url) if request else mag.image.url
            return {
                'id': mag.id,
                'name': mag.name,
                'wilaya': mag.wilaya,
                'image': img_url,
                'is_active': mag.is_active,
                'EtatOuverture': mag.EtatOuverture
            }
        return None


class StorySerializer(serializers.ModelSerializer):
    items = StoryItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField(read_only=True)
    cover_url = serializers.SerializerMethodField(read_only=True)
    is_expired = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Story
        fields = [
            'id',
            'title',
            'image',
            'cover_url',
            'is_active',
            'order',
            'views_count',
            'date_creation',
            'date_expires',
            'items_count',
            'is_expired',
            'items',
        ]
        read_only_fields = ['id', 'date_creation', 'views_count']

    def get_cover_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        # If no specific cover, fallback to first item's image
        first_item = obj.items.filter(is_active=True).first()
        if first_item and first_item.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_item.image.url)
            return first_item.image.url
        return None

    def get_items_count(self, obj):
        return obj.items.count()

    def get_is_expired(self, obj):
        from django.utils import timezone
        if obj.date_expires and obj.date_expires < timezone.now():
            return True
        return False



