from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from decimal import Decimal
import random
import string

import uuid


import http


# type de compte de partner car dans le table partenaire on a deux type partener peut etre un choffeur cote vtc et magasin ou restuant cote (food)
class Type_compte_partener(models.Model):
    name = models.CharField(max_length=25)
    description = models.TextField(max_length=1000, null=True, blank=True)
    tax_tawsile = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.name
# typpe de compte sa veut dire le compte a deux type gold ou premier il a une relation avec consement et pourcentage de gagne


class Abonnment_compte(models.Model):
    name = models.CharField(max_length=30)
    descprtion = models.TextField(max_length=1000, null=True, blank=True)

    def __str__(self):
        return self.name


class CustomUser(AbstractUser):
    # Date de naissance
    first_name = models.CharField(max_length=30, blank=True, null=True)
    last_name = models.CharField(max_length=30, blank=True, null=True)
    date_de_naissance = models.DateField(blank=True, null=True)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)
    type_account_choise =[
        ("classique",'Classique'),
        ("premium",'Premium'),
    ]
    type_account =models.CharField(max_length=23, choices=type_account_choise,default="classique",blank=True,null=True)
    latitude = models.DecimalField(
        max_digits=20, decimal_places=15, null=True, blank=True)
    longitude = models.DecimalField(
        max_digits=20, decimal_places=15, null=True, blank=True)
    localtion_name = models.CharField(max_length=200, blank=True, null=True)



# Rôle de l'utilisateur (admin, employeur, client)
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('agent_administratif', 'Agent Administratif'),
        ('client', 'Client'),
        ('chef_bureau', 'chef bureux '),
        ("partener", "partener"),
        ("centre_appel", "Centre Appel"),
        ('gestion_commercial', "Gestion Commerciel"),
        ("superviseur", "Superviseur"),
        ("validation_vtc", "employer vtc"),
        ("suivi_vtc", "Suivi VTC"),
        ("comptable", "Comptable"),
        ("confirmation", "Confirmation"),
    ]
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, db_index=True)

# Lieu de résidence
    lieux = models.CharField(max_length=50, blank=True, null=True)

# Sexe (homme ou femme)

    sexe = models.CharField(max_length=6, null=True, blank=True)
    rating = models.FloatField(default=5, blank=True, null=True)
    groupe_name=models.CharField(blank=True,null=True,max_length=100)


# Numéros de téléphone
    phone_number_1 = models.CharField(
        max_length=15, help_text="Numéro de téléphone 1", db_index=True)
    phone_number_2 = models.CharField(
        max_length=15, blank=True, null=True, help_text="Numéro de téléphone 2 (facultatif)")


    def get_image_upload_path(instance, filename):
    # Generate a unique UUID token for the image filename
     unique_token = str(uuid.uuid4())  # Generate a unique token
     if instance.wilaya is None:
        return f'default/{instance.pk}/{unique_token}.jpg'
     return f'{instance.wilaya}/{instance.pk}/{unique_token}.jpg'


    image_url = models.ImageField(
        upload_to=get_image_upload_path, blank=True, null=True, help_text="Image de profil ")
    bloquer = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False, help_text="Supprimé par Centre d'Appel (soft-delete)")

# Wilaya (zone géographique)
    wilaya = models.CharField(
        max_length=100, blank=True, null=True, help_text="Wilaya de résidence")
    
    wilaya_code = models.IntegerField(
        blank=True, null=True, help_text="Code de la wilaya de résidence")

    groupe = models.CharField(max_length=500, blank=True, null=True)
    # Temporarily allow null


    email = models.CharField(max_length=40, null=True, blank=True) #deux choix si unique ou pas 
    confirmation=models.BooleanField(default=False, help_text="Confirmation service ",blank=True,null=True)


    # Emploi actuel

    # Rendement (exemple de score de 0 à 100)
    rendement = models.FloatField(
        default=0, help_text="Rendement (par exemple, de 0 à 100)")
    point = models.IntegerField(default=0)

    # Note en étoiles (de 1 à 5)

    # Override groups and user_permissions with unique related names
    groups = models.ManyToManyField(
        Group,
        related_name="customuser_set",
        blank=True,
        help_text="The groups this user belongs to."
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="customuser_user_permissions",
        blank=True,
        help_text="Specific permissions for this user."
    )
    # if true he peut valider les commandes  chef de bureux et groupe agent
    permission_vlider = models.BooleanField(default=False)

    # Permissions VTC & Courses
    permission_commission_vtc = models.BooleanField(null=True, blank=True, default=None)
    permission_compte_vtc = models.BooleanField(null=True, blank=True, default=None)
    permission_list_course = models.BooleanField(null=True, blank=True, default=None)
    permission_vtc_detaille = models.BooleanField(null=True, blank=True, default=None)
    permission_transporteurs = models.BooleanField(null=True, blank=True, default=None)
    permission_demandes_vtc = models.BooleanField(null=True, blank=True, default=None)
    permission_actions_vtc = models.BooleanField(null=True, blank=True, default=None)
    permission_caisse_vtc = models.BooleanField(null=True, blank=True, default=None)
    permission_dispatch_vtc = models.BooleanField(null=True, blank=True, default=None)

    # Alias direct VTC
    commission_vtc = models.BooleanField(null=True, blank=True, default=None)
    compte_vtc = models.BooleanField(null=True, blank=True, default=None)
    list_course = models.BooleanField(null=True, blank=True, default=None)
    vtc_detaille = models.BooleanField(null=True, blank=True, default=None)

    # Permissions Centre d'Appel & Confirmation
    permission_apple_center = models.BooleanField(null=True, blank=True, default=None)
    permission_magasins = models.BooleanField(null=True, blank=True, default=None)
    permission_livreurs = models.BooleanField(null=True, blank=True, default=None)
    permission_commandes = models.BooleanField(null=True, blank=True, default=None)
    permission_dispatch = models.BooleanField(null=True, blank=True, default=None)
    permission_promo = models.BooleanField(null=True, blank=True, default=None)
    permission_objectifs = models.BooleanField(null=True, blank=True, default=None)

    # Permissions Comptabilité & Finances
    permission_comptable = models.BooleanField(null=True, blank=True, default=None)
    permission_caisses = models.BooleanField(null=True, blank=True, default=None)
    permission_caisse_livreur = models.BooleanField(null=True, blank=True, default=None)
    permission_commission_livreur = models.BooleanField(null=True, blank=True, default=None)
    permission_actions = models.BooleanField(null=True, blank=True, default=None)

    # Permissions Commercial & Superviseur
    permission_deliveries = models.BooleanField(null=True, blank=True, default=None)
    permission_partenaire = models.BooleanField(null=True, blank=True, default=None)
    permission_superviseurs = models.BooleanField(null=True, blank=True, default=None)
    permission_rapports = models.BooleanField(null=True, blank=True, default=None)
    permission_recharge = models.BooleanField(null=True, blank=True, default=None)
    permission_ajoute_agent = models.BooleanField(null=True, blank=True, default=None)

    # Nombre de commandes (modifiable manuellement par le super admin)
    nbr_commandes = models.IntegerField(default=0, blank=True, null=True, help_text="Nombre de commandes (modifiable par l'admin)")

    # Portefeuille / Solde du client en DA (modifiable UNIQUEMENT par le super admin)
    solde = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        help_text="Solde portefeuille client en DA (modifiable uniquement par l'admin)"
    )

    def save(self, *args, **kwargs):
    # Check if the user already exists in the database
     if self.pk:
        # Get the old instance from the database
        old_picture = CustomUser.objects.get(pk=self.pk)
        # Check if the image has changed
        if old_picture.image_url and old_picture.image_url != self.image_url:
            # Delete the old image file
            old_picture.image_url.delete(save=False)

    # Save the instance (works for both new and existing users)
     super().save(*args, **kwargs)  

    class Meta:
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
            models.Index(fields=['phone_number_1']),
            models.Index(fields=['bloquer']),
            models.Index(fields=['deleted']),

        ]


class Vihucule (models.Model):
    modele = models.CharField(max_length=30, null=True, blank=True)

    marque = models.CharField(max_length=30, null=True, blank=True)
    matricule = models.CharField(null=True, blank=True, max_length=17)
    num_assurance = models.CharField(null=True, blank=True, max_length=20)
    num_scanner = models.CharField(null=True, blank=True, max_length=20)
    Date_expiration_assurance = models.DateField(null=True, blank=True)

    Date_expiration_scanner = models.DateField(null=True, blank=True)
    TYPE_CHOICES = [
        ('Classique', 'Classique'),
        ("Moto", "Moto"),
        ('Comfort', 'Comfort'),
        ('Black', 'Black'),
        ('Utilitaire', 'Utilitaire'),
        ('XXL', 'XXL'),
        ('Harim', 'Harim'),
        ("Voiture_livreur","Livreur avec voitrure ")
    ]
    type_vehicule = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='Classique',  # Default choice if none is selected
    )

    def __str__(self):
        return f"{self.id}"


class Partenneur(models.Model):
    user = models.ForeignKey(
        CustomUser, related_name='USER', on_delete=models.CASCADE)
    vihucule = models.ForeignKey(
        Vihucule, null=True, blank=True, on_delete=models.CASCADE)
    num_de_carte_prenneur = models.CharField(
        null=True, blank=True, max_length=20)
    type_partener = models.ForeignKey(
        Abonnment_compte, related_name='gold', on_delete=models.CASCADE, null=True, blank=True)
    type_compte = models.ForeignKey(
        Type_compte_partener, related_name="choffeur", on_delete=models.CASCADE, null=True, blank=True)
    nom_de_magasin = models.CharField(max_length=30, null=True, blank=True)
    adresse = models.CharField(max_length=200, blank=True, null=True)
    RC = models.CharField(max_length=30, null=True, blank=True)
    Nif = models.CharField(max_length=30, null=True, blank=True)
    numero_act = models.CharField(max_length=30, null=True, blank=True)
    card_number = models.CharField(
        max_length=18, blank=True, null=True, help_text="Numéro de carte (16 chiffres maximum)")
    tax_a_payer = models.IntegerField(null=True, blank=True)
    tax_global = models.IntegerField(null=True, blank=True)
    chiffre_affaires = models.IntegerField(null=True, blank=True)
    consement = models.IntegerField(null=True, blank=True)
    num_de_matricule = models.CharField(null=True, blank=True, max_length=30)
    # pour ajouter
    randement = models.IntegerField(null=True, blank=True)

    latitude = models.DecimalField(
        max_digits=20, decimal_places=15, null=True, blank=True)
    longitude = models.DecimalField(
        max_digits=20, decimal_places=15, null=True, blank=True)

    pre_en_charge = models.BooleanField(default=False)
    is_available = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username}"


class Coursa (models.Model):
    client = models.ForeignKey(
        CustomUser, related_name="client", on_delete=models.CASCADE)
    partener = models.ForeignKey(
        Partenneur, related_name="partener", on_delete=models.CASCADE,blank=True,null=True)
    agent = models.ForeignKey(
        CustomUser, related_name="agent", on_delete=models.CASCADE, blank=True, null=True)
    km = models.FloatField()
    # cest deux attribure pour nommer la place ----------------les nom de places ----------------------------------------------------------
    depart_location = models.CharField(max_length=200, blank=True, null=True)
    depart_region = models.CharField(max_length=200, blank=True, null=True)

    arrive_location = models.CharField(max_length=200, blank=True, null=True)
    arrive_region = models.CharField(max_length=200, blank=True, null=True)
    duration = models.FloatField(blank=True, null=True)
    # ------------------------------------------------------------------------------------------------------------------------------------
    latitude_depart = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True)
    longitude_depart = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True)
    latitude_arrive = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True)
    longitude_arrive = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True)
    ETAT_CHOICES = [
        ('en_attente', 'En attente'),
        ('en_cours', 'En cours'),
        ('terminee', 'Terminée'),
        ('annulee', 'Annulée'),
        ('Nouveux', "Nouveux")
    ]
    etat = models.CharField(
        max_length=20, choices=ETAT_CHOICES, default='Nouveux')
    TYPE_CHOICES = [
        ('Classique', 'Classique'),
        ("Moto", "Moto"),
        ('Comfort', 'Comfort'),
        ('Black', 'Black'),
        ('Utilitaire', 'Utilitaire'),
        ('XXL', 'XXL'),
        ('Harim', 'Harim'),
        ("Voiture_livreur","Livreur avec voitrure ")
    ]
    type_coursa = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='Classique',  
    )
    # attribute valider le payment cote uutlistaue de role valider_vtc
    paye = models.BooleanField(default=False)
    # attribute pour valider le payment cote livreur
    paye_par_partener = models.BooleanField(default=False)
    prix = models.IntegerField()
    wilaya = models.CharField(max_length=30, blank=True, null=True)
    facteur_bonus = models.IntegerField(default=0)
    tax_tawsile = models.FloatField(null=True, blank=True)
    date_creation = models.DateTimeField(
        auto_now_add=True, blank=True, null=True)
    sets = models.IntegerField(default=1, blank=True, null=True)

    def save(self, *args, **kwargs):
        try:
            type_compte = Type_compte_partener.objects.get(
                name__icontains="chof")
            self.tax_tawsile = int(type_compte.tax_tawsile*float(self.prix)/100)
        except Type_compte_partener.DoesNotExist:
            self.tax_tawsile = 0  # or handle this case as needed
        super().save(*args, **kwargs)

    def __str__(self):
        return str(self.id)


class Payment(models.Model):
    partner = models.ForeignKey(Partenneur, on_delete=models.CASCADE,blank=True,null=True)
    total_tax_tawsile = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00)
    # Boolean field to track payment status
    paid = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # Use nom_de_magasin if available, otherwise fallback to the username
        partner_name = self.partner.nom_de_magasin or self.partner.user.username
        return f"Payment for {partner_name} - {self.total_tax_tawsile}"


class Payment_Par_partener(models.Model):
    partner = models.ForeignKey(Partenneur, on_delete=models.CASCADE)
    courses = models.ManyToManyField(
        'Coursa', related_name='payments')  # ManyToMany link to courses
    total_tax_tawsile = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00)
    confirmed_by_partner = models.BooleanField(
        default=False)  # Partner confirmation
    paid = models.BooleanField(default=False)  # Admin validation
    ETAT_CHOICES = [

        ('en_cours', 'En cours'),
        ('refuse', 'Refusé'),
        ("accepte", "Accepter")

    ]
    etat = models.CharField(
        max_length=20, choices=ETAT_CHOICES, default='en_cour')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        partner_name = self.partner.nom_de_magasin or self.partner.user.username
        return f"Payment for {partner_name} - {self.total_tax_tawsile}"

    def calculate_total_tax(self):
        """
        Calculate the total tax based on the courses linked to the payment.
        Assumes there's a Many-to-Many relationship between Payment_Par_partener and Coursa.
        """
        total_tax = sum(course.prix * Decimal(20) / Decimal(100)
                        for course in self.courses.all())
        self.total_tax_tawsile = total_tax
        self.save()


class Comentaire(models.Model):
    pertener = models.ForeignKey(
        Partenneur, blank=True, null=True, on_delete=models.CASCADE)
    comm = models.TextField(max_length=20000, blank=True, null=True)
    centre_appel = models.ForeignKey(
        CustomUser, blank=True, null=True, on_delete=models.CASCADE)
    date_de_creation=models.DateTimeField(null=True,blank=True,auto_now_add=True)


class Cassie(models.Model):
    chef_bu = models.ForeignKey(
        CustomUser, blank=True, null=True, on_delete=models.CASCADE)
    resut = models.FloatField(null=True, blank=True)
    date_creationn = models.DateTimeField(auto_now_add=True)
    etat = models.BooleanField(default=False)
    prix_reale = models.IntegerField(default=0)
    approuve = models.BooleanField(default=False)
    a_compte = models.FloatField(default=0, null=True, blank=True)
    manque = models.FloatField(null=True, blank=True)


def generate_random_code(length=8):
    # Définir les caractères autorisés (lettres, chiffres et symboles)
    characters = string.ascii_letters + string.digits + string.punctuation

    # Générer un code aléatoire de la longueur spécifiée
    random_code = ''.join(random.choice(characters) for _ in range(length))

    return random_code

# Exemple d'utilisation


class Remise (models.Model):
    partenneur = models.ForeignKey(Partenneur, on_delete=models.CASCADE)
    code_invitation = models.CharField(
        max_length=8, default=generate_random_code, unique=True, db_index=True)
    revunu = models.FloatField()
    pourcentage = models.DecimalField(
        max_digits=5,  # Cela permet jusqu'à 3 chiffres avant la virgule, plus les 2 décimales
        decimal_places=2,  # 2 décimales pour les pourcentages
        default=0.02,  # Valeur par défaut à 0.0 si aucune remise n'est appliquée
        help_text="Pourcentage de réduction appliqué"
    )
    inviteurs = models.ManyToManyField(
        Partenneur, related_name="invites", blank=True)

    CIBLE_CHOICES = [
        ('tous_clients', 'Tous les clients'),
        ('client_specifique', 'Client spécifique'),
        ('tous_livreurs', 'Tous les livreurs'),
        ('livreur_specifique', 'Livreur spécifique'),
        ('tous_magasins', 'Tous les magasins'),
        ('magasin_specifique', 'Magasin spécifique'),
        ('tous_partenaires', 'Tous les partenaires'),
        ('partenaire_specifique', 'Partenaire spécifique'),
    ]
    cible_type = models.CharField(
        max_length=30, choices=CIBLE_CHOICES, default='tous_clients', help_text="Cible du code promo")
    cible_user = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='promos_cibles', help_text="Utilisateur ciblé spécifique")
    cible_magasin = models.ForeignKey(
        'food.Magasin', on_delete=models.SET_NULL, null=True, blank=True, related_name='promos_cibles_magasin', help_text="Magasin ciblé spécifique")
    max_utilisations = models.IntegerField(
        default=0, help_text="Nombre maximum d'utilisations (0 = illimité)")
    date_expiration = models.DateTimeField(
        null=True, blank=True, help_text="Date et heure d'expiration")
    is_active = models.BooleanField(
        default=True, help_text="Activer ou désactiver le code promo")
    created_at = models.DateTimeField(
        auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return f"{self.code_invitation} - {self.partenneur.id if self.partenneur else 'No Partner'}"

    


class Commissions(models.Model):
    wilaya = models.CharField(max_length=30, null=True, blank=True)

    type_course = models.CharField(max_length=40, blank=True, null=True)
    prix_depart = models.FloatField("Prix de depart", null=True, blank=True)
    prix_second = models.FloatField("Prix de second", null=True, blank=True)
    code_wilaya = models.IntegerField(null=True, blank=True,db_index=True)
    
    prix_km = models.FloatField(
        "Prix de km ville", null=True, blank=True)  # Remove trailing space
    prix_km_long = models.FloatField("Prix de km long", null=True, blank=True)
    prix_nuit_second = models.FloatField(
        "prix de nuit second ", null=True, blank=True)

    description = models.TextField(max_length=1002, blank=True, null=True)
    

    class Meta:
        verbose_name_plural = "Commissions"
        

    def __str__(self):
        return f"Commission for {self.wilaya}"


class Action_Superviseur(models.Model):
    superviseur = models.ForeignKey(
        CustomUser, null=True, blank=True, on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)
    pertenneur = models.ForeignKey(
        Partenneur, null=True, blank=True, on_delete=models.CASCADE)


class Rapport(models.Model):
    superviseur = models.ForeignKey(
        CustomUser, null=True, blank=True, on_delete=models.CASCADE)
    parteneur = models.ForeignKey(
        Partenneur, null=True, blank=True, on_delete=models.CASCADE)
    verifie = models.BooleanField(null=True, blank=True)
    message = models.TextField(max_length=10000)
    date = models.DateTimeField(auto_now_add=True, null=True, blank=True)


class Flixy (models.Model):
    superviseur = models.ForeignKey(
        CustomUser, null=True, blank=True,related_name="superviseur", on_delete=models.CASCADE)
    centre_appel=models.ForeignKey(CustomUser, null=True, related_name="centre_appel",blank=True, on_delete=models.CASCADE)
    date_de_creation = models.DateTimeField(
        auto_now_add=True, null=True, blank=True)
    somme = models.FloatField(null=True, blank=True)
    wilaya = models.CharField(max_length=30, null=True, blank=True)
    somme_a_envoye = models.FloatField(null=True, blank=True, default=0)
    
    ETAT_CHOICES = [
        ('refuse', 'Refusé'),
        ('en_attente', 'En attente'),
        ('accepte', 'Accepté'),
        ("annuler", "Annuler")

    ]
    etat = models.CharField(
        max_length=20, choices=ETAT_CHOICES, default='en_attente')  

    appouvie_par_super_v = models.BooleanField(default=False)


class Actions_centre_appel_flixy(models.Model):
    centre_appel = models.ForeignKey(


        CustomUser, related_name="centre_appel_action",null=True, blank=True, on_delete=models.CASCADE)


    ETAT_CHOICES = [
        ('refuse', 'Refusé'),
        ('en_attente', 'En attente'),
        ('accepte', 'Accepté')
    ]
    etat = models.CharField(
        max_length=20, choices=ETAT_CHOICES, default='en_attente')
    data_de_creation = models.DateTimeField(auto_now_add=True)


    prix=models.FloatField(null=True, blank=True)
    prix_a_envoye=models.FloatField(null=True, blank=True)
    superviseur=models.ForeignKey(CustomUser,related_name='superviseur_action',null=True, blank=True,on_delete=models.CASCADE)



class Notication_choffeur (models.Model):
    partenneur =models.ForeignKey(Partenneur,on_delete=models.CASCADE,blank=True,null=True)
    read=models.BooleanField(default=False)
    message=models.CharField(max_length=150,blank=True,null=True)
    date_creation=models.DateTimeField(auto_now_add=True)

class CatalogueVideo (models.Model):
    name=models.CharField(max_length=60)
    description=models.TextField()
    def __str__(self):
        return f"{self.name}"

class VideoToto (models.Model):
    name=models.CharField(max_length=50)
    description =models.TextField()
    def get_video_upload_path(instance, filename):
        unique_token = str(uuid.uuid4())  # Generate a unique token
        return f'totovideo/{unique_token}.jpg'

    image = models.ImageField(upload_to=get_video_upload_path)
    time=models.CharField(max_length=40)
    lien=models.CharField(max_length=70,blank=True,null=True)
    
    cataloguevideo=models.ForeignKey(CatalogueVideo,blank=True,null=True,on_delete=models.CASCADE)
    def __str__(self):
        return f"{self.name}"
class HistoriqueCoursa(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)


    partenneur = models.ForeignKey(Partenneur, on_delete=models.CASCADE,blank=True,null=True)


    client = models.ForeignKey(CustomUser, related_name="client_historique", on_delete=models.CASCADE)
    coursa = models.ForeignKey(Coursa, related_name="historique_coursa", on_delete=models.CASCADE)
    etat = models.CharField(max_length=20, choices=Coursa.ETAT_CHOICES, default='Nouveux')
    previous_etat = models.CharField(max_length=20, blank=True, null=True)


class OTP(models.Model):
    phone_number =models.CharField(max_length=15)
    code =models.CharField(max_length=15)
    expired =models.DateTimeField(blank=True,null=True) 


class VersementCaisse(models.Model):
    TYPE_CHOICES = [
        ('VTC', 'Caisse VTC'),
        ('LIVREUR', 'Caisse Livreur'),
    ]
    type_caisse = models.CharField(max_length=10, choices=TYPE_CHOICES)
    chauffeur = models.ForeignKey(Partenneur, null=True, blank=True, on_delete=models.SET_NULL, related_name='versements_caisse')
    livreur = models.ForeignKey('food.Livreur', null=True, blank=True, on_delete=models.SET_NULL, related_name='versements_caisse')
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    solde_avant = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    solde_apres = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    mode_paiement = models.CharField(max_length=50, default='especes')  # especes, baridimob, virement, ccp, etc.
    reference = models.CharField(max_length=100, blank=True, null=True)
    observation = models.TextField(blank=True, null=True)
    agent = models.ForeignKey(CustomUser, null=True, blank=True, on_delete=models.SET_NULL, related_name='versements_encaisses')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        dest = f"Chauffeur #{self.chauffeur_id}" if self.type_caisse == 'VTC' else f"Livreur #{self.livreur_id}"
        return f"Versement {self.type_caisse} - {self.montant} DA ({dest})"


class Objectif(models.Model):
    CIBLE_CHOICES = [
        ('vtc', 'Chauffeur VTC'),
        ('livreur', 'Livreur Food'),
        ('tous', 'Tous (Chauffeur & Livreur)'),
    ]
    TYPE_OBJECTIF_CHOICES = [
        ('courses', 'Nombre de courses / livraisons'),
        ('chiffre_affaires', "Chiffre d'affaires (DA)"),
    ]
    PERIODE_CHOICES = [
        ('journalier', 'Journalier'),
        ('weekend', 'Week-end'),
        ('hebdomadaire', 'Hebdomadaire'),
        ('mensuel', 'Mensuel'),
        ('personnalise', 'Personnalisé'),
    ]

    titre = models.CharField(max_length=150, help_text="Titre de l'objectif (ex: Prime Weekend 15 courses)")
    description = models.TextField(blank=True, null=True, help_text="Détails, conditions ou instructions")
    cible = models.CharField(max_length=20, choices=CIBLE_CHOICES, default='vtc')
    type_objectif = models.CharField(max_length=30, choices=TYPE_OBJECTIF_CHOICES, default='courses')
    valeur_cible = models.FloatField(help_text="Objectif à atteindre (ex: 15 courses, 10 livraisons, 10000 DA)")
    prime_montant = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, help_text="Montant de la prime en DA")
    periode = models.CharField(max_length=30, choices=PERIODE_CHOICES, default='weekend')
    date_debut = models.DateTimeField(help_text="Date et heure de début")
    date_fin = models.DateTimeField(help_text="Date et heure de fin")
    wilaya = models.CharField(max_length=100, default='Toutes', blank=True, null=True, help_text="Wilaya ciblée ou 'Toutes'")
    is_active = models.BooleanField(default=True, help_text="Activer ou désactiver l'objectif")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.titre} ({self.get_cible_display()}) - {self.prime_montant} DA"


class ProgressionObjectif(models.Model):
    objectif = models.ForeignKey(Objectif, on_delete=models.CASCADE, related_name='progressions')
    partenaire = models.ForeignKey(Partenneur, on_delete=models.CASCADE, related_name='progressions_objectifs', null=True, blank=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='progressions_objectifs')
    valeur_actuelle = models.FloatField(default=0.0, help_text="Progression actuelle (courses terminées ou CA)")
    est_atteint = models.BooleanField(default=False, help_text="True si la valeur cible est atteinte")
    date_atteint = models.DateTimeField(null=True, blank=True)
    prime_versee = models.BooleanField(default=False, help_text="True si le bonus a été crédité/payé")
    date_versement = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('objectif', 'user')
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username} - {self.objectif.titre} ({self.valeur_actuelle}/{self.objectif.valeur_cible})"
