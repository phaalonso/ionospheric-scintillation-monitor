import React from "react";
import { Card, Categoria } from "./styled";

interface IStatsCard {
    name: string;
}

const StatsCard: React.FC<IStatsCard> = ({ name, children }) => {
    return (
        <Card>
            {name && <Categoria>{name}</Categoria>}
            {children}
        </Card>
    );
};

export default StatsCard;
