import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import logo from "../assets/ponder-fox-verticle.png"

function Footer(){
    const { user } = useAuth();

    return(
        <>
            <footer className="grid place-content-center p-10">
                <div id="footWrap">
                    <div className="footCol flex flex-col items-start gap-3">
                        <Link to="/">
                            <img src={logo} alt="Ponderfox" className="h-20 w-auto" />
                        </Link>
                        <div className="copyright">&copy; 2025 Benjamin Fuller</div>
                    </div>
                    <div className="footCol flex flex-col">
                        <h2 className="text-2xl font-bold">Quick Links</h2>                    
                        <Link to="/">Home</Link>
                        <Link to="/about">About</Link>
                    </div>
                    <div className="footCol flex flex-col">
                        <h2 className="text-2xl font-bold">Profile Links</h2>
                        <Link to={user ? "/dashboard" : "/login"}>Dashboard</Link>
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