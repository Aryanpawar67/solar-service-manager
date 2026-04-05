import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth";

// Wire JWT token into every API call
setAuthTokenGetter(() => getToken());

createRoot(document.getElementById("root")!).render(<App />);
