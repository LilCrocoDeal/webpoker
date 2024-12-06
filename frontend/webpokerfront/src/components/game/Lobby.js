import '../pages/styles/Base.css'
import './styles/Lobby.css'
import React, {useEffect, useState} from "react";
import {lobby_permissions} from "../../requests/Auth";
import {useNavigate} from "react-router-dom";
import Chat from "./Chat";

const Lobby = () => {

    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const pathname = window.location.pathname;
    const lobby_id = pathname.split('/').filter(Boolean).at(-1);


    useEffect(() => {
        (async () => {
            try {
                const check = await lobby_permissions(lobby_id);
                if (!check) {
                    navigate("/NoAccess");
                }
                // const gameSocket = new WebSocket("ws://localhost:8000/ws/game/" + lobby_id + "/");
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

    return (
        <div className="base">
            <button className="returnButton_game" onClick={() => {navigate('/main')}}></button>
            <Chat/>
        </div>
    );
};

export default Lobby;