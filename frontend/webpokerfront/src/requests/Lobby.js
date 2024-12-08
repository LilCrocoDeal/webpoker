import {axiosInstance} from "./AxiosConfig";

export const create_lobby = async (formData) => {

    try {
        const data = {
            'max_players': formData.max_players,
            'current_players': 1,
            'big_blind': formData.big_blind,
            'small_blind': formData.big_blind / 2,
            'lobby_name': formData.lobby_name,
        }
        const response = await axiosInstance.post('/lobby/create/', data);
        return {'lobby_id': response.data.lobby_id};
    } catch (error){
        console.log(error);
        return null;
    }
}


export const get_lobbies = async () => {

    try {
        const response = await axiosInstance.get('/lobby/get/');
        return response.data;
    } catch (error){
        console.log(error);
        return null;
    }
}


export const join_lobby = async (lobbyId) => {

    try {
        await axiosInstance.post('/lobby/join/', {'lobby_id': lobbyId});
        return true;
    } catch (error){
        console.log(error);
        return false;
    }
}


export const get_players_info = async (lobby_id) => {

    try {
        const response = await axiosInstance.post('lobby/players/', {'lobby_id': lobby_id});
        const players = response.data.players.map((player) => ({
            ...player,
            'is_current_user': (player.user_id === response.data.current_player),
            'cards': null,
        }));
        return players;
    } catch (error) {
        console.log(error);
        return null;
    }
}

export const get_table_info = async (lobby_id) => {

    try {
        const response = await axiosInstance.post('lobby/table/', {'lobby_id': lobby_id});
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log(error);
        return null;
    }
}