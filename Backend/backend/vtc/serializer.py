from rest_framework import serializers
from .models import *
from django.contrib.auth.hashers import make_password
#cette class pour selizer les donne de reviews int js 
class ReviewsSerializer(serializers.ModelSerializer):
    class Meta:
        model=Review
        fields='__all__'
    def validate_stars(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Le nombre d'étoiles doit être entre 1 et 5.")
        if value == 0:
            raise serializers.ValidationError("Le nombre d'étoiles ne peut pas être zéro.")
    def validate_user(self, value):
        if value is None :
            raise serializers.ValidationError("L'utilisateur est obligatoire.")
    def validate_comment(self, value):
        if value is None :
            raise serializers.ValidationError("le commentaire est obligatoire")
class RideTrackingSerializer(serializers.ModelSerializer):
    partner_location = serializers.SerializerMethodField()
    
    class Meta:
        model = Coursa
        fields = ['id', 'etat', 'partner_location']
    
    def get_partner_location(self, obj):
        # Access cached partner data from select_related
        partner = getattr(obj, 'partener', None)
        if not partner:
            return None
            
        return {
            'latitude': float(partner.latitude) if partner.latitude else None,
            'longitude': float(partner.longitude) if partner.longitude else None
        }
class CommissionPrixParWilaya(serializers.ModelSerializer):
    class Meta :
        model=Commissions
        fields = ["id", "wilaya", "prix_depart", "type_course"]


class TypeCourseSerializer(serializers.ModelSerializer):
    rules_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TypeCourse
        fields = ['id', 'name', 'code', 'description', 'icon', 'is_active', 'created_at', 'rules_count']

    def get_rules_count(self, obj):
        return Commissions.objects.filter(type_course__iexact=obj.code).count()