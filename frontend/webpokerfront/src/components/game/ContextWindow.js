import {useEffect, useState} from "react";
import {set_readiness} from "../../requests/Lobby";
import './styles/ContextWindow.css'
import '../pages/styles/Base.css'
import {useNavigate} from "react-router-dom";
import Timer from "../elements/Timer";


const ContextWindow = ({players, roundState, playerState, socketGameRef, lobbyInfo}) => {

    const [buttonGreen, setButtonGreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isEmpty, setIsEmpty] = useState(false);
    const navigate = useNavigate();

    const pathname = window.location.pathname;
    const lobby_id = pathname.split('/').filter(Boolean).at(-1);

    useEffect(() => {
        (async () => {
            try{
                if(players.length === 1 || roundState !== 'waiting') {
                    setButtonGreen(false);
                }
                setIsEmpty(false);
            } catch (error) {
                console.error('failed:', error);
                navigate('/error');
            } finally {
                setIsLoading(false);
            }
        })();
        // eslint-disable-next-line
    }, [players]);


    const set_ready_state = async () => {
        if (buttonGreen) {
            const response = await set_readiness(lobby_id, 'not_ready');
            if (response) {
                setButtonGreen(false);
            } else {
                throw Error('Лютейшая ошибка');
            }
        }
        else {
            const response = await set_readiness(lobby_id, 'ready');

            if (response === null) {
                setButtonGreen(true);
            } else if (response === 'start_round') {
                await socketGameRef.current.send((JSON.stringify({
                    'event': 'start_round',
                    'lobby_id': lobby_id,
                })))
                setButtonGreen(true);
            }
        }
    }

    const set_empty = () => {
        setIsEmpty(true);
    }

    const on_fold = async () => {
        await socketGameRef.current.send((JSON.stringify({
            'event': 'end_turn',
            'user_id': players.find(player => player.is_current_user).user_id,
            'lobby_id': lobby_id,
            'action': 'fold'
        })))
        setIsEmpty(true);
    }

    const on_call = async () => {
        await socketGameRef.current.send((JSON.stringify({
            'event': 'end_turn',
            'user_id': players.find(player => player.is_current_user).user_id,
            'lobby_id': lobby_id,
            'action': 'call'
        })))
        setIsEmpty(true);
    }

    const on_raise = async () => {
        await socketGameRef.current.send((JSON.stringify({
            'event': 'end_turn',
            'user_id': players.find(player => player.is_current_user).user_id,
            'lobby_id': lobby_id,
            'action': 'raise'
        })))
        setIsEmpty(true);
    }

    const on_all_in = async () => {
        await socketGameRef.current.send((JSON.stringify({
            'event': 'end_turn',
            'user_id': players.find(player => player.is_current_user).user_id,
            'lobby_id': lobby_id,
            'action': 'all_in'
        })))
        setIsEmpty(true);
    }

    if (isLoading) {
        return (
            <div className="preloader">
                <div className="spinner"></div>
            </div>
        );
    }

    if (isEmpty) {
        return <div></div>;
    }

    if (roundState === 'waiting') {
        if (players.length === 1) {
            return (
                <div className="base_context">
                    <h1 className="text_context">Ожидание присоединения игроков...</h1>
                </div>
            );
        } else {
            return (
                <div className="base_context">
                    <h1 className="text_context">{buttonGreen ? '' : 'Нажмите кнопку по готовности к игре'}</h1>
                    <button
                        className="button_confirm_context"
                        style={{backgroundColor: buttonGreen ? "green" : "#878a8d"}}
                        onClick={set_ready_state}
                    >Готов</button>
                </div>
            );
        }
    }
    else if (roundState === 'preflop' || roundState === 'flop' || roundState === 'turn' || roundState === 'river') {
        if (playerState === 'active' || playerState === 'non_active' ||
            playerState === 'all_in' || playerState === 'first_check') {
            return (
                <div className="base_context">
                    <h1 className="text_context">Ход игрока {(players.find(player => (player.status === 'turn')) || {}).username}:</h1>
                    <Timer onComplete={set_empty} />
                    <p className="text_context">текущая ставка: {lobbyInfo.round_bet}</p>
                    <p className="text_context">ваши фишки: {(players.find(player => player.is_current_user) || {}).poker_chips}</p>
                </div>
            );
        } else if (playerState === 'turn') {
            return (
                <div className="base_context">
                    <h1 className="text_context">Ваш ход:</h1>
                    <Timer onComplete={set_empty}/>
                    <p className="text_context">текущая ставка: {lobbyInfo.round_bet}</p>
                    <button onClick={on_fold} className="button_choice_context">FOLD</button>
                    <button onClick={on_call} className="button_choice_context">CALL</button>
                    <button onClick={on_raise} className="button_choice_context">RAISE</button>
                    <button onClick={on_all_in} className="button_choice_context">ALL IN</button>
                    <p className="text_context">ваши фишки: {(players.find(player => player.is_current_user) || {}).poker_chips}</p>
                </div>
            );
        }
    }
    else if (roundState === 'flop' || roundState === 'turn') {
        if (playerState === 'active' || playerState === 'non_active' || playerState === 'all_in') {
            return (
                <div className="base_context">
                    <h1 className="text_context">Ход игрока {(players.find(player => (player.status === 'turn')) || {}).username}:</h1>
                    <Timer onComplete={set_empty} />
                    <p className="text_context">текущая ставка: {lobbyInfo.round_bet}</p>
                    <p className="text_context">ваши фишки: {(players.find(player => player.is_current_user) || {}).poker_chips}</p>
                </div>
            );
        } else if (playerState === 'turn') {
            return (
                <div className="base_context">
                    <h1 className="text_context">Ваш ход:</h1>
                    <Timer onComplete={set_empty}/>
                    <p className="text_context">текущая ставка: {lobbyInfo.round_bet}</p>
                    <button onClick={on_fold} className="button_choice_context">FOLD</button>
                    <button onClick={on_call} className="button_choice_context">CALL</button>
                    <button onClick={on_raise} className="button_choice_context">RAISE</button>
                    <button onClick={on_all_in} className="button_choice_context">ALL IN</button>
                    <p className="text_context">ваши фишки: {(players.find(player => player.is_current_user) || {}).poker_chips}</p>
                </div>
            );
        }
    }
};

export default ContextWindow;