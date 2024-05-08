import {Component, createEffect, onCleanup, onMount} from "solid-js";
import L from "leaflet";
import "leaflet-rotatedmarker";

import 'leaflet/dist/leaflet.css';
import styles from "./Map.module.css";
import Metric from "../model";
import markerIcon from "../assets/mining-car.svg"

interface MapProps {
    metrics: Metric[];
}

const Map: Component<MapProps> = props => {
    let mapContainer: HTMLDivElement | undefined;
    let map: L.Map;

    const icon = L.icon({
        iconUrl: markerIcon,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
    });

    onMount(() => {
        if (mapContainer) {
            map = L.map(mapContainer).setView([51.505, -0.09], 2);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);
        }
    });

    createEffect(() => {
        if (map) {
            // Clear existing markers
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    map.removeLayer(layer);
                }
            });

            // Add new markers
            const bounds = L.latLngBounds([]);
            props.metrics.forEach((metric: Metric) => {
                const marker = L.marker(
                    [metric.last_latitude, metric.last_longitude],
                    {
                        icon: icon,
                        rotationAngle: metric.last_heading,
                    },
                ).addTo(map);

                marker.bindPopup(
                    `<b>${metric.name}</b><br>Measurement: ${metric.mean_measurement.toFixed(1)}`
                );

                bounds.extend(marker.getLatLng());

                if (bounds.isValid()) {
                    map.fitBounds(bounds, {padding: [50, 50]});  // Adjust padding as needed
                }
            });
        }
    });


    onCleanup(() => {
        if (map) map.remove();
    });

    return (
        <div class={styles.map} ref={mapContainer}></div>
    );
};

export default Map;
