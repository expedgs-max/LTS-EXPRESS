from django.contrib import admin
from .models import *

class ReviewsAdmin(admin.ModelAdmin):
    list_display = ("user__first_name", "user__last_name","stars","comment")
    search_fields =("user__first_name", "user__last_name","user__name","")
    list_filter = ("stars",)
 



admin.site.register(Review, ReviewsAdmin)  


@admin.register(TypeCourse)
class TypeCourseAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "icon", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "code", "description")

