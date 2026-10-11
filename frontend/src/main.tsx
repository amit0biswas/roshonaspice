import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { logEvent, type Analytics } from "@firebase/analytics";
import App from "./App";
import { initializeFirebaseAnalytics } from "./firebase";
import { StoreProvider } from "./store";
import "./styles.css";

function AnalyticsRouteTracker() {
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    let active = true;
    void initializeFirebaseAnalytics().then((instance) => {
      if (active) setAnalytics(instance);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!analytics || previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    logEvent(analytics, "page_view", {
      page_path: location.pathname,
      page_location: `${window.location.origin}${location.pathname}`,
      page_title: document.title
    });
  }, [analytics, location.pathname]);

  return null;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AnalyticsRouteTracker />
      <StoreProvider><App /></StoreProvider>
    </BrowserRouter>
  </React.StrictMode>
);
