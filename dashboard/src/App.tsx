import {Component, createEffect, createSignal} from 'solid-js';
import MapVisualizer from "./components/MapVisualizer";

import styles from './App.module.css';
import Metric from "./model";


const App: Component = () => {
    const [metrics, setMetrics] = createSignal<Metric[]>([]);

    const apiHost = import.meta.env.VITE_API_HOST || 'localhost';
    const apiPort = import.meta.env.VITE_API_PORT || 8080;
    const url = `http://${apiHost}:${apiPort}/metrics/top10`;
    const fetchMetrics = async () => {
        const response = await fetch(url);
        const data = await response.json();
        setMetrics(data);
    };

    createEffect(() => {
        fetchMetrics()
            .catch(error => console.error("Error fetching metrics:", error));
    });

    return (
        <div class={styles.App}>
            <header class={styles.header}>
                <h1>Key Metrics</h1>
            </header>
            <main>
                <table>
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Average Measurement</th>
                        <th>Min Measurement</th>
                        <th>Max Measurement</th>
                        <th>Latest Latitude</th>
                        <th>Latest Longitude</th>
                        <th>Latest Heading</th>
                        <th>Count</th>
                    </tr>
                    </thead>
                    <tbody>
                    {metrics().map((metric) => (
                        <tr>
                            <td>{metric.name}</td>
                            <td>{metric.mean_measurement.toFixed(1)}</td>
                            <td>{metric.min_measurement.toFixed(1)}</td>
                            <td>{metric.max_measurement.toFixed(1)}</td>
                            <td>{metric.last_latitude.toFixed(2)}</td>
                            <td>{metric.last_longitude.toFixed(2)}</td>
                            <td>{metric.last_heading.toFixed(2)}</td>
                            <td>{metric.count}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <MapVisualizer metrics={metrics()}/>
            </main>
        </div>
    );
};

export default App;
