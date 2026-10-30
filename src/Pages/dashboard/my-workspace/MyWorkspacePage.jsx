/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, Clock3, MapPin, MessageCircle, Monitor, Phone, Plus, RefreshCw, Search } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { Input } from '@components/components/ui/input';
import { Card } from '@components/components/ui/card';
import TabComp from '@components/components/tab-comp/TabComp';
import useAuthSession from '@/hooks/useAuthSession';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import Service from '@/services/central-command.service';
import { useCommandMutation, useCommandQuery } from './useCommand';
import { Lookup, Modal, Pager, PersonAvatar, QueryState, Status } from './CommandUI';
import { canUse, dateLabel, idOf } from './centralCommand.utils';
import EventSelector from './EventSelector';
import WorkspaceConversation from './WorkspaceConversation';
import WorkspaceFiles, { FileLink } from './WorkspaceFiles';
import WorkspaceWork, { NewFollowUp } from './WorkspaceWork';
import useCommandRealtime from './useCommandRealtime';

const inboxTime = value => value && !Number.isNaN(new Date(value).getTime()) ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '';
const emptyDraft = { text: '', attachments: [], attempt: null };
const peerOf = (conversation, session) => conversation.contactType === 'Employee' ? conversation.participants?.find(p => typeof p === 'object' && idOf(p) !== session.employeeId) || { name: conversation.title || 'Employee' } : { name: conversation.title || conversation.contactType };
function NewChat({ onClose, onCreated }) {
  const [person, setPerson] = useState(''); const mutation = useCommandMutation();
  return <Modal title="New conversation" description="Start a dashboard conversation with an accessible colleague." onClose={onClose}><Lookup label="Colleague" path="/people" value={person} onChange={setPerson} /><Button disabled={!person || mutation.isPending} onClick={async () => { try { const result = await mutation.mutateAsync(() => Service.create('/conversations', { contactType: 'Employee', participantId: person })); onCreated(result._id); } catch { /* reported */ } }}>Start conversation</Button></Modal>;
}
function EventContext({ conversationId, eventId, setEvent, session, detailTab, setDetailTab }) {
  const [modal, setModal] = useState(null); const [selected, setSelected] = useState(''); const [linkEvent, setLinkEvent] = useState('');
  const mutation = useCommandMutation();
  const event = useCommandQuery('/events/' + eventId, { ...(conversationId ? { conversationId } : {}) }, !!eventId);
  const eventSummary = useCommandQuery('/events', { search: event.data?.eventName || '', page: 1, limit: 100, ...(conversationId ? { conversationId } : {}) }, !!event.data);
  const manager = eventSummary.data?.items?.find(item => item._id === eventId)?.assignedManager;
  const eventMode = detailTab === 'event';
  const scopedEvent = eventMode ? eventId : undefined;
  const ready = !eventMode || !!eventId;
  const scope = { ...(scopedEvent ? { eventId: scopedEvent } : {}), page: 1, limit: 3, tab: 'Active' };
  const tasks = useCommandQuery('/tasks', scope, ready && canUse(session, 'task:view:self'));
  const followUps = useCommandQuery('/follow-ups', scope, ready);
  const files = useCommandQuery('/files', { eventId: scopedEvent, page: 1, limit: 3 }, !!scopedEvent);
  const open = (kind, id = '') => { setSelected(id); setModal(kind); };
  return <aside className="workspace-context workspace-panel" aria-label={eventMode ? "Event Detail" : "Self Detail"}><div className="workspace-context-header"><h2>{eventMode ? "Event Detail" : "Self Detail"}</h2><TabComp tabs={[{ value: "self", label: "Self" }, { value: "event", label: "Event" }]} value={detailTab} onValueChange={setDetailTab} variant="buttons" className="workspace-detail-tabs" display="inline-block" ariaLabel="Detail scope" /></div><div className="workspace-context-scroll" tabIndex={0} aria-label="Detail content">{eventMode && <div className="workspace-event-selection"><EventSelector conversationId={conversationId || undefined} value={eventId} selectedEvent={event.data} onChange={setEvent} />
    {conversationId && <Button variant="link" size="sm" className="workspace-link-event" onClick={() => setModal('link')}>Link event context</Button>}
    {eventId ? <QueryState query={event}>{event.data && <div className="workspace-event-card"><div className="workspace-section-heading"><h3>{event.data.eventName}</h3><Status>{event.data.bookingStatus}</Status></div><p><CalendarDays />{dateLabel(event.data.eventDate)}</p><p><MapPin />{[event.data.venue, event.data.city].filter(Boolean).join(', ') || 'Venue not set'}</p><div className="workspace-event-facts"><div><span>Coordinator</span><strong>{manager?.name || event.data.assignedManager?.name || (idOf(event.data.assignedManager) === session.employeeId ? 'You' : idOf(event.data.assignedManager) ? 'Assigned manager' : 'Not assigned')}</strong></div><div><span>Guest count</span><strong>{event.data.guestCount ?? 'Not set'}</strong></div></div></div>}</QueryState> : <p className="workspace-context-empty">Select an event to view its details.</p>}</div>}
    {ready && <>
      {canUse(session, 'task:view:self') && <section><div className="workspace-section-heading"><h3>Next actions</h3></div><QueryState query={tasks} empty={tasks.data?.items?.length === 0}>{tasks.data?.items?.map(item => <button key={item._id} className="workspace-work-row" onClick={() => open('tasks', item._id)}><span>{item.title}</span><Status>{item.status}</Status><small>{dateLabel(item.dueAt)}</small></button>)}</QueryState><Button variant="link" size="sm" onClick={() => open('tasks')}>View all ({tasks.data?.total ?? '-'})</Button></section>}
      <section><div className="workspace-section-heading"><h3>Follow-up</h3><Button variant="ghost" size="sm" onClick={() => eventId ? open('new-follow-up') : setDetailTab('event')}><Plus />Add</Button></div><QueryState query={followUps} empty={followUps.data?.items?.length === 0}>{followUps.data?.items?.map(item => <button key={item._id} className="workspace-work-row" onClick={() => open('follow-ups', item._id)}><span>{item.title}</span><Status>{item.status}</Status><small>{dateLabel(item.dueAt)}</small></button>)}</QueryState><Button variant="link" size="sm" onClick={() => open('follow-ups')}>View all ({followUps.data?.total ?? '-'})</Button></section>
      <section><div className="workspace-section-heading"><h3>Shared Files</h3><Button variant="ghost" size="sm" onClick={() => scopedEvent ? open('files') : setDetailTab('event')}><Plus />Upload</Button></div>{scopedEvent ? <QueryState query={files} empty={files.data?.items?.length === 0}>{files.data?.items?.map(file => <div className="workspace-file-row" key={file._id}><FileLink id={file._id} name={file.name} /></div>)}</QueryState> : <p className="workspace-context-empty">Select an event to view shared files.</p>}<Button variant="link" size="sm" onClick={() => scopedEvent ? open('files') : setDetailTab('event')}>{scopedEvent ? 'View all (' + (files.data?.total ?? '-') + ')' : 'Select event'}</Button></section>
    </>}</div>
    {['tasks', 'follow-ups'].includes(modal) && <WorkspaceWork kind={modal} eventId={scopedEvent} session={session} initialId={selected} onClose={() => setModal(null)} />}
    {modal === 'new-follow-up' && <NewFollowUp eventId={eventId} conversationId={conversationId} onClose={() => setModal(null)} />}
    {modal === 'files' && <WorkspaceFiles eventId={eventId} onClose={() => setModal(null)} />}
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
  const { status: connectionStatus, retry: retryRealtime } = useCommandRealtime(allowed, session?.employeeId);
  const summary = useCommandQuery('/summary', {}, allowed);
  const inbox = useCommandQuery('/conversations', { page, limit: 15, search: debounced, tab, ...(type ? { contactType: type } : {}) }, allowed);
  const detail = useCommandQuery('/conversations/' + conversationId, {}, allowed && !!conversationId);
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
    <div className="workspace-metrics"><QueryState query={summary}>{metrics.map(([key, label, Icon, tone]) => <Card key={key} className="workspace-metric"><span className={'workspace-metric-icon ' + tone}><Icon /></span><div><p>{label}</p><strong>{summary.data?.[key] ?? '-'}</strong></div></Card>)}<Card className="workspace-metric"><span aria-hidden="true" className={'workspace-metric-status-dot' + (summary.data?.whatsappConfigured ? ' is-configured' : '')} /><span className={'workspace-metric-icon ' + (summary.data?.whatsappConfigured ? 'workspace-tone-0' : 'workspace-tone-muted')}><span className="workspace-whatsapp-icon"><MessageCircle /><Phone /></span></span><div><p>WhatsApp</p><span className={'workspace-metric-status' + (summary.data?.whatsappConfigured ? ' is-configured' : '')}>{summary.data?.whatsappConfigured ? 'Configured' : 'Not configured'}</span></div></Card></QueryState></div>
    <div className="workspace-columns"><section className="workspace-inbox workspace-panel"><div className="workspace-inbox-tools"><div className="workspace-section-heading"><h2>Shared Inbox{summary.data?.unreadMessages > 0 && <span className="workspace-unread-badge" aria-label={summary.data.unreadMessages + " unread messages"}>{summary.data.unreadMessages}</span>}</h2><div className="flex items-center"><Button size="icon" variant="ghost" className="workspace-icon-button" aria-label="Refresh workspace" onClick={() => client.invalidateQueries({ queryKey: ['central-command'] })}><RefreshCw /></Button><Button size="icon" variant="ghost" className="workspace-icon-button" aria-label="New conversation" onClick={() => setNewChat(true)}><Plus /></Button></div></div>
      <div className="workspace-search"><Search /><Input aria-label="Search my conversations" placeholder="Search people or messages" value={search} maxLength={100} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
      <TabComp tabs={[{ value: 'all', label: 'All' }, { value: 'Client', label: 'Clients' }, { value: 'Vendor', label: 'Vendors' }, { value: 'Employee', label: 'Employees' }]} value={type || 'all'} onValueChange={value => { update({ contactType: value === 'all' ? '' : value }); setPage(1); }} variant="buttons" className="workspace-contact-tabs" ariaLabel="Contact types" />
      <TabComp tabs={[{ value: 'Needs reply', label: 'Needs reply \u00b7 ' + (summary.data?.pendingReplies ?? 0) }, { value: 'Unread', label: 'Unread' }, { value: 'All', label: 'All conversations' }]} value={tab} onValueChange={value => { update({ tab: value === 'All' ? '' : value }); setPage(1); }} variant="buttons" className="workspace-filter-tabs" ariaLabel="Inbox filters" /></div>
      <div className="workspace-inbox-list" tabIndex={0} aria-label="Conversations"><QueryState query={inbox} empty={inbox.data?.items?.length === 0}>{inbox.data?.items?.map(item => { const person = peerOf(item, session); return <button key={item._id} className={'workspace-inbox-item ' + (conversationId === item._id ? 'is-selected' : '')} onClick={() => select(item._id)} aria-pressed={conversationId === item._id}><PersonAvatar name={person.name} image={person.profileImage} /><span className="min-w-0 flex-1"><span className="workspace-inbox-title"><strong>{person.name}</strong><span className={"workspace-contact-badge workspace-contact-" + item.contactType?.toLowerCase()}>{item.contactType}</span></span><span className="workspace-preview">{item.lastMessage?.text || (item.lastMessage?.attachments?.length ? 'Attachment' : 'No messages yet')}</span><span className="workspace-channel"><Monitor />{item.lastMessage?.source || "Dashboard"}</span></span><span className="workspace-inbox-time">{inboxTime(item.lastMessage?.createdAt)}</span>{item.unreadCount > 0 && <span className="workspace-unread-badge workspace-unread" aria-label={item.unreadCount + " unread messages"}>{item.unreadCount}</span>}</button>; })}</QueryState></div><Pager data={inbox.data} page={page} setPage={setPage} />
    </section>
    {conversationId ? <QueryState query={detail}>{detail.data && <WorkspaceConversation key={conversationId} conversation={detail.data} peer={peer} session={session} eventId={eventId} draft={drafts[conversationId] || emptyDraft} setDraft={draft => setDrafts(previous => ({ ...previous, [conversationId]: draft }))} />}</QueryState> : <div className="workspace-welcome workspace-panel"><MessageCircle /><h2>Select a conversation</h2><p>Keep in touch with your team and view event updates.</p><Button variant="outline" onClick={() => setNewChat(true)}><Plus />Start a conversation</Button></div>}
    <EventContext key={conversationId + eventId} conversationId={conversationId} eventId={eventId} setEvent={id => update({ event: id })} session={session} detailTab={detailTab} setDetailTab={value => update({ detail: value === "event" ? "event" : "" })} />
    </div>{newChat && <NewChat onClose={() => setNewChat(false)} onCreated={select} />}
  </div>;
}
