# employer/task.py
from apscheduler.schedulers.background import BackgroundScheduler
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from django.utils import timezone
from employer.models import Cassie,CustomUser,Notication_choffeur,Partenneur
from django.db.models import Q
from employer.models import Coursa
from channels.layers import get_channel_layer
from datetime import timedelta
from asgiref.sync import async_to_sync
from django.db.models import Count
def update_cassie_etat():
    print("[Job] Job executed at:", timezone.localtime(timezone.now()))
    Cassie.objects.all().update(etat=False)
    users = CustomUser.objects.filter(
    Q(role="chef_bureau") | Q(role="agent_administratif")
)
    users.update(permission_vlider=False)
    print("[Job] Updated all Cassie.etat to False")
def check_unpaid_coursas():
    # Calculate 7 days ago
    seven_days_ago = timezone.now() - timedelta(days=30)
    
    # Find unpaid Coursas
    unpaid_coursas = Coursa.objects.filter(
        paye=False,
        paye_par_partener=False,
        date_creation__lte=seven_days_ago,
        partener__type_compte__name="choffeur"

    ).values('partener__user',"partener__user__id").annotate(total=Count('id')).distinct()
    channel_layer = get_channel_layer()
    for coursa in unpaid_coursas:
        user_id = coursa['partener__user__id']
        group_name = f'notification_chauffeur_{user_id}'
        noti = Notication_choffeur.objects.create(
            partenneur=Partenneur.objects.get(user__id=user_id),
            message="you need to pay your courses or you get ban ",
            read=False
        )
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'send_notification_7days',
                'message': noti.message,
                
                'date': timezone.now().isoformat()
            }
        )
def blok_users_after_37_jours():
    # Calculate 7 days ago
    seven_days_ago = timezone.now() - timedelta(days=37)
    
    # Find unpaid Coursas
    unpaid_users = (Coursa.objects
        .filter(
            paye=False,
            paye_par_partener=False,
            date_creation__lte=seven_days_ago
        )
        .values('partener__user')  # Group by user
        .annotate(total=Count('id'))  # Count courses per user
        .distinct()
    )

    # Block unique users
    for entry in unpaid_users:
        user = CustomUser.objects.get(id=entry['partener__user'])
        if user.is_active:
            user.is_active = False
            user.save()
            print(f"Blocked user: {user.username}")
        
            # Create single notification
            Notication_choffeur.objects.create(
                partenneur=Partenneur.objects.get(user__id=user.pk),
                message="Your account has been blocked due to unpaid courses.",
                read=False
            )
    
    
        # group_name = f'notification_chauffeur_{coursa.partener.user.id}'
        # noti = Notication_choffeur.objects.create(
        #     partenneur=coursa.partener,
        #     message="You need to pay your courses or you will be banned.",
        #     read=False
        # )
        # async_to_sync(channel_layer.group_send)(
        #     group_name,
        #     {
        #         'type': 'send_notification_7days',
        #         'message': noti.message,
        #         'date': timezone.now().isoformat()
        #     }
        # )
        # Block the user by setting is_active to False
        

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")

    try:
        # Schedule job to run daily at 21:10 Algiers time
        scheduler.add_job(
            update_cassie_etat,
            trigger="cron",
            hour=23,
            minute=59,
            id="daily_etat_update",
            replace_existing=True,
            timezone="Africa/Algiers"
        )
        scheduler.add_job(
        check_unpaid_coursas,
        'cron',
        hour=15,
        minute=47,
        name="check_unpaid_coursas",
        id="check_unpaid_coursas",
        jobstore="default",
        timezone="Africa/Algiers",
        replace_existing=True

    )
        scheduler.add_job(
            blok_users_after_37_jours,
            "cron",
            hour=15,
            minute=57,
            name="blok_users_after_37_jours",
            id="blok_users_after_37_jours",
            jobstore="default",
            timezone="Africa/Algiers",
            replace_existing=True


        )
        print("[Scheduler] Scheduler started successfully!")

        if not scheduler.running:
            scheduler.start()
    except Exception as e:
        print(f"[Scheduler] Error: {e}")