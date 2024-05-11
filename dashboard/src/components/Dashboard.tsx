import {Component} from 'solid-js';
import MapVisualizer from "./MapVisualizer";
import StatsTable from "./StatsTable";
import {LiveMetrics, Metric} from "../model";

import styles from './Dashboard.module.css';

interface DashboardProps {
    metrics: Metric[];
    // liveMetrics: LiveMetrics;
}

const Dashboard: Component<DashboardProps> = (props) => {
    return (
        <main class={styles.dashbaord}>
            <StatsTable metrics={props.metrics}/>
            <MapVisualizer metrics={props.metrics}/>
        </main>
    );
};

export default Dashboard;
