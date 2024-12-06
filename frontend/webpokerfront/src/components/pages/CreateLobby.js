import {useState} from "react";
import './styles/Base.css'
import './styles/CreateLobby.css'
import {useNavigate} from "react-router-dom";
import {create_lobby} from "../../requests/Lobby";

const CreateLobby = () => {

    const [formData, setFormData] = useState({
        max_players: 5,
        big_blind: 500,
        lobby_name: 'lobby',
    });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Обработчик изменения полей формы
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "lobby_name") {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
        else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: parseInt(value),
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        (async () => {
            try {
                setIsLoading(true);
                const result = await create_lobby(formData);
                navigate('/lobby/' + result.lobby_id);

            } catch (error) {
                console.error('Creating lobby failed:', error);
                navigate('/error');
            } finally {
                setIsLoading(false);
            }
        })();
    };

    if (isLoading) {
        return (
            <div className="preloader">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="base">
            <form onSubmit={handleSubmit}>
                <div className="box_lobbies">
                    <div className="contextText">
                        <label>
                            Задайте имя лобби:
                            <input
                                className="bordered_lobbies"
                                type="text"
                                name="lobby_name"
                                placeholder="По умолчанию лобби будет называться lobby"
                                maxLength={15}
                                onChange={handleChange}
                            />
                        </label>
                    </div>
                    <div className="contextText">
                        <label>
                            Выберите максимальное количество игроков:
                            <select
                                className="bordered_lobbies"
                                name="max_players"
                                onChange={handleChange}
                                defaultValue={"5"}
                                required
                            >
                                <option value="2">2 игрока</option>
                                <option value="3">3 игрока</option>
                                <option value="4">4 игрока</option>
                                <option value="5">5 игроков</option>
                                <option value="6">6 игроков</option>
                                <option value="7">7 игроков</option>
                                <option value="8">8 игроков</option>
                                <option value="9">9 игроков</option>
                                <option value="10">10 игроков</option>
                            </select>
                        </label>
                    </div>
                    <div className="contextText">
                        <label>
                            Выберите размер BB:
                            <select
                                className="bordered_lobbies"
                                name="big_blind"
                                onChange={handleChange}
                                defaultValue={"500"}
                                required
                            >
                                <option value="10">10 фишек</option>
                                <option value="100">100 фишек</option>
                                <option value="500">500 фишек</option>
                                <option value="1000">1000 фишек</option>
                                <option value="5000">5000 фишек</option>
                                <option value="10000">10000 фишек</option>
                                <option value="50000">50000 фишек</option>
                                <option value="100000">100000 фишек</option>
                            </select>
                        </label>
                    </div>
                </div>

                <button type="submit" className="baseButton contextText lobbiesButton1">Создать лобби</button>
                <button className="baseButton contextText lobbiesButton2" onClick={() => {
                    navigate('/main');
                }}>Вернуться</button>
            </form>
        </div>
    );
};

export default CreateLobby;