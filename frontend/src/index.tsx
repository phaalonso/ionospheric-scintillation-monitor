import React from "react";
import ReactDOM from "react-dom";
// oxlint-disable-next-line import/no-unassigned-import
import "./index.css";
import App from "./App";
import HooksProvider from "./hooks";

ReactDOM.render(
    <React.StrictMode>
        <HooksProvider>
            <App />
        </HooksProvider>
    </React.StrictMode>,
    document.getElementById("root"),
);
