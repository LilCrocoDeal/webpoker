import '../pages/styles/Base.css'
import './styles/Error.css'
import {useNavigate} from "react-router-dom";
import {confirmation} from "../../requests/Auth";

const Warning = ({lobby_id, changeWarning}) => {

    const navigate = useNavigate();

    const yes = async () => {
        const result = await confirmation(lobby_id);
        if (result) {
            changeWarning();
            navigate('/main');
        }
        else {
            changeWarning();
            navigate('/error');
        }
    };

    const no = () => {
        changeWarning();
        navigate('/lobby/' + lobby_id);
    };

    return (
        <div>
            <h1 className="contextText">Вы уверены, что хотите покинуть лобби?</h1>
            <button type="button" onClick={yes} className="contextText baseButton warningButton1">
                Да
            </button>
            <button type="button" onClick={no} className="contextText baseButton warningButton2">
                Нет
            </button>
        </div>
    );
};

export default Warning;