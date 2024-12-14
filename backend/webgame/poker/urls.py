from django.urls import path
from poker.views.auth_views.views import (google_auth, get_profile, logout, edit_profile,
                                          get_profile_photos, get_state, get_user_id)

from poker.views.lobby_views.views import (create_lobby, get_lobbies_list, join_lobby, exit_lobby, validate_lobby,
                                           get_players_info, get_table_info, set_ready, set_not_ready, get_player_cards,
                                           get_round_state)


urlpatterns = [
    path('auth/', google_auth),
    path('auth/logout/', logout),
    path('auth/get_state/', get_state),
    path('auth/get_user_id/', get_user_id),
    path('profile/', get_profile),
    path('profile/edit/', edit_profile),
    path('profile/photos/', get_profile_photos),
    path('lobby/create/', create_lobby),
    path('lobby/get/', get_lobbies_list),
    path('lobby/join/', join_lobby),
    path('lobby/exit/', exit_lobby),
    path('lobby/validate/', validate_lobby),
    path('lobby/players/', get_players_info),
    path('lobby/table/', get_table_info),
    path('lobby/get_cards/', get_player_cards),
    path('lobby/set/ready/', set_ready),
    path('lobby/set/not_ready/', set_not_ready),
    path('lobby/get_state/', get_round_state),
]