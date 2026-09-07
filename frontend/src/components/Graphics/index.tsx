import React, { useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { useAuth } from "../../hooks/auth";
import { api } from "../../services/api";
import MetricChart from "../MetricChart";
import { Metrics, SubscribeButton } from './styles';

interface GraphicData {
	time: Date,
		value: number,
}

interface IIndices {
	prn: number,
		mediasnr: number,
		mediaazi: number,
		mediaelev: number,
		tinicial: string,
		tfinal: string,
		dpsnr: number,
		s4: number,
}

interface IndicesPorPrn {
	prn: number;
	indices: Omit<IIndices, 'prn'>[];
}

const randomNum = () => Math.floor(Math.random() * (235 - 52 + 1) + 52);

const randomRGB = () => `rgb(${randomNum()}, ${randomNum()}, ${randomNum()})`;

const colors: string[] = [];

for (let i = 0; i < 40; i++) {
	colors.push(randomRGB());
}

const MAX_DATA_LENGTH = 100;

const Graphics: React.FC = () => {
	const { data } = useAuth();

	const [totalRam, setTotalRam] = useState<number>();
	const [ramData, setRamData] = useState<GraphicData[]>([]);
	const [cpuData, setCpuData] = useState<GraphicData[]>([]);
	const [indices, setIndices] = useState<IndicesPorPrn[]>([])

	const {
		sendMessage,
		readyState,
	} = useWebSocket('ws://localhost:3333/websocket', {
		onOpen: () => {
			console.log('Conexão aberta');
			sendMessage(`token_${data.token}`);
		},
		onError: (error) => console.error(error),
		onClose: () => {
			console.log('Conexão fechada');
		},
		onMessage: (event) => {
			const msg = event.data;

			const ramMatch = msg.match(/^ram_(.*)$/);

			if (ramMatch) {
				let array = ramData;

				const data: GraphicData = {
					time: new Date(),
					value: Number.parseFloat(ramMatch[1]),
				}

				if (ramData.length > MAX_DATA_LENGTH) {
					const diff = ramData.length - MAX_DATA_LENGTH;
					array = ramData.slice(diff, MAX_DATA_LENGTH);
				}

				setRamData([
					...array,
					data,
				])
			}

			const cpuMatch = msg.match(/^cpu_(.*)$/);

			if (cpuMatch) {
				let array = cpuData;

				const data: GraphicData = {
					time: new Date(),
					value: Number.parseFloat(cpuMatch[1]),
				}

				if (cpuData.length > MAX_DATA_LENGTH) {
					const diff = cpuData.length - MAX_DATA_LENGTH;

					array = cpuData.slice(diff, MAX_DATA_LENGTH);
				}

				setCpuData([
					...array,
					data,
				]);
			}
		}
	});

	useEffect(() => {
		api.get('/stats/ram').then(res => {
			console.log(res.data);
			setTotalRam(res.data.totalMemMb);
		});
	}, []);

	const onClickRam = () => {
		if (readyState === ReadyState.CONNECTING) {
			alert('Webscoket ainda está no estado CONNECTING');
			return;
		}

		sendMessage('sub_ram');
	}

	const onClickCpu = () => {
		if (readyState === ReadyState.CONNECTING) {
			alert('Webscoket ainda está no estado CONNECTING');
			return;
		}

		sendMessage('sub_cpu');
	}

	const onIndices = async () => {
		try {
			const res = await api.get('/scintilation');
			// console.log(res.data.data);

			setIndices(res.data.data);

			console.log(res.data.data);
		} catch (err) {
			console.error(err);
		}
	}

	return (
		<Metrics>
			{ramData.length > 0 ? (
				<div>
					<div>
						<span>Ram: </span>
						<span>{ramData[ramData.length - 1].value} Mb</span>
					</div>

					<MetricChart
						data={{
							labels: ramData.map(r => r.time.toLocaleTimeString('pt-br')),
								datasets: [{
									data: ramData.map(r => r.value),
									backgroundColor: 'rgb(75, 192, 192)',
									borderColor: 'rgb(75, 192, 192)',
									borderWidth: 1,
								}]
						}}

						options={{
							plugins: {
								legend: {
									display: false,
								}
							},
								scales: {
									y: {
										min: 0,
											max: totalRam
									}
								}
						}}
					/>
				</div>
			) : (
				<SubscribeButton onClick={onClickRam} type="submit">Obter dados de RAM</SubscribeButton>
			)}

			{cpuData.length > 0 ? (
				<div>
					<div>
						<span>Cpu: </span>
						<span>{cpuData[cpuData.length - 1].value} %</span>
					</div>

					<MetricChart
						data={{
							labels: cpuData.map(c => c.time.toLocaleTimeString('pt-br')),
								datasets: [{
									data: cpuData.map(c => c.value),
									backgroundColor: 'rgb(75, 192, 192)',
									borderColor: 'rgb(75, 192, 192)',
									borderWidth: 1,
								}]
						}}
						options={{
							animation: false,
								plugins: {
									legend: {
										display: false,
									}
								},
								scales: {
									y: {
										max: 100,
											min: 0
									}
								}
						}}
					/>
				</div>
		) : (
			<SubscribeButton onClick={onClickCpu} type="submit">Obter dados de CPU</SubscribeButton>
		)}

		{indices?.length > 0 ? (
			<div>
				<MetricChart 
					data={{
						labels: indices[1].indices.map(ind => new Date(ind.tinicial).toLocaleTimeString('pt-br')),
						datasets: indices.map((indice, index) => ({
							label: indice.prn.toString(),
							//@ts-ignore
							data: indice.indices.map(ind => ({
								x: Number.parseInt(ind.tinicial),
								y: ind.s4,
							})),
							backgroundColor: colors[index],
							borderColor: colors[index],
							borderWidth: 1,
						})),
					}}

					options={{
						interaction: {
							intersect: false
						},
							plugins: {
								legend: {
									//display: false
								},
							},
							scales: {
								x: { //time: { tooltipFormat: 'DD T',
									//}
								},
									y: {
										//max: 1.5,
										min: 0
									}
							}
					}}
			/>
			</div>
		) : (
			<SubscribeButton onClick={onIndices} type="submit">Obter dados dos indices</SubscribeButton>
		)}
		</Metrics>
	);
}

export default Graphics;
