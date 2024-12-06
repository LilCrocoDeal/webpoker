import random
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, user_id, email, **extra_fields):
        if not user_id or email:
            raise ValueError("user_id and email field must be set")
        user = self.model(user_id=user_id, email=email, **extra_fields)
        user.save(using=self._db)
        return user

    def create_superuser(self, user_id, email, **extra_fields):
        extra_fields.setdefault('is_superuser', True)

        if not extra_fields.get('is_superuser'):
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(user_id, email, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    """
    Модель пользователя
    fields:
    email - получен из аккаунта google
    username - получен из аккаунта google
    user_id - уникальный идентификатор, получен из аккаунта google
    poker_chips - баланс игровых фишек пользователя
    win - количество выиграных фишек пользователя за все время
    status - принимает значения 'active', 'in_lobby', 'in_game', что позволяет при перезаходе на сайт перекидывать
             сразу на нужную страницу
    profile_image - иконка в профиле пользователя, ссылка на папку в static
    """
    email = models.EmailField(max_length=40, unique=True)
    username = models.CharField(max_length=30, default='Guest')
    user_id = models.CharField(max_length=50, unique=True)
    poker_chips = models.IntegerField(default=5000)
    win = models.IntegerField(default=0)
    status = models.CharField(max_length=10, default='active')
    profile_image = models.CharField(max_length=100,
                                     default='http://127.0.0.1:8000/static/profile_pictures/LuckyChip.png')

    objects = UserManager()

    USERNAME_FIELD = 'email'

    def __str__(self):
        return self.email


class Lobbies(models.Model):
    """
    Модель, хранящая созданные лобби и базовую информацию о них, установленную во время создания
    fields:
    max_players - максимум игроков за столом
    current_players - текущее количество игроков за столом
    big_blind, small_blind - заданные BB и SB стола
    max_bet - предел допустимой ставки за столом
    """
    BB_choices = [
        (10, '10 BB'),
        (100, '100 BB'),
        (500, '500 BB'),
        (1000, '1000 BB'),
        (5000, '5000 BB'),
        (10000, '10000 BB'),
        (50000, '50000 BB'),
        (100000, '100000 BB'),
    ]
    SB_choices = [
        (5, '5 SB'),
        (50, '50 SB'),
        (250, '250 SB'),
        (500, '500 SB'),
        (2500, '2500 SB'),
        (5000, '5000 SB'),
        (25000, '25000 SB'),
        (50000, '50000 SB'),
    ]
    lobby_id = models.AutoField(primary_key=True)
    lobby_name = models.CharField(max_length=15, default='lobby')
    max_players = models.IntegerField(default=5)
    current_players = models.IntegerField(default=0)
    big_blind = models.IntegerField(choices=BB_choices, default=500)
    small_blind = models.IntegerField(choices=SB_choices, default=250)


class Players(models.Model):
    """
    Модель для in-game players, которая показывает их состояние за столом
    fields:
    seating_position - место посадки игрока для определения очередности
    current_hand - текущая рука игрока (по умолчанию [])
    current_bet - текущая ставка игрока
    status - состояние игрока ('non_active' - когда игрок находится в лобби до начала игры и когда он не участвует в
             раунде, т.е. спасанул; 'first_check' - первая проверка полученных карт до ставок; 'turn' - ход игрока,
             во время которого он принимает решение о действии, 'active' - когда игрок в раунде и сделал свою ставку.)
    """
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    lobby_id = models.ForeignKey(Lobbies, on_delete=models.CASCADE)
    seating_position = models.IntegerField(default=0)
    current_hand = models.JSONField(default=list)
    current_bet = models.IntegerField(default=0)
    status = models.CharField(max_length=30, default='non_active')


class LobbyInfo(models.Model):
    """
    Модель для параметров in-game lobby
    fields:
    player_with_turn - посадочное место игрока с текущим ходом
    round_bet - текущая ставка раунда, 0 - если раунд не идет
    deck - текущая колода раунда
    """
    lobby_id = models.ForeignKey(Lobbies, on_delete=models.CASCADE)
    player_with_turn = models.IntegerField(default=0)
    round_bet = models.IntegerField(default=0)
    deck = models.JSONField(default=list)

    def shuffle_deck(self):
        """Перемешивает текущую колоду"""
        random.shuffle(self.deck)
        self.save()

    def draw_card(self):
        """Достает верхнюю карту из колоды"""
        if self.deck:
            card = self.deck.pop()
            self.save()
            return card
        return None

    def reset_deck(self):
        """Сбрасывает колоду к исходному состоянию"""
        self.deck = self.create_full_deck()
        self.shuffle_deck()
        self.save()

    def create_full_deck(self):
        """Создает игральную колоду из 52 карт"""
        return [(i, j) for i in range(2, 15) for j in ['spades', 'hearts', 'clubs', 'diamonds']]


class Actions(models.Model):
    """
    Модель, сохраняющая временные действия игроков во время раунда
    fields:
    action_type - тип действия, принимает значение 'fold' - игрок сбросил карты, 'call' - игрок поддержал ставку,
                  'raise' - игрок повысил ставку, 'all_in' - пока не понятна реализации, будет допиливаться
    action_amount - стоимость ставки, если action_type = 'raise'
    action_time - время, в которое было сделано действие
    """
    action_id = models.AutoField(primary_key=True)
    lobby_id = models.ForeignKey(Lobbies, on_delete=models.CASCADE)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    action_type = models.CharField(max_length=30, default='none')
    action_amount = models.IntegerField(default=0)
    action_time = models.TimeField(auto_now=True)

