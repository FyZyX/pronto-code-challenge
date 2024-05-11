import {Component} from 'solid-js';
import MapVisualizer from "./MapVisualizer";
import StatsTable from "./StatsTable";
import {LiveMetrics, Metric, SummaryStats} from "../model";

import styles from './Dashboard.module.css';
import EntityGrid from "./EntityGrid";

interface DashboardProps {
    summaryStats: SummaryStats[];
    metrics: Metric[];
    liveMetrics: LiveMetrics;
}

const Dashboard: Component<DashboardProps> = (props) => {
    return (
        <main class={styles.dashbaord}>
            <StatsTable metrics={props.metrics}/>
            <EntityGrid summaryStats={props.summaryStats}/>
            <MapVisualizer metrics={props.metrics}/>
        </main>
    );
};

export default Dashboard;
