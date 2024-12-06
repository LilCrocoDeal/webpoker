import {uri} from "../../requests/Auth";
import './styles/Auth.css'
import './styles/Base.css'
import GoogleLoginButton from "../elements/GoogleLoginButton";

const Auth = () => {

    return (
        <div className="base">
            <h1 className="contextText title">Poker</h1>
            <p className="contextText request">Авторизация</p>
            <GoogleLoginButton href={uri}/>
        </div>
    )
}

export default Auth;