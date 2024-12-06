import '../pages/styles/Base.css'
import './styles/Error.css'
import {useNavigate} from "react-router-dom";


const Error = () => {

    const navigate = useNavigate();

    return (
        <div>
            <h1 className="contextText">Произошла внутренняя ошибка</h1>
            <button type="button" onClick={() => {navigate('/');}} className="contextText baseButton errorButton">
                Вернуться на главную страницу
            </button>
        </div>
    );
}

export default Error