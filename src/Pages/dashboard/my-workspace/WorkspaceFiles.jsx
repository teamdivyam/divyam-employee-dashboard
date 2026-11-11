/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import useAuthSession from '@/hooks/useAuthSession';
import useCurrentEmployee from '@/hooks/useCurrentEmployee';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/components/ui/dropdown-menu';
import { Download, FileImage, FolderOpen, FileText, Upload, Files, Image, HardDrive, MoreVertical, Search } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { Input } from '@components/components/ui/input';
import { Checkbox } from '@components/components/ui/checkbox';
import Service from '@/services/central-command.service';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { useCommandMutation, useCommandQuery } from './useCommand';
import { CHAT_FILE_TYPES, uploadError } from './workspaceMedia.utils';
import { Modal, Pager, PersonAvatar, QueryState } from './CommandUI';

function FileEmptyState({ preview = false, filtered = false }) {
  const Icon = preview ? FileImage : FolderOpen;
  return <div className="workspace-file-empty"><div className={'workspace-file-empty-art' + (preview ? ' is-preview' : '')} aria-hidden="true"><span /><Icon strokeWidth={1} /><i /><i /><i /></div><p>{preview ? 'Select a file to preview.' : filtered ? 'No matching files found.' : 'No records found.'}</p></div>;
}
export function FileLink({ id, name, download = false }) {
  const mutation = useCommandMutation();
  return <Button type="button" variant="link" size="sm" className="workspace-file-link" disabled={mutation.isPending} onClick={() => {
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    mutation.mutate(async () => { try { const result = await Service.get(`/files/${id}/${download ? 'download' : 'preview'}`); if (tab) tab.location.replace(result.url); else toast.error('Allow pop-ups to open this file.'); } catch (error) { tab?.close(); throw error; } });
  }}>{download ? <Download /> : <FileText />}{name || 'Open attachment'}</Button>;
}
const fileSize = bytes => bytes < 1024 ? bytes + ' B' : bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KiB' : (bytes / (1024 * 1024)).toFixed(1) + ' MiB';
function SharedFilePreview({ file, accountId }) {
  const [failed, setFailed] = useState(false);
  const supported = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.contentType);
  const preview = useQuery({ queryKey: ['central-command', 'shared-file-preview', file._id, accountId], enabled: supported && !!accountId,
    queryFn: async ({ signal }) => { const result = await Service.list('/files/' + file._id + '/preview', {}, signal); setFailed(false); return result; },
    staleTime: 240000, refetchInterval: 240000, retry: false });
  return <div className="workspace-files-preview-content"><div className="workspace-files-preview-heading"><div><h3>{file.name}</h3><small>{fileSize(file.size)}</small></div><FileLink id={file._id} name="Download" download /></div>
    {supported ? <QueryState query={preview}>{failed ? <Button variant="outline" onClick={() => preview.refetch()}>Retry preview</Button> : preview.data?.url && (file.contentType === 'application/pdf' ? <iframe title={'Preview of ' + file.name} src={preview.data.url} /> : <img alt={file.name} src={preview.data.url} onError={() => setFailed(true)} />)}</QueryState> : <div className="workspace-files-preview-empty"><FileText /><p>Preview is not available for this file type.</p><FileLink id={file._id} name="Download file" download /></div>}
  </div>;
}
export default function WorkspaceFiles({ eventId, employeeId, conversationId, onClose, selected = [], onSelect }) {
  const auth = useAuthSession();
  const employee = useCurrentEmployee();
  const input = useRef(null);
  const [previewFile, setPreviewFile] = useState(null);
  const context = conversationId ? { conversationId } : employeeId ? { employeeId } : { eventId };
  const chat = !!conversationId;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState(null);
  const controller = useRef(null);
  const mutation = useCommandMutation();
  const debounced = useDebouncedValue(search);
  const query = useCommandQuery('/files', { ...context, page, limit: 25, search: debounced }, !!(eventId || employeeId || conversationId));
  const stats = useQuery({ queryKey: ['central-command', 'file-stats', context, auth.data?.employeeId], enabled: !!auth.data?.employeeId && !!(eventId || employeeId || conversationId), retry: false,
    queryFn: async ({ signal }) => {
      let page = 1; let count = 0; let images = 0; let bytes = 0;
      while (true) {
        const result = await Service.list('/files', { ...context, page, limit: 100 }, signal);
        for (const file of result.items) { count++; if (file.contentType?.startsWith('image/')) images++; bytes += file.size || 0; }
        if (!result.items.length || page * result.limit >= result.total) return { count, images, other: count - images, bytes };
        page++;
      }
    } });
  useEffect(() => () => controller.current?.abort(), []);
  async function upload(file) {
    if (!file) return;
    if (controller.current || (onSelect && selected.length >= 10)) return;
    const error = uploadError(file, chat);
    if (error) return toast.error(error);
    controller.current = new AbortController(); setProgress(0);
    try { const saved = await mutation.mutateAsync(() => Service.upload(context, file, e => setProgress(Math.round(e.loaded / (e.total || file.size) * 100)), controller.current.signal)); if (!controller.current.signal.aborted && onSelect && selected.length < 10) onSelect([...new Set([...selected, saved._id])]); toast.success('File uploaded.'); } catch { /* reported by mutation */ } finally { controller.current = null; setProgress(null); }
  }
  const totals = stats.isError ? undefined : stats.data;
  const metrics = [['Total Files', Files, totals?.count], ['Images', Image, totals?.images], ['Other Files', FileText, totals?.other], ['Storage', HardDrive, totals ? fileSize(totals.bytes) : undefined]];
  const visibleFiles = query.data?.items?.filter(file => !chat || CHAT_FILE_TYPES.includes(file.contentType)) || [];
  const person = employee.data;
  return <Modal title={<><span className="workspace-files-heading-icon"><FileText /></span>{chat ? 'Chat Attachments' : onSelect ? 'Attach Shared Files' : 'Shared Files'}</>} description={chat ? 'Images and PDFs shared in this conversation.' : employeeId ? 'Files shared with this employee.' : 'Files shared with this event.'} onClose={onClose} wide contentClassName="workspace-files-dialog">
    <Button type="button" variant="custom" className="workspace-files-upload-button" disabled={progress !== null || (onSelect && selected.length >= 10)} onClick={() => input.current?.click()}><Upload />Upload</Button>
    <input ref={input} type="file" className="sr-only" tabIndex={-1} aria-label="Upload file" accept={chat ? CHAT_FILE_TYPES.join(',') : undefined} disabled={progress !== null || (onSelect && selected.length >= 10)} onChange={e => { upload(e.target.files?.[0]); e.target.value = ''; }} />
    <div className="workspace-files-summary"><div className="workspace-files-person"><PersonAvatar name={person?.name || 'You'} image={person?.profileImage} /><div><h3>{person?.name || 'You'}</h3><small>{typeof person?.designation === 'string' ? person.designation : person?.designation?.name || person?.accessRole || 'Employee'}</small></div></div>{metrics.map(([label, Icon, value]) => <div className="workspace-files-metric" key={label}><span className={"workspace-files-icon tone-" + label.toLowerCase().replaceAll(" ", "-")}><Icon /></span><div><small>{label}</small><strong>{value ?? '?'}</strong></div></div>)}</div>
    <div className="workspace-files-info"><span>Max 20 MiB per file</span>{chat && <span>JPEG, PNG, GIF, WebP or PDF</span>}{stats.isError && <Button variant="link" size="sm" onClick={() => stats.refetch()}>Retry file totals</Button>}{progress !== null && <span className="workspace-files-progress" role="status">Uploading {progress}% <progress value={progress} max="100" /><Button variant="ghost" size="sm" onClick={() => controller.current?.abort()}>Cancel upload</Button></span>}</div>
    <div className="workspace-files-columns"><aside className="workspace-files-sidebar" aria-label="Shared file list"><div className="workspace-search"><Search /><Input aria-label="Search documents" placeholder="Search files..." value={search} maxLength={100} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div><h3 className="workspace-files-list-heading">Files ({query.data?.total ?? '?'})</h3>
      <QueryState query={query}>{visibleFiles.length === 0 && <FileEmptyState filtered={!!debounced} />}{visibleFiles.map(file => <div className={'workspace-files-row' + (previewFile?._id === file._id ? ' is-selected' : '')} key={file._id}>
        {onSelect && <Checkbox aria-label={'Attach ' + file.name} checked={selected.includes(file._id)} disabled={progress !== null || (!selected.includes(file._id) && selected.length >= 10)} onCheckedChange={checked => onSelect(checked ? [...selected, file._id] : selected.filter(id => id !== file._id))} />}
        <button className="workspace-files-row-main" aria-pressed={previewFile?._id === file._id} onClick={() => setPreviewFile(file)}><span className="workspace-files-icon"><FileText /></span><span><span className="workspace-files-name">{file.name}</span><small>{fileSize(file.size)}</small></span></button>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={'Options for ' + file.name} className="workspace-files-menu"><MoreVertical /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setPreviewFile(file)}>Preview and download</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </div>)}</QueryState><Pager data={query.data} page={page} setPage={setPage} />
    </aside><section className="workspace-files-preview" aria-label="File preview">{previewFile ? <SharedFilePreview key={previewFile._id} file={previewFile} accountId={auth.data?.employeeId} /> : <FileEmptyState preview />}</section></div>
    <footer className="workspace-files-footer"><Button variant="outline" onClick={onClose}>{onSelect ? 'Done (' + selected.length + '/10)' : 'Close'}</Button></footer>
  </Modal>;
}
