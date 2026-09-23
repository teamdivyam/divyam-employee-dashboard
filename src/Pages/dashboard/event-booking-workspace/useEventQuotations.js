import { useQuery } from '@tanstack/react-query';
import AdminService from '../../../services/event-booking-workspace.service';
export default function useEventQuotations(eventId, enabled = true) {
  return useQuery({
    queryKey: ['event-quotations', eventId], enabled: Boolean(eventId) && enabled,
    queryFn: async () => {
      const quotations = [];
      let page = 1;
      let totalPages = 1;
      do {
        const { data } = await AdminService.getEventQuotations({ eventId, page, limit: 100 });
        quotations.push(...(data.quotations || []));
        totalPages = data.pagination?.totalPages || 0;
        page += 1;
      } while (page <= totalPages);
      return quotations;
    },
  });
}
