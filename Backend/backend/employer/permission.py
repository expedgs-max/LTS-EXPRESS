from rest_framework.permissions import BasePermission


class RolePermission(BasePermission):
    """
    Custom permission to grant access based on user roles.
    """

    def __init__(self, required_roles):
        self.required_roles = required_roles

    def has_permission(self, request, view):
        return request.user.role in self.required_roles


class IsOwnerOrAdmin(BasePermission):
    """
    Custom permission to only allow owners or admins to access the data.
    """

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            # Allow access if the user is an admin or the owner of the data

            if request.user.role == 'admin':
                return True
        return False


class IsPertener(BasePermission):
    """
    custom permiiison just for partener 
    """

    def has_permission(self, request, view):
        if request.user.is_authenticated and request.user:
            if request.user.role == "partener":
                return True
            else:
                return False


class IsCentreappel(BasePermission):
    """
    custom permiiison just for partener 
    """

    def has_permission(self, request, view):
        if request.user.is_authenticated and request.user:
            if request.user.role in ["centre_appel", 'superviseur']:
                return True
            else:
                return False


class Iscommerciale (BasePermission):
    """
    custom permiiison just for partener 
    """

    def has_permission(self, request, view):
        if request.user.is_authenticated and request.user:
            if request.user.role == "gestion_commercial":
                return True
            else:
                return False


class IssuperVisseur(BasePermission):
    """
    customer permission for just supervisssur 
    """

    def has_permission(self, request, view):
        if request.user.is_authenticated and request.user:
            if request.user.role == "superviseur":
                return True
            else:
                return False


class Isvtc(BasePermission):
    """
    cutsomer le seul qui valide les coures et aussi voir la liste des coureses 
    """

    def has_permission(self, request, view):
        if request.user.is_authenticated and request.user:
            if request.user.role in ["validation_vtc", "confirmation", "centre_appel", "admin", "admin_superieur"]:
                return True
            else:
                return False


class IsComtable (BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated and request.user:
            if request.user.role == "comptable":
                return True
            else:
                return False


class IsEmployeeManager(BasePermission):
    """
    Permission pour les rôles autorisés à consulter et gérer le personnel et partenaires.
    """
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            role = (getattr(request.user, 'role', '') or '').lower()
            return role in [
                'admin', 'admin_superieur', 'chef_bureau',
                'gestion_commercial', 'confirmation', 'centre_appel'
            ]
        return False

