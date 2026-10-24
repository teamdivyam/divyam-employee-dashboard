import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/services/socket';
import { subscribeEventBookingUpdates } from './eventBookingRealtime';

export default function useEventBookingUpdates() {
  const queryClient = useQueryClient();
  useEffect(() => subscribeEventBookingUpdates(getSocket(), () => {
    queryClient.invalidateQueries({ queryKey: ['event-bookings'], refetchType: 'active' });
    queryClient.invalidateQueries({ queryKey: ['event-booking-analytics'], refetchType: 'active' });
  }), [queryClient]);
}
