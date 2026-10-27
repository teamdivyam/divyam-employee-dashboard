/* eslint-disable react/prop-types */
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@components/components/ui/button';
import { Input } from '@components/components/ui/input';
import { Textarea } from '@components/components/ui/textarea';
import Service from '@/services/central-command.service';
import { useCommandMutation, useCommandQuery } from './useCommand';
import { Choice, Field, Modal, Pager, QueryState, Status } from './CommandUI';
import WorkspaceFiles, { FileLink } from './WorkspaceFiles';
import { canUse, dateLabel, datePayload, editableTask, idOf, localDateInput } from './centralCommand.utils';

function WorkForm({ item, kind, session, onClose }) {
  const task = kind === 'tasks';
  const [text, setText] = useState(item.workUpdate || item.note || '');
  const [proofs, setProofs] = useState(item.proofFiles || []);
  const [title, setTitle] = useState(item.title);
  const [due, setDue] = useState(localDateInput(item.dueAt));
  const [type, setType] = useState(item.type || 'Call');
  const [files, setFiles] = useState(false);
  const mutation = useCommandMutation();
  const own = idOf(item.createdBy) === session.employeeId;
  const editable = task ? editableTask(item) && canUse(session, 'task:manage:self') : own && item.status === 'Pending';
  async function save(action) {
    if (task && action === 'submit' && (!text.trim() || (item.proofRequired && !proofs.length))) return toast.error('Add a work update and all required proof files.');
    try {
      await mutation.mutateAsync(() => task ? Service[action === 'draft' ? 'update' : 'create'](`/tasks/${item._id}/${action}`, { workUpdate: text, proofFiles: proofs }) : action === 'save' ? Service.update(`/follow-ups/${item._id}`, { title: title.trim(), dueAt: datePayload(due), type, note: text }) : Service.create(`/follow-ups/${item._id}/actions`, { action }));
      toast.success(task ? action === 'submit' ? 'Submitted for review.' : 'Draft saved.' : 'Follow-up updated.'); onClose();
    } catch { /* retain form */ }
  }
  return <div className="space-y-3"><Status>{item.status}</Status><p className="workspace-muted">Due {dateLabel(item.dueAt)}</p>
    {task ? <><p className="whitespace-pre-wrap">{item.instructions || 'No additional instructions.'}</p>{item.feedback && <div className="workspace-feedback"><h3>Review feedback</h3><p>{item.feedback}</p></div>}{item.referenceFiles?.map(id => <FileLink key={idOf(id)} id={idOf(id)} name="Reference file" />)}</> : <><Field label="Title"><Input aria-label="Reminder title" value={title} disabled={!editable} maxLength={200} onChange={e => setTitle(e.target.value)} /></Field><Field label="Due date and time (IST)"><Input aria-label="Reminder due date (IST)" type="datetime-local" value={due} disabled={!editable} onChange={e => setDue(e.target.value)} /></Field><Choice label="Type" value={type} disabled={!editable} onChange={setType} options={['Call', 'Message'].map(value => ({ value, label: value }))} /></>}
    <Field label={task ? 'Work update' : 'Note'}><Textarea aria-label={task ? 'Work update' : 'Reminder note'} value={text} maxLength={5000} disabled={!editable || mutation.isPending} onChange={e => setText(e.target.value)} /></Field>
    {task && <><p className="workspace-muted">{item.proofRequired ? 'Proof is required.' : 'Proof is optional.'} {proofs.length}/10 files</p>{proofs.map(id => <div key={idOf(id)} className="flex items-center gap-2"><FileLink id={idOf(id)} name="Proof file" />{editable && <Button size="sm" variant="ghost" disabled={mutation.isPending} onClick={() => setProofs(proofs.filter(p => p !== id))}>Remove</Button>}</div>)}{editable && <Button variant="outline" disabled={mutation.isPending} onClick={() => setFiles(true)}>Add proof files</Button>}</>}
    <div className="flex flex-wrap gap-2">{editable && (task ? <><Button variant="outline" disabled={mutation.isPending} onClick={() => save('draft')}>Save draft</Button><Button disabled={mutation.isPending} onClick={() => save('submit')}>Submit for review</Button></> : <Button disabled={mutation.isPending || !title.trim() || !due} onClick={() => save('save')}>Save reminder</Button>)}
      {!task && item.status !== 'Cancelled' && <>{idOf(item.assignedTo) === session.employeeId && <Button disabled={mutation.isPending} onClick={() => save(item.status === 'Done' ? 'Undo' : 'Done')}>{item.status === 'Done' ? 'Undo' : 'Mark done'}</Button>}{own && <Button variant="outline" disabled={mutation.isPending} onClick={() => save('Cancel')}>Cancel reminder</Button>}</>}
    </div>{files && <WorkspaceFiles eventId={idOf(item.eventId)} selected={proofs} onSelect={setProofs} onClose={() => setFiles(false)} />}
  </div>;
}
export function NewFollowUp({ eventId, conversationId, onClose }) {
  const [title, setTitle] = useState(''); const [due, setDue] = useState(''); const [note, setNote] = useState(''); const [type, setType] = useState('Call'); const mutation = useCommandMutation();
  return <Modal title="Add personal follow-up" description="This reminder does not place a call or send a message." onClose={onClose}><form className="space-y-3" onSubmit={async e => { e.preventDefault(); try { await mutation.mutateAsync(() => Service.create('/follow-ups', { title: title.trim(), dueAt: datePayload(due), type, note, eventId, ...(conversationId ? { conversationId } : {}) })); onClose(); } catch { /* retain draft */ } }}>
    <Field label="Title"><Input aria-label="Follow-up title" required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></Field><Field label="Due date and time (IST)"><Input aria-label="Follow-up due date (IST)" required type="datetime-local" value={due} onChange={e => setDue(e.target.value)} /></Field><Choice label="Type" value={type} onChange={setType} options={['Call', 'Message'].map(value => ({ value, label: value }))} /><Field label="Note"><Textarea aria-label="Follow-up note" maxLength={5000} value={note} onChange={e => setNote(e.target.value)} /></Field><Button disabled={mutation.isPending || !title.trim()}>Create reminder</Button>
  </form></Modal>;
}
export default function WorkspaceWork({ kind, eventId, session, initialId = '', onClose }) {
  const [filter, setFilter] = useState('All'); const [page, setPage] = useState(1); const [selected, setSelected] = useState(initialId);
  const list = useCommandQuery('/' + kind, { eventId, tab: filter, page, limit: 15 });
  const detail = useCommandQuery(`/${kind}/${selected}`, {}, !!selected);
  return <Modal title={kind === 'tasks' ? 'My tasks' : 'My follow-ups'} description="Assigned event work · Times shown in IST" onClose={onClose} wide>
    <div className="grid gap-4 md:grid-cols-2"><div className="space-y-3"><Choice label="Show" value={filter} onChange={v => { setFilter(v); setPage(1); }} options={['All', 'Active', 'Today', 'Upcoming', 'Done'].map(value => ({ value, label: value }))} /><QueryState query={list} empty={list.data?.items?.length === 0}>{list.data?.items?.map(item => <button key={item._id} className="workspace-work-row" aria-pressed={selected === item._id} onClick={() => setSelected(item._id)}><span>{item.title}</span><Status>{item.status}</Status><small>{dateLabel(item.dueAt)}</small></button>)}</QueryState><Pager data={list.data} page={page} setPage={setPage} /></div><div>{selected ? <QueryState query={detail}>{detail.data && <WorkForm key={selected} item={detail.data} kind={kind} session={session} onClose={onClose} />}</QueryState> : <p className="workspace-empty">Select a record to view details.</p>}</div></div>
  </Modal>;
}
