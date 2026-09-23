/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@components/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/components/ui/dialog';

export default function EventReceiptPreviewDialog({ receipt, booking, onClose }) {
  const [document, setDocument] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [downloading, setDownloading] = useState(false);
  useEffect(() => {
    let active = true;
    setDocument(null); setError('');
    if (receipt) {
      (async () => {
        try {
          const { prepareReceiptPdf } = await import('../eventReceiptPdf');
          const result = await prepareReceiptPdf(receipt, booking);
          if (active) setDocument({ ...result, receipt, booking });
        } catch (failure) {
          if (active) setError(failure.message || 'Unable to load receipt. Please try again.');
        }
      })();
    }
    return () => { active = false; };
  }, [receipt, booking, attempt]);
  const ready = document?.receipt === receipt && document?.booking === booking;
  const download = async () => {
    if (!ready || downloading) return;
    setDownloading(true);
    try { await document.pdf.save(document.filename, { returnPromise: true }); }
    catch (failure) { toast.error(failure.message || 'Unable to download receipt.'); }
    finally { setDownloading(false); }
  };
  return <Dialog open={Boolean(receipt)} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0">
      <DialogHeader className="shrink-0 border-b border-border px-4 py-3 pr-12 text-left"><DialogTitle>Payment Receipt</DialogTitle><DialogDescription>{receipt?.receiptNumber || 'Receipt preview'}</DialogDescription></DialogHeader>
      <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-3 sm:p-5" aria-busy={!ready && !error}>
        {error ? <div role="alert" className="space-y-3 py-12 text-center"><p className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={() => setAttempt((value) => value + 1)}>Retry</Button></div> : ready ? <div className="space-y-4">{document.previews.map((src, index) => <img key={index} src={src} alt={`Payment receipt ${receipt.receiptNumber || ''}, page ${index + 1}`} className="mx-auto h-auto w-full max-w-[794px] bg-white shadow-sm" />)}</div> : <div role="status" className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Preparing receipt...</div>}
      </div>
      <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border p-3"><Button variant="outline" onClick={onClose}>Close</Button><Button variant="custom" disabled={!ready || downloading} onClick={download}>{downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{downloading ? 'Downloading...' : 'Download'}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
