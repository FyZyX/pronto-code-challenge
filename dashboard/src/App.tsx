import {Component} from 'solid-js';

import Dashboard from "./components/Dashboard";
import styles from './App.module.css';

const App: Component = () => {
    return (
        <div class={styles.App}>
            <header class={styles.header}>
                <h1>Key Metrics</h1>
            </header>
            <Dashboard/>
        </div>
    );
};

export default App;
