/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, Clock3, MapPin, MessageCircle, Monitor, MoreVertical, Phone, Plus, RefreshCw, Search } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { toast } from 'sonner';
import { Checkbox } from '@components/components/ui/checkbox';
import { Input } from '@components/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@components/components/ui/dropdown-menu';
import useCurrentEmployee from '@/hooks/useCurrentEmployee';
import { Card } from '@components/components/ui/card';
import TabComp from '@components/components/tab-comp/TabComp';
import useAuthSession from '@/hooks/useAuthSession';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import Service from '@/services/central-command.service';
import { useCommandMutation, useCommandQuery } from './useCommand';
import { Lookup, Modal, Pager, PersonAvatar, QueryState, Status } from './CommandUI';
import { canUse, dateLabel, editableTask, idOf } from './centralCommand.utils';
import EventSelector from './EventSelector';
import WorkspaceConversation from './WorkspaceConversation';
import WorkspaceFiles, { FileLink } from './WorkspaceFiles';
import WorkspaceWork, { NewFollowUp } from './WorkspaceWork';
import useCommandRealtime from './useCommandRealtime';
import WorkspacePresence from './WorkspacePresence';

const inboxTime = value => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '';
const emptyDraft = { text: '', attachments: [], attempt: null };
const peerOf = (conversation, session) => conversation.contactType === 'Employee' ? conversation.participants?.find(p => typeof p === 'object' && idOf(p) !== session.employeeId) || { name: conversation.title || 'Employee' } : { name: conversation.title || conversation.contactType };
function NewChat({ onClose, onCreated }) {
  const [person, setPerson] = useState(''); const mutation = useCommandMutation();
  return <Modal title="New conversation" description="Start a dashboard conversation with an accessible colleague." onClose={onClose}><Lookup label="Colleague" path="/people" value={person} onChange={setPerson} /><Button disabled={!person || mutation.isPending} onClick={async () => { try { const result = await mutation.mutateAsync(() => Service.create('/conversations', { contactType: 'Employee', participantId: person })); onCreated(result._id); } catch { /* reported */ } }}>Start conversation</Button></Modal>;
}
function ContextRowMenu({ label, onOpen }) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="workspace-context-menu" aria-label={label}><MoreVertical /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={onOpen}>View details</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}
const contextDate = value => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : 'No due date';
function EventContext({ conversationId, eventId, setEvent, session, detailTab, setDetailTab, contactType }) {
  const [modal, setModal] = useState(null); const [selected, setSelected] = useState(''); const [linkEvent, setLinkEvent] = useState('');
  const mutation = useCommandMutation();
  const employee = useCurrentEmployee();
  const ownerName = employee.data?.name || 'You';
  const event = useCommandQuery('/events/' + eventId, { ...(conversationId ? { conversationId } : {}) }, !!eventId);
  const eventSummary = useCommandQuery('/events', { search: event.data?.eventName || '', page: 1, limit: 100, ...(conversationId ? { conversationId } : {}) }, !!event.data);
  const manager = eventSummary.data?.items?.find(item => item._id === eventId)?.assignedManager;
  const selfAllowed = !conversationId || contactType === 'Employee';
  const eventMode = !selfAllowed || detailTab === 'event';
  const scopedEvent = eventMode ? eventId : undefined;
  const ready = !eventMode || !!eventId;
  const selection = eventMode ? { kind: 'event', eventId: scopedEvent } : { kind: 'self', employeeId: session.employeeId };
  const workContext = selection.kind === 'self' ? { employeeId: selection.employeeId } : { eventId: selection.eventId };
  const scope = { ...workContext, page: 1, limit: 3, tab: 'Active' };
  const tasks = useCommandQuery('/tasks', scope, ready && canUse(session, 'task:view:self'));
  const followUps = useCommandQuery('/follow-ups', scope, ready);
  const files = useCommandQuery('/files', { ...workContext, page: 1, limit: 3 }, ready);
  const open = (kind, id = '') => { setSelected(id); setModal(kind); };
  async function submitTask(item) {
    if (mutation.isPending || !canUse(session, 'task:manage:self') || !editableTask(item)) return;
    if (item.proofRequired) { open('tasks', item._id); return; }
    try {
      await mutation.mutateAsync(async () => {
        const task = await Service.get('/tasks/' + item._id);
        if (!editableTask(task)) throw new Error('This task is no longer editable.');
        if (task.proofRequired) { open('tasks', item._id); return; }
        await Service.create('/tasks/' + item._id + '/submit', {
          workUpdate: task.workUpdate?.trim() || 'Submitted for review.',
          proofFiles: (task.proofFiles || []).map(idOf),
        });
        toast.success('Submitted for review.');
      });
    } catch { /* Mutation reports errors and refreshes stale records. */ }
  }
  return <aside className="workspace-context workspace-panel" aria-label={eventMode ? "Event Detail" : "Self Detail"}><div className="workspace-context-header"><h2>{eventMode ? "Event Detail" : "Self Detail"}</h2><TabComp tabs={[...(selfAllowed ? [{ value: "self", label: "Self" }] : []), { value: "event", label: "Event" }]} value={eventMode ? 'event' : 'self'} onValueChange={setDetailTab} variant="buttons" activeButtonVariant="custom" className="workspace-detail-tabs" display="inline-block" ariaLabel="Detail scope" /></div><div className="workspace-context-scroll" tabIndex={0} aria-label="Detail content">{eventMode && <div className="workspace-event-selection"><EventSelector conversationId={conversationId || undefined} value={eventId} selectedEvent={event.data} onChange={setEvent} />
    {conversationId && <Button variant="link" size="sm" className="workspace-link-event" onClick={() => setModal('link')}>Link event context</Button>}
    {eventId ? <QueryState query={event}>{event.data && <div className="workspace-event-card"><div className="workspace-section-heading"><h3>{event.data.eventName}</h3><Status>{event.data.bookingStatus}</Status></div><p><CalendarDays />{dateLabel(event.data.eventDate)}</p><p><MapPin />{[event.data.venue, event.data.city].filter(Boolean).join(', ') || 'Venue not set'}</p><div className="workspace-event-facts"><div><span>Coordinator</span><strong>{manager?.name || event.data.assignedManager?.name || (idOf(event.data.assignedManager) === session.employeeId ? 'You' : idOf(event.data.assignedManager) ? 'Assigned manager' : 'Not assigned')}</strong></div><div><span>Guest count</span><strong>{event.data.guestCount ?? 'Not set'}</strong></div></div></div>}</QueryState> : <p className="workspace-context-empty">Select an event to view its details.</p>}</div>}
    {ready && <>
      {canUse(session, 'task:view:self') && <section><div className="workspace-section-heading"><h3>Next actions</h3></div><QueryState query={tasks} empty={tasks.data?.items?.length === 0}>{tasks.data?.items?.map(item => <div key={item._id} className="workspace-context-row workspace-context-task"><Checkbox className="workspace-context-task-checkbox" aria-label={(item.proofRequired ? 'Open proof submission for ' : 'Submit for review: ') + item.title} checked={['Under review', 'Completed'].includes(item.status)} disabled={mutation.isPending || !canUse(session, 'task:manage:self') || !editableTask(item)} onCheckedChange={checked => { if (checked) submitTask(item); }} /><button className="workspace-context-row-main" onClick={() => open('tasks', item._id)}><span className="workspace-context-row-copy"><span className="workspace-context-title">{item.title}</span><small>{contextDate(item.dueAt)}</small></span><span className="workspace-context-status" data-status={item.status}><Status>{item.status}</Status></span></button></div>)}</QueryState><Button variant="link" size="sm" onClick={() => open('tasks')}>View all ({tasks.data?.total ?? '-'})</Button></section>}
      <section><div className="workspace-section-heading"><h3>Follow-up</h3><Button variant="link" size="sm" onClick={() => open('new-follow-up')}><Plus />Add</Button></div><QueryState query={followUps} empty={followUps.data?.items?.length === 0}>{followUps.data?.items?.map(item => <div key={item._id} className="workspace-context-row workspace-context-follow-up"><button className="workspace-context-row-main" onClick={() => open('follow-ups', item._id)}>{item.type === 'Message' ? <MessageCircle className="workspace-context-call" /> : <Phone className="workspace-context-call" />}<span className="workspace-context-row-copy"><span className="workspace-context-title">{item.title}</span><small>{idOf(item.assignedTo) === session.employeeId ? ownerName : 'Assigned colleague'} ? {contextDate(item.dueAt)}</small></span></button><ContextRowMenu label={'Options for ' + item.title} onOpen={() => open('follow-ups', item._id)} /></div>)}</QueryState><Button variant="link" size="sm" onClick={() => open('follow-ups')}>View all ({followUps.data?.total ?? '-'})</Button></section>
      <section><div className="workspace-section-heading"><h3>Shared Files</h3><Button variant="link" size="sm" onClick={() => open('files')}><Plus />Upload</Button></div>{ready ? <QueryState query={files} empty={files.data?.items?.length === 0}>{files.data?.items?.map(file => <div className="workspace-context-row workspace-context-file" key={file._id}><FileLink id={file._id} name={file.name} /><ContextRowMenu label={'Options for ' + file.name} onOpen={() => open('files')} /></div>)}</QueryState> : <p className="workspace-context-empty">Select an event to view shared files.</p>}<Button variant="link" size="sm" onClick={() => open('files')}>{ready ? 'View all (' + (files.data?.total ?? '-') + ')' : 'Select event'}</Button></section>
    </>}</div>
    {['tasks', 'follow-ups'].includes(modal) && <WorkspaceWork kind={modal} {...workContext} session={session} initialId={selected} onClose={() => setModal(null)} />}
    {modal === 'new-follow-up' && <NewFollowUp {...workContext} conversationId={eventMode ? conversationId : undefined} onClose={() => setModal(null)} />}
    {modal === 'files' && <WorkspaceFiles {...workContext} onClose={() => setModal(null)} />}
    {modal === 'link' && <Modal title="Link event context" description="All participants must have access to this event." onClose={() => setModal(null)}><Lookup label="Event" path="/events" nameKey="eventName" value={linkEvent} onChange={setLinkEvent} /><Button disabled={!linkEvent || mutation.isPending} onClick={async () => { try { await mutation.mutateAsync(() => Service.update(`/conversations/${conversationId}`, { eventId: linkEvent })); setEvent(linkEvent); setModal(null); } catch { /* reported */ } }}>Link event</Button></Modal>}
  </aside>;
}
export default function MyWorkspacePage() {
  const auth = useAuthSession();
  return <WorkspaceSession key={auth.data?.employeeId || 'signed-out'} />;
}
function WorkspaceSession() {
  const auth = useAuthSession(); const session = auth.data; const client = useQueryClient();
  const [params, setParams] = useSearchParams(); const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [newChat, setNewChat] = useState(false); const [cachedPeers, setCachedPeers] = useState({}); const [drafts, setDrafts] = useState({});
  const tab = ['Unread', 'Needs reply'].includes(params.get('tab')) ? params.get('tab') : 'All';
  const detailTab = params.get('detail') === 'event' ? 'event' : 'self';
  const type = ['Employee', 'Vendor', 'Client'].includes(params.get('contactType')) ? params.get('contactType') : '';
  const conversationId = /^[a-f\d]{24}$/i.test(params.get('conversation') || '') ? params.get('conversation') : '';
  const requestedEvent = /^[a-f\d]{24}$/i.test(params.get('event') || '') ? params.get('event') : '';
  const allowed = canUse(session, 'notification:view:self'); const debounced = useDebouncedValue(search);
  const { status: connectionStatus, presenceSince, retry: retryRealtime } = useCommandRealtime(allowed, session?.employeeId);
  const summary = useCommandQuery('/summary', {}, allowed);
  const inbox = useCommandQuery('/conversations', { page, limit: 15, search: debounced, tab, ...(type ? { contactType: type } : {}) }, allowed);
  const replyInbox = useCommandQuery('/conversations', { page: 1, limit: 100, tab: 'Needs reply', ...(type ? { contactType: type } : {}) }, allowed);
  const detail = useCommandQuery('/conversations/' + conversationId, {}, allowed && !!conversationId);
  const presenceQuery = useCommandQuery('/conversations/' + conversationId + '/presence', {}, allowed && !!conversationId && !!detail.data);
  const presenceAvailable = query => connectionStatus === 'connected' && !query.isError && query.dataUpdatedAt >= presenceSince;
  const eventId = requestedEvent ? (conversationId ? detail.data?.eventIds?.some(id => idOf(id) === requestedEvent) ? requestedEvent : '' : requestedEvent) : '';
  const update = changes => { const next = new URLSearchParams(params); Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key)); setParams(next); };
  const select = id => { const item = inbox.data?.items?.find(c => c._id === id); if (item) setCachedPeers(previous => ({ ...previous, [id]: peerOf(item, session) })); update({ conversation: id, event: '' }); setNewChat(false); };
  const listed = inbox.data?.items?.find(c => c._id === conversationId);
  const peerQuery = useQuery({
    queryKey: ['central-command', 'peer', conversationId, session?.employeeId],
    enabled: allowed && detail.data?.contactType === 'Employee' && !listed && !cachedPeers[conversationId],
    retry: false,
    queryFn: async ({ signal }) => {
      const ids = detail.data.participants.map(idOf).filter(id => id !== session.employeeId);
      let page = 1;
      while (page <= 10000) {
        const people = await Service.list('/people', { page, limit: 100 }, signal);
        const found = people.items.find(person => ids.includes(person._id));
        if (found) return found;
        if (page * people.limit >= people.total) break;
        page += 1;
      }
      return { name: 'Employee conversation' };
    },
  });
  const peer = listed ? peerOf(listed, session) : cachedPeers[conversationId] || peerQuery.data || { name: detail.data?.contactType === 'Employee' ? 'Employee conversation' : detail.data?.title || 'Conversation' };
  if (auth.isPending || auth.isError) return <QueryState query={auth} />;
  if (!allowed) return <div className="workspace-empty">You do not have permission to access My Workspace.</div>;
  const metrics = [['unreadMessages', 'Unread messages', MessageCircle, 'workspace-tone-0'], ['pendingReplies', 'Pending replies', Clock3, 'workspace-tone-1'], ['activeEvents', 'Active events', CalendarDays, 'workspace-tone-2'], ['followUpsToday', 'Follow-ups today', CheckCircle2, 'workspace-tone-3']];
  return <div className="my-workspace" aria-label="My Workspace"><h1 className="sr-only">My Workspace</h1>
    {connectionStatus !== 'connected' && <div className="workspace-section-heading"><span className="workspace-provider-status" role="status">{connectionStatus === 'error' ? 'Live updates unavailable' : 'Live updates reconnecting'}</span><Button variant="ghost" size="sm" onClick={retryRealtime}>Retry connection</Button></div>}
    <div className="workspace-metrics"><QueryState query={summary}>{metrics.map(([key, label, Icon, tone]) => <Card key={key} className={"workspace-metric workspace-metric-" + tone}><span className={'workspace-metric-icon ' + tone}><Icon /></span><div><p>{label}</p><strong>{summary.data?.[key] ?? '-'}</strong></div></Card>)}<Card className="workspace-metric workspace-metric-whatsapp"><span aria-hidden="true" className={'workspace-metric-status-dot' + (summary.data?.whatsappConfigured ? ' is-configured' : '')} /><span className={'workspace-metric-icon ' + (summary.data?.whatsappConfigured ? 'workspace-tone-0' : 'workspace-tone-muted')}><span className="workspace-whatsapp-icon"><MessageCircle /><Phone /></span></span><div><p>WhatsApp</p><span className={'workspace-metric-status' + (summary.data?.whatsappConfigured ? ' is-configured' : '')}>{summary.data?.whatsappConfigured ? 'Connected' : 'Not connected'}</span></div></Card></QueryState></div>
    <div className="workspace-columns"><section className="workspace-inbox workspace-panel"><div className="workspace-inbox-tools"><div className="workspace-section-heading"><h2>Shared Inbox</h2><Button size="icon" variant="ghost" className="workspace-icon-button" aria-label="New conversation" onClick={() => setNewChat(true)}><Plus /></Button></div>
      <div className="workspace-search"><Search /><Input aria-label="Search my conversations" placeholder="Search people or messages" value={search} maxLength={100} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
      <TabComp tabs={[{ value: 'all', label: 'All' }, { value: 'Client', label: 'Clients' }, { value: 'Vendor', label: 'Vendors' }, { value: 'Employee', label: 'Employees' }, { value: 'unlinked', label: 'Unlinked', disabled: true }]} value={type || 'all'} onValueChange={value => { update({ contactType: value === 'all' ? '' : value }); setPage(1); }} variant="buttons" className="workspace-contact-tabs" ariaLabel="Contact types" />
      <TabComp tabs={[{ value: 'Needs reply', label: 'Needs reply ? ' + (summary.data?.pendingReplies ?? 0) }, { value: 'Unread', label: 'Unread' }, { value: 'All', label: 'All conversations' }]} value={tab} onValueChange={value => { update({ tab: value === 'All' ? '' : value }); setPage(1); }} variant="buttons" className="workspace-filter-tabs" ariaLabel="Inbox filters" /></div>
      <div className="workspace-inbox-list" tabIndex={0} aria-label="Conversations"><QueryState query={inbox} empty={inbox.data?.items?.length === 0}>{inbox.data?.items?.map(item => {
        const person = peerOf(item, session);
        const whatsapp = item.lastMessage?.source === 'WhatsApp';
        const needsReply = tab === 'Needs reply' || replyInbox.data?.items?.some(reply => reply._id === item._id);
        return <div key={item._id} className={'workspace-inbox-item ' + (conversationId === item._id ? 'is-selected' : '')}>
          <button className="workspace-inbox-select" onClick={() => select(item._id)} aria-pressed={conversationId === item._id}>
            <span className="workspace-inbox-avatar"><PersonAvatar name={person.name} image={person.profileImage} /><WorkspacePresence presence={item.presence} available={presenceAvailable(inbox)} /></span>
            <span className="workspace-inbox-copy"><span className="workspace-inbox-title"><strong>{person.name}</strong><span className={'workspace-contact-badge workspace-contact-' + item.contactType?.toLowerCase()}>{item.contactType}</span></span>{item.unreadCount > 0 && <span className="sr-only">{item.unreadCount} unread messages. </span>}<span className="workspace-preview">{item.lastMessage?.text || (item.lastMessage?.attachments?.length ? 'Attachment' : 'No messages yet')}</span><span className="workspace-channel">{whatsapp ? <span className="workspace-inbox-whatsapp"><MessageCircle /><Phone /></span> : <Monitor />}{item.lastMessage?.source || 'Dashboard'}</span></span>
            <span className="workspace-inbox-time">{inboxTime(item.lastMessage?.createdAt)}</span>{needsReply && <span className="workspace-needs-reply">Needs reply</span>}
          </button>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="workspace-inbox-menu" aria-label={'Options for ' + person.name}><MoreVertical /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => select(item._id)}>Open conversation</DropdownMenuItem><DropdownMenuItem onSelect={() => client.invalidateQueries({ queryKey: ['central-command'] })}><RefreshCw />Refresh workspace</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>;
      })}</QueryState></div><Pager data={inbox.data} page={page} setPage={setPage} />
    </section>
    {conversationId ? <QueryState query={detail}>{detail.data && <WorkspaceConversation key={conversationId} conversation={detail.data} presence={presenceQuery.data ? presenceQuery.data.presence : detail.data.presence} presenceAvailable={presenceAvailable(presenceQuery)} peer={peer} session={session} eventId={eventId} draft={drafts[conversationId] || emptyDraft} setDraft={draft => setDrafts(previous => ({ ...previous, [conversationId]: draft }))} />}</QueryState> : <div className="workspace-welcome workspace-panel"><MessageCircle /><h2>Select a conversation</h2><p>Keep in touch with your team and view event updates.</p><Button variant="outline" onClick={() => setNewChat(true)}><Plus />Start a conversation</Button></div>}
    <EventContext key={conversationId + eventId + detailTab} contactType={detail.data?.contactType || listed?.contactType} conversationId={conversationId} eventId={eventId} setEvent={id => update({ event: id })} session={session} detailTab={detailTab} setDetailTab={value => update({ detail: value === "event" ? "event" : "" })} />
    </div>{newChat && <NewChat onClose={() => setNewChat(false)} onCreated={select} />}
  </div>;
}
