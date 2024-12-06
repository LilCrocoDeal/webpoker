from rest_framework import serializers
from django.contrib.auth import get_user_model
from poker.models import Lobbies, Players

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'poker_chips', 'win', 'profile_image')


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'profile_image')


class LobbySerializer(serializers.ModelSerializer):
    class Meta:
        model = Lobbies
        fields = '__all__'


class PlayersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Players
        fields = '__all__'
