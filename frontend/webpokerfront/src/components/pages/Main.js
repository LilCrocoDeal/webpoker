import './styles/Base.css'
import './styles/Main.css'
import {useNavigate} from "react-router-dom";

const Main = () => {

    const navigate = useNavigate();

    return (
        <div className="base">
            <div className="container_main">
                <button
                    type="button" className="baseButton contextText" onClick={() => {
                        navigate("/create_lobby");
                }}>СОЗДАТЬ ЛОББИ</button>
                <button
                    type="button" className="baseButton contextText" onClick={() => {
                        navigate("/join_lobby");
                }}>ПРИСОЕДИНИТЬСЯ К ЛОББИ</button>
                <button
                    type="button" className="baseButton contextText" onClick={() => {
                        navigate("/profile");
                }}>ПОСМОТРЕТЬ ПРОФИЛЬ</button>
            </div>
        </div>
    )
}

export default Main;