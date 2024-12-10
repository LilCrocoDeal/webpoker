import {useEffect, useState} from "react";
import {get_round_state, set_readiness} from "../../requests/Lobby";
import './styles/ContextWindow.css'
import '../pages/styles/Base.css'
import {useNavigate} from "react-router-dom";


const ContextWindow = ({players, lobbyInfo, socketGameRef}) => {

    const [buttonGreen, setButtonGreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [roundState, setRoundState] = useState('waiting');
    const navigate = useNavigate();

    const pathname = window.location.pathname;
    const lobby_id = pathname.split('/').filter(Boolean).at(-1);

    useEffect(() => {
        (async () => {
            try{
                const round_state = await get_round_state(lobby_id);
                setRoundState(round_state);

                if(players.length === 1 || roundState !== 'waiting') {
                    setButtonGreen(false);
                }
            } catch (error) {
                console.error('failed:', error);
                navigate('/error');
            } finally {
                setIsLoading(false);
            }
        })();
        // eslint-disable-next-line
    }, []);


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

    if (isLoading) {
        return (
            <div className="preloader">
                <div className="spinner"></div>
            </div>
        );
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
                        style={{backgroundColor: buttonGreen ? "green" : "gray"}}
                        onClick={set_ready_state}
                    >Готов</button>
                </div>
            );
        }
    }
    else if (roundState === 'preflop') {
        return (<div>мама я в префлопе и все суки это знают</div>);
    }
};

export default ContextWindow;