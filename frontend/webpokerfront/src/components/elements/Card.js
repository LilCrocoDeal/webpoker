import card_cover from '../../assets/Playing Cards/card_cover.png'

const Card = ({alt, value}) => {

    if (value === null) {
        return (
            <div>

            </div>
        );
    }
    else if (value === 'card_cover') {
        return (
            <img src={card_cover} alt={alt}/>
        )
    } else {
        const card_name = value[0] + "_" + value[1]
        return (
            <img src={require(`../../assets/Playing Cards/${card_name}.png`)} alt={alt}/>
        )
    }

};

export default Card;