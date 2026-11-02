/* eslint-disable react/prop-types */
import { useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays, Check, CheckCircle2, ClipboardList, Clock3, FileText, List, MessageSquare, MoreVertical, Phone, Plus, Search } from 'lucide-react';
import useCurrentEmployee from '@/hooks/useCurrentEmployee';
import { Label } from '@components/components/ui/label';
import WorkspaceTasks from './WorkspaceTasks';
import EventSelector from './EventSelector';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import TabComp from '@components/components/tab-comp/TabComp';
import { Checkbox } from '@components/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/components/ui/dropdown-menu';
import { Button } from '@components/components/ui/button';
import { Input } from '@components/components/ui/input';
import { Textarea } from '@components/components/ui/textarea';
import Service from '@/services/central-command.service';
import { useCommandMutation, useCommandQuery } from './useCommand';
import { Choice, Field, Modal, Pager, PersonAvatar, QueryState, Status } from './CommandUI';
import WorkspaceFiles, { FileLink } from './WorkspaceFiles';
import { canUse, dateLabel, datePayload, editableTask, idOf, localDateInput } from './centralCommand.utils';

export function WorkForm({ item, kind, session, onClose, summary = true }) {
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
  return <div className="space-y-3">{summary && <><Status>{item.status}</Status><p className="workspace-muted">Due {dateLabel(item.dueAt)}</p></>}
    {task ? <>{summary && <p className="whitespace-pre-wrap">{item.instructions || 'No additional instructions.'}</p>}{item.feedback && <div className="workspace-feedback"><h3>Review feedback</h3><p>{item.feedback}</p></div>}{summary && item.referenceFiles?.map(id => <FileLink key={idOf(id)} id={idOf(id)} name="Reference file" />)}</> : <><Field label="Title"><Input aria-label="Reminder title" value={title} disabled={!editable} maxLength={200} onChange={e => setTitle(e.target.value)} /></Field><Field label="Due date and time (IST)"><Input aria-label="Reminder due date (IST)" type="datetime-local" value={due} disabled={!editable} onChange={e => setDue(e.target.value)} /></Field><Choice label="Type" value={type} disabled={!editable} onChange={setType} options={['Call', 'Message'].map(value => ({ value, label: value }))} /></>}
    <Field label={task ? 'Work update' : 'Note'}><Textarea aria-label={task ? 'Work update' : 'Reminder note'} value={text} maxLength={5000} disabled={!editable || mutation.isPending} onChange={e => setText(e.target.value)} /></Field>
    {task && <><p className="workspace-muted">{item.proofRequired ? 'Proof is required.' : 'Proof is optional.'} {proofs.length}/10 files</p>{proofs.map(id => <div key={idOf(id)} className="flex items-center gap-2"><FileLink id={idOf(id)} name="Proof file" />{editable && <Button size="sm" variant="ghost" disabled={mutation.isPending} onClick={() => setProofs(proofs.filter(p => p !== id))}>Remove</Button>}</div>)}{editable && <Button variant="outline" disabled={mutation.isPending} onClick={() => setFiles(true)}>Add proof files</Button>}</>}
    <div className="flex flex-wrap gap-2">{editable && (task ? <><Button variant="outline" disabled={mutation.isPending} onClick={() => save('draft')}>Save draft</Button><Button disabled={mutation.isPending} onClick={() => save('submit')}>Submit for review</Button></> : <Button disabled={mutation.isPending || !title.trim() || !due} onClick={() => save('save')}>Save reminder</Button>)}
      {!task && item.status !== 'Cancelled' && <>{idOf(item.assignedTo) === session.employeeId && <Button disabled={mutation.isPending} onClick={() => save(item.status === 'Done' ? 'Undo' : 'Done')}>{item.status === 'Done' ? 'Undo' : 'Mark done'}</Button>}{own && <Button variant="outline" disabled={mutation.isPending} onClick={() => save('Cancel')}>Cancel reminder</Button>}</>}
    </div>{files && <WorkspaceFiles {...(idOf(item.employeeId) ? { employeeId: idOf(item.employeeId) } : { eventId: idOf(item.eventId) })} selected={proofs} onSelect={setProofs} onClose={() => setFiles(false)} />}
  </div>;
}
export function NewFollowUp({ eventId, employeeId, conversationId, onClose }) {
  const employee = useCurrentEmployee();
  const person = employee.data;
  const [selectedEventId, setSelectedEventId] = useState(eventId || '');
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('Call');
  const mutation = useCommandMutation();
  const close = () => { if (!mutation.isPending) onClose(); };
  async function create(e) {
    e.preventDefault();
    if ((!employeeId && !selectedEventId) || !title.trim() || !due || mutation.isPending) return;
    try {
      await mutation.mutateAsync(() => Service.create('/follow-ups', {
        title: title.trim(), dueAt: datePayload(due), type, note,
        ...(employeeId ? { employeeId } : { eventId: selectedEventId }),
        ...(!employeeId && conversationId ? { conversationId } : {}),
      }));
      toast.success('Follow-up created.');
      onClose();
    } catch { /* retain draft */ }
  }
  return <Modal title={<><span className="workspace-follow-up-heading-icon"><Clock3 /></span>New Follow-up</>} description="Create a reminder for the selected employee or event." onClose={close} contentClassName="workspace-follow-up-dialog">
    <form onSubmit={create} className="workspace-follow-up-form">
      <div className="workspace-follow-up-person"><PersonAvatar name={person?.name || 'You'} image={person?.profileImage} /><div><h3>{person?.name || 'You'}</h3><p>{typeof person?.designation === 'string' ? person.designation : person?.designation?.name || person?.accessRole || 'Employee'}</p></div></div>
      {!employeeId && !eventId && <EventSelector label="Event (required)" conversationId={conversationId || undefined} value={selectedEventId} onChange={setSelectedEventId} />}
      <div className="workspace-follow-up-field"><Label htmlFor="follow-up-title"><FileText />Follow-up Title *</Label><Input id="follow-up-title" aria-label="Follow-up title" required maxLength={200} value={title} disabled={mutation.isPending} onChange={e => setTitle(e.target.value)} /></div>
      <div className="workspace-follow-up-field"><Choice label="Responsible person *" value="self" disabled options={[{ value: 'self', label: person?.name || 'You' }]} onChange={() => {}} /></div>
      <div className="workspace-follow-up-field"><Label htmlFor="follow-up-due"><CalendarDays />Due Date &amp; Time *</Label><Input id="follow-up-due" aria-label="Follow-up due date (IST)" title="India Standard Time (IST)" required type="datetime-local" value={due} disabled={mutation.isPending} onChange={e => setDue(e.target.value)} /></div>
      <fieldset className="workspace-follow-up-type" disabled={mutation.isPending}><legend>Type</legend><div>{[['Call', Phone], ['Message', MessageSquare]].map(([value, Icon]) => <Button key={value} type="button" variant="outline" aria-pressed={type === value} onClick={() => setType(value)}><Icon />{value}</Button>)}</div></fieldset>
      <div className="workspace-follow-up-field"><Label htmlFor="follow-up-note"><List />Note (optional)</Label><Textarea id="follow-up-note" aria-label="Follow-up note" maxLength={5000} value={note} disabled={mutation.isPending} onChange={e => setNote(e.target.value)} /></div>
      <footer className="workspace-follow-up-footer"><Button type="button" variant="outline" disabled={mutation.isPending} onClick={close}>Cancel</Button><Button type="submit" variant="custom" className="workspace-follow-up-create" disabled={mutation.isPending || !title.trim() || !due || (!employeeId && !selectedEventId)}>{mutation.isPending ? 'Creating...' : 'Create follow-up'}</Button></footer>
    </form>
  </Modal>;
}
export default function WorkspaceWork({ kind, eventId, employeeId, session, initialId = '', onClose }) {
  return kind === 'tasks' ? <WorkspaceTasks eventId={eventId} employeeId={employeeId} session={session} initialId={initialId} onClose={onClose} /> : <WorkspaceFollowUps kind={kind} eventId={eventId} employeeId={employeeId} session={session} initialId={initialId} onClose={onClose} />;
}
function WorkspaceFollowUps({ kind, eventId, employeeId, session, initialId, onClose }) {
  const [filter, setFilter] = useState('All');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(initialId);
  const [adding, setAdding] = useState(false);
  const employee = useCurrentEmployee();
  const person = employee.data;
  const mutation = useCommandMutation();
  const debounced = useDebouncedValue(search);
  const context = employeeId ? { employeeId } : { eventId };
  const list = useCommandQuery('/follow-ups', { ...context, tab: filter, status: status === 'All' || filter === 'Done' ? undefined : status, search: debounced, page, limit: 15 });
  const detail = useCommandQuery('/follow-ups/' + selected, {}, !!selected);
  const total = useCommandQuery('/follow-ups', { ...context, tab: 'All', page: 1, limit: 1 });
  const pending = useCommandQuery('/follow-ups', { ...context, tab: 'Active', page: 1, limit: 1 });
  const done = useCommandQuery('/follow-ups', { ...context, tab: 'Done', page: 1, limit: 1 });
  const today = useCommandQuery('/follow-ups', { ...context, tab: 'Today', status: 'Pending', page: 1, limit: 1 });
  const metrics = [['Total', ClipboardList, total, 'violet'], ['Pending', Clock3, pending, 'amber'], ['Completed', CheckCircle2, done, 'green'], ['Due Today', CalendarDays, today, 'violet']];
  async function toggle(item) {
    try { await mutation.mutateAsync(() => Service.create('/follow-ups/' + item._id + '/actions', { action: item.status === 'Done' ? 'Undo' : 'Done' })); toast.success(item.status === 'Done' ? 'Reminder reopened.' : 'Reminder completed.'); } catch { /* reported */ }
  }
  return <Modal title={<><span className="workspace-reminders-heading-icon"><Clock3 /></span>Follow-ups</>} description={employeeId ? 'Self reminders' : 'Event reminders'} onClose={onClose} wide contentClassName="workspace-reminders-dialog">
    <Button variant="custom" className="workspace-reminders-add" onClick={() => setAdding(true)}><Plus />Add follow-up</Button>
    <div className="workspace-reminders-summary"><div className="workspace-reminders-person"><PersonAvatar name={person?.name || 'You'} image={person?.profileImage} /><div><h3>{person?.name || 'You'}</h3><small>{typeof person?.designation === 'string' ? person.designation : person?.designation?.name || person?.accessRole || 'Employee'}</small></div></div>{metrics.map(([label, Icon, query, tone]) => <div className="workspace-reminders-metric" key={label}><span className={'workspace-reminders-icon ' + tone}><Icon /></span><div><small>{label}</small><strong>{query.isError ? '?' : query.data?.total ?? '?'}</strong></div></div>)}</div>
    <div className="workspace-reminders-columns"><aside className="workspace-reminders-sidebar" aria-label="Follow-ups"><div className="workspace-search"><Search /><Input aria-label="Search follow-ups" placeholder="Search follow-ups..." value={search} maxLength={100} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div><h3 className="workspace-reminders-list-heading">Follow-ups ({list.data?.total ?? '?'})</h3>
      <TabComp tabs={['All', 'Today', 'Upcoming', 'Done'].map(value => ({ value, label: value }))} value={filter} onValueChange={value => { setFilter(value); setPage(1); }} variant="buttons" className="workspace-reminders-tabs" ariaLabel="Follow-up filters" />
      <QueryState query={list} empty={list.data?.items?.length === 0}>{list.data?.items?.map(item => <div key={item._id} className={'workspace-reminders-row' + (selected === item._id ? ' is-selected' : '')}>
        <Checkbox aria-label={(item.status === 'Done' ? 'Reopen ' : 'Complete ') + item.title} checked={item.status === 'Done'} disabled={mutation.isPending || item.status === 'Cancelled' || idOf(item.assignedTo) !== session.employeeId} onCheckedChange={() => toggle(item)} />
        <button className="workspace-reminders-row-main" aria-pressed={selected === item._id} onClick={() => setSelected(item._id)}><span className="workspace-reminders-title">{item.title}</span><small>{idOf(item.assignedTo) === session.employeeId ? person?.name || 'You' : 'Assigned colleague'} &middot; {dateLabel(item.dueAt)}</small><span className={'workspace-reminders-type ' + (item.type === 'Call' ? 'is-call' : '')}>{item.type}</span>{item.status === 'Cancelled' && <Status>Cancelled</Status>}</button>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="workspace-reminders-menu" aria-label={'Options for ' + item.title}><MoreVertical /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setSelected(item._id)}>View details</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </div>)}</QueryState><Pager data={list.data} page={page} setPage={setPage} />
      <details className="workspace-reminders-filters"><summary>More filters</summary><Choice label="Status" value={filter === 'Done' ? 'Done' : status} disabled={filter === 'Done'} onChange={value => { setStatus(value); setPage(1); }} options={['All', 'Pending', 'Done', 'Cancelled'].map(value => ({ value, label: value }))} /></details>
      <p className="workspace-reminders-hint"><Check />Tick a reminder to mark it done.</p>
    </aside><section className="workspace-reminders-detail" aria-label="Follow-up details">{selected ? <QueryState query={detail}>{detail.data && <WorkForm key={selected} item={detail.data} kind={kind} session={session} onClose={() => setSelected('')} />}</QueryState> : <p className="workspace-reminders-empty">Select a follow-up to view details.</p>}</section></div>
    <footer className="workspace-reminders-footer"><Button variant="outline" onClick={onClose}>Cancel</Button></footer>
    {adding && <NewFollowUp {...context} onClose={() => setAdding(false)} />}
  </Modal>;
}
