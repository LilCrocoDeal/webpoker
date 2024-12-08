import {useEffect, useRef, useState} from "react";
import './styles/Table.css'
import Card from "../elements/Card";

const Table = ({players, dealerCards, button}) => {
    const [tablePlayers, setTablePlayers] = useState([]);
    const [tableCards, setTableCards] = useState([null, null, null, null, null]);
    const [tableButton, setTableButton] = useState(0);
    const tableRef = useRef(null);
    const playerRef = useRef(null);
    const [offset, setOffset] = useState(0);
    const [tableRadius, setTableRadius] = useState(0);


    useEffect(() => {
        const updateParameters = () => {
            if (tableRef.current) {
                const { height } = tableRef.current.getBoundingClientRect();
                setTableRadius(height / 2);
            }
            if (playerRef.current) {
                const { height, width } = playerRef.current.getBoundingClientRect();
                setOffset(Math.max(height, width)/2);
            }
        };

        updateParameters();
        window.addEventListener("resize", updateParameters);

        setTablePlayers(players);
        setTableCards(dealerCards);
        setTableButton(button);

        return () => {
            window.removeEventListener("resize", updateParameters);
        };
    }, [players, dealerCards, button]);


    const calculatePosition = (seating_position, total, type) => {
        const angle = (2 * Math.PI * (seating_position-1)) / total + Math.PI / 2 ;
        if (type === 'player') {
            const x = tableRadius + (tableRadius + offset) * Math.cos(angle);
            const y = tableRadius + (tableRadius + offset) * Math.sin(angle);
            return { x, y };
        }
        else if (type === 'button') {
            const x = tableRadius + (tableRadius - offset) * Math.cos(angle);
            const y = tableRadius + (tableRadius - offset) * Math.sin(angle);
            return { x, y };
        }
        else {
            return null;
        }
    };

    return (
        <div className="lobby_table">
            <div className="table_table" ref={tableRef}></div>
            <div className="players_table">
                <div className="center_table">
                    <div className="deck_table">
                        <div className="card-slot_table">
                            <Card alt={'Deck'} value={'card_cover'}/>
                        </div>
                    </div>
                    <div className="dealer_cards_table">
                        <div className="card-slot_table">
                            <Card alt={'Deck'} value={tableCards[0]}/>
                        </div>
                        <div className="card-slot_table">
                            <Card alt={'Deck'} value={tableCards[1]}/>
                        </div>
                        <div className="card-slot_table">
                            <Card alt={'Deck'} value={tableCards[2]}/>
                        </div>
                        <div className="card-slot_table">
                            <Card alt={'Deck'} value={tableCards[3]}/>
                        </div>
                        <div className="card-slot_table">
                            <Card alt={'Deck'} value={tableCards[4]}/>
                        </div>
                    </div>
                </div>
                {() => {
                    if (tableButton !== 0) {
                        const BB_position = calculatePosition(tableButton, players.length, 'button');
                        const SB_position = calculatePosition(
                            (tableButton === 1 ? players.length : (tableButton-1)),
                            players.length,
                            'button'
                        );
                        return (
                            <div>
                                <div
                                    key={'BB'}
                                    className="bb_table"
                                    style={{
                                        top: `${BB_position.y}px`,
                                        left: `${BB_position.x}px`,
                                    }}
                                >BB</div>
                                <div
                                    key={'SB'}
                                    className="sb_table"
                                    style={{
                                        top: `${SB_position.y}px`,
                                        left: `${SB_position.x}px`,
                                    }}
                                >SB</div>
                            </div>
                        )
                    }
                }}
                {tablePlayers.map((player) => {
                    const position = calculatePosition((player.seating_position), players.length, 'player');
                    return (
                        <div
                            key={player.user_id}
                            className="player-slot_table"
                            ref={playerRef}
                            style={{
                                top: `${position.y}px`,
                                left: `${position.x}px`,
                            }}
                        >
                            <div className="card-slots_table">
                                <div className="card-slot_table">
                                    <Card alt={player.seating_position + 1} value={player.cards}/>
                                </div>
                                <div className="card-slot_table">
                                    <Card alt={player.seating_position + 2} value={player.cards}/>
                                </div>
                            </div>
                            <h1 className="nickname_table">{player.username}</h1>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Table;