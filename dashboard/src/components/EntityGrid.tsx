import {Component, For} from "solid-js";
import {SummaryStats} from "../model";

import styles from "./EntityGrid.module.css";

interface EntityCardProps {
    stats: SummaryStats;
}

const EntityCard: Component<EntityCardProps> = (props) => {
    return (
        <div class={styles.summaryStats}>
            <h3>{props.stats.name}</h3>
            <div>
                <p>Mean: {props.stats.mean_measurement.toFixed(1)}</p>
                <p>Max: {props.stats.max_measurement.toFixed(1)}</p>
                <p>Min: {props.stats.min_measurement.toFixed(1)}</p>
                <p>Count: {props.stats.count}</p>
            </div>
        </div>
    );
};

interface EntityGridProps {
    summaryStats: SummaryStats[];
}

const EntityGrid: Component<EntityGridProps> = (props) => {
    return (
        <div class={styles.entityGrid}>
            <For each={props.summaryStats}>
                {(stats) => <EntityCard stats={stats}/>}
            </For>
        </div>
    );
};

export default EntityGrid;
