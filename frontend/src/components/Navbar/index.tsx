import React from "react";
import { FiHome, FiLogOut, FiUsers } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/auth";
import { Nav, UserContainer } from "./styles";

const UserNav: React.FC = () => {
    const auth = useAuth();

    const logout = () => {
        auth.singOut();
    };

    return (
        <UserContainer>
            {auth.authState.user.nome}
            <button onClick={logout}>
                <FiLogOut style={{ strokeWidth: 4 }} /> Sair
            </button>
        </UserContainer>
    );
};

interface INavBar {
    pathName?: string;
}

const Navbar: React.FC<INavBar> = ({ pathName }) => {
    const path = pathName?.split("/").pop();

    console.log("Path", path);

    return (
        <Nav>
            <Link to="/" className={path === "" ? "title active" : "title"}>
                <FiHome />
                <span>Dashboard</span>
            </Link>
            <Link to="user" className={path === "user" ? "active" : ""}>
                <FiUsers />
                <span>Usuarios</span>
            </Link>
            <UserNav />
        </Nav>
    );
};

export default Navbar;
