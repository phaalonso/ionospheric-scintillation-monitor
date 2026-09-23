import React, { useEffect } from "react";
import { Line } from "react-chartjs-2";
import { ChartData, ChartOptions } from "chart.js";

interface MetricChartProps {
    data: ChartData<"line">;
    options?: ChartOptions<"line">;
    width?: number;
}

const MetricChart: React.FC<MetricChartProps> = ({ data, options, width }) => {
    if (!width) width = 700;

    useEffect(() => console.log("b"), []);
    return (
        <div
            style={{
                width,
            }}
        >
            <Line
                //width={width}
                title="Uso de RAM"
                lang="pt-br"
                data={data}
                options={{
                    animation: false,
                    elements: {
                        line: {
                            tension: 0.2,
                        },
                        point: {
                            radius: 0,
                        },
                    },
                    ...options,
                }}
            />
        </div>
    );
};

export default MetricChart;
