import {Component} from "solid-js";
import Metric from "../model";

import styles from "./StatsTable.module.css";

interface StatsTableProps {
    metrics: Metric[];
}

const StatsTable: Component<StatsTableProps> = (props) => {
    return (
        <table class={styles.statsTable}>
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
            {props.metrics.map(metric => (
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
    );
};

export default StatsTable;
