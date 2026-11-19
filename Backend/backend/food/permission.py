from rest_framework.permissions import BasePermission
from employer.models import *
class IsClient(BasePermission):
    """
    Custom permission to only allow owners or admins to access the data.
    cette permission pour que just le client a cette permisiion 
    """

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            if request.user.role in ['client', 'user'] or not request.user.role or request.user.is_superuser:
                return True
        return False
class Ischefbureux (BasePermission):
    """
    Custom permission to only allow owners or admins to access the data.
    cette permission pour que just le usser avec le role chef bureuxc peut acceder a cette api
    """
    def has_permission(self, request, view):
     
        
     if request.user and request.user.is_authenticated :
         if request.user.role in ["chef_bureau" ,"agent_administratif"] :
             return True 
     return False
class IsPertener(BasePermission) :
    """
    User with role pertener or administrative/confirmation staff have permission to this action
    """
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated :
            if request.user.role in ["partener", "confirmation", "centre_appel", "admin", "superviseur"] or request.user.is_superuser:
                return True
            return False

        
class IsAgentAdmin(BasePermission):
    """
    permission le seul qui peut valider la commande est user with role agent 
    """
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated :
            if request.user.role=="agent_administratif" :
                return True
        return False
class Islivreur (BasePermission) :
    """
    permission custome for livreur 
    """
    def has_permission(self, request, view):
        if request.user.is_authenticated and request.user.role=="partener" :
            if Partenneur.objects.get(user_id=request.user.id,type_compte__name__icontains="liveur") :
                return True
            else :
                return False
class IsConfirmation(BasePermission):
    """
    Permission pour les utilisateurs ayant le rôle confirmation, centre_appel ou admin
    """
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            if request.user.role in ["confirmation", "centre_appel", "admin"]:
                return True
        return False


    



