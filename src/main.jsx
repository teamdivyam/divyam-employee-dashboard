import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import DashBoardRoutes from "./Routes/index.jsx";
import { Provider } from "react-redux";
import store from "./store/store.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { config } from "../config.js";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

window.__TANSTACK_QUERY_CLIENT__ = queryClient;

createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <GoogleReCaptchaProvider
        reCaptchaKey={config.SITE_KEY_RECAPTCHA}
      >
        <DashBoardRoutes />
      </GoogleReCaptchaProvider>
      <Toaster richColors={true} position="top-center" />
    </Provider>
  </QueryClientProvider>
);