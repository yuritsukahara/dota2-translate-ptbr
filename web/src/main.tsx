import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import "react-loading-skeleton/dist/skeleton.css";
import { App } from "./App";
import { RouterProvider } from "./router";
import "@/app/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider>
      <App />
    </RouterProvider>
  </React.StrictMode>,
);
