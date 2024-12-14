import {load_profile} from "../../requests/LoadProfile";
import React, {useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import './styles/Chat.css'

const Chat = () => {

    const [message, setMessage] = useState('');
    const [chat, setChat] = useState([]);
    const socketChatRef = useRef(null);
    const navigate = useNavigate();

    const pathname = window.location.pathname;
    const lobby_id = pathname.split('/').filter(Boolean).at(-1);

    useEffect(() => {
        socketChatRef.current = new WebSocket("ws://127.0.0.1/ws/chat/" + lobby_id + "/");
        socketChatRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setChat((prevMessages) => [
                ...prevMessages,
                { 'username': data.username, 'message': data.message }
            ]);
        };
        return () => {
            if (socketChatRef.current) {
                socketChatRef.current.close();
            }
        };
        // eslint-disable-next-line
    }, []);

    const sendMessage = async () => {
        try {
            const username = (await load_profile()).username
            if (socketChatRef.current && socketChatRef.current.readyState === WebSocket.OPEN) {
                if (message.replace(/\s+/g, '') !== '') {
                    await socketChatRef.current.send(JSON.stringify({
                        'message': message,
                        'username': username,
                    }));
                }
                await setMessage('');
            } else {
                throw new Error('WebSocket is not open');
            }
        } catch (error) {
            console.error('failed:', error);
            navigate('/error');
        }
    }

    const handleKeyDown = async (e) => {
        if (e.key === "Enter") {
            await sendMessage();
        }
    };

    return (
        <div className="chat_game">
            <div className="chatField_game">
                {chat.map((data, index) => (

                    <p key={index}>
                        <strong>{data.username}: </strong> {data.message}
                    </p>
                ))}
            </div>
            <div className="chatInputBox">
                <input
                    className="chatInput_game"
                    type="text"
                    value={message}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setMessage(e.target.value)}
                /><br/>
                <input className="chatInputSubmit_game " type="button" onClick={sendMessage}/>
            </div>
        </div>
    );
};

export default Chat;