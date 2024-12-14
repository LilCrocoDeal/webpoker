import './styles/Base.css'
import './styles/EditProfile.css'
import './styles/Profile.css'
import {axiosInstance} from "../../requests/AxiosConfig";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";

import one from '../../assets/Profile Pictures/1.png'
import two from '../../assets/Profile Pictures/2.png'
import free from '../../assets/Profile Pictures/3.png'
import four from '../../assets/Profile Pictures/4.png'
import five from '../../assets/Profile Pictures/5.png'
import six from '../../assets/Profile Pictures/6.png'

const EditProfile = () => {

    const [isLoading, setIsLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const navigate = useNavigate();

    // Получение фотографий с сервера
    useEffect(() => {
        (async () => {
            try {
                const result = await axiosInstance.get("/profile/photos/");
                setSelectedPhoto(result.data.current_photo);

            } catch (error) {
                console.error('Loading user info failed:', error);
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

    const handlePhotoClick = (photo) => {
        setSelectedPhoto(photo);
    };

    // Обработчик сохранения выбора
    const handleSave = () => {
        (async () => {
            try {
                await axiosInstance.post("/profile/edit/", { 'profile_image': selectedPhoto });
                navigate("/profile");

            } catch (error) {
                console.error('Loading user info failed:', error);
                navigate('/error');
            } finally {
                setIsLoading(false);
            }
        })();
    };

    return (
        <div className="base">
            <div className="container_edit">
                <div className="column_edit">
                    <button className={`icon_edit ${selectedPhoto === 1 ? "selected" : ""}`}
                            onClick={() => handlePhotoClick(1)}>
                        <img src={one} alt="Profile Icon 1"/>
                    </button>
                    <button className={`icon_edit ${selectedPhoto === 4 ? "selected" : ""}`}
                            onClick={() => handlePhotoClick(4)}>
                        <img src={four} alt="Profile Icon 4"/>
                    </button>
                </div>
                <div className="column_edit">
                    <button className={`icon_edit ${selectedPhoto === 2 ? "selected" : ""}`}
                            onClick={() => handlePhotoClick(2)}>
                        <img src={two} alt="Profile Icon 2"/>
                    </button>
                    <button className={`icon_edit ${selectedPhoto === 5 ? "selected" : ""}`}
                            onClick={() => handlePhotoClick(5)}>
                        <img src={five} alt="Profile Icon 5"/>
                    </button>
                </div>
                <div className="column_edit">
                    <button className={`icon_edit ${selectedPhoto === 3 ? "selected" : ""}`}
                            onClick={() => handlePhotoClick(3)}>
                        <img src={free} alt="Profile Icon 3"/>
                    </button>
                    <button className={`icon_edit ${selectedPhoto === 6 ? "selected" : ""}`}
                            onClick={() => handlePhotoClick(6)}>
                        <img src={six} alt="Profile Icon 6"/>
                    </button>
                </div>
            </div>
            <button className="baseButton contextText button_edit" onClick={handleSave}>Выбрать</button>
        </div>
    );
};

export default EditProfile;