/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@components/components/ui/button';

export default function QuotationPdfPreview({ input }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [downloading, setDownloading] = useState(false);
  useEffect(() => {
    let active = true;
    setResult(null); setError('');
    import('../eventQuotationPdf').then(({ prepareQuotationPdf }) => prepareQuotationPdf(input)).then((document) => {
      if (active) setResult({ ...document, input });
    }).catch((failure) => { if (active) setError(failure.message || 'Unable to prepare quotation.'); });
    return () => { active = false; };
  }, [input, attempt]);
  const ready = result?.input === input;
  const download = async () => {
    if (!ready || downloading) return;
    setDownloading(true);
    try { await result.pdf.save(result.filename, { returnPromise: true }); }
    catch (failure) { toast.error(failure.message || 'Unable to download quotation.'); }
    finally { setDownloading(false); }
  };
  return <section className="space-y-3" aria-label="Quotation PDF preview" aria-busy={!ready && !error}>
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded border border-border bg-card p-3"><p className="text-xs text-muted-foreground">{input.record ? 'Quotation PDF' : 'Draft preview — quotation number and version are assigned on save.'}</p><Button type="button" variant="custom" size="sm" disabled={!ready || downloading} onClick={download}>{downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Download PDF</Button></div>
    {error ? <div role="alert" className="space-y-3 py-10 text-center"><p className="text-sm text-destructive">{error}</p><Button type="button" variant="outline" onClick={() => setAttempt((value) => value + 1)}>Retry</Button></div> : ready ? result.previews.map((src, index) => <img key={index} src={src} alt={`Quotation ${input.record?.quotationNo || 'draft'}, page ${index + 1}`} className="mx-auto h-auto w-full max-w-[794px] bg-white shadow-sm" />) : <div role="status" className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Preparing quotation...</div>}
  </section>;
}
