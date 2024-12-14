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
    const [roundState, setRoundState] = useState('waiting');
    const [playerState, setPlayerState] = useState('non_active');
    const [winners, setWinners] = useState([]);
    const [logs, setLogs] = useState([]);
    const [button, setButton] = useState(0);
    const [warning, setWarning] = useState(false);
    const navigate = useNavigate();
    const socketGameRef = useRef(null);

    const pathname = window.location.pathname;
    const lobby_id = pathname.split('/').filter(Boolean).at(-1);

    const lobby_preloader = async (external_data = null) => {
        if (lobby_id !== null) {
            const round_state = await get_round_state(lobby_id);
            const players_info = await get_players_info(lobby_id);
            const table_info = await get_table_info(lobby_id);

            setRoundState(round_state);
            setPlayerState((players_info.find(player => player.is_current_user) || {}).status)

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
                case 'flop':
                case 'turn':
                case 'river':
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
                case 'end_game':
                    try {
                        const new_end_players = players_info.map((player) => ({
                            ...player,
                            'cards': external_data.findIndex(object => object.player === player.user_id) === -1 ?
                                ((player.status === 'non_active') ? [null, null] : ['card_cover', 'card_cover']) :
                                (external_data[external_data.findIndex(object => object.player === player.user_id)].hand)
                        }))
                        setPlayers(new_end_players);
                    } catch (error) {
                        const end_cards = await get_player_cards(lobby_id);

                        const new_end_players = players_info.map((player) => ({
                            ...player,
                            'cards': (player.is_current_user) ? end_cards :
                                ((player.status === 'non_active') ? [null, null] : ['card_cover', 'card_cover'])
                        }))
                        setPlayers(new_end_players);
                    }

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

                socketGameRef.current = new WebSocket("ws://127.0.0.1/ws/game/" + lobby_id + "/");
                socketGameRef.current.onopen = async (event) => {
                    await socketGameRef.current.send(JSON.stringify({
                        'event': 'connect',
                        'user_id': player_id,
                    }));
                }
                socketGameRef.current.onmessage = async (event) => {
                    const data = JSON.parse(event.data);
                    const players_info = await get_players_info(lobby_id);
                    console.log(data)
                    switch (data.event) {
                        case 'update_players_data':
                            await lobby_preloader();
                            break;
                        case 'start_round':
                            setLogs((prevMessages) => [
                                ...prevMessages,
                                'Раунд начат'
                            ]);
                            await lobby_preloader();
                            await socketGameRef.current.send(JSON.stringify({
                                'event': 'ready_to_start',
                                'user_id': player_id,
                                'lobby_id': lobby_id,
                            }));
                            break;
                        case 'player_turn':
                            setLogs((prevMessages) => [
                                ...prevMessages,
                                'Ход игрока ' + players_info.find(player => player.user_id === data.player).username
                            ]);
                            await lobby_preloader();
                            break;
                        case 'action_response':
                            if (data.action === 'fold'){
                                setLogs((prevMessages) => [
                                    ...prevMessages,
                                    'Игрок ' + players_info.find(player => player.user_id === data.user_id).username +
                                    ' спасовал'
                                ]);
                            }
                            else if (data.action === 'call'){
                                setLogs((prevMessages) => [
                                    ...prevMessages,
                                    'Игрок ' + players_info.find(player => player.user_id === data.user_id).username +
                                    ' поддержал ставку'
                                ]);
                            }
                            else if (data.action === 'raise') {
                                setLogs((prevMessages) => [
                                    ...prevMessages,
                                    'Игрок ' + players_info.find(player => player.user_id === data.user_id).username +
                                    ' поднял ставку вдвое'
                                ]);
                            }
                            else if (data.action === 'all_in'){
                                setLogs((prevMessages) => [
                                    ...prevMessages,
                                    'Игрок ' + players_info.find(player => player.user_id === data.user_id).username +
                                    ' пошел ва-банк'
                                ]);
                            }
                            break;
                        case 'end_stage':
                            await lobby_preloader();
                            await socketGameRef.current.send(JSON.stringify({
                                'event': 'ready_to_start_new_stage',
                                'user_id': player_id,
                                'lobby_id': lobby_id,
                            }));
                            break;
                        case 'stage_ended':
                            setLogs((prevMessages) => [
                                ...prevMessages,
                                data.previous_stage + ' завершен'
                            ])
                            await lobby_preloader();
                            break;
                        case 'end_game':
                            setWinners(data.info.winners);
                            setLogs([]);
                            await lobby_preloader(data.info.last_players);
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
                    logs={logs}
                />
            </div>
            <div className="contextWindow_base">
                <ContextWindow
                    players={players}
                    socketGameRef={socketGameRef}
                    roundState={roundState}
                    playerState={playerState}
                    lobbyInfo={lobbyInfo}
                    winners={winners}
                />
            </div>
            <div className="chatWindow_base">
                <Chat/>
            </div>
        </div>
    );
};

export default Lobby;