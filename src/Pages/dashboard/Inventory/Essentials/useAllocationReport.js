import { useRef, useState } from "react";
import { toast } from "sonner";

export default function useAllocationReport(service, allocationId, booking, categories, eventId = null, filename = null) {
  const lock = useRef(false);
  const [generating, setGenerating] = useState(false);
  const download = async () => {
    if (lock.current) return;
    lock.current = true; setGenerating(true);
    try {
      const [{ loadAllocationReport, loadEventAllocationReport }, { createAllocationPdf }, { loadAuditImages }] = await Promise.all([
        import("./allocationReportData"), import("./allocationReportPdf"), import("./allocationReportImages"),
      ]);
      const report = eventId
        ? await loadEventAllocationReport(service, eventId, booking, categories)
        : await loadAllocationReport(service, allocationId, booking, categories);
      const images = await loadAuditImages(report.rows);
      const pdf = createAllocationPdf(report, images);
      pdf.save(filename || `DIVYAM_Event_Allocation_${report.reference.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`);
      toast.success("Allocation report downloaded");
    } catch (error) { toast.error(error?.response?.data?.message || error?.message || "Unable to download allocation report. Please retry."); }
    finally { lock.current = false; setGenerating(false); }
  };
  return { generating, download };
}
