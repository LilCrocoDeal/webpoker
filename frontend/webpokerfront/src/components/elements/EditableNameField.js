import React, {useState} from "react";
import '../pages/styles/Profile.css'
import '../pages/styles/Base.css'
import {axiosInstance} from "../../requests/AxiosConfig";

const EditableNameField = ({ name }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(name);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleInputChange = (e) => {
        setText(e.target.value); // Обновляем текст при вводе
    };

    const handleInputBlur = () => {
        setText(name);
        setIsEditing(false); // Выключаем режим редактирования при потере фокуса
    };

    const handleKeyDown = async (e) => {
        if (e.key === "Enter") {
            try {
                await axiosInstance.post("/profile/edit/", {'username': text});
            } catch (error) {
                console.log(error);
                setText(name);
            }
            setIsEditing(false);
        }
    };

    return (
        <div className="box_profile icon-wrapper_profile">
            <p className="contextText text_profile">Имя:</p>
            {isEditing ? (
                <input
                    type="text"
                    className="bordered_profile contextText"
                    value={text}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
            ) : (
                <span className="bordered_profile contextText">{text}</span>
            )}
            <button className="edit-icon_profile" onClick={handleEditClick}></button>
        </div>
    );
}

export default EditableNameField;