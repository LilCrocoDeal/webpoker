from OpenSSL.rand import status
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import F, Max
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from poker.permissions import HasUserId
from poker.serializers import LobbySerializer, PlayersSerializer, LobbyInfoSerializer
from poker.models import Lobbies, Players, LobbyInfo

User = get_user_model()


@api_view(['POST'])
@permission_classes([HasUserId])
def create_lobby(request):
    user = User.objects.get(user_id=request.COOKIES.get('user_id'))
    lobby_serializer = LobbySerializer(data=request.data)
    if lobby_serializer.is_valid():
        lobby = lobby_serializer.save()
        lobby_id = lobby.lobby_id

        new_player = Players(user_id=user, lobby_id=lobby)
        new_player.seating_position = 1
        new_player.save()

        new_lobby = LobbyInfo(lobby_id=lobby)
        new_lobby.save()

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
    lobby_info = LobbyInfo.objects.get(lobby_id=lobby)

    if lobby.current_players == lobby.max_players:
        return Response({'response': 'lobby is full'}, status=400)
    if user.poker_chips < lobby.big_blind:
        return Response({'response': 'not have enough chips'}, status=400)
    if lobby.current_players == 1:
        lobby_info.status = 'active'
        lobby_info.save()

    lobby.current_players += 1
    lobby.save()

    taken_seats = sorted(Players.objects.filter(lobby_id=lobby).values_list('seating_position', flat=True))
    seating_position = max(taken_seats) + 1

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
    lobby_info = LobbyInfo.objects.get(lobby_id=lobby)

    if lobby.current_players == 1:
        lobby.delete()
    else:
        if lobby.current_players == 2:
            lobby_info.status = 'inactive'
            lobby_info.round_stage = 'waiting'
            lobby_info.save()
        lobby.current_players -= 1
        lobby.save()
        player_to_delete = Players.objects.get(user_id=user)
        deleted_seating_position = player_to_delete.seating_position
        player_to_delete.delete()

        Players.objects.filter(
            lobby_id=lobby,
            seating_position__gt=deleted_seating_position
        ).update(seating_position=F('seating_position') - 1)

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


@api_view(['POST'])
@permission_classes([HasUserId])
def get_players_info(request):
    user = User.objects.get(user_id=request.COOKIES.get('user_id'))
    lobby = Lobbies.objects.get(lobby_id=request.data['lobby_id'])

    players = Players.objects.filter(lobby_id=lobby)

    if players.exists():
        serializer = PlayersSerializer(players, many=True)
        return Response({'players': serializer.data, 'current_player': user.id}, status=200)
    else:
        return Response({'error': 'wrong lobby_id'}, status=400)


@api_view(['POST'])
@permission_classes([HasUserId])
def get_table_info(request):
    lobby = Lobbies.objects.get(lobby_id=request.data['lobby_id'])
    lobby_info = LobbyInfo.objects.get(lobby_id=lobby)
    serializer = LobbyInfoSerializer(lobby_info)
    if lobby_info.status == 'inactive':
        return Response({'lobby_info': serializer.data, 'dealer_cards': [
            None, None, None, None, None
        ]}, status=200)
    elif lobby_info.round_stage == 'waiting':
        return Response({'lobby_info': serializer.data, 'dealer_cards': [
            None, None, None, None, None
        ]}, status=200)
    elif lobby_info.round_stage == 'preflop':
        return Response({'lobby_info': serializer.data, 'dealer_cards': [
            'card_cover', 'card_cover', 'card_cover', 'card_cover', 'card_cover'
        ]}, status=200)
    elif lobby_info.round_stage == 'flop':
        return Response({'lobby_info': serializer.data, 'dealer_cards': [
            lobby_info.dealer_cards[0],
            lobby_info.dealer_cards[1],
            lobby_info.dealer_cards[2],
            'card_cover',
            'card_cover'
        ]}, status=200)
    elif lobby_info.round_stage == 'turn':
        return Response({'lobby_info': serializer.data, 'dealer_cards': [
            lobby_info.dealer_cards[0],
            lobby_info.dealer_cards[1],
            lobby_info.dealer_cards[2],
            lobby_info.dealer_cards[3],
            'card_cover'
        ]}, status=200)
    elif lobby_info.round_stage == 'river':
        return Response({'lobby_info': serializer.data, 'dealer_cards': [
            lobby_info.dealer_cards[0],
            lobby_info.dealer_cards[1],
            lobby_info.dealer_cards[2],
            lobby_info.dealer_cards[3],
            lobby_info.dealer_cards[4]
        ]}, status=200)
    else:
        return Response(status=400)


@api_view(['POST'])
@permission_classes([HasUserId])
def get_player_cards(request):
    user = User.objects.get(user_id=request.COOKIES.get('user_id'))
    lobby = Lobbies.objects.get(lobby_id=request.data['lobby_id'])

    player = Players.objects.get(lobby_id=lobby, user_id=user)
    if len(player.current_hand):
        return Response({'player_cards': player.current_hand}, status=200)
    else:
        return Response({'player_cards': [None, None]}, status=200)


@api_view(['POST'])
@permission_classes([HasUserId])
def set_ready(request):
    user = User.objects.get(user_id=request.COOKIES.get('user_id'))
    lobby = Lobbies.objects.get(lobby_id=request.data['lobby_id'])

    player = Players.objects.get(lobby_id=lobby, user_id=user)
    if player.status == 'non_active':
        player.status = 'active'
        player.save()

        lobby_players = Players.objects.filter(lobby_id=lobby)
        count_players = lobby_players.count()
        if all(player.status == 'active' for player in lobby_players) and count_players > 1:
            return Response({'action': 'start_round'}, status=200)
        elif count_players == 1:
            print('ERROR COUNT LAYERS')
            return Response(status=400)


        return Response({'action': None}, status=200)

    return Response(status=400)


@api_view(['POST'])
@permission_classes([HasUserId])
def set_not_ready(request):
    user = User.objects.get(user_id=request.COOKIES.get('user_id'))
    lobby = Lobbies.objects.get(lobby_id=request.data['lobby_id'])

    player = Players.objects.get(lobby_id=lobby, user_id=user)
    if player.status == 'active':
        player.status = 'non_active'
        player.save()

        return Response(status=200)

    return Response(status=400)


@api_view(['POST'])
@permission_classes([HasUserId])
def get_round_state(request):
    lobby = Lobbies.objects.get(lobby_id=request.data['lobby_id'])
    lobby_info = LobbyInfo.objects.get(lobby_id=lobby)

    return Response({'state': lobby_info.round_stage}, status=200)














