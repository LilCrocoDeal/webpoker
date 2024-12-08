import '../pages/styles/Base.css'
import './styles/Lobby.css'
import React, {useEffect, useRef, useState} from "react";
import {lobby_permissions} from "../../requests/Auth";
import {useNavigate} from "react-router-dom";
import Chat from "./Chat";
import Table from "./Table";
import {get_players_info, get_table_info} from "../../requests/Lobby";
import Warning from "../errors/Warning";


const Lobby = () => {

    const [isLoading, setIsLoading] = useState(true);
    const [players, setPlayers] = useState([]);
    const [dealerCards, setDealerCards] = useState([null, null, null, null, null]);
    const [button, setButton] = useState(0);
    const [warning, setWarning] = useState(false);
    const navigate = useNavigate();
    const socketGameRef = useRef(null);

    const pathname = window.location.pathname;
    const lobby_id = pathname.split('/').filter(Boolean).at(-1);

    const get_players = async () => {
        const players_info = await get_players_info(lobby_id);
        if(players_info === null) {
            throw Error('Ошибка получения игроков из базы данных')
        }
        else {
            setPlayers(players_info);
            return players_info.find((player) => player.is_current_user === true).user_id
        }
    }

    const get_table = async () => {
        const table_info = await get_table_info(lobby_id);

        setDealerCards(table_info.dealer_cards);
        if (table_info.lobby_info.status === 'active') {
            setButton(table_info.lobby_info.player_with_turn);
        }
    }

    useEffect(() => {
        (async () => {
            try {
                const check = await lobby_permissions(lobby_id);
                if (!check) {
                    navigate("/NoAccess");
                }

                const player_id = await get_players();
                await get_table();

                socketGameRef.current = new WebSocket("ws://localhost:8000/ws/game/" + lobby_id + "/");
                socketGameRef.current.onopen = async (event) => {
                    await socketGameRef.current.send(JSON.stringify({
                        'event': 'info',
                        'message': 'connect',
                        'user_id': player_id,
                    }));
                }
                socketGameRef.current.onmessage = async (event) => {
                    const data = JSON.parse(event.data);
                    console.log(data);
                    switch (data.event) {
                        case 'update_players_data':
                            await get_players();
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
                />
            </div>
            <div className="contextWindow_base">

            </div>
            <div className="chatWindow_base">
                <Chat/>
            </div>
        </div>
    );
};

export default Lobby;