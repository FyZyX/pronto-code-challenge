import {Component, createEffect, createSignal, onCleanup, onMount} from 'solid-js';
import MapVisualizer from "./MapVisualizer";
import LiveMapVisualizer from "./LiveMapVisualizer";
import StatsTable from "./StatsTable";
import EntityGrid from "./EntityGrid";
import {LiveMetric, LiveMetrics, Metric, SummaryStats} from "../model";

import styles from './Dashboard.module.css';


const [liveMetrics, setLiveMetrics] = createSignal<LiveMetrics>({});


class DataService {
    apiHost = import.meta.env.VITE_API_HOST || 'localhost';
    apiPort = import.meta.env.VITE_API_PORT || 8080;

    top10EndpointURL = this.endpointURL('metrics/top10')
    summaryStatsEndpointURL = this.endpointURL('summary-stats')

    websocketURL(): string {
        return `ws://${this.apiHost}:${this.apiPort}/ws`;
    }

    endpointURL(path: string): string {
        return `http://${this.apiHost}:${this.apiPort}/${path}`;
    }

    newSocket(handleMessage: (liveMetric: LiveMetric) => void) {
        const ws = new WebSocket(this.websocketURL());

        ws.onopen = () => console.log('WebSocket connected');
        ws.onclose = () => console.log('WebSocket disconnected');
        ws.onerror = error => console.error('WebSocket error:', error);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };

        onCleanup(() => {
            ws.close();
        });

        return ws;
    }

    sendSubscription(ws: WebSocket, names: string[]) {
        ws.send(JSON.stringify({
            action: 'subscribe',
            names: names
        }));
    }

    sendUnsubscription(ws: WebSocket, names: string[]) {
        ws.send(JSON.stringify({
            action: 'unsubscribe',
            names: names
        }));

        setLiveMetrics(prevMetrics => {
            const newMetrics = {...prevMetrics};
            names.forEach(name => {
                delete newMetrics[name];
            });
            return newMetrics;
        });
    }

    fetchSummaryStats = async (): Promise<SummaryStats[]> => {
        const response = await fetch(this.summaryStatsEndpointURL);
        return await response.json();
    };

    fetchMetrics = async (): Promise<Metric[]> => {
        const response = await fetch(this.top10EndpointURL);
        return await response.json();
    };
}


const Dashboard: Component = () => {
    const [metrics, setMetrics] = createSignal<Metric[]>([]);
    const [summaryStats, setSummaryStats] = createSignal<SummaryStats[]>([]);
    const [liveData, setLiveData] = createSignal(false);
    const [ws, setWs] = createSignal<WebSocket | null>(null);

    const dataService = new DataService();

    onMount(() => {
        const handleMessage = (liveMetric: LiveMetric) => {
            setLiveMetrics(prev => ({...prev, [liveMetric.name]: liveMetric}));
        };
        const socket = dataService.newSocket(handleMessage);
        setWs(socket);
    });

    onCleanup(() => {
        const socket = ws();
        if (socket) {
            socket.close();
        }
    });

    const updateSubscriptions = (currentNames: string[], newNames: string[]) => {
        const socket = ws();
        if (!socket) return;

        const subscribes = newNames.filter(name => !currentNames.includes(name));
        const unsubscribes = currentNames.filter(name => !newNames.includes(name));

        dataService.sendSubscription(socket, subscribes);
        dataService.sendUnsubscription(socket, unsubscribes);
    };

    const updateKeyMetrics = async () => {
        const newSummaryStats = await dataService.fetchSummaryStats();
        const newMetrics = await dataService.fetchMetrics();

        const currentNames = metrics().map(metric => metric.name);
        const newNames = newMetrics.map(metric => metric.name);
        updateSubscriptions(currentNames, newNames)

        setSummaryStats(newSummaryStats);
        setMetrics(newMetrics);
    };

    createEffect(() => {
        updateKeyMetrics()
            .catch(error => console.error("Error updating key metrics:", error));

        const interval = setInterval(() => {
            updateKeyMetrics()
                .catch(error => console.error("Error updating key metrics:", error));
        }, 5000);

        onCleanup(() => clearInterval(interval));
    });

    return (
        <main class={styles.dashbaord}>
            {liveData()
                ? <EntityGrid summaryStats={summaryStats()}/>
                : <StatsTable metrics={metrics()}/>
            }
            <button onClick={() => setLiveData(!liveData())}>Toggle Live Data</button>
            {liveData()
                ? <LiveMapVisualizer liveMetrics={liveMetrics()}/>
                : <MapVisualizer metrics={metrics()}/>
            }

        </main>
    );
};

export default Dashboard;
