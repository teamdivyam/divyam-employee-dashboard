import { io } from "socket.io-client";
import { config } from "../../config";

let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(config.BACKEND_URL, { withCredentials: true, autoConnect: false });
    }
    if (!socket.connected) socket.connect();
    return socket;
};
