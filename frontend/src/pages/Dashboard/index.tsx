import React from "react";
import { useLocation } from "react-router";
import DiskStats from "../../components/DiskStats";
import Graphics from "../../components/Graphics";
import Navbar from "../../components/Navbar";
import { Container } from "./styled";

const Dashboard: React.FC = () => {
    const location = useLocation();

    return (
        <div>
            <Navbar pathName={location.pathname} />
            <Container>
                <DiskStats />
                <Graphics />
            </Container>
        </div>
    );
};

export default Dashboard;
