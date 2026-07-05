import axios from "axios";
import { config } from "../../config";

const axiosRequest = axios.create({
    baseURL: `${config.BACKEND_URL}/api/employee`,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    withCredentials: true,
});

axiosRequest.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("AppID");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Catch 401 errors globally
axiosRequest.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const errorMessage = error.response.data.message;
            if (errorMessage === "Token Unauthorized") {
                localStorage.removeItem("AppID");
                window.location.href = config.PRODUCTION_MODE === "production" ? "https://admin.divyam.com/login" : "http://localhost:5173/login";
            }
        }

        return Promise.reject(error);
    }
);

export default axiosRequest;