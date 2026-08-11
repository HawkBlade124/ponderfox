import { Link } from "react-router-dom"

function Footer(){
    return(
        <>
            <footer className="grid place-content-center p-10">
                <div id="footWrap">
                    <div className="footCol">
                        <Link to="/">Ponderfox</Link>
                        <div className="copyright">&copy; 2025 Benjamin Fuller</div>
                    </div>
                    <div className="footCol flex flex-col">
                        <h2 className="text-2xl font-bold">Quick Links</h2>                    
                        <Link to="/">Home</Link>
                        <Link to="/about">About</Link>
                    </div>
                    <div className="footCol flex flex-col">
                        <h2 className="text-2xl font-bold">Profile Links</h2>
                        <Link to="/dashboard">Dashboard</Link>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                        <Link to="/settings">Account</Link>
                    </div>
                </div>
            </footer>
        </>
    )
}

export default Footer