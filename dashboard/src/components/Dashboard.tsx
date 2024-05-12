import {Component, createSignal} from 'solid-js';
import MapVisualizer from "./MapVisualizer";
import StatsTable from "./StatsTable";
import {LiveMetrics, Metric, SummaryStats} from "../model";

import styles from './Dashboard.module.css';
import EntityGrid from "./EntityGrid";
import LiveMapVisualizer from "./LiveMapVisualizer";

interface DashboardProps {
    summaryStats: SummaryStats[];
    metrics: Metric[];
    liveMetrics: LiveMetrics;
}

const Dashboard: Component<DashboardProps> = (props) => {
    const [liveData, setLiveData] = createSignal(false);

    return (
        <main class={styles.dashbaord}>
            <StatsTable metrics={props.metrics}/>
            <EntityGrid summaryStats={props.summaryStats}/>
            <button onClick={() => setLiveData(!liveData())}>Toggle Live Data</button>
            {liveData()
                ? <LiveMapVisualizer liveMetrics={props.liveMetrics}/>
                : <MapVisualizer metrics={props.metrics}/>
            }

        </main>
    );
};

export default Dashboard;
