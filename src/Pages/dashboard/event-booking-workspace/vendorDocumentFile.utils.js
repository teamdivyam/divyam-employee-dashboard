import { toast } from 'sonner';
import EventService from '@/services/event-booking-workspace.service';

export const openVendorDocument = async (eventId, vendorId, documentId) => {
  const tab = window.open('about:blank', '_blank');
  if (!tab) { toast.error('Allow pop-ups to open the document.'); return; }
  tab.opener = null;
  try {
    if (!documentId) throw new Error('Document unavailable.');
    const response = await EventService.getVendorDocumentFile({ eventId, vendorId, documentId });
    const url = URL.createObjectURL(response.data);
    tab.location.replace(url);
    const cleanup = window.setInterval(() => {
      if (!tab.closed) return;
      URL.revokeObjectURL(url);
      window.clearInterval(cleanup);
    }, 5_000);
  } catch (error) {
    tab.close();
    toast.error(error.response?.status === 403 ? 'You do not have access to this document.' : 'Unable to open document.');
  }
};
