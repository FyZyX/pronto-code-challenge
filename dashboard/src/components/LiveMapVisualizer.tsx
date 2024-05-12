import {Component, createEffect, onCleanup, onMount} from "solid-js";
import L, {Marker} from "leaflet";
import "leaflet-rotatedmarker";

import 'leaflet/dist/leaflet.css';
import styles from "./MapVisualizer.module.css";
import {Metric, LiveMetrics, LiveMetric} from "../model";
import markerIcon from "../assets/mining-car.svg"

interface MapVisualizerProps {
    liveMetrics: LiveMetrics;
}

const MapVisualizer: Component<MapVisualizerProps> = props => {
    let mapContainer: HTMLDivElement | undefined;
    let map: L.Map;
    const markers = new Map<string, L.Marker>();

    const icon = L.icon({
        iconUrl: markerIcon,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });

    const createLiveMarker = (metric: LiveMetric) => {
        return L.marker(
            [metric.latitude, metric.longitude],
            {
                icon: icon,
                rotationAngle: metric.heading,
            },
        );
    }

    const updateLiveMarker = (
        marker: Marker,
        metric: LiveMetric,
    ) => {
        const latLng = new L.LatLng(metric.latitude, metric.longitude);
        const heading = metric.heading;
        const measurement = metric.measurement.toFixed(1);

        marker.setLatLng(latLng);
        marker.setRotationAngle(heading);
        marker.bindPopup(`<b>${metric.name}</b><br>Measurement: ${measurement}`);
    }

    onMount(() => {
        if (mapContainer) {
            map = L.map(mapContainer).setView([38.30, -123.30], 7);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);
        }
    });

    createEffect(() => {
        if (!map) return;

        Object.entries(props.liveMetrics).forEach(([name, metric]) => {
            let marker = markers.get(metric.name);
            if (marker) {
                updateLiveMarker(marker, metric);
            } else {
                marker = createLiveMarker(metric);
                marker.addTo(map);
                markers.set(metric.name, marker);
            }
        });
    });

    onCleanup(() => {
        if (map) map.remove();
    });

    return (
        <div class={styles.map} ref={mapContainer}></div>
    );
};

export default MapVisualizer;
