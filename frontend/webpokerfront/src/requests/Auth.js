import {axiosInstance} from "./AxiosConfig";


const GOOGLE_AUTH_URI = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_CLIENT_ID = '477157095175-qdg1vd05nftvbdgavqcs3h5j41tr146b.apps.googleusercontent.com'
const GOOGLE_REDIRECT_URI = 'http://webpoker.timofeev.beget.tech/main/'

export const uri = `${GOOGLE_AUTH_URI}?redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&client_id=${GOOGLE_CLIENT_ID}&scope=profile email`


export const manage = async (uid_code) => {

    if (uid_code !== null) {
        try {
            await axiosInstance.post('/auth/', {'code': uid_code})
        } catch (error) {
            console.error(error);
            return {'status': 'error'};
        }
    }
    try {
        const result = await axiosInstance.get('/auth/get_state/');
        if (result.data.info === 'in_lobby') {
            return {'status': 'in_lobby', 'lobby_id': result.data.lobby_id}
        }
        else if (result.data.info === 'in_game') {
            return {'status': 'in_game', 'lobby_id': result.data.lobby_id}
        }
        else if (result.data.info === 'active') {
            return {'status': 'active'};
        }
    } catch (error) {
        console.log('error');
        return {'status': 'unauthorized'};
    }
}


export const confirmation = async (lobby_id) => {
    try {
        await axiosInstance.post('/lobby/exit/', {'lobby_id': lobby_id})
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}


export const lobby_permissions = async (lobby_id) => {
    try {
        await axiosInstance.post('/lobby/validate/', {'lobby_id': lobby_id})
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}


export const get_user_id = async () => {
    try {
        const response = await axiosInstance.get('/auth/get_user_id/')
        return response.data.user_id;
    } catch (error) {
        console.error(error);
        return false;
    }
}
