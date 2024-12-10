from django.urls import path
from poker.views.auth_views.views import (google_auth, get_profile, logout, edit_profile,
                                          get_profile_photos, get_state, get_user_id)

from poker.views.lobby_views.views import (create_lobby, get_lobbies_list, join_lobby, exit_lobby, validate_lobby,
                                           get_players_info, get_table_info, set_ready, set_not_ready, get_player_cards,
                                           get_round_state)


urlpatterns = [
    path('api/auth/', google_auth),
    path('api/auth/logout/', logout),
    path('api/auth/get_state/', get_state),
    path('api/auth/get_user_id/', get_user_id),
    path('api/profile/', get_profile),
    path('api/profile/edit/', edit_profile),
    path('api/profile/photos/', get_profile_photos),
    path('api/lobby/create/', create_lobby),
    path('api/lobby/get/', get_lobbies_list),
    path('api/lobby/join/', join_lobby),
    path('api/lobby/exit/', exit_lobby),
    path('api/lobby/validate/', validate_lobby),
    path('api/lobby/players/', get_players_info),
    path('api/lobby/table/', get_table_info),
    path('api/lobby/get_cards/', get_player_cards),
    path('api/lobby/set/ready/', set_ready),
    path('api/lobby/set/not_ready/', set_not_ready),
    path('api/lobby/get_state/', get_round_state),
]