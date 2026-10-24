import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  CalendarDays,
  CheckSquare,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Settings2,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import AdminService from "../../../services/event-booking-workspace.service";
import TabComp from "@components/components/tab-comp";
import { Button } from "@components/components/ui/button";
import {
  getBookingDetail,
  getEmployees,
} from "./components/EventBookingComponents";
import { EventSummaryContext } from "./components/EventSummaryContext";
import EventBookingClientHeader from "./components/EventBookingClientHeader";
import AddBookingDialog from "./components/AddBookingDialog";

const tabs = [
  { value: "overview", label: "Overview", icon: CheckCircle2 },
  { value: "plan", label: "Event Plan", icon: CalendarDays },
  { value: "operations", label: "Operations", icon: Settings2 },
  { value: "finance", label: "Finance & Files", icon: WalletCards },
  { value: "post-event-review", label: "Post-Event Review", icon: CheckSquare },
  { value: "activity", label: "Activity", icon: ClipboardCheck },
];
const destinations = {
  overview: "",
  plan: "/plan/functions",
  operations: "/operations",
  finance: "/finance",
  "post-event-review": "/post-event-review",
  activity: "/activity",
};

export default function EventBookingLayout() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = `/dashboard/assigned-events/${eventId}`;
  const section = pathname.slice(basePath.length).split("/")[1];
  const activeTab = Object.hasOwn(destinations, section) ? section : "overview";
  const isInventory = pathname === `${basePath}/operations/inventory`;
  const inventoryScrollRef = useCallback((page) => {
    if (!page || !isInventory) return;
    const header = page.querySelector('[data-event-locked-header]');
    const tabs = page.querySelector('[data-event-primary-tabs]');
    if (!header || !tabs) return;
    const update = () => {
      const headerHeight = header.getBoundingClientRect().height;
      page.style.setProperty('--event-locked-header-height', `${headerHeight}px`);
      page.style.setProperty('--event-inventory-header-offset', `${headerHeight + tabs.getBoundingClientRect().height}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(header);
    observer.observe(tabs);
    return () => {
      observer.disconnect();
      page.style.removeProperty('--event-locked-header-height');
      page.style.removeProperty('--event-inventory-header-offset');
    };
  }, [isInventory]);
  const [summaryTarget, setSummaryTarget] = useState(null);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const bookingQuery = useQuery({
    queryKey: ["event-booking-detail", eventId],
    queryFn: async () =>
      (await AdminService.getEventBookingDetail({ eventId })).data,
    enabled: Boolean(eventId),
  });
  const booking = getBookingDetail(bookingQuery.data);
  const managersQuery = useQuery({
    queryKey: ["event-booking-managers"],
    queryFn: async () =>
      (await AdminService.getEventBookingManagers({ limit: 100 })).data,
  });
  const employees = getEmployees(managersQuery.data);
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["event-booking-detail", eventId],
      }),
      queryClient.invalidateQueries({ queryKey: ["event-bookings"] }),
      queryClient.invalidateQueries({ queryKey: ["event-booking-analytics"] }),
    ]);
  const bookingFormMutation = useMutation({
    mutationFn: (formData) =>
      AdminService.updateEventBookingForm({ eventId, formData }),
    onSuccess: (response) => {
      toast.success(response?.data?.message || "Booking updated");
      setBookingFormOpen(false);
      refresh();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || "Unable to update booking"),
  });

  useEffect(() => {
    if (searchParams.get("action") === "edit-booking") setBookingFormOpen(true);
  }, [searchParams]);

  const setBookingDialogOpen = (open) => {
    setBookingFormOpen(open);
    if (!open && searchParams.has("action")) {
      const next = new URLSearchParams(searchParams);
      next.delete("action");
      setSearchParams(next, { replace: true });
    }
  };

  if (bookingQuery.isLoading)
    return (
      <div className="crm-page grid min-h-[70vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (!booking)
    return (
      <div className="crm-page p-5 text-center">
        <p>
          {bookingQuery.isError
            ? "Unable to load event booking"
            : "Event booking not found"}
        </p>
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => bookingQuery.refetch()}
        >
          Try again
        </Button>
      </div>
    );

  return (
    <div ref={inventoryScrollRef} data-event-inventory-page={isInventory || undefined} className="crm-page relative h-[calc(100dvh-4rem)] min-w-0 overflow-auto [&_input[placeholder^='Search']::placeholder]:text-xs [&_input[placeholder^='Search']:focus-visible]:border-primary [&_input[type='search']::placeholder]:text-xs [&_input[type='search']:focus-visible]:border-primary">
      <div className={isInventory ? "contents" : "sticky top-0 z-20 space-y-3 bg-background p-3 pb-4 sm:p-4 lg:p-5 lg:pb-4"}>
        <div data-event-locked-header={isInventory || undefined} className={isInventory ? "sticky top-0 z-30 bg-background p-3 pb-0 sm:p-4 sm:pb-0 lg:p-5 lg:pb-0" : ""}>
        <EventBookingClientHeader
          booking={booking}
          onAssignTask={() =>
            navigate(basePath + "/operations?action=create-task")
          }
          onAllocateItem={() =>
            navigate(
              basePath + "/operations/inventory?action=add-company-requirement",
            )
          }
          onDownloadEvent={() => window.print()}
          onRecordPayment={() =>
            navigate(basePath + "/finance?tab=payments&action=record-payment")
          }
        />
        </div>
        <div ref={setSummaryTarget} className={isInventory ? "min-w-0 mx-3 mt-3 empty:hidden sm:mx-4 lg:mx-5" : "min-w-0 empty:hidden"} />
        <div data-event-primary-tabs={isInventory || undefined} className={isInventory ? "sticky top-[var(--event-locked-header-height,0px)] z-20 mt-3 mb-4 bg-background px-3 sm:px-4 lg:px-5" : ""}>
        <TabComp
          tabs={tabs}
          value={activeTab}
          onValueChange={(value) => navigate(basePath + destinations[value])}
          distribution="content"
          density="compact"
          ariaLabel="Event sections"
        />
        </div>
      </div>
      <div className="min-w-0 px-3 pb-3 sm:px-4 sm:pb-4 lg:px-5 lg:pb-5 [&>.crm-page]:!min-h-0 [&>.crm-page]:!p-0">
        <EventSummaryContext.Provider value={summaryTarget}>
          <Outlet
            context={{
              booking,
              bookingQuery,
              openBookingEdit: () => setBookingFormOpen(true),
              openBookingSnapshotEdit: () => setBookingFormOpen(true),
            }}
          />
        </EventSummaryContext.Provider>
      </div>
      <AddBookingDialog
        open={bookingFormOpen}
        onOpenChange={setBookingDialogOpen}
        booking={booking}
        customers={booking.customer ? [booking.customer] : []}
        employees={employees}
        mode="edit"
        saving={bookingFormMutation.isPending}
        onSubmit={(payload) => bookingFormMutation.mutate(payload)}
      />
    </div>
  );
}
