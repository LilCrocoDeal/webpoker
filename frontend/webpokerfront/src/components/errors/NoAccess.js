import '../pages/styles/Base.css'
import './styles/Error.css'
import {useNavigate} from "react-router-dom";

const NoAccess = () => {

    const navigate = useNavigate();

    return (
        <div>
            <h1 className="contextText">Вы не имеете доступа к этому лобби</h1>
            <button type="button" onClick={() => {navigate('/');}} className="contextText baseButton errorButton">
                Вернуться
            </button>
        </div>
    );
};

export default NoAccess;