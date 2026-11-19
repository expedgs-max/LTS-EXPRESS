from django.db import models
from employer.models import *
from django.core.exceptions import ObjectDoesNotExist
from model_utils import FieldTracker 
# Create your models here.
class Catlogue (models.Model):
    name=models.CharField(max_length=100,null=True,blank=True)
    description=models.TextField(max_length=1000,null=True,blank=True)
    type=models.ForeignKey(Type_compte_partener,related_name="type_partener",on_delete=models.CASCADE,blank=True,null=True)


    icone=models.ImageField(upload_to='catalogue_icons', blank=True, null=True, help_text="Icone du catalogue")
    photo=models.ImageField(upload_to='catalogue_photos', blank=True, null=True, help_text="Photo du catalogue")
    


    def __str__(self):
        return f"{self.name }"
class Magasin(models.Model):
    cataloguqe=models.ManyToManyField(Catlogue,related_name="catalogue",blank=True)
    
    owner = models.ForeignKey(Partenneur, related_name='partener_magsin', on_delete=models.CASCADE)
    descprition=models.TextField(max_length=2000,null=True,blank=True)
    name = models.CharField(max_length=100, help_text="Nom du magasin")
    address = models.CharField(max_length=200, help_text="Adresse du magasin")
    contact = models.CharField(max_length=15, blank=True, null=True, help_text="Numéro de contact")
    is_active = models.BooleanField(default=True, help_text="Magasin actif ou non")
    EtatOuverture = models.BooleanField(default=False, help_text="Etat de ouverture ")
    wilaya=models.CharField(max_length=20,blank=True,null=True)
    tracker_etat_ouvrage = FieldTracker(fields=['EtatOuverture'])
    
    
    rating= models.FloatField(default=5,blank=True, null=True)
    ordre = models.IntegerField(default=999, blank=True, null=True, help_text="Ordre de classement du magasin (1, 2, 3...)")
    ordre_sponsor = models.IntegerField(default=0, blank=True, null=True, help_text="Ordre d'affichage sponsorisé (0 = non sponsorisé, 1, 2, 3... = ordre d'affichage)")
    livraison_gratuite = models.BooleanField(default=False, help_text="Livraison gratuite activée")
    date_debut_livraison_gratuite = models.DateField(null=True, blank=True, help_text="Date début livraison gratuite")
    date_fin_livraison_gratuite = models.DateField(null=True, blank=True, help_text="Date fin livraison gratuite")
    tarif_livraison = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Tarif de livraison personnalisé (DA)")
    pourcentage_commission = models.FloatField(default=0, null=True, blank=True, help_text="Pourcentage de commission plateforme (%)")
    pourcentage_remise = models.FloatField(default=0, null=True, blank=True, help_text="Pourcentage de remise / réduction (%)")

    def is_livraison_gratuite_active(self):
        if not self.livraison_gratuite:
            return False
        from django.utils import timezone
        today = timezone.localdate()
        if self.date_debut_livraison_gratuite and today < self.date_debut_livraison_gratuite:
            return False
        if self.date_fin_livraison_gratuite and today > self.date_fin_livraison_gratuite:
            return False
        return True
    def get_image_upload_path(instance, filename):
    # Generate a unique UUID token for the image filename
     unique_token = str(uuid.uuid4())  # Generate a unique token
     if instance.wilaya is None:

        return f'default/{instance.pk}/{unique_token}.jpg'

     return f'magasins/{instance.wilaya}/{instance.pk}/{unique_token}.jpg'
    image=models.ImageField( upload_to=get_image_upload_path,max_length=50,blank=True,null=True)
    image_background=models.ImageField(upload_to=get_image_upload_path,null=True, blank=True)
    def save(self, *args, **kwargs):
        # Check if the instance already exists in the database
        if self.pk:
            # Get the existing instance from the database
            old_instance = Magasin.objects.get(pk=self.pk)
            # If the image has changed
            if old_instance.image and old_instance.image != self.image:
                # Delete the old image file
                old_instance.image.delete(save=False)
            if old_instance.image_background and old_instance.image_background != self.image_background:
                # Delete the old image file
                old_instance.image_background.delete(save=False)
        # Save the new image
        super().save(*args, **kwargs)
    

    def __str__(self):
        return f"{self.name} - {self.owner.user.first_name}"
    
    
class PrixStarshop (models.Model):
    prix=models.FloatField(default=0,blank=True,null=True)
    quantity=models.IntegerField(default=0,blank=True,null=True)
    def __str__(self):
        return f"{self.prix} - {self.quantity}"
    
    
 #this model is for produis de resturant 
class Produis(models.Model):
    magasin = models.ForeignKey(Magasin, related_name='articles', on_delete=models.CASCADE)
    catalogue=models.ForeignKey(Catlogue, related_name='articles', on_delete=models.CASCADE,blank=True, null=True)
    name = models.CharField(max_length=100, help_text="Nom de l'article alimentaire")
    description = models.TextField(blank=True, null=True, help_text="Description de l'article")
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Prix de l'article") 
    disponibilite= models.BooleanField(default=True, help_text="Disponibilité de l'article")
    rating= models.FloatField(default=5,blank=True, null=True)
    principal=models.CharField(max_length=100,blank=True,null=True)
    secondaire=models.CharField(max_length=100,blank=True,null=True)
    autre=models.CharField(max_length=100,blank=True,null=True)
    calories=models.FloatField(default=0,blank=True, null=True)

    quantity_stock =models.IntegerField(blank=True,null=True)
    ordre = models.IntegerField(default=999, blank=True, null=True, help_text="Ordre de classement du produit dans le magasin (1, 2, 3...)")

    prixstar_shop=models.ManyToManyField(PrixStarshop)
    def get_image_upload_path(instance,self):
        unique_token = str(uuid.uuid4())
        return f"magasins{instance.magasin.id}/produis/{unique_token}.jpg"
 
        
       

    image = models.ImageField(upload_to=get_image_upload_path,blank=True, null=True, help_text="Image de l'article")
    def save(self, *args, **kwargs):
        # Check if the instance already exists in the database
        if self.pk:
            # Get the existing instance from the database
            old_instance = Produis.objects.get(pk=self.pk)
            # If the image has changed
            if old_instance.image and old_instance.image != self.image:
                # Delete the old image file
                old_instance.image.delete(save=False)
        # Save the new image
        super().save(*args, **kwargs)
    

    def __str__(self):
        return f"{self.name} - {self.magasin.name}"

class Livreur(models.Model):
    partenneur = models.OneToOneField(Partenneur, on_delete=models.CASCADE, related_name='livreur', null=True, blank=True)
    magasin=models.ForeignKey(Magasin, on_delete=models.CASCADE, related_name='magasin', null=True, blank=True) #on ajoute en magasin many to many 
    is_available = models.BooleanField(default=True, help_text="Le livreur est disponible ou non")
    wilaya = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
     if self.partenneur is not None and self.partenneur.user is not None:
        return f"{self.partenneur.user.first_name} {self.partenneur.user.last_name} - Disponible: {'Oui' if self.is_available else 'Non'}"
     return "Livreur non assigné"

class Commande(models.Model):
    client = models.ForeignKey(CustomUser, related_name='commandes', on_delete=models.CASCADE, verbose_name="Client")
    magasin = models.ForeignKey(Magasin, related_name='commandes', on_delete=models.CASCADE, verbose_name="Magasin")
    livreur = models.ForeignKey(Livreur, related_name='livraisons', on_delete=models.CASCADE, blank=True, null=True, help_text="Livreur assigné")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Prix total")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Date de création")
    delivery_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, verbose_name="Prix de livraison")
    valide_payment=models.BooleanField(default=False)
    emp_val=models.ForeignKey(CustomUser,null=True,blank=True,related_name="emplois_qui_valide" ,verbose_name='le emploiser qui valider le payment de livreeur ',on_delete=models.CASCADE)
    paye_par_livreur=models.BooleanField(default=False)
    prix_de_tax=models.FloatField(default=0,blank=True, null=True)
    specific=models.TextField(blank=True,null=True)
    distination=models.CharField(max_length=100,blank=True,null=True)
    scaned=models.BooleanField(default=False)
    confirmation=models.BooleanField(default=False, help_text="Confirmation service ",blank=True,null=True)


    type_livraison_choise =[
        ("classique",'Classique'),
        ("premium",'Premium'),
    ]

    
    
    
    status_choices = [
        ('pending', 'En attente'), #hadi ki la commande t cree
        ('confirmed', 'Confirmée'), #hadi qui magasin confirmer la commande avec assigne le livreur 
        ('delivered', 'Livrée'), #
        ("search",'en recherge '),
        ("ready","Ready"),
        ("in_progress","livreur_pret_commande"),
        ('canceled', 'Annulée'),
        ("annule_par_client",'Annule Par client '),
        ("annule_par_livreur","Annule Par Livreur")
    ]
    type_livraison=models.CharField(max_length=10, choices=type_livraison_choise, default='classique', verbose_name="Type de livraison")
    status = models.CharField(max_length=30, choices=status_choices, default='pending', verbose_name="Statut")

    tracker = FieldTracker(fields=['status'])
    itemss=models.IntegerField(blank=True,null=True,default=1)
    trip_time=models.CharField(max_length=10,blank=True,null=True)
    distance=models.CharField(max_length=10,blank=True,null=True)

    def __str__(self):
        return f"Commande #{self.id} - Client: {self.client.username} - Statut: {self.get_status_display()}"
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
    

class CommandeArticle(models.Model):
    commande = models.ForeignKey(Commande, related_name='articles_commandes', on_delete=models.CASCADE)
    article = models.ForeignKey(Produis, on_delete=models.CASCADE, verbose_name="Article")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Quantité")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Sous-total")
    wilaya = models.CharField(max_length=20, blank=True, null=True)
    specific=models.TextField(blank=True,null=True)
    

    def __str__(self):
        return f"{self.quantity}x {self.article.name} (Commande #{self.commande.id})"

    # def save(self, *args, **kwargs):
    #     # Ensure that article.price and quantity are Decimal types for calculation
    #     price = Decimal(self.article.price)  # Convert price to Decimal if it's not already
    #     quantity = Decimal(self.quantity)  # Convert quantity to Decimal if needed
    #     self.subtotal = price * quantity
        super().save(*args, **kwargs)
class Payment_de_livreur(models.Model):
    livreur = models.OneToOneField(Livreur, on_delete=models.CASCADE, related_name='payment')
    total_fees = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    application_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    
class PaymentEmplois(models.Model):
    emplois = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='payments')
    total_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, verbose_name="Montant total payé")
    service_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, verbose_name="Frais de service")

    def __str__(self):
        return f"Payment record for Emplois #{self.emplois.id} - Total Paid: {self.total_paid}"
#models qui prut consuler le temps de action de valide commande et le temps de valider 
class Actions (models.Model):
    agent=models.ForeignKey(CustomUser,blank=True,null=True,on_delete=models.CASCADE)
    
    date_action=models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    livreur=models.ForeignKey(Livreur,null=True,blank=True,on_delete=models.CASCADE)
class Publicity (models.Model):
    TARGET_CHOICES = [
        ('client', 'Client'),
        ('livreur', 'Livreur Food'),
        ('chauffeur', 'Chauffeur VTC'),
    ]

    name=models.CharField(max_length=100,blank=True,null=True)
    description=models.TextField(max_length=20000,blank=True,null=True)
    magasin=models.ForeignKey(Magasin, null=True, blank=True,on_delete=models.CASCADE)
    image=models.ImageField(upload_to="publicities",blank=True,null=True)
    lien=models.URLField(blank=True, null=True, help_text="Lien de redirection de la publicité")
    target=models.CharField(max_length=20, choices=TARGET_CHOICES, default='client', db_index=True, help_text="Cible d'affichage (client, livreur, chauffeur)")
    badge_tag=models.CharField(max_length=50, blank=True, null=True, help_text="Badge d'accroche (ex: BONUS LIVREUR, PRIME VTC, PROMO)")
    cta_text=models.CharField(max_length=50, blank=True, null=True, default="En savoir plus", help_text="Texte du bouton d'action")
    is_active=models.BooleanField(default=True)
    date_creation=models.DateTimeField(auto_now_add=True)
    date_expires=models.DateTimeField()

    def __str__(self):
        return f"[{self.target}] {self.name} - {self.magasin.name if self.magasin else 'Sans magasin'}"



class CommissionLivreur (models.Model):
    km=models.FloatField()
    prix=models.FloatField()
    description=models.TextField()
    def __str__(self):
        return f'{self.km} km - {self.prix} DA'


class ReviewsProduis(models.Model):
    client=models.ForeignKey(CustomUser, related_name='reviews_client_produis', on_delete=models.CASCADE)
    article=models.ForeignKey(Produis, related_name='reviews_article', on_delete=models.CASCADE)
    commentaire=models.TextField(blank=True, null=True)
    star = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Évaluation de 1 à 5")
    created_at = models.DateTimeField(auto_now_add=True,null=True, blank=True)
    def __str__(self):
        return f'Review de {self.client.username} pour {self.article.name}'
class ReviewsMagasin(models.Model):
    client=models.ForeignKey(CustomUser, related_name='reviews_client_magasin', on_delete=models.CASCADE)
    magasin=models.ForeignKey(Magasin, related_name='reviews_magasin', on_delete=models.CASCADE)
    commentaire=models.TextField(blank=True, null=True)
    star = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Évaluation de 1 à 5")
    created_at = models.DateTimeField(auto_now_add=True,null=True, blank=True)
    def __str__(self):
        return f'Review de {self.client.username} pour {self.magasin.name}'
class DeviceApp(models.Model):
    version=models.CharField(max_length=20,null=True, blank=True)
    description = models.TextField(blank=True,null=True)
    app=models.FileField(blank=True,null=True)
    create_at=models.DateTimeField(auto_now_add=True,null=True, blank=True)
    def __str__(self):
        return f"{self.version }"
class testMigrations (models.Model):
    name=models.CharField(max_length=100)

class Historique_annuler_commande (models.Model) :
    commande=models.ForeignKey(Commande,blank=True,on_delete=models.CASCADE)
    user_annulie=models.ForeignKey(CustomUser,blank=True,null=True,on_delete=models.CASCADE)
    raison=models.TextField(blank=True,null=True,verbose_name="Raison d'annulation")
    date_creation=models.DateTimeField(auto_now_add=True)


class Story(models.Model):
    title = models.CharField(max_length=150, help_text="Titre ou nom du groupe de story")
    image = models.ImageField(upload_to="stories/covers/", blank=True, null=True, help_text="Image de couverture ou avatar de la bulle")
    is_active = models.BooleanField(default=True, help_text="Story active ou inactive")
    order = models.PositiveIntegerField(default=0, help_text="Ordre d'affichage dans la liste des bulles")
    date_creation = models.DateTimeField(auto_now_add=True)
    date_expires = models.DateTimeField(null=True, blank=True, help_text="Date d'expiration globale de la story")
    views_count = models.PositiveIntegerField(default=0, help_text="Nombre total de vues de la story")

    class Meta:
        ordering = ['order', '-date_creation']
        verbose_name = "Story"
        verbose_name_plural = "Stories"

    def __str__(self):
        return f"Story: {self.title} (ID: {self.id})"


class StoryItem(models.Model):
    story = models.ForeignKey(Story, related_name="items", on_delete=models.CASCADE, help_text="Story parente")
    image = models.ImageField(upload_to="stories/items/", help_text="Image du slide plein écran")
    duration = models.PositiveIntegerField(default=5, help_text="Durée d'affichage en secondes")
    lien = models.URLField(blank=True, null=True, help_text="Lien de redirection externe")
    magasin = models.ForeignKey(Magasin, null=True, blank=True, on_delete=models.SET_NULL, help_text="Liaison vers un magasin partenaire")
    title = models.CharField(max_length=150, blank=True, null=True, help_text="Titre optionnel du slide")
    description = models.TextField(blank=True, null=True, help_text="Description ou texte additionnel")
    order = models.PositiveIntegerField(default=0, help_text="Ordre du slide dans la story")
    is_active = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_expires = models.DateTimeField(null=True, blank=True)
    views_count = models.PositiveIntegerField(default=0, help_text="Nombre total de vues de ce slide")

    class Meta:
        ordering = ['order', 'date_creation']
        verbose_name = "Élément de Story"
        verbose_name_plural = "Éléments de Story"

    def __str__(self):
        return f"Item #{self.id} - Story: {self.story.title} ({self.duration}s)"



    




