import '../pages/styles/Base.css'
import './styles/Error.css'
import {useNavigate} from "react-router-dom";

const Unauthorized = () => {

    const navigate = useNavigate();

    return (
        <div>
            <h1 className="contextText">Так как вы не авторизованы, вы не имеете доступа к этой странице</h1>
            <button type="button" onClick={() => {navigate('/');}} className="contextText baseButton errorButton">
                Вернуться на страницу авторизации
            </button>
        </div>
    );
}

export default Unauthorized