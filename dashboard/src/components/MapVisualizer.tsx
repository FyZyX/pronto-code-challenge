import {Component, createEffect, onCleanup, onMount} from "solid-js";
import L, {Marker} from "leaflet";
import "leaflet-rotatedmarker";

import 'leaflet/dist/leaflet.css';
import styles from "./MapVisualizer.module.css";
import {Metric} from "../model";
import markerIcon from "../assets/mining-car.svg"

interface MapVisualizerProps {
    metrics: Metric[];
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

    const createMarker = (metric: Metric) => {
        return L.marker(
            [metric.last_latitude, metric.last_longitude],
            {
                icon: icon,
                rotationAngle: metric.last_heading,
            },
        );
    }

    const updateMarker = (
        marker: Marker,
        metric: Metric,
        duration: number,
    ) => {
        const startTime = performance.now();

        const startLatLng = marker.getLatLng();
        const startHeading = marker.options.rotationAngle || metric.last_heading;
        const targetLatLng = new L.LatLng(metric.last_latitude, metric.last_longitude);
        const targetHeading = metric.last_heading;
        const measurement = metric.mean_measurement.toFixed(1);

        const animate = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
            const progress = elapsedTime / duration;
            const lat = startLatLng.lat + (targetLatLng.lat - startLatLng.lat) * progress;
            const lng = startLatLng.lng + (targetLatLng.lng - startLatLng.lng) * progress;
            const heading = startHeading + (targetHeading - startHeading) * progress;

            marker.setLatLng([lat, lng]);
            marker.setRotationAngle(heading);
            marker.bindPopup(`<b>${metric.name}</b><br>Measurement: ${measurement}`);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                marker.setLatLng(targetLatLng);
                marker.setRotationAngle(targetHeading);
            }
        };
        requestAnimationFrame(animate);
    }

    const centerMap = (metrics: Metric[]) => {
        const bounds = L.latLngBounds([]);
        props.metrics.forEach((metric: Metric) => {
            const latLng = new L.LatLng(metric.last_latitude, metric.last_longitude);
            bounds.extend(latLng);
        })

        if (bounds.isValid()) {
            map.fitBounds(bounds, {padding: [50, 50]});  // Adjust padding as needed
        }
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

        const newMetrics = new Set();

        // Add new markers
        props.metrics.forEach((metric: Metric) => {
            newMetrics.add(metric.name);

            let marker = markers.get(metric.name);
            if (marker) {
                updateMarker(marker, metric, 1000);
            } else {
                marker = createMarker(metric);
                marker.addTo(map);
                markers.set(metric.name, marker);
            }
        });

        // Remove markers that are no longer in the new data
        markers.forEach((marker, name) => {
            if (!newMetrics.has(name)) {
                map.removeLayer(marker);
                markers.delete(name);
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
