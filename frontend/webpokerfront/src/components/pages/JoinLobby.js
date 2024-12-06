import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {get_lobbies, join_lobby} from "../../requests/Lobby";
import './styles/JoinLobby.css'

const JoinLobby = () => {

    const [isLoading, setIsLoading] = useState(true);
    const [lobbies, setLobbies] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            try {
                const result = await get_lobbies();
                setLobbies(result);
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

    const handleJoinRoom = (lobbyId) => {
        (async () => {
            try {
                const result = await join_lobby(lobbyId);
                if (result) {
                    navigate("/lobby/" + lobbyId);
                }
                else {
                    navigate('/error');
                }
            } catch (error) {
                console.error('Join lobby failed:', error);
                navigate('/error');
            } finally {
                setIsLoading(false);
            }
        })();
    };

    return (
        <div className="base join_container">
            <div className="join_top-container">
                {lobbies.length === 0 ? (
                    <h1 className="contextText">Нет доступных комнат</h1>
                ) : (
                    <ul className="join_ul">
                        {lobbies.map((lobby) => (
                            <li key={lobby.lobby_id} className="join_li">
                                <h1 className="join_element">{lobby.lobby_name}</h1>
                                <span className="join_element">
                                    {"игроки: " + lobby.current_players + "/" + lobby.max_players}
                                </span>
                                <span className="join_element">{lobby.big_blind + " BB"}</span>
                                <button
                                    className="join_bt contextText"
                                    onClick={() => handleJoinRoom(lobby.lobby_id)}
                                >
                                    Войти
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="join_middle-gap"></div>
            <div className="join_bottom-container">
                <button className="baseButton contextText joinButton" onClick={() => {
                    navigate('/main');
                }}>Вернуться</button>
            </div>
        </div>
    );
};

export default JoinLobby;