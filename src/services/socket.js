import { io } from "socket.io-client";
import { config } from "../../config";
import EmployeeV2Service from './employee-v2.service';

let socket = null;
let generation = 0;
let blocked = false;
let recovering = false;
let attemptedRefresh = false;

async function recoverAuthentication() {
    if (blocked || recovering) return;
    if (attemptedRefresh) {
        blocked = true;
        socket.disconnect();
        window.dispatchEvent(new Event('auth:unauthorized'));
        return;
    }
    attemptedRefresh = true;
    recovering = true;
    const current = generation;
    socket.disconnect();
    try {
        await EmployeeV2Service.refresh();
        if (current === generation) {
            recovering = false;
            socket.connect();
        }
    } catch {
        if (current === generation) {
            blocked = true;
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
    } finally {
        if (current === generation) recovering = false;
    }
}

export const getSocket = ({ connect = true } = {}) => {
    if (!socket) {
        socket = io(config.BACKEND_URL, { withCredentials: true, autoConnect: false });
        socket.on('connect', () => { attemptedRefresh = false; });
        socket.on('disconnect', reason => {
            if (reason === 'io server disconnect') void recoverAuthentication();
        });
        socket.on('connect_error', error => {
            const code = Number(error?.data?.status || error?.data?.statusCode);
            if ([401, 403].includes(code) || /unauthorized|authentication|jwt|expired|revoked|inactive/i.test(error?.message || '')) void recoverAuthentication();
        });
    }
    if (connect && !socket.connected && !blocked && !recovering) socket.connect();
    return socket;
};

export const startSocketSession = () => {
    blocked = false;
    attemptedRefresh = false;
    getSocket();
};
export const disconnectSocket = () => {
    generation += 1;
    blocked = true;
    recovering = false;
    socket?.disconnect();
};
