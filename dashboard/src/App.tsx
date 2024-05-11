import {Component, createEffect, createSignal, onCleanup, onMount} from 'solid-js';
import MapVisualizer from "./components/MapVisualizer";
import StatsTable from "./components/StatsTable";
import {Metric, LiveMetrics} from "./model";

import styles from './App.module.css';

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
    const [ws, setWs] = createSignal<WebSocket | null>(null);

    onMount(() => {
        setWs(setupWebSocket());
    });

    const top10EndpointURL = endpointURL('metrics/top10')

    const fetchMetrics = async () => {
        const response = await fetch(top10EndpointURL);
        const data = await response.json();

        const socket = ws();
        if (socket) {
            const currentNames = metrics().map(metric => metric.name);
            const newNames = data.map((metric: Metric) => metric.name);

            const namesToSubscribe = newNames.filter((name: string) => !currentNames.includes(name));
            const namesToUnsubscribe = currentNames.filter(name => !newNames.includes(name));

            sendSubscription(socket, namesToSubscribe);
            sendUnsubscription(socket, namesToUnsubscribe);
        }

        setMetrics(data);
    };

    createEffect(() => {
        fetchMetrics()
            .catch(error => console.error("Error fetching metrics:", error));

        const interval = setInterval(fetchMetrics, 5000);

        onCleanup(() => clearInterval(interval));
    });

    return (
        <div class={styles.App}>
            <header class={styles.header}>
                <h1>Key Metrics</h1>
            </header>
            <main>
                <StatsTable metrics={metrics()}/>
                <MapVisualizer metrics={metrics()}/>
            </main>
        </div>
    );
};

export default App;
