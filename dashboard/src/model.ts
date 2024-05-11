export type SummaryStats = {
    name: string;
    mean_measurement: number;
    min_measurement: number;
    max_measurement: number;
    count: number;
};

export type Metric = {
    name: string;
    mean_measurement: number;
    min_measurement: number;
    max_measurement: number;
    last_latitude: number;
    last_longitude: number;
    last_heading: number;
    count: number;
};

export type LiveMetric = {
    name: string;
    latitude: number;
    longitude: number;
    heading: number;
    measurement: number;
    verification_id: string;
};

export interface LiveMetrics {
    [key: string]: LiveMetric;
}
