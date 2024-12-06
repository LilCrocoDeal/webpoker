from django.urls import path
from poker.views.auth_views.views import (google_auth, get_profile, logout, edit_profile,
                                          get_profile_photos, get_state)

from poker.views.lobby_views.views import create_lobby, get_lobbies_list, join_lobby, exit_lobby, validate_lobby

urlpatterns = [
    path('api/auth/', google_auth),
    path('api/auth/logout/', logout),
    path('api/auth/get_state/', get_state),
    path('api/profile/', get_profile),
    path('api/profile/edit/', edit_profile),
    path('api/profile/photos/', get_profile_photos),
    path('api/lobby/create/', create_lobby),
    path('api/lobby/get/', get_lobbies_list),
    path('api/lobby/join/', join_lobby),
    path('api/lobby/exit/', exit_lobby),
    path('api/lobby/validate/', validate_lobby),
]