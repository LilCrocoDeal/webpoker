const Card = ({alt, value}) => {

    if (value === null) {
        return (
            <div>

            </div>
        );
    }
    else {
        return (
            <img src={require(`../../assets/Playing Cards/${value}.png`)} alt={alt}/>
        )
    }

};

export default Card;