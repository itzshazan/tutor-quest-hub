import { createRoot } from "react-dom/client";
import "./lib/sentry"; // Initialize Sentry before anything else
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
