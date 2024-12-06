import "./styles/GoogleLoginButton.css";
import google_logo from "../../assets/google_logo.webp"

const GoogleLoginButton = ({ href }) => {
    return (
        <a href={href} className="google-login-link">
            <img
                src={google_logo}
                alt="Google Icon"
                className="google-icon"
            />
            <span className="google-link-text">Войти через Google</span>
        </a>
    );
};

export default GoogleLoginButton;