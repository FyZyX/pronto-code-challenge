import {Component, createEffect, createSignal, onCleanup, onMount} from 'solid-js';
import MapVisualizer from "./MapVisualizer";
import LiveMapVisualizer from "./LiveMapVisualizer";
import StatsTable from "./StatsTable";
import EntityGrid from "./EntityGrid";
import {LiveMetrics, Metric, SummaryStats} from "../model";

import styles from './Dashboard.module.css';

const apiHost = import.meta.env.VITE_API_HOST || 'localhost';
const apiPort = import.meta.env.VITE_API_PORT || 8080;

const [liveMetrics, setLiveMetrics] = createSignal<LiveMetrics>({});

function websocketURL(): string {
    return `ws://${apiHost}:${apiPort}/ws`;
}

function endpointURL(path: string): string {
    return `http://${apiHost}:${apiPort}/${path}`;
}

function setupWebSocket() {
    const ws = new WebSocket(websocketURL());

    ws.onopen = () => console.log('WebSocket connected');
    ws.onclose = () => console.log('WebSocket disconnected');
    ws.onerror = error => console.error('WebSocket error:', error);
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setLiveMetrics(prev => ({...prev, [data.name]: data}));
    };

    onCleanup(() => {
        ws.close();
    });

    return ws;
}

function sendSubscription(ws: WebSocket, names: string[]) {
    ws.send(JSON.stringify({
        action: 'subscribe',
        names: names
    }));
}

function sendUnsubscription(ws: WebSocket, names: string[]) {
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

const Dashboard: Component = () => {
    const [metrics, setMetrics] = createSignal<Metric[]>([]);
    const [summaryStats, setSummaryStats] = createSignal<SummaryStats[]>([]);
    const [liveData, setLiveData] = createSignal(false);
    const [ws, setWs] = createSignal<WebSocket | null>(null);

    const top10EndpointURL = endpointURL('metrics/top10')
    const summaryStatsEndpointURL = endpointURL('summary-stats')

    onMount(() => {
        setWs(setupWebSocket());
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

        sendSubscription(socket, subscribes);
        sendUnsubscription(socket, unsubscribes);
    };

    const fetchSummaryStats = async (): Promise<SummaryStats[]> => {
        const response = await fetch(summaryStatsEndpointURL);
        return await response.json();
    };

    const fetchMetrics = async (): Promise<Metric[]> => {
        const response = await fetch(top10EndpointURL);
        return await response.json();
    };

    const updateKeyMetrics = async () => {
        const newSummaryStats = await fetchSummaryStats();
        const newMetrics = await fetchMetrics();

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
            <StatsTable metrics={metrics()}/>
            <EntityGrid summaryStats={summaryStats()}/>
            <button onClick={() => setLiveData(!liveData())}>Toggle Live Data</button>
            {liveData()
                ? <LiveMapVisualizer liveMetrics={liveMetrics()}/>
                : <MapVisualizer metrics={metrics()}/>
            }

        </main>
    );
};

export default Dashboard;
