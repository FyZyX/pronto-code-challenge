type Metric = {
    name: string;
    mean_measurement: number;
    min_measurement: number;
    max_measurement: number;
    last_latitude: number;
    last_longitude: number;
    last_heading: number;
    count: number;
};

export default Metric;
