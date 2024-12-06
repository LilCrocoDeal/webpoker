import {axiosInstance} from "./AxiosConfig";

export const load_profile = async () => {

    try {
        const response = await axiosInstance.get('/profile/');
        return {
            'username': response.data.username,
            'poker_chips': response.data.poker_chips,
            'win': response.data.win,
            'profile_image': response.data.profile_image
        };
    } catch (error){
        console.log(error);
        return [null, null, null];
    }
}