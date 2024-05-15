import {Component, createEffect, createResource, createSignal, onCleanup, onMount, Show} from 'solid-js';
import MapVisualizer from "./MapVisualizer";
import LiveMapVisualizer from "./LiveMapVisualizer";
import StatsTable from "./StatsTable";
import EntityGrid from "./EntityGrid";
import {LiveMetric, LiveMetrics, Metric, SummaryStats} from "../model";

import styles from './Dashboard.module.css';

class DataService {
    apiHost = import.meta.env.VITE_API_HOST || 'localhost';
    apiPort = import.meta.env.VITE_API_PORT || 8080;

    endpoints = {
        top10Metrics: this.endpointURL('metrics'),
        summaryStats: this.endpointURL('summary-stats'),
    };

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
    }

    fetchSummaryStats = async (): Promise<SummaryStats[]> => {
        const response = await fetch(this.endpoints.summaryStats);
        return await response.json();
    };

    fetchMetrics = async (): Promise<Metric[]> => {
        const response = await fetch(this.endpoints.top10Metrics);
        return await response.json();
    };
}


const Dashboard: Component = () => {
    const dataService = new DataService();

    const [trigger, setTrigger] = createSignal(0);
    const [metrics, setMetrics] = createResource(trigger, dataService.fetchMetrics);
    const [summaryStats, setSummaryStats] = createResource(trigger, dataService.fetchSummaryStats);
    const [liveMetrics, setLiveMetrics] = createSignal<LiveMetrics>({});
    const [liveData, setLiveData] = createSignal(false);
    const [ws, setWs] = createSignal<WebSocket | null>(null);

    const toggleLiveData = () => {
        setLiveData(!liveData())
    };

    const updateLiveMetrics = (liveMetric: LiveMetric) => {
        setLiveMetrics(prev => ({...prev, [liveMetric.name]: liveMetric}));
    };

    onMount(() => {
        const socket = dataService.newSocket(updateLiveMetrics);
        setWs(socket);
    });

    onCleanup(() => {
        const socket = ws();
        if (socket) {
            socket.close();
        }
    });

    const updateSubscriptions = (names: string[]) => {
        const socket = ws();
        if (!socket) return;

        dataService.sendSubscription(socket, names);

        setLiveMetrics(prevMetrics => {
            const newMetrics = {...prevMetrics};
            names.forEach(name => {
                if (!newMetrics.hasOwnProperty(name)) {
                    delete newMetrics[name];
                }
            });
            return newMetrics;
        });
    };

    createEffect(() => {
        const interval = setInterval(() => {
            setTrigger(count => count + 1);
        }, 5000);

        onCleanup(() => clearInterval(interval));
    });

    createEffect(() => {
        const names = metrics()?.map(metric => metric.name);
        if (names) {
            updateSubscriptions(names);
        }
    });

    return (
        <main class={styles.dashboard}>
            <div class={styles.summaryView}>
                <div class={styles.viewControls}>
                    <button onClick={toggleLiveData}>Toggle Live Data</button>
                </div>

                <Show when={liveData()} fallback={<StatsTable metrics={metrics() || []}/>}>
                    <EntityGrid summaryStats={summaryStats() || []}/>
                </Show>
            </div>
            <Show when={liveData()} fallback={<MapVisualizer metrics={metrics() || []}/>}>
                <LiveMapVisualizer liveMetrics={liveMetrics()}/>
            </Show>
        </main>
    );
};

export default Dashboard;
