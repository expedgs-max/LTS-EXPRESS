from django.db import models
from employer.models import *
from django.core.validators import MinValueValidator, MaxValueValidator

#cette table de donne stock les etoiles (njom)et commentaire de tout les utlisteur de system
class Review(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE,blank=True, null=True)
    stars = models.FloatField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(max_length=1000)
    create_at=models.DateField(auto_now_add=True)


class VtcPlace(models.Model):
    name = models.CharField(max_length=255)
    formatted_address = models.CharField(max_length=500, blank=True, null=True)
    city = models.CharField(max_length=150, blank=True, null=True)
    state = models.CharField(max_length=150, blank=True, null=True)
    state_short = models.CharField(max_length=100, blank=True, null=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.city or self.state})"


class TypeCourse(models.Model):
    name = models.CharField(max_length=60, help_text="Nom affiché (ex: Classique, Confort, Moto)")
    code = models.CharField(max_length=60, unique=True, help_text="Identifiant unique / slug (ex: classique, confort, moto)")
    description = models.TextField(max_length=500, blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True, default="FaCar")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Type de course"
        verbose_name_plural = "Types de course"
        ordering = ["id"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class TransporteurProfile(models.Model):
    partenaire = models.OneToOneField(
        Partenneur,
        on_delete=models.CASCADE,
        related_name='transport_profile'
    )
    categories = models.CharField(
        max_length=255,
        default="hilux,utilitaire",
        help_text="Codes catégories séparés par virgule : hilux, camion, utilitaire, confort, classique"
    )
    category_label = models.CharField(max_length=100, default="Hilux / Pick-up")
    price_estimate = models.CharField(max_length=100, default="Dès 800 DA")
    eta_minutes = models.IntegerField(default=5)
    description = models.TextField(blank=True, default="")
    badge = models.CharField(max_length=80, default="Robuste 4x4")
    badge_color = models.CharField(max_length=20, default="#D97706")
    vehicle_image = models.ImageField(upload_to="transport/vehicles/", blank=True, null=True)
    vehicle_year = models.IntegerField(default=2023)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profil Transporteur"
        verbose_name_plural = "Profils Transporteurs"

    def __str__(self):
        return f"Profil Transport - {self.partenaire.user.username if self.partenaire and self.partenaire.user else self.id}"


class TransportCategory(models.Model):
    name = models.CharField(max_length=100, help_text="Nom affiché (ex: Hilux / Pick-up, Frigorifique)")
    slug = models.CharField(max_length=60, unique=True, help_text="Slug code (ex: hilux, frigorifique)")
    icon = models.CharField(max_length=50, blank=True, default="🛻")
    color = models.CharField(max_length=20, blank=True, default="#D97706")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Catégorie de Transport"
        verbose_name_plural = "Catégories de Transport"
        ordering = ["id"]

    def __str__(self):
        return f"{self.name} ({self.slug})"








