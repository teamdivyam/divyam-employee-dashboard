/* eslint-disable react/prop-types */
import { useState } from 'react';
import { CalendarDays, ChevronDown, MoreVertical, Plus, Check, CheckCircle2, ClipboardList, Clock3, FileText, Layers, List, Paperclip, Search } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/components/ui/dropdown-menu';
import { Input } from '@components/components/ui/input';
import TabComp from '@components/components/tab-comp/TabComp';
import useCurrentEmployee from '@/hooks/useCurrentEmployee';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { Choice, Modal, Pager, PersonAvatar, QueryState, Status } from './CommandUI';
import { useCommandQuery } from './useCommand';
import { dateLabel, idOf } from './centralCommand.utils';
import { FileLink } from './WorkspaceFiles';
import { WorkForm } from './WorkspaceWork';

function taskDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'No date set';
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', dateStyle: 'short' });
  const date = new Date(value);
  const label = day.format(date) === day.format(new Date()) ? 'Today' : new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }).format(date);
  return label + ', ' + new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
}
export default function WorkspaceTasks({ eventId, employeeId, session, initialId, onClose }) {
  const context = employeeId ? { employeeId } : { eventId };
  const [selected, setSelected] = useState(initialId);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [period, setPeriod] = useState('All');
  const [page, setPage] = useState(1);
  const employee = useCurrentEmployee();
  const debounced = useDebouncedValue(search);
  const list = useCommandQuery('/tasks', { ...context, search: debounced, status: status === 'All' ? undefined : status, tab: period, page, limit: 15 });
  const total = useCommandQuery('/tasks', { ...context, tab: 'All', page: 1, limit: 1 });
  const pending = useCommandQuery('/tasks', { ...context, tab: 'All', status: 'Pending', page: 1, limit: 1 });
  const review = useCommandQuery('/tasks', { ...context, tab: 'All', status: 'Under review', page: 1, limit: 1 });
  const completed = useCommandQuery('/tasks', { ...context, tab: 'Done', page: 1, limit: 1 });
  const selectedId = selected || list.data?.items?.[0]?._id || '';
  const detail = useCommandQuery('/tasks/' + selectedId, {}, !!selectedId);
  const counts = [total, pending, review, completed].map(query => query.isError ? '—' : query.data?.total ?? '—');
  const tabs = ['All', 'Pending', 'Under review', 'Completed'];
  const metrics = [['Total Tasks', ClipboardList, 'violet'], ['Pending', Clock3, 'amber'], ['Under Review', Layers, 'violet'], ['Completed', CheckCircle2, 'green']];
  const item = detail.data;
  const event = useCommandQuery('/events/' + eventId, {}, !!eventId && !employeeId);
  const contextName = employeeId ? employee.data?.name || 'My tasks' : event.data?.eventName || 'Event tasks';
  const files = useCommandQuery('/files', { ...(idOf(item?.employeeId) ? { employeeId: idOf(item.employeeId) } : { eventId: idOf(item?.eventId) }), limit: 100 }, !!(item?.eventId || item?.employeeId));
  const fileName = file => file?.name || files.data?.items?.find(record => record._id === idOf(file))?.name || 'Reference file';
  const personName = person => person?.name || (idOf(person) === session.employeeId ? employee.data?.name || 'You' : 'Assigned employee');
  return <Modal title={<><span className="workspace-task-heading-icon"><Check /></span>Next Actions</>} description="Manage your assigned tasks." hideDescription onClose={onClose} wide contentClassName="workspace-task-dialog">
    <div className="workspace-task-summary">
      <div className="workspace-task-person"><>{employeeId ? <PersonAvatar name={contextName} image={employee.data?.profileImage} /> : <span className="workspace-task-context-icon"><ClipboardList /></span>}</><div><h3>{contextName}</h3><small>{employeeId ? [employee.data?.designation?.name || (typeof employee.data?.designation === 'string' ? employee.data.designation : ''), employee.data?.employeeCode].filter(Boolean).join(' / ') || 'Self tasks' : 'Event task overview'}</small></div></div>
      {metrics.map(([label, Icon, tone], index) => <div className="workspace-task-metric" key={label}><span className={'workspace-task-icon ' + tone}><Icon /></span><div><small>{label}</small><strong>{[total, pending, review, completed][index].isError ? <button className="workspace-task-retry" onClick={() => [total, pending, review, completed][index].refetch()}>Retry</button> : counts[index]}</strong></div></div>)}
    </div>
    <div className="workspace-task-columns">
      <aside className="workspace-task-sidebar" aria-label="Tasks">
        <div className="workspace-search"><Search /><Input placeholder="Search tasks..." aria-label="Search tasks" value={search} maxLength={100} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        <TabComp variant="buttons" className="workspace-task-tabs" ariaLabel="Task status" value={status} onValueChange={value => { setStatus(value); setPage(1); }} tabs={tabs.map((value, index) => ({ value, label: <>{value === 'Under review' ? 'Under Review' : value} <span className="workspace-task-count">{counts[index]}</span></> }))} />
        <div className="workspace-task-list-heading"><span>Tasks ({list.data?.total ?? '—'})</span><small>Due date <ChevronDown /></small></div>
        <QueryState query={list} empty={list.data?.items?.length === 0}>{list.data?.items?.map(task => <div className={'workspace-task-row' + (selectedId === task._id ? ' is-selected' : '')} key={task._id}><button className="workspace-task-row-main" aria-pressed={selectedId === task._id} onClick={() => setSelected(task._id)}><span className="workspace-task-icon"><FileText /></span><span className="workspace-task-row-content"><h3>{task.title}</h3><span className="workspace-task-row-meta"><span data-status={task.status}><Status>{task.status}</Status></span><small><CalendarDays />{taskDate(task.dueAt)}</small></span></span></button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="workspace-task-menu" aria-label={"Actions for " + task.title}><MoreVertical /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setSelected(task._id)}>View task</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>)}</QueryState>
        <Pager data={list.data} page={page} setPage={setPage} />
        <details className="workspace-task-filters"><summary>More filters</summary><Choice label="Due date" value={period} onChange={value => { setPeriod(value); setPage(1); }} options={['All', 'Today', 'Upcoming'].map(value => ({ value, label: value }))} /></details>
      </aside>
      <section className="workspace-task-detail" aria-label="Task details">
        {selectedId ? <QueryState query={detail}>{item && <>
          <div className="workspace-task-facts"><div><span className="workspace-task-icon"><FileText /></span><div><small>Task Title</small><h3>{item.title}</h3></div></div><div><span className="workspace-task-icon"><CalendarDays /></span><div><small>Due Date &amp; Time</small><p>{dateLabel(item.dueAt)}</p></div></div></div>
          <section className="workspace-task-section workspace-task-instructions"><h3><List />Instructions</h3><div className="workspace-task-section-body"><p>{item.instructions || 'No additional instructions.'}</p></div></section>
          <section className="workspace-task-section"><h3><Paperclip />Attachments ({item.referenceFiles?.length || 0})</h3><div className="workspace-task-section-body">{item.referenceFiles?.length ? item.referenceFiles.map(file => <div className="workspace-task-attachment" key={idOf(file)}><FileLink id={idOf(file)} name={fileName(file)} /><FileLink id={idOf(file)} name="Download" download /></div>) : <p>No reference attachments.</p>}</div></section>
          <section className="workspace-task-section workspace-task-work"><h3>Work update &amp; proof</h3><div className="workspace-task-section-body"><WorkForm key={selectedId} item={item} kind="tasks" session={session} onClose={onClose} summary={false} /></div></section>
          <details key={selectedId} className="workspace-task-section"><summary>Activity History ({(item.history?.length || 0) + (item.createdAt ? 1 : 0)})</summary><div className="workspace-task-section-body">
            {item.createdAt && <div className="workspace-task-activity"><span className="workspace-task-icon"><Plus /></span><p>Task created by <strong>{personName(item.createdBy)}</strong></p><time>{dateLabel(item.createdAt)}</time></div>}
            {item.history?.map((entry, index) => <div className="workspace-task-activity" key={entry._id || index}><span className="workspace-task-icon"><Clock3 /></span><div><p>{entry.action}{entry.actor && <> by <strong>{personName(entry.actor)}</strong></>}</p>{entry.feedback && <p>{entry.feedback}</p>}</div><time>{dateLabel(entry.at)}</time></div>)}
            {!item.createdAt && !item.history?.length && <p>No activity yet.</p>}
          </div></details>
        </>}</QueryState> : <p className="workspace-empty">Select a task to view its details.</p>}
      </section>
    </div>
    <footer className="workspace-task-footer"><Button variant="outline" onClick={onClose}>Cancel</Button></footer>
  </Modal>;
}
