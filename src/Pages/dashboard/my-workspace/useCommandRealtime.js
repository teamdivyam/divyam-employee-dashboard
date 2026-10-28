import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/services/socket';
import EmployeeV2Service from '@/services/employee-v2.service';
import { subscribeCentralCommand } from './centralCommand.realtime';

export default function useCommandRealtime(enabled, accountId) {
  const client = useQueryClient();
  const [status, setStatus] = useState('disconnected');
  useEffect(() => {
    if (!enabled || !accountId) return;
    const socket = getSocket({ connect: false });
    let disposed = false;
    let attemptedRefresh = false;
    const subscription = subscribeCentralCommand(socket,
      () => client.invalidateQueries({ queryKey: ['central-command'] }, { cancelRefetch: false }),
      setStatus,
      async error => {
        const code = error?.data?.status || error?.data?.statusCode;
        if (attemptedRefresh || !(code === 401 || /unauthorized|authentication|jwt|expired/i.test(error?.message || ''))) return;
        attemptedRefresh = true;
        try {
          await EmployeeV2Service.refresh();
          if (!disposed) socket.connect();
        } catch {
          if (!disposed) window.dispatchEvent(new Event('auth:unauthorized'));
        }
      });
    window.addEventListener('focus', subscription.schedule);
    window.addEventListener('online', subscription.schedule);
    socket.connect();
    return () => {
      disposed = true;
      subscription.dispose();
      window.removeEventListener('focus', subscription.schedule);
      window.removeEventListener('online', subscription.schedule);
      void client.cancelQueries({ queryKey: ['central-command'] });
    };
  }, [enabled, accountId, client]);
  return { status, retry: () => {
    const socket = getSocket({ connect: false });
    if (!socket.connected) socket.connect();
    return client.invalidateQueries({ queryKey: ['central-command'] });
  } };
}
