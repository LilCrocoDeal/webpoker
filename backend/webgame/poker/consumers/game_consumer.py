import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import F, Q
from poker.models import Players, LobbyInfo, Lobbies

User = get_user_model()

class GameConsumer(AsyncWebsocketConsumer):

    players_connect_events = set()
    response_buffer = set()
    players_query = []


    #-------------------------БАЗОВЫЕ МЕТОДЫ-------------------------------------------------
    async def connect(self):
        self.lobby_name = self.scope['url_route']['kwargs']['room_name']
        self.lobby_group_name = f"lobby_{self.lobby_name}"

        await self.channel_layer.group_add(self.lobby_group_name, self.channel_name)
        await self.accept()


    async def disconnect(self, close_code):
        self.players_connect_events.discard(self.scope['user_id'])

        await self.channel_layer.group_discard(self.lobby_group_name, self.channel_name)
        asyncio.create_task(self.handle_disconnection_with_check(self.scope['user_id']))


    async def receive(self, text_data):
        text_data_json = json.loads(text_data)

        if text_data_json['event'] == 'connect':
            self.scope['user_id'] = text_data_json['user_id']
            self.players_connect_events.add(text_data_json['user_id'])

            await self.channel_layer.group_send(
                self.lobby_group_name,
                {
                    'type': 'connection',
                    'event': 'update_players_data',
                }
            )

        elif text_data_json['event'] == 'force_disconnect':
            self.scope['user_id'] = None
            await self.channel_layer.group_send(
                self.lobby_group_name,
                {
                    'type': 'connection',
                    'event': 'update_players_data',
                }
            )

        elif text_data_json['event'] == 'start_round':

            await self.start_round_db(text_data_json['lobby_id'])

            await self.channel_layer.group_send(
                self.lobby_group_name,
                {
                    'type': 'start_round',
                    'lobby_id': text_data_json['lobby_id'],
                }
            )

        elif text_data_json['event'] == 'ready_to_start':
            if text_data_json['user_id'] in self.response_waiting_query:
                self.players_query.remove(text_data_json['user_id'])
                await self.channel_layer.group_send(
                    self.lobby_group_name,
                    {
                        'type': 'delete_players_query_object',
                        'object': text_data_json['user_id']
                    }
                )
                if not self.players_query:
                    await self.channel_layer.group_send(
                        self.lobby_group_name,
                        {
                            'type': 'form_players_query',
                            'event': 'normal',
                            'lobby_id': text_data_json['lobby_id']
                        }
                    )
                    await self.channel_layer.group_send(
                        self.lobby_group_name,
                        {
                            'type': 'player_turn',
                        }
                    )
        elif text_data_json['event'] == 'end_turn':
            if text_data_json['user_id'] in self.response_buffer:
                self.response_buffer.discard(text_data_json['user_id'])

                action = await self.player_action_db(text_data_json['user_id'], text_data_json['action'])
                if action == 'done' or action == 'cash_issue':
                    await self.channel_layer.group_send(
                        self.lobby_group_name,
                        {
                            'type': 'action_response',
                            'action': action,
                        }
                    )
                    await self.channel_layer.group_send(
                        self.lobby_group_name,
                        {
                            'type': 'player_turn',
                        }
                    )
                elif action == 'update':
                    await self.channel_layer.group_send(
                        self.lobby_group_name,
                        {
                            'type': 'form_players_query',
                            'event': 'update',
                            'lobby_id': text_data_json['lobby_id'],
                            'user_id': text_data_json['user_id'],
                        }
                    )
                    await self.channel_layer.group_send(
                        self.lobby_group_name,
                        {
                            'type': 'player_turn',
                        }
                    )
                elif action == 'error':
                    await self.end_game(text_data_json['user_id'], 'error')


    # -------------------------ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ-------------------------------------------------
    async def connection(self, event):
        await self.send(text_data=json.dumps({
            'event': event['event'],
        }))


    async def start_round(self, event):
        self.players_query = await self.get_turn_order(event['lobby_id'])
        await self.send(text_data=json.dumps({
            'event': 'start_round',
        }))


    async def delete_players_query_object(self, event):
        try:
            self.players_query.remove(event['object'])
        except ValueError:
            pass


    async def form_players_query(self, event):
        if event['event'] == 'normal':
            self.players_query = await self.get_turn_order(event['lobby_id'])
        else:
            self.players_query = await self.get_turn_order(event['lobby_id'], user_id=event['user_id'])


    async def action_response(self, event):
        await self.send(text_data=json.dumps({
            'event': 'action_response',
            'action': event['action']
        }))


    async def player_turn(self, event):
        try:
            player = self.players_query.pop()
            self.response_buffer.add(player)

            await self.set_player_turn(player)

            await self.send(text_data=json.dumps({
                'event': 'player_turn',
                'player': self.players_query[-1]
            }))
            asyncio.create_task(self.waiting_for_player_end_turn(self.players_query[-1]))
        except IndexError:
            pass



    async def handle_disconnection_with_check(self, user_id):
        if user_id is None:
            return

        for _ in range(30):
            if user_id in self.players_connect_events:
                return

            await asyncio.sleep(1)

        await self.remove_user_from_db(user_id)

        await asyncio.sleep(2)
        await self.channel_layer.group_send(
            self.lobby_group_name,
            {
                'type': 'connection',
                'event': 'update_players_data',
            }
        )


    async def waiting_for_player_end_turn(self, user_id):
        if user_id is None:
            return

        for _ in range(32):
            if user_id not in self.response_buffer:
                return

            await asyncio.sleep(1)

        await self.player_action_db(user_id, 'fold')

    # -------------------------БД МЕТОДЫ-------------------------------------------------
    @database_sync_to_async
    def set_player_turn(self, user_id):
        player = Players.objects.get(user_id=User.objects.get(id=user_id))
        player.status = 'turn'
        player.save()

    @database_sync_to_async
    def remove_user_from_db(self, user_id):
        user = User.objects.get(id=user_id)
        lobby = Players.objects.get(user_id=user).lobby_id
        lobby_info = LobbyInfo.objects.get(lobby_id=lobby)

        if lobby.current_players == 1:
            lobby.delete()
        else:
            if lobby.current_players == 2:
                lobby_info.status = 'inactive'
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


    @database_sync_to_async
    def start_round_db(self, lobby_id):
        lobby = Lobbies.objects.get(lobby_id=lobby_id)
        lobby_info = LobbyInfo.objects.get(lobby_id=lobby)

        players = list(Players.objects.filter(lobby_id=lobby).values_list('user_id', flat=True))

        Players.objects.filter(lobby_id=lobby).update(status='first_check')

        lobby_info.reset_deck()
        for _ in range(5):
            card = lobby_info.draw_card()
            lobby_info.dealer_cards.append(card)
        lobby_info.save()

        for i in range(len(players)):
            player = Players.objects.get(user_id=(User.objects.get(id=players[i])))
            for _ in range(2):
                card = lobby_info.draw_card()
                player.current_hand.append(card)
            player.save()

        lobby_info.round_bet = lobby.big_blind
        lobby_info.round_bank = lobby.big_blind + lobby.small_blind
        lobby_info.round_stage = 'preflop'
        lobby_info.save()


    @database_sync_to_async
    def get_turn_order(self, lobby_id, user_id=None):
        lobby = Lobbies.objects.get(lobby_id=lobby_id)
        active_players = (Players.objects.filter(lobby_id=lobby).exclude(Q(status='non_active') | Q(status='ready'))
                          .order_by('seating_position'))

        if user_id is not None:
            player_with_turn = Players.object.get(user_id=User.objects.get(id=user_id)).seating_position

        else:
            player_with_turn = LobbyInfo.objects.get(lobby_id=lobby).player_with_turn

        first_part = list(active_players.filter(seating_position__gte=player_with_turn)
                          .values_list('user_id', flat=True))
        second_part = list(active_players.filter(seating_position__lt=player_with_turn)
                           .values_list('user_id', flat=True))
        result = list(reversed(first_part + second_part))

        if user_id is not None:
            result.remove(player_with_turn)

        return result


    @database_sync_to_async
    def player_action_db(self, user_id, action):
        try:
            player = Players.objects.get(user_id=User.objects.get(id=user_id))
            lobby_info = LobbyInfo(lobby_id=player.lobby_id)
            user = User.objects.get(id=user_id)
        except ObjectDoesNotExist:
            return 'error'

        if player.status != 'turn':
            return 'another thread'

        if action == 'fold':

            if lobby_info.round_stage == 'preflop':
                if player.seating_position == lobby_info.player_with_BB:

                    user.poker_chips -= player.lobby_id.big_blind
                    if user.poker_chips < 0:
                        self.remove_user_from_db(user_id)
                        return 'cash_issue'
                    else:
                        user.save()
                elif ((player.seating_position == (lobby_info.player_with_BB - 1) and lobby_info.player_with_BB != 1) or
                      (lobby_info.player_with_BB == 1 and player.seating_position == Players.objects
                              .filter(lobby_id=player.lobby_id)
                              .exclude(Q(status='non_active') | Q(status='ready')).count())):

                    user.poker_chips -= player.lobby_id.small_blind
                    if user.poker_chips < 0:
                        self.remove_user_from_db(user_id)
                        return 'cash_issue'
                    else:
                        user.save()

            player.status = 'non_active'
            player.current_hand = [None, None]
            player.current_bet = 0
            player.save()
            return 'done'

        elif action == 'call':

            delta = lobby_info.round_bet - player.current_bet

            user.poker_chips -= delta
            if user.poker_chips < 0:
                self.remove_user_from_db(user_id)
                return 'cash_issue'
            else:
                user.save()

            player.current_bet = lobby_info.round_bet
            player.status = 'active'
            player.save()

            lobby_info.round_bank += delta
            lobby_info.save()

            return 'done'

        elif action == 'raise':

            delta = (lobby_info.round_bet * 2) - player.current_bet

            user.poker_chips -= delta
            if user.poker_chips < 0:
                self.remove_user_from_db(user_id)
                return 'cash_issue'
            else:
                user.save()
            player.current_bet = (lobby_info.round_bet * 2)
            player.status = 'active'
            player.save()

            lobby_info.round_bank += delta
            lobby_info.save()

            return 'update'

        elif action == 'all_in':
            if user.poker_chips >= lobby_info.round_bet:
                lobby_info.round_bank += user.poker_chips
                lobby_info.round_bet = user.poker_chips
                lobby_info.save()

                player.status = 'all_in'
                player.current_bet = user.poker_chips + player.current_bet
                player.save()

                user.poker_chips = 0
                user.save()
                return 'update'
            else:
                lobby_info.round_bank += user.poker_chips
                lobby_info.save()

                player.status = 'all_in'
                player.current_bet = user.poker_chips + player.current_bet
                player.save()

                user.poker_chips = 0
                user.save()
                return 'update'
        else:
            return 'error'


    @database_sync_to_async
    def end_game(self, user_id, status):
        if status == 'normal':
            pass
        elif status == 'error':
            lobby = Players.objects.get(user_id=User.objects.get(id=user_id)).lobby_id
            lobby_players = Players.objects.filter(lobby_id=lobby)

            for player in lobby_players:
                user = player.user_id
                user.poker_chips += player.current_bet
                user.save()

                player.current_hand = [None, None]
                player.current_bet = 0
                player.status = 'non_active'
                player.save()

            lobby_info = LobbyInfo.objects.get(lobby_id=lobby)
            if lobby_info.player_with_BB < Players.objects.filter(lobby_id=lobby).count():
                lobby_info.player_with_BB += 1
            else:
                lobby_info.player_with_BB = 1
            lobby_info.round_bet = 0
            lobby_info.round_bank = 0
            lobby_info.round_stage = 'waiting'
            lobby_info.dealer_cards = []
            lobby_info.deck = []
            lobby_info.save()

