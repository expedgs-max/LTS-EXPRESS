# Generated manually for Story views_count

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('food', '0034_story_storyitem'),
    ]

    operations = [
        migrations.AddField(
            model_name='story',
            name='views_count',
            field=models.PositiveIntegerField(default=0, help_text='Nombre total de vues de la story'),
        ),
        migrations.AddField(
            model_name='storyitem',
            name='views_count',
            field=models.PositiveIntegerField(default=0, help_text='Nombre total de vues de ce slide'),
        ),
    ]
