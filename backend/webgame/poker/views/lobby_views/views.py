from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import F, Max
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from poker.permissions import HasUserId
from poker.serializers import LobbySerializer, PlayersSerializer
from poker.models import Lobbies, Players

User = get_user_model()


@api_view(['POST'])
@permission_classes([HasUserId])
def create_lobby(request):
    user = User.objects.get(user_id=request.COOKIES.get('user_id'))
    lobby_serializer = LobbySerializer(data=request.data)
    if lobby_serializer.is_valid():
        lobby = lobby_serializer.save()
        lobby_id = lobby.lobby_id

        player_data = {
            'lobby_id': lobby_id,
            'user_id': user.id,
            'seating_position': 1,
        }

        players_serializer = PlayersSerializer(data=player_data, partial=True)
        if players_serializer.is_valid():
            players_serializer.save()

            user.status = 'in_lobby'
            user.save()

            return Response({'lobby_id': lobby_id}, status=200)

    return Response(status=400)


@api_view(['GET'])
@permission_classes([HasUserId])
def get_lobbies_list(request):
    lobbies = Lobbies.objects.filter(current_players__lt=F('max_players'))
    serializer = LobbySerializer(lobbies, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([HasUserId])
@transaction.atomic
def join_lobby(request):
    user = User.objects.get(user_id=request.COOKIES.get('user_id'))
    lobby = Lobbies.objects.get(lobby_id=request.data['lobby_id'])

    if lobby.current_players == lobby.max_players:
        return Response({'response': 'lobby is full'}, status=400)
    if user.poker_chips < lobby.big_blind:
        return Response({'response': 'not have enough chips'}, status=400)

    lobby.current_players += 1
    lobby.save()

    taken_seats = sorted(Players.objects.filter(lobby_id=lobby).values_list('seating_position', flat=True))
    seating_position = max(taken_seats) + 1

    for seat in range(1, lobby.max_players + 1):
        if seat not in taken_seats:
            seating_position = seat
            break


    new_player = Players(lobby_id=lobby, user_id=user)
    new_player.seating_position = seating_position
    new_player.save()

    user.status = 'in_lobby'
    user.save()

    return Response(status=200)


@api_view(['POST'])
@permission_classes([HasUserId])
@transaction.atomic
def exit_lobby(request):
    user = User.objects.get(user_id=request.COOKIES.get('user_id'))
    lobby = Lobbies.objects.get(lobby_id=request.data['lobby_id'])

    if lobby.current_players == 1:
        lobby.delete()
    else:
        lobby.current_players -= 1
        lobby.save()
        Players.objects.get(user_id=user).delete()

    user.status = 'active'
    user.save()

    return Response(status=200)


@api_view(['POST'])
@permission_classes([HasUserId])
def validate_lobby(request):
    user = User.objects.get(user_id=request.COOKIES.get('user_id'))
    lobby = Lobbies.objects.get(lobby_id=request.data['lobby_id'])

    get_player = Players.objects.filter(user_id=user, lobby_id=lobby)
    if get_player.exists():
        return Response(status=200)
    else:
        return Response(status=400)









