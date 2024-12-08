import React, { useState, useEffect } from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {manage} from "../../requests/Auth";
import '../pages/styles/Base.css'


/**
 * Обертка для страниц, которая позволяет перенаправить пользователя на нужную страницу при случайном
 * закрытии или намеренном вводе ненужных и недоступных ему страниц
 **/
const UserManager = ({ child, child_type }) => {

    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(window.location.search);
    const uid_code = searchParams.get('code');

    useEffect(() => {
        (async () => {
            try {
                const result = await manage(uid_code);

                switch (child_type){
                    case 'auth':
                        if (result.status === 'active') {
                            navigate("/main");
                        }
                        else if (result.status === 'in_lobby' || result.status === 'in_game') {
                            navigate("/lobby/" + result.lobby_id);
                        }
                        break;
                    case 'profile':
                        if (result.status === 'unauthorized') {
                            navigate("/unauthorized");
                        }
                        else if (result.status === 'in_lobby'|| result.status === 'in_game') {
                            navigate("/lobby/" + result.lobby_id);
                        }
                        else if (result.status === 'error') {
                            navigate("/error");
                        }
                        break;
                    case 'lobby':
                        if (result.status === 'unauthorized' || result.status === 'active') {
                            navigate("/noaccess");
                        }
                        break;
                    default:
                        navigate("/error");
                        break;
                }
            } catch (error) {
                console.error('failed:', error);
                navigate('/error');
            } finally {
                setIsLoading(false);
            }
        })();
        // eslint-disable-next-line
    }, [location]);

    if (isLoading) {
        return (
            <div className="preloader">
                <div className="spinner"></div>
            </div>
        );
    }

    return <>{child}</>;
};

export default UserManager;
