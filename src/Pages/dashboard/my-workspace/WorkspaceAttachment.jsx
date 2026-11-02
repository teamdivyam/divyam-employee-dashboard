/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@components/components/ui/button';
import useAuthSession from '@/hooks/useAuthSession';
import Service from '@/services/central-command.service';
import { useCommandQuery } from './useCommand';
import { QueryState } from './CommandUI';
import { FileLink } from './WorkspaceFiles';

function ImagePreview({ id, name }) {
  const { data: session } = useAuthSession();
  const [failed, setFailed] = useState(false);
  const preview = useQuery({ queryKey: ['central-command', 'file-preview', id, session?.employeeId], queryFn: async ({ signal }) => {
    const result = await Service.list(`/files/${id}/preview`, {}, signal);
    setFailed(false);
    return result;
  }, enabled: !!session?.employeeId, staleTime: 240000, refetchInterval: 240000, retry: false });
  if (preview.isError || failed) return <Button size="sm" variant="outline" onClick={() => preview.refetch()}>Retry image preview</Button>;
  return preview.data?.url ? <img className="workspace-attachment-image" src={preview.data.url} alt={name} onError={() => setFailed(true)} /> : <p className="workspace-muted">Loading preview...</p>;
}
export default function WorkspaceAttachment({ id }) {
  const metadata = useCommandQuery(`/files/${id}`);
  const file = metadata.data;
  return <div className="workspace-attachment-card"><QueryState query={metadata}>{file && <>
    {['image/jpeg', 'image/png', 'image/webp'].includes(file.contentType) && <ImagePreview id={id} name={file.name} />}
    <span className="workspace-attachment-name">{file.name}</span><small>{Math.ceil(file.size / 1024)} KB · {file.contentType === 'application/pdf' ? 'PDF' : file.contentType}</small>
    <div className="flex flex-wrap gap-2"><FileLink id={id} name="Open" download={file.contentType === 'image/gif'} /><FileLink id={id} name="Download" download /></div>
  </>}</QueryState></div>;
}
