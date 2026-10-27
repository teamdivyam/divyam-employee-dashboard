/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, FileText, Upload } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { Input } from '@components/components/ui/input';
import { Checkbox } from '@components/components/ui/checkbox';
import Service from '@/services/central-command.service';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { useCommandMutation, useCommandQuery } from './useCommand';
import { Modal, Pager, QueryState } from './CommandUI';

export function FileLink({ id, name, download = false }) {
  const mutation = useCommandMutation();
  return <Button type="button" variant="link" size="sm" className="workspace-file-link" disabled={mutation.isPending} onClick={() => {
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    mutation.mutate(async () => { try { const result = await Service.get(`/files/${id}/${download ? 'download' : 'preview'}`); if (tab) tab.location.replace(result.url); else toast.error('Allow pop-ups to open this file.'); } catch (error) { tab?.close(); throw error; } });
  }}>{download ? <Download /> : <FileText />}{name || 'Open attachment'}</Button>;
}
export default function WorkspaceFiles({ eventId, onClose, selected = [], onSelect }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState(null);
  const controller = useRef(null);
  const mutation = useCommandMutation();
  const debounced = useDebouncedValue(search);
  const query = useCommandQuery('/files', { eventId, page, limit: 25, search: debounced }, !!eventId);
  useEffect(() => () => controller.current?.abort(), []);
  async function upload(file) {
    if (!file) return;
    if (!file.size || file.size > 30 * 1024 * 1024) return toast.error('Choose a nonempty file up to 30 MiB.');
    controller.current = new AbortController(); setProgress(0);
    try { const saved = await mutation.mutateAsync(() => Service.upload(eventId, file, e => setProgress(Math.round(e.loaded / (e.total || file.size) * 100)), controller.current.signal)); if (onSelect && selected.length < 10) onSelect([...selected, saved._id]); toast.success('File uploaded.'); } catch { /* reported by mutation */ } finally { setProgress(null); }
  }
  return <Modal title={onSelect ? 'Attach event files' : 'Shared documents'} description="Upload files up to 30 MiB. Attaching a file does not send a message or submit work." onClose={onClose}>
    <label className="workspace-upload"><Upload className="h-4 w-4" />Upload file<Input type="file" aria-label="Upload event file" disabled={progress !== null} onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} /></label>
    {progress !== null && <div role="status">Uploading {progress}% <progress value={progress} max="100" /><Button variant="ghost" onClick={() => controller.current?.abort()}>Cancel</Button></div>}
    <Input aria-label="Search documents" placeholder="Search documents" value={search} maxLength={100} onChange={e => { setSearch(e.target.value); setPage(1); }} />
    <QueryState query={query} empty={query.data?.items?.length === 0}><div className="space-y-2">{query.data?.items?.map(file => <div className="workspace-file-row" key={file._id}>
      {onSelect && <Checkbox aria-label={'Attach ' + file.name} checked={selected.includes(file._id)} disabled={!selected.includes(file._id) && selected.length >= 10} onCheckedChange={checked => onSelect(checked ? [...selected, file._id] : selected.filter(id => id !== file._id))} />}
      <div className="min-w-0 flex-1"><FileLink id={file._id} name={file.name} /><p className="workspace-muted">{Math.ceil(file.size / 1024)} KB</p></div><FileLink id={file._id} name="Download" download />
    </div>)}</div></QueryState><Pager data={query.data} page={page} setPage={setPage} />
    {onSelect && <Button onClick={onClose}>Done ({selected.length}/10)</Button>}
  </Modal>;
}
