from rest_framework import serializers
from .models import *
from django.contrib.auth.hashers import make_password
from django.db.models import Q
from food.models import Magasin
class TypeComptePartenerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Type_compte_partener
        fields = "__all__"

        def validate_name(self, value):
            if len(value) < 3:
                raise serializers.ValidationError(
                    "The name must be at least 3 characters long.")

            if Type_compte_partener.objects.get(name=value).exist():
                raise serializers.ValidationError(
                    "cette compte partennneur exit deja ")
            return value

        def validate_tax_tawsile(self, value):
            if value and value < 0:
                raise serializers.ValidationError(
                    "The tax value cannot be negative.")
            return value


class AbonnmentCompteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Type_compte_partener
        fields = "__all__"  # Include fields to serialize


class CustomUserSerializer(serializers.ModelSerializer):
    delivered_orders_count = serializers.SerializerMethodField()
    nbr_commandes = serializers.SerializerMethodField()
    type_compte_name = serializers.SerializerMethodField()
    partener_id = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        extra_kwargs = {
            # Prevents password from being read
            'password': {'write_only': True},
            "rating": {"read_only": True},
            "solde": {"read_only": True},  # STRICT SECURITY: Solde modifiable UNIQUEMENT par l'admin
        }

        fields = "__all__"  # Include all fields to serialize

    def get_delivered_orders_count(self, obj):
        if not obj or not getattr(obj, 'id', None):
            return 0
        try:
            raw_nbr = getattr(obj, 'nbr_commandes', None)
            if raw_nbr is not None:
                return raw_nbr
            from food.models import Commande
            delivered_statuses = ['delivered', 'livree', 'livrée', 'DELIVERED', 'LIVREE']
            client_c = Commande.objects.filter(client_id=obj.id, status__in=delivered_statuses).count()
            livreur_c = Commande.objects.filter(livreur__partenneur__user_id=obj.id, status__in=delivered_statuses).count()
            magasin_c = Commande.objects.filter(magasin__owner__user_id=obj.id, status__in=delivered_statuses).count()
            return max(client_c, livreur_c, magasin_c)
        except Exception:
            return 0

    def get_nbr_commandes(self, obj):
        if not obj or not getattr(obj, 'id', None):
            return 0
        raw_nbr = getattr(obj, 'nbr_commandes', None)
        if raw_nbr is not None:
            return raw_nbr
        return self.get_delivered_orders_count(obj)

    def get_type_compte_name(self, obj):
        try:
            p = obj.USER.first()
            if p and p.type_compte:
                return p.type_compte.name
        except Exception:
            pass
        return None

    def get_partener_id(self, obj):
        try:
            p = obj.USER.first()
            if p:
                return p.id
        except Exception:
            pass
        return None



    def to_internal_value(self, data):
        if hasattr(data, 'dict'):
            data = data.copy()
        elif isinstance(data, dict):
            data = data.copy()
            
        if 'phone_number_1' in data and data['phone_number_1']:
            p1 = str(data['phone_number_1']).replace(' ', '').replace('-', '')
            if p1.startswith('0') and len(p1) == 10:
                p1 = '+213' + p1[1:]
            elif p1.startswith('213') and len(p1) == 12:
                p1 = '+' + p1
            elif not p1.startswith('+') and len(p1) == 9:
                p1 = '+213' + p1
            data['phone_number_1'] = p1
        if 'phone_number_2' in data and data['phone_number_2']:
            p2 = str(data['phone_number_2']).replace(' ', '').replace('-', '')
            if p2.startswith('0') and len(p2) == 10:
                p2 = '+213' + p2[1:]
            elif p2.startswith('213') and len(p2) == 12:
                p2 = '+' + p2
            elif not p2.startswith('+') and len(p2) == 9:
                p2 = '+213' + p2
            data['phone_number_2'] = p2
            
        if 'sex' in data and 'sexe' not in data:
            data['sexe'] = data['sex']
            
        # Protection anti-fraude : supprimer solde si passé dans la requête
        if 'solde' in data:
            data.pop('solde', None)

        return super().to_internal_value(data)

    def create(self, validated_data):
        """Override create method to hash password"""
        password = validated_data.get('password')  # Get the plain password
        if password:
            validated_data['password'] = make_password(
                password)  # Hash the password

        # Now create the user instance with the hashed password
        user = CustomUser.objects.create(**validated_data)
        return user

    def update(self, instance, validated_data):
        """Override update method to hash password if provided"""
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)
    
    def validate_username(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError("Le nom d'utilisateur est obligatoire.")
        value = str(value).strip()
        if len(value) < 3:
            raise serializers.ValidationError("Le nom d'utilisateur doit contenir au moins 3 caractères.")
        user_id = self.instance.id if self.instance else None
        if user_id:
            # Exclude the current user from the query to avoid validating their own username
            if CustomUser.objects.filter(username=value).exclude(id=user_id).exists():
                raise serializers.ValidationError("Le nom d'utilisateur existe déjà.")
        else:
            # Check for username existence when creating a new user
            if CustomUser.objects.filter(username=value).exists():
                raise serializers.ValidationError("Le nom d'utilisateur existe déjà.")

        return value


    def validate_email(self, value):
        """Validate email format and uniqueness"""
    # Check if the email is provided and has the correct format
     #    if not value:
     #        raise serializers.ValidationError('Email is required')
     #   if "@" not in value:
        #    raise serializers.ValidationError("Enter a valid email address")



    # Check if the email already exists for a different user when updating
        user_id = self.instance.id if self.instance else None
        if user_id:
            # When updating, exclude the current user from the query to avoid validating their own email
            if CustomUser.objects.exclude(id=user_id).filter(email=value).exists():
                raise serializers.ValidationError("e-mail existe déjà")
        else:
            # When creating a new user, check for email existence
            if CustomUser.objects.filter(email=value).exists():
                raise serializers.ValidationError("L'e-mail existe déjà")

        return value

    def validate_phone_number_1(self, value):
        """Validate phone number format and uniqueness"""
        if not value:
            raise serializers.ValidationError('Phone number is required')
        
        # Sanitize value by removing spaces and dashes
        value = value.replace(' ', '').replace('-', '')

        if len(value) != 13:
            raise serializers.ValidationError(
            "Le numéro de téléphone doit être au format +213 XX XX XX XXX")
        if not (value.startswith("+2136") or value.startswith("+2135") or value.startswith("+2137")):
            raise serializers.ValidationError(
            "Le numéro de téléphone doit commencer par +2136, +2135 ou +2137")

    # Check if the phone number already exists for a different user when updating
        user_id = self.instance.id if self.instance else None
        if user_id:
            # When updating, exclude the current user from the query to avoid validating their own phone number
            if CustomUser.objects.exclude(id=user_id).filter(phone_number_1=value).exists():
                raise serializers.ValidationError(
                    ' le numéro de téléphone existe déjà')
        else:
            # When creating a new user, check for phone number existence
            if CustomUser.objects.filter(Q(phone_number_1=value) | Q(phone_number_2=value)):
                raise serializers.ValidationError(
                    'le numéro de téléphone existe déjà')
            

        return value
    def validate_phone_number_2(self, value):
        """Validate phone number format and uniqueness"""
        if value :
            # Sanitize value by removing spaces and dashes
            value = value.replace(' ', '').replace('-', '')
            
            if len(value) != 13:
                raise serializers.ValidationError(
                "Le numéro de téléphone 2 doit être au format +213 XX XX XX XXX")
            if not (value.startswith("+2136") or value.startswith("+2135") or value.startswith("+2137")):
                raise serializers.ValidationError(
                "Le numéro de téléphone doit commencer par +2136, +2135 ou +2137")
            

    # Check if the phone number already exists for a different user when updating
        if value :
            user_id = self.instance.id if self.instance else None
            if user_id:
                # When updating, exclude the current user from the query to avoid validating their own phone number
                if CustomUser.objects.exclude(id=user_id).filter(phone_number_1=value).exists():
                    raise serializers.ValidationError(
                        ' le numéro de téléphone 2 existe déjà')
                
            else:
                print (f'value : {value }')
                if CustomUser.objects.filter(Q(phone_number_1=value) | Q(phone_number_2=value)):
                    raise serializers.ValidationError(
                        'le numéro de téléphone 2 existe déjà')
                

        return value



    def validate_role(self, value):
        """Ensure role is not empty"""
        if not value:
            raise serializers.ValidationError("Role must not be empty")
        return value
    # def validate_password(self,value):
    #     if not value :
    #         print(f"value is :{value}")
    #         raise serializers.ValidationError("password must not be empty")
    def validate_password(self,value):
        
        if not value:
            raise serializers.ValidationError("password must not be empty")


        if len(value) < 6:
            raise serializers.ValidationError(
            "Le mot de passe doit contenir au moins 6 caractères.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError(
            "Le mot de passe doit contenir au moins un chiffre.")
        


        if not any(char.islower() for char in value):
            raise serializers.ValidationError(
            "Le mot de passe doit contenir au moins une lettre minuscule.")
        
        return value
    def to_representation(self, instance):
        # Get the default serialized data
        data = super().to_representation(instance)

        # Add partener_id only if the user is a "partener"
        if instance.role == "partener":
            try:
                # Fetch the related Partenneur object (adjust the query as needed)
                partener = Partenneur.objects.get(user=instance)
                data["partener_id"] = partener.id
                data['partener__type_vehicule'] = partener.vihucule.type_vehicule if partener.vihucule else None

            except Partenneur.DoesNotExist:
                # Handle missing Partenneur gracefully
                data["partener_id"] = None
        else:
            # Remove partener_id if the user is not a "partener"
            data.pop("partener_id", None)

        return data


class VihuculeSerializer(serializers.ModelSerializer):
    Date_expiration_assurance = serializers.DateField(required=False, allow_null=True)
    Date_expiration_scanner = serializers.DateField(required=False, allow_null=True)
    num_assurance = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    num_scanner = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    # Fields that need to be serialized
    class Meta:
        model = Vihucule
        fields = '__all__'  # This will include all fields from the Vihucule model

    def __str__(self):
        return f"{self.instance.id}"


class PartenneurSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), 
        write_only=True,
        source='user'
    )
    
    type_compte = TypeComptePartenerSerializer(read_only=True)
    type_compte_id = serializers.PrimaryKeyRelatedField(
        queryset=Type_compte_partener.objects.all(),
        write_only=True,
        source='type_compte'
    )

    vihucule = VihuculeSerializer(read_only=True)
    vihucule_id = serializers.PrimaryKeyRelatedField(
        queryset=Vihucule.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,  # Critical fix
        source='vihucule'
    )

    numero_act = serializers.CharField(required=False, allow_null=True, allow_blank=True)


    
    # Override the 'latitude' and 'longitude' fields to convert Decimal to float
    magasin_id = serializers.SerializerMethodField() 

    class Meta:
        model = Partenneur
        fields = "__all__"
        

    def get_magasin_id(self, obj):
        # Assuming there is a related Magasin model with a foreign key to Partenneur
        try:
            magasin = Magasin.objects.get(owner__id=obj.id)
            return magasin.id  # Replace 'magasin' with the related name if different
        except Magasin.DoesNotExist:
            return None
        

    # def validate_card_number(self, value):
    #     if value is None:
    #         raise serializers.ValidationError('num de carte est obligatoire ')
    #     if len(str(value)) != 18:  # Ensure the length is exactly 18
    #         raise serializers.ValidationError(
    #             "num de carte doit etre  18 caractere   ")
    #     return value

    def get_latitude(self, obj):
        # Convert Decimal to float for JSON serialization
        return float(obj.latitude) if obj.latitude is not None else None

    def get_longitude(self, obj):
        # Convert Decimal to float for JSON serialization
        return float(obj.longitude) if obj.longitude is not None else None

    def update(self, instance, validated_data):
        # Extract the nested vihucule data
        vihucule_data = validated_data.pop('vihucule', None)

        # Update Partenneur instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # If vihucule data is present, update the related Vihucule object
        
        if vihucule_data:
                vihucule_instance = instance.vihucule  # Get the related Vihucule object
                for attr, value in vihucule_data.items():
                    setattr(vihucule_instance, attr, value)
                vihucule_instance.save()

        return instance


class CoursaSerializer(serializers.ModelSerializer):
    client = CustomUserSerializer()  # Serializes the related CustomUser (client)
    agent = CustomUserSerializer()   # Serializes the related CustomUser (agent)
    partener = PartenneurSerializer()  # Nested serializer for partener

    class Meta:
        model = Coursa
        fields = "__all__"


class PaymentSerrializer(serializers.ModelSerializer):
    partner = PartenneurSerializer()  # Correct field name

    class Meta:
        model = Payment
        fields = "__all__"


class PaymentParPartenerSerializer(serializers.ModelSerializer):
    courses = CoursaSerializer(many=True)  # Serialize related Coursa objects

    class Meta:
        model = Payment_Par_partener
        fields = "__all__"


class ComentaireSerializer(serializers.ModelSerializer):
    pertener = PartenneurSerializer()
    centre_appel = CustomUserSerializer()

    class Meta:
        model = Comentaire
        fields = "__all__"


class CassierSerializer (serializers.ModelSerializer):

    chef_bu = CustomUserSerializer()

    class Meta:
        model = Cassie
        fields = '__all__'


class RaportSerilzer(serializers.ModelSerializer):
    superviseur = CustomUserSerializer()
    parteneur = PartenneurSerializer()

    class Meta:
        model = Rapport
        fields = "__all__"


class CammisionSerilize(serializers.ModelSerializer):
    class Meta:
        model = Commissions
        fields = "__all__"


class CustomerUserlisteSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'phone_number_1', "image_url"]


class PartnerLiteSerializer(serializers.ModelSerializer):
    user = CustomerUserlisteSerializer()

    # Show type_compte name

    class Meta:
        model = Partenneur
        fields = ['user']


class CustomerCoursaSerializer(serializers.ModelSerializer):
    client = CustomerUserlisteSerializer()
    partener = PartnerLiteSerializer()

    class Meta:
        model = Coursa
        fields = [
            "id",
            'client',
            'partener',
            'prix',
            'etat',
            'duration',
            'km',
            'date_creation',
            "depart_region",
            "depart_location",
            "arrive_region",
            "arrive_location",
            "sets",
            "paye",
            "tax_tawsile",


        ]


class taxtawsilepartener (serializers.ModelSerializer):
    class Meta:
        model = Coursa
        fields = ["id", 'tax_tawsile', 'paye']


class SupervisseurSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'phone_number_1',
                  "image_url", "wilaya", "username", "phone_number_2", "email"]

        
class CentreappelSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name',
                   "username"]



class FlixySelezers(serializers.ModelSerializer):
    superviseur = SupervisseurSerializer()
    centre_appel =CentreappelSerializer()

    class Meta:
        model = Flixy
        fields = "__all__"

    def valide_etat(self, value):
        if value not in ['accepte', 'en_attente', "refuse", "annuler"]:
            raise serializers.ValidationError('etat invalide ')
        return value


class Action_flixySelezers(serializers.ModelSerializer):
    centre_appel = CentreappelSerializer()
    superviseur= SupervisseurSerializer()

    class Meta:
        model = Actions_centre_appel_flixy
        fields = "__all__"
class Notification_choffeurSelezers (serializers.ModelSerializer):
    partenneur= PartenneurSerializer()
    class Meta:
        model = Notication_choffeur
        fields = "__all__"

class RemiseSelezers (serializers.ModelSerializer):
    class Meta :
        model=Remise


        fields=["id","code_invitation","revunu"]

class CatalogueVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CatalogueVideo
        fields = ('id', 'name')


class VideoTotoSerializer(serializers.ModelSerializer):
    # Show the nested catalogue video info on reads
    cataloguevideo = CatalogueVideoSerializer(read_only=True)
    # Allow clients to set it by ID on writes
    cataloguevideo_id = serializers.PrimaryKeyRelatedField(
        queryset=CatalogueVideo.objects.all(),
        source='cataloguevideo',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = VideoToto
        fields = (
            'id',
            'name',
            'description',
            'image',
            'time',
            'lien',
            
            'cataloguevideo',
            'cataloguevideo_id',
        )
        read_only_fields = ('id',)




class ProgressionObjectifSerializer(serializers.ModelSerializer):
    user_nom_complet = serializers.SerializerMethodField()
    user_phone = serializers.SerializerMethodField()
    valeur_cible = serializers.FloatField(source='objectif.valeur_cible', read_only=True)
    prime_montant = serializers.DecimalField(source='objectif.prime_montant', max_digits=10, decimal_places=2, read_only=True)
    pourcentage = serializers.SerializerMethodField()

    class Meta:
        model = ProgressionObjectif
        fields = [
            'id', 'objectif', 'user', 'partenaire',
            'user_nom_complet', 'user_phone', 'valeur_actuelle',
            'valeur_cible', 'prime_montant', 'est_atteint',
            'date_atteint', 'prime_versee', 'date_versement',
            'pourcentage', 'created_at', 'updated_at'
        ]

    def get_user_nom_complet(self, obj):
        name = f"{obj.user.first_name or ''} {obj.user.last_name or ''}".strip()
        return name if name else obj.user.username

    def get_user_phone(self, obj):
        return obj.user.phone_number_1 or ""

    def get_pourcentage(self, obj):
        cible = obj.objectif.valeur_cible if obj.objectif else 0
        if not cible or cible <= 0:
            return 100.0 if obj.est_atteint else 0.0
        pct = (obj.valeur_actuelle / cible) * 100.0
        return round(min(100.0, max(0.0, pct)), 1)


class ObjectifSerializer(serializers.ModelSerializer):
    cible_label = serializers.CharField(source='get_cible_display', read_only=True)
    periode_label = serializers.CharField(source='get_periode_display', read_only=True)
    type_objectif_label = serializers.CharField(source='get_type_objectif_display', read_only=True)
    participants_count = serializers.SerializerMethodField()
    completed_count = serializers.SerializerMethodField()
    primes_payees_count = serializers.SerializerMethodField()
    taux_completion = serializers.SerializerMethodField()
    statut_periode = serializers.SerializerMethodField()

    class Meta:
        model = Objectif
        fields = [
            'id', 'titre', 'description', 'cible', 'cible_label',
            'type_objectif', 'type_objectif_label', 'valeur_cible',
            'prime_montant', 'periode', 'periode_label',
            'date_debut', 'date_fin', 'wilaya', 'is_active',
            'participants_count', 'completed_count', 'primes_payees_count',
            'taux_completion', 'statut_periode', 'created_at', 'updated_at'
        ]

    def get_participants_count(self, obj):
        return obj.progressions.count()

    def get_completed_count(self, obj):
        return obj.progressions.filter(est_atteint=True).count()

    def get_primes_payees_count(self, obj):
        return obj.progressions.filter(prime_versee=True).count()

    def get_taux_completion(self, obj):
        total = obj.progressions.count()
        if total == 0:
            return 0.0
        completed = obj.progressions.filter(est_atteint=True).count()
        return round((completed / total) * 100.0, 1)

    def get_statut_periode(self, obj):
        from django.utils import timezone
        from django.utils.dateparse import parse_datetime
        now = timezone.now()
        if not obj.is_active:
            return "inactif"
        d_debut = parse_datetime(obj.date_debut) if isinstance(obj.date_debut, str) else obj.date_debut
        d_fin = parse_datetime(obj.date_fin) if isinstance(obj.date_fin, str) else obj.date_fin

        if d_debut and timezone.is_naive(d_debut):
            d_debut = timezone.make_aware(d_debut)
        if d_fin and timezone.is_naive(d_fin):
            d_fin = timezone.make_aware(d_fin)

        if d_debut and now < d_debut:
            return "a_venir"
        if d_fin and now > d_fin:
            return "expire"
        return "en_cours"
