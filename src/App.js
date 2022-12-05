import 'rsuite/dist/rsuite.min.css'
import Home from './component/home';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../src/assets/css/live-resume.css';
import '../src/assets/vendors/@fortawesome/fontawesome-free/css/all.min.css';
import logo from '../src/assets/image/logo.png'
import humburger from '../src/assets/image/hamburger.svg'
import { Avatar } from 'rsuite';
import { useAuth0,withAuthenticationRequired } from "@auth0/auth0-react";
import React from 'react';
import { useEffect } from 'react';

function App() {
    //check if user is logged in
    //create await constant to get is authenticated
    const { user,isLoading,loginWithRedirect } = useAuth0();
   
    useEffect(() => {
        if(!isLoading){
            if(!user){
                loginWithRedirect();
            }
        }
    },[isLoading])

    return (
        <>
            <header>
                <a className="btn btn-white btn-share ml-auto mr-3 ml-md-0 mr-md-auto" href='https://www.youtube.com/@lalitdetroja1979'>
                    <i className="fab fa-youtube"></i> &nbsp;
                    Subscribe us!</a>
                <button
                onClick={() => loginWithRedirect()}
                title="Logout"
                 className="btn btn-menu-toggle btn-white rounded-circle" data-toggle="collapsible-nav" data-target="collapsible-nav"><img src={user &&user.picture ? user.picture :humburger } alt="hamburger" /></button>
            </header>
            <div className="content-wrapper">
                <aside>
                    <div className="profile-img-wrapper">
                        <img src={logo} alt="profile" style={{ height: "100px", width: "100px" }} />
                    </div>
                    <h1 className="profile-name">The Ocean Of Money</h1>
                    <div className="text-center">
                        <span className="badge badge-white badge-pill profile-designation">Stock Market Analysis</span>
                    </div>
                    {/* <div className="widget">
                    <a className="btn btn-danger rounded-pill" href="https://www.youtube.com/@lalitdetroja1979"> 
                    <i className="fab fa-youtube"></i> &nbsp; Subscribe Now </a>
            </div> */}
                </aside>
                <main>
                    <section className="intro-section">
                        <h2 className="section-title">The Ocean of money stock analysis </h2>
                        <h5>Welcome {user &&user.name ? user.name : ""}</h5>
                        <p>To get stock wise analysis you have to select future date range and get set your profit range and wait for result and in result you can check all history year pattern and you can buy your equity respectively.</p>
                    </section>
                    <Home />
                    <footer>
                        The Oceam of money @ <a href="https://www.youtube.com/@lalitdetroja1979" target="_blank" rel="noopener noreferrer">Lalit Detroja</a>. All Rights Reserved 2022
                        <p><b>Disclaimer</b> - The investments discussed or recommended in the market analysis, research reports, etc. may not be suitable for all investors. Investors must make their own investment decisions based on their specific investment objectives and financial position and only after consulting such independent advisors as may be necessary.</p>
                    </footer>
                </main>
            </div>

        </>
    );
}

export default App
