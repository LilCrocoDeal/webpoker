import {axiosInstance} from "../../requests/AxiosConfig";
import {useEffect, useState} from "react";
import './styles/Profile.css'
import './styles/Base.css'
import {useNavigate} from "react-router-dom";
import {load_profile} from "../../requests/LoadProfile";
import EditableNameField from "../elements/EditableNameField";

const Profile = () => {

    const [isLoading, setIsLoading] = useState(true);
    const [username, setName] = useState(null);
    const [poker_chips, setChips] = useState(null);
    const [win, setWin] = useState(null);
    const [profile_image, setProfileImage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const result = await load_profile();

                setName(result.username);
                setChips(result.poker_chips);
                setWin(result.win);
                setProfileImage(result.profile_image);

            } catch (error) {
                console.error('Loading user info failed:', error);
                navigate('/error');
            } finally {
                setIsLoading(false);
            }
        })();

        // eslint-disable-next-line
    }, []);

    if (isLoading) {
        return (
            <div className="preloader">
                <div className="spinner"></div>
            </div>
        );
    }

    const logout = async () => {
        try {
            await axiosInstance.get("/auth/logout");
            navigate("/");
        } catch (error) {
            console.error('Ошибка запроса выхода из профиля:', error);
            navigate("/error");
        }
    }

    return (
        <div className="base">
            <div className="container_profile">
                <div className="column_profile column-left_profile">
                    <div className="icon-wrapper_profile">
                        <div className="icon_profile">
                            <img src={profile_image} alt="Profile Icon"/>
                        </div>
                        <button className="edit-icon_profile" onClick={() => {
                            navigate('/profile/edit');
                        }}></button>
                    </div>
                </div>
                <div className="column_profile column-right_profile">
                    <EditableNameField name={username}/>
                    <div className="box_profile">
                        <p className="contextText text_profile">Фишки:</p>
                        <span className="bordered_profile contextText">{poker_chips} ⛃</span>
                    </div>
                    <div className="box_profile">
                        <p className="contextText text_profile">Общий выигрыш:</p>
                        <span className="bordered_profile contextText">{win} ⛃</span>
                    </div>
                </div>
            </div>
            <div className="box_profile">
                <button className="baseButton contextText profileButton1" onClick={() => {
                    navigate('/main');
                }}>Вернуться</button>
                <button className="baseButton contextText profileButton2" onClick={logout}>Выйти из профиля</button>
            </div>
        </div>
    )
}

export default Profile;