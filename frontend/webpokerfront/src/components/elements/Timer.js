import { useState, useEffect } from "react";
import './styles/Timer.css'

const Timer = ({ onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {

        setTimeLeft(30);
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="timer_box">
            <h1>{timeLeft}</h1>
        </div>
    );
};

export default Timer;