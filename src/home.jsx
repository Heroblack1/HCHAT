import { useState } from 'react'
import { Link } from 'react-router-dom';


const Home = () => {
    const slides = [
        {msg1: 'Welcome to HB chat', msg2:"Let's help get you started"},
        {msg1: 'Message', msg2:"Chat with friends and family"},
        {msg1: 'Call', msg2:"Reach out to loved ones via voice or video call"}
    ]

    const [index, setIndex] = useState(0);


    const skip = () =>{
        setIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }

    return (
        <>
        <div className="bod">
            <h1 className="header">{slides[index].msg1}</h1>
            <p className="orangeLet">{slides[index].msg2}</p>

            <div className="con">
                <div className="dot-con">
                    <span className="dot" style = {{backgroundColor: index===0? "orange": "white"}}></span>
                    <span className="dot" style = {{backgroundColor: index===1? "orange": "white"}}></span>
                    <span className="dot" style = {{backgroundColor: index===2? "orange": "white"}}></span>
                </div>
            
                <button className="whiteLet" onClick={skip}>Skip</button>
                {
                index===2? <Link className="whiteLet" to='/getStarted'>Get started</Link>:null
                }
            </div>
        </div>

      
        </>
    )
}

export default Home;