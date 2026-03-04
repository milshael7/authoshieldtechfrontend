// frontend/src/core/AutoDevEngine.jsx
// ==========================================================
// AUTODEV ENGINE
// Platform self-diagnosis + monitoring
// ==========================================================

import { useEffect } from "react";
import { useEventBus } from "./EventBus.jsx";

export default function AutoDevEngine() {

  const bus = useEventBus();

  useEffect(() => {

    function handleError(event) {

      bus.emit("autodev_error", {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        ts: Date.now()
      });

    }

    function handlePromise(event) {

      bus.emit("autodev_promise_failure", {
        reason: String(event.reason || "unknown"),
        ts: Date.now()
      });

    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handlePromise);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handlePromise);
    };

  }, [bus]);

  useEffect(() => {

    const interval = setInterval(() => {

      if (!navigator.onLine) {

        bus.emit("autodev_network_offline", {
          ts: Date.now()
        });

      }

    }, 10000);

    return () => clearInterval(interval);

  }, [bus]);

  return null;

}
