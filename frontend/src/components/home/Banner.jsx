import { useNavigate } from 'react-router-dom';

function Banner() {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/');
        window.location.reload(); // Force le rechargement
    };

    return (
        <div id="Home-banner-display">
            <img 
                src="/ISSue_banner.png" 
                alt="ISSue - Track the ISS, test your geography" 
                className="logo-banner"
                onClick={handleClick}
                style={{ cursor: 'pointer' }}
            />
            <p className="text-center">ISSue provides quizes blablabla description</p>
        </div>
    )
}

export default Banner;