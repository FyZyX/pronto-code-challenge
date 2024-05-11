import {Component} from "solid-js";
import {SummaryStats} from "../model";

import styles from "./EntityGrid.module.css";

interface EntityGridProps {
    summaryStats: SummaryStats[];
}

const EntityGrid: Component<EntityGridProps> = (props) => {
    return (
        <ol class={styles.entityGrid}>
            {props.summaryStats.map(stats => (
                <li><b>{stats.name}</b> – {stats.mean_measurement.toFixed(1)}</li>
            ))}
        </ol>
    );
};

export default EntityGrid;
