import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
from django.contrib.auth import get_user_model
from django.db.models import F
from poker.models import Players, LobbyInfo

User = get_user_model()

class GameConsumer(AsyncWebsocketConsumer):

    players_connect_events = set()

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

        if text_data_json['event'] == 'info':
            if text_data_json['message'] == 'connect':
                self.scope['user_id'] = text_data_json['user_id']
                self.players_connect_events.add(text_data_json['user_id'])

                await self.channel_layer.group_send(
                    self.lobby_group_name,
                    {
                        'type': 'connection',
                        'event': 'update_players_data',
                    }
                )
            elif text_data_json['message'] == 'force_disconnect':
                self.scope['user_id'] = None
                await self.channel_layer.group_send(
                    self.lobby_group_name,
                    {
                        'type': 'connection',
                        'event': 'update_players_data',
                    }
                )


    async def connection(self, event):
        await self.send(text_data=json.dumps({
            'event': event['event'],
        }))


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