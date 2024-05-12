import {Component, For} from "solid-js";
import {SummaryStats} from "../model";

import styles from "./EntityGrid.module.css";

interface EntityGridProps {
    summaryStats: SummaryStats[];
}

const EntityGrid: Component<EntityGridProps> = (props) => {
    return (
        <div class={styles.entityGrid}>
            <For each={props.summaryStats}>
                {(stats) => (
                    <div class={styles.summaryStats}>
                        <h3>{stats.name}</h3>
                        <p>Mean: {stats.mean_measurement.toFixed(1)}</p>
                        <p>Max: {stats.max_measurement.toFixed(1)}</p>
                        <p>Min: {stats.min_measurement.toFixed(1)}</p>
                        <p>Count: {stats.count}</p>
                    </div>
                )}
            </For>
        </div>
    );
};

export default EntityGrid;
