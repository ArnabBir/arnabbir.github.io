import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import AppErrorBoundary from './components/AppErrorBoundary';
import { installPreloadRecovery } from './lib/preload-recovery';

installPreloadRecovery();

ReactDOM.createRoot(document.getElementById("root")).render(
    <AppErrorBoundary><App /></AppErrorBoundary>
);
