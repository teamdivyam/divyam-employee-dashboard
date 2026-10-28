/* eslint-disable react/prop-types */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCheck, Monitor, Paperclip, Send } from 'lucide-react';
import { Button } from '@components/components/ui/button';
import { Textarea } from '@components/components/ui/textarea';
import Service from '@/services/central-command.service';
import { PersonAvatar, QueryState } from './CommandUI';
import { chronologicalMessages, createSendAttempt, errorMessage, idOf } from './centralCommand.utils';
import { useCommandMutation } from './useCommand';
import WorkspaceFiles, { FileLink } from './WorkspaceFiles';

const dayKey = value => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
const timeLabel = value => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const dayLabel = value => dayKey(value) === dayKey(Date.now()) ? 'Today' : new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));

export default function WorkspaceConversation({ conversation, peer, session, eventId, draft, setDraft }) {
  const [picking, setPicking] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const nearBottom = useRef(true);
  const previousLatest = useRef(null);
  const latestNode = useRef(null); const history = useRef(null); const lastRead = useRef(''); const didScroll = useRef(false);
  const mutation = useCommandMutation(); const client = useQueryClient();
  const messages = useInfiniteQuery({ queryKey: ['central-command', 'messages', conversation._id, session.employeeId], queryFn: ({ pageParam, signal }) => Service.list(`/conversations/${conversation._id}/messages`, { page: pageParam, limit: 25 }, signal), initialPageParam: 1, getNextPageParam: last => last.page * last.limit < last.total ? last.page + 1 : undefined, retry: false });
  const inaccessible = [401, 403, 404].includes(messages.error?.response?.status);
  const ordered = useMemo(() => inaccessible ? [] : chronologicalMessages(messages.data?.pages), [messages.data, inaccessible]); const latest = ordered.at(-1)?._id;
  const hasUnread = ordered.some(message => idOf(message.sender) !== session.employeeId && !message.readBy?.some(reader => idOf(reader) === session.employeeId));
  useEffect(() => {
    if (!latest || !latestNode.current || !hasUnread) return;
    let active = true;
    const mark = async () => {
      if (document.visibilityState !== 'visible' || lastRead.current === latest) return;
      lastRead.current = latest;
      try { await Service.create(`/conversations/${conversation._id}/read`, { throughMessageId: latest }); if (active) { client.invalidateQueries({ queryKey: ['central-command', '/summary'] }); client.invalidateQueries({ queryKey: ['central-command', '/conversations'] }); } } catch { if (active) lastRead.current = ''; }
    };
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) mark(); }, { root: history.current });
    observer.observe(latestNode.current);
    const visible = () => { const box = latestNode.current?.getBoundingClientRect(); const container = history.current?.getBoundingClientRect(); if (box && container && box.top >= container.top && box.bottom <= container.bottom) mark(); };
    document.addEventListener('visibilitychange', visible);
    return () => { active = false; observer.disconnect(); document.removeEventListener('visibilitychange', visible); };
  }, [latest, hasUnread, conversation._id, client]);
  useEffect(() => {
    const node = history.current;
    if (!node || !latest) return;
    if (!didScroll.current || nearBottom.current) {
      node.scrollTop = node.scrollHeight;
      didScroll.current = true;
    } else if (previousLatest.current && previousLatest.current !== latest) {
      setHasNewMessages(true);
    }
    previousLatest.current = latest;
  }, [latest]);
  async function send(e) {
    e.preventDefault();
    if (!draft.text.trim() && !draft.attachments.length && !draft.attempt) return;
    const payload = draft.attempt || createSendAttempt({ text: draft.text.trim(), attachments: draft.attachments, internal: false }).body;
    setDraft({ ...draft, attempt: payload });
    try { await mutation.mutateAsync(async () => {
      const message = await Service.create(`/conversations/${conversation._id}/messages`, payload);
      client.setQueryData(['central-command', 'messages', conversation._id, session.employeeId], data => {
        if (!data?.pages?.length) return data;
        return { ...data, pages: data.pages.map((page, index) => index === 0 ? { ...page, items: [message, ...page.items.filter(item => item._id !== message._id)] } : page) };
      });
      return message;
    }); setDraft({ text: '', attachments: [], attempt: null }); }
    catch (error) { if (error.response && error.response.status < 500 && ![408, 429].includes(error.response.status)) setDraft({ ...draft, attempt: null }); }
  }
  async function media(messageId, index) {
    try { const blob = await Service.media(conversation._id, messageId, index); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'attachment-' + (index + 1); a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000); } catch (error) { toast.error(errorMessage(error)); }
  }
  const locked = mutation.isPending || !!draft.attempt;
  return <section className="workspace-chat workspace-panel"><header className="workspace-chat-header"><PersonAvatar name={peer.name} image={peer.profileImage} /><div className="min-w-0 flex-1"><h2>{peer.name}</h2><p className="workspace-muted">{peer.designation || peer.accessRole || conversation.contactType}</p></div><span className={"workspace-conversation-status " + (conversation.status === "Open" ? "is-open" : "")}>{conversation.status}</span></header>
    <div className="workspace-history" ref={history} onScroll={() => { const node = history.current; nearBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 180; if (nearBottom.current) setHasNewMessages(false); }} aria-label="Message history">
      {messages.hasNextPage && <Button variant="outline" size="sm" disabled={messages.isFetching} onClick={() => messages.fetchNextPage()}>Load older messages</Button>}
      <QueryState query={messages} empty={ordered.length === 0}>{ordered.map((message, index) => {
        const own = idOf(message.sender) === session.employeeId;
        const read = message.readBy?.some(id => idOf(id) !== session.employeeId);
        return <Fragment key={message._id}>
          {(index === 0 || dayKey(message.createdAt) !== dayKey(ordered[index - 1].createdAt)) && <div className="workspace-day-divider"><time dateTime={message.createdAt}>{dayLabel(message.createdAt)}</time></div>}
          <article className={'workspace-message ' + (own ? 'workspace-message-own' : '')}>
            <div className="workspace-bubble"><div className="workspace-bubble-content"><p>{message.text}</p><span className="workspace-message-time"><time dateTime={message.createdAt}>{timeLabel(message.createdAt)}</time>{own && <CheckCheck className={read ? 'is-read' : ''} aria-label={read ? 'Read' : 'Sent'} />}</span></div>
              {message.attachments?.map(id => <FileLink key={idOf(id)} id={idOf(id)} />)}
              {message.inboundMedia?.map((_, index) => <Button key={index} variant="link" size="sm" onClick={() => media(message._id, index)}>Download incoming attachment {index + 1}</Button>)}
            </div>
            <div className="workspace-delivery"><Monitor aria-hidden="true" /><span>{message.source === 'WhatsApp' ? 'Received via WhatsApp' : own ? read ? 'Read' : message.dashboard?.status || 'Sent' : 'Dashboard'}</span></div>
          </article>
        </Fragment>;
      })}</QueryState><div ref={latestNode} className="h-1" />
    </div>
    {hasNewMessages && <Button variant="outline" size="sm" onClick={() => { history.current.scrollTop = history.current.scrollHeight; nearBottom.current = true; setHasNewMessages(false); }}>New messages — jump to latest</Button>}
    <form onSubmit={send} className="workspace-composer"><div className="workspace-composer-heading"><h3>Message</h3><span>Sends via Dashboard</span></div>{conversation.status === 'Closed' ? <p className="workspace-muted">This conversation is closed.</p> : <><Textarea aria-label="Message" placeholder={'Type a message to ' + peer.name + '...'} rows={3} maxLength={4000} disabled={locked} value={draft.text} onChange={e => setDraft({ ...draft, text: e.target.value })} />{draft.attachments.length > 0 && <p className="workspace-muted">{draft.attachments.length} files attached <Button type="button" variant="ghost" size="sm" disabled={locked} onClick={() => setDraft({ ...draft, attachments: [] })}>Clear</Button></p>}{draft.attempt && !mutation.isPending && <p role="alert" className="text-xs text-destructive">Delivery could not be confirmed. Retry this exact request to avoid creating a duplicate message.</p>}<div className="flex items-center justify-between"><Button type="button" variant="ghost" size="icon" aria-label="Attach event files" disabled={!eventId || locked} onClick={() => setPicking(true)}><Paperclip /></Button><Button size="sm" disabled={mutation.isPending || (!draft.attempt && !draft.text.trim() && !draft.attachments.length)}><Send />{mutation.isPending ? 'Sending...' : draft.attempt ? 'Retry same request' : 'Send'}</Button></div></>}
    </form>{picking && <WorkspaceFiles eventId={eventId} selected={draft.attachments} onSelect={attachments => setDraft({ ...draft, attachments })} onClose={() => setPicking(false)} />}
  </section>;
}
