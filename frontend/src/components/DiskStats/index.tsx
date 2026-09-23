import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import StatsCard from "../StatsCard";

interface Stats {
    totalGb: number;
    usedGb: number;
    freeGb: number;
    usedPercentage: number;
    freePercentage: number;
}

const DiskStats: React.FC = () => {
    const [diskStats, setDiskStats] = useState<Stats>();

    useEffect(() => {
        api.get("/stats/disk").then((res) => {
            if (res.status === 200) setDiskStats(res.data);
        });
    }, []);

    return (
        <StatsCard name="Disco">
            {diskStats ? (
                <div>
                    <span>Usado {diskStats?.usedGb}</span>
                    <span>Livre {diskStats?.freeGb}</span>
                    <span>Lotação {diskStats?.usedPercentage}</span>
                </div>
            ) : (
                <div>Carregando</div>
            )}
        </StatsCard>
    );
};

export default DiskStats;
