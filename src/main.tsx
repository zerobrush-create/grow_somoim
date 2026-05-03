import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Surface unhandled errors to the console on mobile where DevTools aren't open
window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
