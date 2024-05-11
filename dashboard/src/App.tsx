import {Component, createEffect, createSignal, onCleanup, onMount} from 'solid-js';
import {LiveMetrics, Metric, SummaryStats} from "./model";

import styles from './App.module.css';
import Dashboard from "./components/Dashboard";

const [liveMetrics, setLiveMetrics] = createSignal<LiveMetrics>({});

const apiHost = import.meta.env.VITE_API_HOST || 'localhost';
const apiPort = import.meta.env.VITE_API_PORT || 8080;

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
}

const App: Component = () => {
    const [metrics, setMetrics] = createSignal<Metric[]>([]);
    const [summaryStats, setSummaryStats] = createSignal<SummaryStats[]>([]);
    const [ws, setWs] = createSignal<WebSocket | null>(null);

    const top10EndpointURL = endpointURL('metrics/top10')
    const summaryStatsEndpointURL = endpointURL('summary-stats')

    onMount(() => {
        setWs(setupWebSocket());
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
        <div class={styles.App}>
            <header class={styles.header}>
                <h1>Key Metrics</h1>
            </header>
            <Dashboard metrics={metrics()} summaryStats={summaryStats()}/>
        </div>
    );
};

export default App;
