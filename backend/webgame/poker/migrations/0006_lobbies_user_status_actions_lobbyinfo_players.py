# Generated by Django 5.1.1 on 2024-12-03 10:26

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('poker', '0005_user_profile_image_alter_user_poker_chips'),
    ]

    operations = [
        migrations.CreateModel(
            name='Lobbies',
            fields=[
                ('lobby_id', models.AutoField(primary_key=True, serialize=False)),
                ('max_players', models.IntegerField(default=5)),
                ('big_blind', models.IntegerField(choices=[(10, '10 BB'), (100, '100 BB'), (500, '500 BB'), (1000, '1000 BB'), (5000, '5000 BB'), (10000, '10000 BB'), (50000, '50000 BB'), (100000, '100000 BB')], default=500)),
                ('small_blind', models.IntegerField(choices=[(5, '5 SB'), (50, '50 SB'), (250, '250 SB'), (500, '500 SB'), (2500, '2500 SB'), (5000, '5000 SB'), (25000, '25000 SB'), (50000, '50000 SB')], default=250)),
                ('max_bet', models.IntegerField(default=1000000)),
            ],
        ),
        migrations.AddField(
            model_name='user',
            name='status',
            field=models.CharField(default='active', max_length=10),
        ),
        migrations.CreateModel(
            name='Actions',
            fields=[
                ('action_id', models.AutoField(primary_key=True, serialize=False)),
                ('action_type', models.CharField(default='none', max_length=30)),
                ('action_amount', models.IntegerField(default=0)),
                ('action_time', models.TimeField(auto_now=True)),
                ('user_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('lobby_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='poker.lobbies')),
            ],
        ),
        migrations.CreateModel(
            name='LobbyInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('player_with_turn', models.IntegerField(default=0)),
                ('round_bet', models.IntegerField(default=0)),
                ('deck', models.JSONField(default=list)),
                ('lobby_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='poker.lobbies')),
            ],
        ),
        migrations.CreateModel(
            name='Players',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('seating_position', models.IntegerField(default=0)),
                ('current_hand', models.JSONField(default=list)),
                ('current_bet', models.IntegerField(default=0)),
                ('status', models.CharField(default='non_active', max_length=30)),
                ('lobby_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='poker.lobbies')),
                ('user_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
