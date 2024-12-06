# поместить в .env из settings

from urllib.parse import urlencode
import requests
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
from poker.permissions import HasUserId
from poker.serializers import ProfileSerializer, UpdateProfileSerializer
from poker.models import Players

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    На вход функции передается код, полученный с клиента после авторизации google,
    затем проходит весь цикл обмена информацией с google api. Добавляет
    user_id в cookie, позволяя идентифицировать пользователя.
    """

    get_google_access_token = requests.post('https://oauth2.googleapis.com/token',
                                            headers={'Content-Type': 'application/x-www-form-urlencoded'},
                                            data=urlencode({
                                                'code': request.data['code'],
                                                'client_id': settings.GOOGLE_OAUTH2_CLIENT_ID,
                                                'client_secret': settings.GOOGLE_OAUTH2_CLIENT_SECRET,
                                                'redirect_uri': 'http://127.0.0.1:3000/main/',
                                                'grant_type': 'authorization_code'
                                            })
                                            )
    google_access_token = get_google_access_token.json()
    if 'error' in google_access_token:
        return Response(google_access_token, status=get_google_access_token.status_code)

    get_user_credentials = requests.get('https://www.googleapis.com/oauth2/v2/userinfo',
                                        headers={
                                            'Authorization': 'Bearer ' + google_access_token['access_token']
                                        })
    user_credentials = get_user_credentials.json()
    if 'error' in get_user_credentials:
        return Response(user_credentials, status=get_user_credentials.status_code)

    get_user = User.objects.filter(email=user_credentials['email'])
    if get_user.exists():
        response = Response({'response': 'authorization success'}, status=200)
        response.set_cookie(
            key='user_id',
            value= User.objects.get(email=user_credentials['email']).user_id,
            httponly=True,
            # secure=True,
            samesite='Lax'
        )
        return response
    else:
        new_user = User(user_id=user_credentials['id'])
        new_user.email = user_credentials['email']
        new_user.username = user_credentials['name']
        new_user.save()
        response = (Response({'response': 'authorization success'}, status=200))
        response.set_cookie(
            key='user_id',
            value= new_user.user_id,
            httponly=True,
            # secure=True,
            samesite='Lax'
        )
        return response


@api_view(['GET'])
@permission_classes([HasUserId])
def get_profile(request):
    """
    Получение профиля пользователя. Выдается имя, баланс фишек и общий выигрыш.
    """
    user = User.objects.get(user_id=request.COOKIES.get('user_id'))
    serializer = ProfileSerializer(user)
    return Response(serializer.data, status=200)


@api_view(['GET'])
@permission_classes([HasUserId])
def logout(request):
    response = Response({'response': 'logout success'}, status=200)
    response.delete_cookie('user_id')
    return response


@api_view(['POST'])
@permission_classes([HasUserId])
def edit_profile(request):
    user = User.objects.get(user_id=request.COOKIES.get('user_id'))
    serializer = UpdateProfileSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(status=200)
    return Response(status=400)


@api_view(['GET'])
@permission_classes([HasUserId])
def get_profile_photos(request):
    user = User.objects.get(user_id=request.COOKIES.get('user_id'))
    data = {
        'photos': [
            'http://127.0.0.1:8000/static/profile_pictures/JokerKnight.png',
            'http://127.0.0.1:8000/static/profile_pictures/LuckyChip.png',
            'http://127.0.0.1:8000/static/profile_pictures/JokerKnight1.png',
            'http://127.0.0.1:8000/static/profile_pictures/LuckyChip1.png',
            'http://127.0.0.1:8000/static/profile_pictures/JokerKnight2.png',
            'http://127.0.0.1:8000/static/profile_pictures/LuckyChip2.png',
        ],
        'current_photo': user.profile_image

    }
    return Response(data, status=200)


@api_view(['GET'])
@permission_classes([HasUserId])
def get_state(request):
    user = User.objects.get(user_id=request.COOKIES.get('user_id'))
    if user.status == 'active':
        return Response({'info': 'active'}, status=200)
    elif user.status == 'in_game':
        lobby_id = Players.objects.get(user_id=user).lobby_id.lobby_id
        return Response({'info': 'in_game', 'lobby_id': lobby_id}, status=200)
    elif user.status == 'in_lobby':
        lobby_id = Players.objects.get(user_id=user).lobby_id.lobby_id
        return Response({'info': 'in_lobby', 'lobby_id': lobby_id}, status=200)

