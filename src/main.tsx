import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/latin-ext-700.css";
import "@fontsource/inter/latin-ext-900.css";
import "@fontsource/source-sans-3/latin-ext-400.css";
import "@fontsource/source-sans-3/latin-ext-700.css";
import "@fontsource/merriweather/latin-ext-400.css";
import "@fontsource/merriweather/latin-ext-700.css";
import App from "./app/App";
import "./app/global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
