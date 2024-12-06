import './styles/Base.css'
import './styles/EditProfile.css'
import './styles/Profile.css'
import {axiosInstance} from "../../requests/AxiosConfig";
import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";

const EditProfile = () => {

    const [isLoading, setIsLoading] = useState(true);
    const [photos, setPhotos] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const navigate = useNavigate();

    // Получение фотографий с сервера
    useEffect(() => {
        (async () => {
            try {
                const result = await axiosInstance.get("/profile/photos/");

                setPhotos(result.data.photos);
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
                    <button className={`icon_edit ${selectedPhoto === photos[0] ? "selected" : ""}`}
                            onClick={() => handlePhotoClick(photos[0])}>
                        <img src={photos[0]} alt="Profile Icon 1"/>
                    </button>
                    <button className={`icon_edit ${selectedPhoto === photos[3] ? "selected" : ""}`}
                            onClick={() => handlePhotoClick(photos[3])}>
                        <img src={photos[3]} alt="Profile Icon 4"/>
                    </button>
                </div>
                <div className="column_edit">
                    <button className={`icon_edit ${selectedPhoto === photos[1] ? "selected" : ""}`}
                            onClick={() => handlePhotoClick(photos[1])}>
                        <img src={photos[1]} alt="Profile Icon 2"/>
                    </button>
                    <button className={`icon_edit ${selectedPhoto === photos[4] ? "selected" : ""}`}
                            onClick={() => handlePhotoClick(photos[4])}>
                        <img src={photos[4]} alt="Profile Icon 5"/>
                    </button>
                </div>
                <div className="column_edit">
                    <button className={`icon_edit ${selectedPhoto === photos[2] ? "selected" : ""}`}
                            onClick={() => handlePhotoClick(photos[2])}>
                        <img src={photos[2]} alt="Profile Icon 3"/>
                    </button>
                    <button className={`icon_edit ${selectedPhoto === photos[5] ? "selected" : ""}`}
                            onClick={() => handlePhotoClick(photos[5])}>
                        <img src={photos[5]} alt="Profile Icon 6"/>
                    </button>
                </div>
            </div>
            <button className="baseButton contextText button_edit" onClick={handleSave}>Выбрать</button>
        </div>
    );
};

export default EditProfile;