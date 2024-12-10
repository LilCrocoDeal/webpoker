import '../pages/styles/Base.css'
import './styles/Lobby.css'
import {useEffect, useRef, useState} from "react";
import {get_user_id, lobby_permissions} from "../../requests/Auth";
import {useNavigate} from "react-router-dom";
import Chat from "./Chat";
import Table from "./Table";
import {get_player_cards, get_players_info, get_round_state, get_table_info} from "../../requests/Lobby";
import Warning from "../errors/Warning";
import ContextWindow from "./ContextWindow";


const Lobby = () => {

    const [isLoading, setIsLoading] = useState(true);
    const [players, setPlayers] = useState([]);
    const [dealerCards, setDealerCards] = useState([null, null, null, null, null]);
    const [lobbyInfo, setLobbyInfo] = useState([]);
    const [button, setButton] = useState(0);
    const [warning, setWarning] = useState(false);
    const navigate = useNavigate();
    const socketGameRef = useRef(null);

    const pathname = window.location.pathname;
    const lobby_id = pathname.split('/').filter(Boolean).at(-1);

    const lobby_preloader = async () => {
        if (lobby_id !== null) {
            const round_state = await get_round_state(lobby_id);
            const players_info = await get_players_info(lobby_id);
            const table_info = await get_table_info(lobby_id);

            switch (round_state) {
                case 'waiting':
                    setPlayers(players_info);

                    setLobbyInfo(table_info.lobby_info);
                    setDealerCards(table_info.dealer_cards);
                    if (table_info.lobby_info.status === 'active') {
                        setButton(table_info.lobby_info.player_with_BB);
                    }
                    break;
                case 'preflop':
                    const cards = await get_player_cards(lobby_id);

                    const new_players = players_info.map((player) => ({
                        ...player,
                        'cards': (player.is_current_user) ? cards :
                            ((player.status === 'non_active') ? [null, null] : ['card_cover', 'card_cover'])
                    }))
                    setPlayers(new_players);

                    setLobbyInfo(table_info.lobby_info);
                    setDealerCards(table_info.dealer_cards);
                    if (table_info.lobby_info.status === 'active') {
                        setButton(table_info.lobby_info.player_with_BB);
                    }
                    break;
                default:
                    break;
            }
        }
    }

    useEffect(() => {
        (async () => {
            try {
                const check = await lobby_permissions(lobby_id);
                if (!check) {
                    navigate("/NoAccess");
                }

                const player_id = await get_user_id();
                await lobby_preloader();

                socketGameRef.current = new WebSocket("ws://localhost:8000/ws/game/" + lobby_id + "/");
                socketGameRef.current.onopen = async (event) => {
                    await socketGameRef.current.send(JSON.stringify({
                        'event': 'connect',
                        'user_id': player_id,
                    }));
                }
                socketGameRef.current.onmessage = async (event) => {
                    const data = JSON.parse(event.data);
                    console.log(data);
                    switch (data.event) {
                        case 'update_players_data':
                            await lobby_preloader();
                            break;
                        case 'start_round':
                            await lobby_preloader();
                            await socketGameRef.current.send(JSON.stringify({
                                'event': 'ready_to_start',
                                'user_id': player_id,
                                'lobby_id': lobby_id,
                            }));
                            break;
                        default:
                            break;
                    }
                };
            } catch (error) {
                console.error('failed:', error);
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

    if (warning) {
        return <Warning
            lobby_id={lobby_id}
            changeWarning={() => {setWarning(false)}}
            socket={socketGameRef}
        />
    }

    return (
        <div>
            <div className="base">
                <button className="returnButton_game" onClick={() => {
                    setWarning(true);
                }}></button>
                <Table
                    players={players}
                    dealerCards={dealerCards}
                    button={button}
                    lobbyInfo={lobbyInfo}
                />
            </div>
            <div className="contextWindow_base">
                <ContextWindow
                    players={players}
                    socketGameRef={socketGameRef}
                />
            </div>
            <div className="chatWindow_base">
                <Chat/>
            </div>
        </div>
    );
};

export default Lobby;