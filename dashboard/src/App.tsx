import {Component, createEffect, createSignal, onCleanup} from 'solid-js';
import MapVisualizer from "./components/MapVisualizer";
import StatsTable from "./components/StatsTable";
import Metric from "./model";

import styles from './App.module.css';

function endpointURL(path: string): string {
    const apiHost = import.meta.env.VITE_API_HOST || 'localhost';
    const apiPort = import.meta.env.VITE_API_PORT || 8080;
    return `http://${apiHost}:${apiPort}/${path}`;
}

const App: Component = () => {
    const [metrics, setMetrics] = createSignal<Metric[]>([]);

    const url = endpointURL('metrics/top10')

    const fetchMetrics = async () => {
        const response = await fetch(url);
        const data = await response.json();
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
