import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/services/socket';
import { subscribeCentralCommand } from './centralCommand.realtime';

export default function useCommandRealtime(enabled, accountId) {
  const client = useQueryClient();
  const [connection, setConnection] = useState({ status: 'disconnected', presenceSince: Infinity });
  useEffect(() => {
    if (!enabled || !accountId) return;
    const socket = getSocket({ connect: false });
    const onStatus = status => {
      // Only requests made after this connection may restore presence.
      void client.cancelQueries({ queryKey: ['central-command'] });
      setConnection({ status, presenceSince: status === 'connected' ? Date.now() : Infinity });
    };
    const subscription = subscribeCentralCommand(socket,
      () => client.invalidateQueries({ queryKey: ['central-command'] }),
      onStatus, () => {});
    const offline = () => onStatus('disconnected');
    const online = () => {
      if (socket.connected) onStatus('connected');
      subscription.schedule();
    };
    window.addEventListener('focus', subscription.schedule);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    getSocket();
    return () => {
      subscription.dispose();
      window.removeEventListener('focus', subscription.schedule);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
      void client.cancelQueries({ queryKey: ['central-command'] });
    };
  }, [enabled, accountId, client]);
  return { ...connection, retry: () => {
    getSocket();
    return client.invalidateQueries({ queryKey: ['central-command'] });
  } };
}
