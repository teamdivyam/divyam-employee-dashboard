/* eslint-disable react/prop-types */
import { useState } from 'react';
import { CalendarDays, Check, CheckCircle2, ClipboardList, Clock3, FileText, Layers, List, Paperclip, Search } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { Input } from '@components/components/ui/input';
import TabComp from '@components/components/tab-comp/TabComp';
import useCurrentEmployee from '@/hooks/useCurrentEmployee';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import { Choice, Modal, Pager, PersonAvatar, QueryState, Status } from './CommandUI';
import { useCommandQuery } from './useCommand';
import { dateLabel, idOf } from './centralCommand.utils';
import { FileLink } from './WorkspaceFiles';
import { WorkForm } from './WorkspaceWork';

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
  return <Modal title={<><span className="workspace-task-heading-icon"><Check /></span>Next Actions</>} description={`Tasks for ${employee.data?.name || 'you'} to ensure timely follow-ups and completion.`} onClose={onClose} wide contentClassName="workspace-task-dialog">
    <div className="workspace-task-summary">
      <div className="workspace-task-person"><PersonAvatar name={employee.data?.name} image={employee.data?.profileImage} /><div><h3>{employee.data?.name || 'My tasks'}</h3><small>{employee.data?.designation?.name || (typeof employee.data?.designation === 'string' ? employee.data.designation : '') || 'My workspace'}</small></div></div>
      {metrics.map(([label, Icon, tone], index) => <div className="workspace-task-metric" key={label}><span className={'workspace-task-icon ' + tone}><Icon /></span><div><small>{label}</small><strong>{counts[index]}</strong></div></div>)}
    </div>
    <div className="workspace-task-columns">
      <aside className="workspace-task-sidebar" aria-label="Tasks">
        <div className="workspace-search"><Search /><Input placeholder="Search tasks" aria-label="Search tasks" value={search} maxLength={100} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        <TabComp variant="buttons" className="workspace-task-tabs" ariaLabel="Task status" value={status} onValueChange={value => { setStatus(value); setPage(1); }} tabs={tabs.map((value, index) => ({ value, label: <>{value === 'Under review' ? 'Under Review' : value} <span className="workspace-task-count">{counts[index]}</span></> }))} />
        <div className="workspace-task-list-heading"><span>Tasks ({list.data?.total ?? '—'})</span><small>Due date ↑</small></div>
        <QueryState query={list} empty={list.data?.items?.length === 0}>{list.data?.items?.map(task => <button className={'workspace-task-row' + (selectedId === task._id ? ' is-selected' : '')} key={task._id} aria-pressed={selectedId === task._id} onClick={() => setSelected(task._id)}><span className="workspace-task-icon"><FileText /></span><span className="workspace-task-row-content"><h3>{task.title}</h3><span className="workspace-task-row-meta"><span data-status={task.status}><Status>{task.status}</Status></span><small><CalendarDays />{dateLabel(task.dueAt)}</small></span></span></button>)}</QueryState>
        <Pager data={list.data} page={page} setPage={setPage} />
        <details className="workspace-task-filters"><summary>More filters</summary><Choice label="Due date" value={period} onChange={value => { setPeriod(value); setPage(1); }} options={['All', 'Today', 'Upcoming'].map(value => ({ value, label: value }))} /></details>
      </aside>
      <section className="workspace-task-detail" aria-label="Task details">
        {selectedId ? <QueryState query={detail}>{item && <>
          <div className="workspace-task-facts"><div><span className="workspace-task-icon"><FileText /></span><div><small>Task Title</small><h3>{item.title}</h3></div></div><div><span className="workspace-task-icon"><CalendarDays /></span><div><small>Due Date &amp; Time</small><p>{dateLabel(item.dueAt)}</p></div></div></div>
          <section className="workspace-task-instructions"><h3><List />Instructions</h3><p>{item.instructions || 'No additional instructions.'}</p></section>
          <section className="workspace-task-section"><h3><Paperclip />Attachments ({item.referenceFiles?.length || 0})</h3><div className="workspace-task-section-body">{item.referenceFiles?.length ? item.referenceFiles.map(file => <div className="workspace-task-attachment" key={idOf(file)}><FileLink id={idOf(file)} name={file.name || 'Reference file'} /><FileLink id={idOf(file)} name="Download" download /></div>) : <p>No reference attachments.</p>}</div></section>
          <details className="workspace-task-section" open><summary>Activity History ({item.history?.length || 0})</summary><div className="workspace-task-section-body">{item.history?.length ? [...item.history].reverse().map((entry, index) => <div className="workspace-task-activity" key={index}><span className="workspace-task-icon"><Clock3 /></span><div><h3>{entry.action}</h3><small>{dateLabel(entry.at)}</small>{entry.feedback && <p>{entry.feedback}</p>}</div></div>) : <p>No activity yet.</p>}</div></details>
          <section className="workspace-task-section"><h3>Work update &amp; proof</h3><div className="workspace-task-section-body"><WorkForm key={selectedId} item={item} kind="tasks" session={session} onClose={onClose} summary={false} /></div></section>
        </>}</QueryState> : <p className="workspace-empty">Select a task to view its details.</p>}
      </section>
    </div>
    <footer className="workspace-task-footer"><Button variant="outline" onClick={onClose}>Cancel</Button></footer>
  </Modal>;
}
