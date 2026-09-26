/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Boxes, CalendarDays, Clock, Eye, Loader2, Plus, Search } from 'lucide-react';
import { useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import AdminService from '../../../services/event-booking-workspace.service';
import { Badge } from '@components/components/ui/badge';
import { Button } from '@components/components/ui/button';
import { Card, CardContent } from '@components/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/components/ui/dialog';
import { Input } from '@components/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './components/EventTable';
import { getEmployees } from './components/EventBookingComponents';
import EventOperationsNav from './components/EventOperationsNav';
import EventSummaryCards from './components/EventSummaryCards';
import InventoryRequirementDialog from './components/InventoryRequirementDialog';
import VendorRequirementDialog from './components/VendorRequirementDialog';
import { getFinalPreferenceCount } from './eventBookingDashboard.utils';
import CreateEventAllocationPage from '../Inventory/Essentials/components/CreateEventAllocationPage';
import { AllocationRequirementWorkspace } from '../Inventory/Essentials/components/EventAllocationTab';

const PAGE_SIZE = 10;
const companyStatuses = ['Pending', 'Reserved', 'Partially Reserved', 'Shortage', 'Dispatched', 'Returned', 'Cancelled'];
const vendorStatuses = ['Pending', 'Confirmed', 'Partial', 'Shortage', 'Delivered', 'Returned', 'Cancelled'];
const idOf = (value) => String(value?._id || value || '');

const formatDateTime = (value) => {
  if (!value) return { date: '-', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '-', time: '' };
  return {
    date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date),
    time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date),
  };
};

const statusTone = (status) => {
  if (['Reserved', 'Returned', 'Confirmed', 'Delivered'].includes(status)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (['Partially Reserved', 'Partial', 'Pending'].includes(status)) return 'border-orange-200 bg-orange-50 text-orange-700';
  if (status === 'Shortage' || status === 'Cancelled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
};

function EventInventoryPanel({ data, onAdd, onView }) {
  const requirements = useMemo(() => (data?.inventory || []).filter((item) => item.status !== 'Cancelled'), [data]);
  const [source, setSource] = useState('Company');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const categories = data?.filters?.categories || [];
  const summary = useMemo(() => requirements.reduce((counts, item) => ({
    ...counts,
    [item.source]: (counts[item.source] || 0) + 1,
  }), { Company: 0, Vendor: 0 }), [requirements]);
  const activeStatuses = (source === 'Vendor' ? vendorStatuses : companyStatuses).filter((item) => item !== 'Cancelled');

  const filtered = useMemo(() => requirements.filter((item) => {
    const query = search.trim().toLowerCase();
    return item.source === source
      && (category === 'all' || item.category === category)
      && (status === 'all' || item.status === status)
      && (!query || [item.itemName, item.sku, item.category, item.coordinatorName, item.coordinator?.name].some((value) => String(value || '').toLowerCase().includes(query)));
  }), [requirements, source, category, status, search]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectSource = (value) => { setSource(value); setStatus('all'); };

  useEffect(() => setPage(1), [source, search, category, status]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <EventOperationsNav active="inventory" />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <div className="relative min-w-44 flex-1 sm:max-w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search inventory item..."
              className="h-8 pl-9 text-xs"
            />
          </div>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Inventory Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Inventory Status</SelectItem>
              {activeStatuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button type="button" variant={source === 'Company' ? 'custom' : 'outline'} size="sm" onClick={() => selectSource('Company')} className="min-w-32">Company ({summary.company || 0})</Button>
          <Button type="button" variant={source === 'Vendor' ? 'custom' : 'outline'} size="sm" onClick={() => selectSource('Vendor')} className="min-w-32">Vendor ({summary.vendor || 0})</Button>
        </div>
        <Button variant="custom" size="sm" onClick={() => onAdd(source)} className="h-9 gap-1.5 text-xs"><Plus className="h-4 w-4" />Add {source} Requirement</Button>
      </div>

      <Card className="overflow-hidden border-border shadow-sm"><CardContent className="p-0">
        <div className="overflow-x-auto"><Table className="min-w-[1120px]">
          <TableHeader><TableRow className="bg-muted/35"><TableHead>Item / Category</TableHead>{source === 'Vendor' && <TableHead>Vendor</TableHead>}<TableHead>Applies To</TableHead><TableHead className="w-56">{source === 'Vendor' ? 'Fulfilment' : 'Allocation'}</TableHead><TableHead>{source === 'Vendor' ? 'Delivery' : 'Dispatch'}</TableHead><TableHead>{source === 'Vendor' ? 'Return / Pickup' : 'Return'}</TableHead><TableHead>Coordinator</TableHead><TableHead>Inventory Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
          <TableBody>{rows.length ? rows.map((item) => {
            const dispatch = formatDateTime(item.dispatchAt);
            const returned = formatDateTime(item.returnAt);
            const required = Number(item.requiredQuantity || 0);
            const reserved = Number(item.reservedQuantity || 0);
            const percent = required ? Math.min(100, Math.round((reserved / required) * 100)) : 0;
            const appliesTo = item.appliesTo?.map((entry) => entry.name).join(', ') || item.appliesToLabel || 'All Functions';
            return <TableRow key={item._id}>
              <TableCell><div className="flex items-center gap-3">{item.itemImage ? <a href={item.itemImage} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.itemName} image in a new tab`} className="block h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-cyan-50 ring-offset-background transition hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"><img src={item.itemImage} alt={item.itemName} loading="lazy" className="h-full w-full object-cover" /></a> : <span className="grid h-14 w-16 shrink-0 place-items-center rounded-lg bg-cyan-50 text-cyan-700"><Boxes className="h-6 w-6" /></span>}<div><p className="font-semibold text-foreground">{item.itemName}</p><p className="text-xs text-muted-foreground">{item.category}{item.sku ? ` · ${item.sku}` : ''}</p></div></div></TableCell>
              {source === 'Vendor' && <TableCell className="text-xs font-medium">{item.vendor?.companyName || 'Not assigned'}</TableCell>}
              <TableCell><span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">{appliesTo}</span></TableCell>
              <TableCell><div className="space-y-1"><div className="flex justify-between text-xs"><span className="font-medium">{reserved} / {required} {source === 'Vendor' ? 'confirmed' : `${item.unitLabel || 'pcs'} reserved`}</span>{Number(item.shortageQuantity || 0) > 0 && <span className="font-semibold text-red-600">{item.shortageQuantity} {source === 'Vendor' ? 'pending' : 'short'}</span>}</div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${percent === 100 ? 'bg-emerald-600' : 'bg-orange-500'}`} style={{ width: `${percent}%` }} /></div></div></TableCell>
              <TableCell><div className="space-y-1 text-xs"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-blue-700" /><p>{dispatch.date}</p></div><div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 shrink-0 text-blue-700" /><p>{dispatch.time}</p></div></div></TableCell>
              <TableCell><div className="space-y-1 text-xs"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-blue-700" /><p>{returned.date}</p></div><div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4 shrink-0 text-blue-700" /><p>{returned.time}</p></div></div></TableCell>
              <TableCell className="text-xs">{item.coordinator?.name || item.coordinatorName || '-'}</TableCell>
              <TableCell><Badge variant="outline" className={statusTone(item.status)}>{item.status}</Badge></TableCell>
              <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => onView(item)} className="gap-1.5 text-blue-700"><Eye className="h-4 w-4" />View</Button></TableCell>
            </TableRow>;
          }) : <TableRow><TableCell colSpan={source === 'Vendor' ? 9 : 8} className="h-32 text-center text-muted-foreground">No {source.toLowerCase()} inventory requirements found.</TableCell></TableRow>}</TableBody>
        </Table></div>
        <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground"><span>Showing {filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} items</span><div className="flex items-center gap-2"><Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>‹</Button><span className="grid h-8 min-w-8 place-items-center rounded-md bg-emerald-50 px-2 font-semibold text-emerald-700">{page}</span><Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>›</Button></div></div>
      </CardContent></Card>
    </div>
  );
}

export default function EventInventoryPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [selectedVendorPreference, setSelectedVendorPreference] = useState(null);
  const [companyRequirementOpen, setCompanyRequirementOpen] = useState(false);
  const [showCompanyAllocationForm, setShowCompanyAllocationForm] = useState(false);
  const [vendorRequirementOpen, setVendorRequirementOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') !== 'add-company-requirement') return;
    setShowCompanyAllocationForm(true);
    const next = new URLSearchParams(searchParams);
    next.delete('action');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const { booking, bookingQuery } = useOutletContext();
  const inventoryQuery = useQuery({ queryKey: ['event-booking-inventory', eventId], queryFn: async () => (await AdminService.getEventInventory({ eventId, limit: 100 })).data, enabled: Boolean(eventId) });
  const managersQuery = useQuery({ queryKey: ['event-booking-managers'], queryFn: async () => (await AdminService.getEventBookingManagers({ limit: 100 })).data });
  const employees = getEmployees(managersQuery.data);
  const functions = useMemo(() => booking?.functions || [], [booking]);
  const vendors = useMemo(() => {
    const byId = new Map();
    (booking?.vendorAssignments || []).forEach((assignment) => {
      const vendor = assignment.vendor;
      if (vendor && idOf(vendor)) byId.set(idOf(vendor), vendor);
    });
    return [...byId.values()];
  }, [booking]);
  const services = useMemo(() => Array.from(new Set([...(booking?.servicesRequired || []), ...(booking?.servicesSelected || []).map((item) => item.name || item.service).filter(Boolean)])), [booking]);
  const metrics = useMemo(() => ({ functions: functions.length, services: services.length, peakGuests: Math.max(Number(booking?.guestCount || 0), ...functions.map((item) => Number(item.guestCount || 0))), preferences: getFinalPreferenceCount(booking), approvals: (booking?.approvals || []).filter((item) => item.status === 'Pending').length }), [booking, functions, services]);

  const linkedCustomer = booking?.customer && typeof booking.customer === 'object' ? booking.customer : {};
  const customerId = linkedCustomer._id || (typeof booking?.customer === 'string' ? booking.customer : '');
  const inventoryData = useMemo(() => {
    const preferencesById = new Map((linkedCustomer.visualPreferences || booking?.visualPreferences || [])
      .map((preference) => [idOf(preference), preference]));
    return {
      ...inventoryQuery.data,
      inventory: (inventoryQuery.data?.inventory || []).map((requirement) => {
        if (requirement.itemImage) return requirement;
        const preference = preferencesById.get(idOf(requirement.visualPreference));
        return { ...requirement, itemImage: preference?.image || preference?.imageUrl || '' };
      }),
    };
  }, [booking?.visualPreferences, inventoryQuery.data, linkedCustomer.visualPreferences]);
  const inventoryMutation = useMutation({
    mutationFn: (payload) => AdminService.updateEventInventoryRequirement({ eventId, requirementId: selectedRequirement._id, ...payload }),
    onSuccess: async () => {
      toast.success('Inventory requirement updated');
      setCompanyRequirementOpen(false);
      setSelectedRequirement(null);
      await Promise.all([inventoryQuery.refetch(), bookingQuery.refetch()]);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Unable to update inventory requirement'),
  });
  const vendorRequirementMutation = useMutation({
    mutationFn: async (formData) => {
      if (!customerId) throw new Error('This booking is not linked to a CRM client.');

      const legacyPreference = new FormData();
      ['title', 'functionName', 'category', 'status', 'source', 'likes', 'avoid', 'notes', 'quantity', 'unit', 'vendor'].forEach((key) => {
        const value = formData.get(key);
        if (value !== null && value !== undefined) legacyPreference.set(key, value);
      });
      const image = formData.get('image');
      const hasUploadedImage = image && typeof image !== 'string' && typeof image.arrayBuffer === 'function';
      if (hasUploadedImage) legacyPreference.set('image', image, image.name || 'vendor-requirement-image');
      if (!selectedVendorPreference?._id && !hasUploadedImage) {
        throw new Error('Please upload a reference image before adding the vendor requirement.');
      }
      legacyPreference.set('fulfilmentSource', 'Vendor');
      legacyPreference.set('recordStatus', 'Saved');

      const preferenceResponse = selectedVendorPreference?._id
        ? await AdminService.adminUpdateCustomerPreference({ eventId, customerId, preferenceId: selectedVendorPreference._id, formData: legacyPreference })
        : await AdminService.adminAddCustomerPreference({ eventId, customerId, formData: legacyPreference });
      const savedPreference = selectedVendorPreference?._id
        ? preferenceResponse.data?.visualPreferences?.find((item) => idOf(item) === idOf(selectedVendorPreference))
        : preferenceResponse.data?.visualPreferences?.at(-1);
      const selectedFunctionIds = String(formData.get('appliesToFunctionIds') || '').split(',').filter(Boolean);
      const selectedFunctions = functions.filter((item) => selectedFunctionIds.includes(idOf(item)));
      const selectedFunction = functions.find((item) => item.name === String(formData.get('functionName') || ''));
      const coordinatorId = String(formData.get('coordinator') || '');

      const requirementPayload = {
        eventId,
        source: 'Vendor',
        visualPreference: savedPreference?._id || null,
        itemImage: savedPreference?.image || savedPreference?.imageUrl || selectedRequirement?.itemImage || '',
        itemName: String(formData.get('title') || '').trim(),
        category: String(formData.get('category') || '').trim(),
        unitLabel: String(formData.get('unit') || 'pcs'),
        requiredQuantity: Number(formData.get('quantity')),
        reservedQuantity: selectedRequirement ? Number(selectedRequirement.reservedQuantity || 0) : 0,
        vendor: formData.get('vendor') || null,
        appliesToFunctions: selectedFunctions.length ? selectedFunctions.map((item) => item._id) : (selectedFunction ? [selectedFunction._id] : []),
        appliesToLabel: selectedFunctions.length ? selectedFunctions.map((item) => item.name).join(', ') : (selectedFunction?.name || String(formData.get('functionName') || '') || 'All Functions'),
        dispatchAt: formData.get('deliveryAt') || null,
        returnAt: formData.get('returnAt') || null,
        coordinator: coordinatorId || null,
        coordinatorName: employees.find((item) => idOf(item) === coordinatorId)?.name || '',
        status: selectedRequirement?.status || 'Pending',
        notes: [formData.get('likes'), formData.get('notes')].filter(Boolean).join(' · '),
      };
      if (selectedRequirement?._id) {
        await AdminService.updateEventInventoryRequirement({ ...requirementPayload, requirementId: selectedRequirement._id });
      } else {
        await AdminService.addEventInventoryRequirement(requirementPayload);
      }
      return preferenceResponse;
    },
    onSuccess: async () => {
      toast.success(selectedRequirement ? 'Vendor requirement updated' : 'Vendor requirement added');
      setVendorRequirementOpen(false);
      setSelectedRequirement(null);
      setSelectedVendorPreference(null);
      await Promise.all([inventoryQuery.refetch(), bookingQuery.refetch()]);
    },
    onError: (error) => toast.error(error.response?.data?.message || error.message || 'Unable to add vendor requirement'),
  });

  if (bookingQuery.isLoading || inventoryQuery.isLoading) return <div className="crm-page grid min-h-[70vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="crm-page p-5"><Card className="crm-card"><CardContent className="p-8 text-center"><p className="font-semibold">Event booking not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assigned-events')}>Back to bookings</Button></CardContent></Card></div>;

  const openAdd = (source) => {
    setSelectedRequirement(null);
    setSelectedVendorPreference(null);
    if (source === 'Company') {
      setShowCompanyAllocationForm(true);
      return;
    }
    if (!customerId) {
      toast.error('This booking is not linked to a CRM client.');
      return;
    }
    setVendorRequirementOpen(true);
  };
  const openView = (item) => {
    setSelectedRequirement(item);
    if (item.source === 'Vendor') {
      const preferences = linkedCustomer.visualPreferences || booking?.visualPreferences || [];
      setSelectedVendorPreference(preferences.find((preference) => idOf(preference) === idOf(item.visualPreference)) || null);
      setVendorRequirementOpen(true);
      return;
    }
    setCompanyRequirementOpen(true);
  };

  return <div className="min-w-0 space-y-3">
    <EventSummaryCards metrics={metrics} />
    <div id="event-inventory"><EventInventoryPanel data={inventoryData} onAdd={openAdd} onView={openView} /></div>
    <InventoryRequirementDialog open={companyRequirementOpen} onOpenChange={(open) => { setCompanyRequirementOpen(open); if (!open) setSelectedRequirement(null); }} requirement={selectedRequirement} functions={functions} employees={employees} vendors={vendors} source="Company" saving={inventoryMutation.isPending} onSave={(payload) => inventoryMutation.mutate(payload)} />
    <Dialog open={showCompanyAllocationForm} onOpenChange={setShowCompanyAllocationForm}>
      <DialogContent className="h-[92vh] max-w-[96vw] overflow-y-auto p-5 sm:max-w-6xl">
        <DialogHeader className="sr-only"><DialogTitle>Create Company Inventory Allocation</DialogTitle></DialogHeader>
        <CreateEventAllocationPage
          initialEvent={booking}
          hideCloseButton
          hideBackButton
          RequirementWorkspace={AllocationRequirementWorkspace}
          onBack={() => setShowCompanyAllocationForm(false)}
          onCreated={async () => {
            setShowCompanyAllocationForm(false);
            await Promise.all([inventoryQuery.refetch(), bookingQuery.refetch()]);
          }}
        />
      </DialogContent>
    </Dialog>
    <VendorRequirementDialog
      open={vendorRequirementOpen}
      onOpenChange={(open) => {
        setVendorRequirementOpen(open);
        if (!open) {
          setSelectedRequirement(null);
          setSelectedVendorPreference(null);
        }
      }}
      eventId={eventId}
      mode={selectedRequirement ? 'edit' : 'add'}
      preference={selectedVendorPreference}
      initialRequirement={selectedRequirement?.source === 'Vendor' ? selectedRequirement : null}
      eventFunctions={functions}
      coordinators={employees}
      isSaving={vendorRequirementMutation.isPending}
      onSubmit={(formData) => vendorRequirementMutation.mutate(formData)}
    />
  </div>;
}
