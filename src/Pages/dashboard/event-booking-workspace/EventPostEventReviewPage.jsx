import { useState } from "react";
import { useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CircleAlert,
  CircleCheck,
  Lightbulb,
  Loader2,
  MessageSquareText,
  Star,
} from "lucide-react";

import TabComp from "@components/components/tab-comp";
import EventBookingWorkspaceService from "../../../services/event-booking-workspace.service";
import EventSummaryCards from "./components/EventSummaryCards";
import nestedTabStyles from "./components/EventNestedTabs.module.css";
import {
  FeedbackLogPanel,
  FeedbackLogToolbar,
  IssuesActionsPanel,
  IssuesActionsToolbar,
  LearningsPanel,
  LearningsToolbar,
  AddFeedbackDialog,
  AddIssueDialog,
  AddLearningDialog,
  RequestFeedbackDialog,
  SUB_TABS,
} from "./components/post-event-review";

export default function EventPostEventReviewPage() {
  const { eventId } = useParams();
  const { booking, bookingQuery } = useOutletContext();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedTab = searchParams.get("tab");
  const activeTab = SUB_TABS.some((tab) => tab.key === requestedTab)
    ? requestedTab
    : "feedback";
  const [addFeedbackOpen, setAddFeedbackOpen] = useState(false);
  const [requestFeedbackOpen, setRequestFeedbackOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [feedbackSource, setFeedbackSource] = useState("all");
  const [feedbackRole, setFeedbackRole] = useState("all");

  // Issues modal state
  const [addIssueOpen, setAddIssueOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [issueSearch, setIssueSearch] = useState("");
  const [issueStatus, setIssueStatus] = useState("all");
  const [issuePriority, setIssuePriority] = useState("all");
  const [addLearningOpen, setAddLearningOpen] = useState(false);
  const [editingLearning, setEditingLearning] = useState(null);
  const [learningSearch, setLearningSearch] = useState("");
  const [learningRelated, setLearningRelated] = useState("all");
  const [learningFunction, setLearningFunction] = useState("all");
  const [learningType, setLearningType] = useState("all");

  // Sync state directly from backend booking object
  const feedbacks = booking?.feedbacks || [];
  const issues = booking?.issues || [];
  const learnings = booking?.learnings || [];
  const ratings = feedbacks
    .map((item) => Number(item.rating))
    .filter((rating) => rating > 0);
  const averageRating = ratings.length
    ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
    : 0;
  const resolvedIssues = issues.filter((item) =>
    ["resolved", "closed", "completed"].includes(
      String(item.status || "").toLowerCase(),
    ),
  ).length;
  const reviewMetrics = [
    {
      label: "Feedback Received",
      value: feedbacks.length,
      caption: "Total entries",
      icon: MessageSquareText,
      tone: "blue",
    },
    {
      label: "Average Rating",
      value: ratings.length ? `${Math.trunc(averageRating * 10) / 10}/5` : "—",
      caption: ratings.length ? `${ratings.length} rated` : "No ratings yet",
      icon: Star,
      tone: "amber",
    },
    {
      label: "Open Issues",
      value: Math.max(0, issues.length - resolvedIssues),
      caption: "Need attention",
      icon: CircleAlert,
      tone: "rose",
    },
    {
      label: "Resolved Issues",
      value: resolvedIssues,
      caption: "Actions completed",
      icon: CircleCheck,
      tone: "emerald",
    },
    {
      label: "Learnings",
      value: learnings.length,
      caption: "Recorded insights",
      icon: Lightbulb,
      tone: "violet",
    },
  ];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["event-booking-detail", eventId] });
  };

  // 1. Feedback mutations
  const addFeedbackMutation = useMutation({
    mutationFn: (payload) => EventBookingWorkspaceService.addEventFeedback({ eventId, ...payload }),
    onSuccess: () => {
      toast.success("Feedback recorded successfully!");
      setAddFeedbackOpen(false);
      setEditingFeedback(null);
      refresh();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to record feedback"),
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: ({ feedbackId, ...payload }) =>
      EventBookingWorkspaceService.updateEventFeedback({ eventId, feedbackId, ...payload }),
    onSuccess: () => {
      toast.success("Feedback updated successfully!");
      setAddFeedbackOpen(false);
      setEditingFeedback(null);
      refresh();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update feedback"),
  });

  // 2. Learning mutations
  const addLearningMutation = useMutation({
    mutationFn: (payload) => EventBookingWorkspaceService.addEventLearning({ eventId, ...payload }),
    onSuccess: () => {
      toast.success("Learning logged successfully!");
      setAddLearningOpen(false);
      setEditingLearning(null);
      refresh();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to add learning"),
  });

  const updateLearningMutation = useMutation({
    mutationFn: ({ learningId, ...payload }) =>
      EventBookingWorkspaceService.updateEventLearning({ eventId, learningId, ...payload }),
    onSuccess: () => {
      toast.success("Learning updated successfully!");
      setAddLearningOpen(false);
      setEditingLearning(null);
      refresh();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Failed to update learning"),
  });

  // 3. Issue mutations
  const addIssueMutation = useMutation({
    mutationFn: (payload) => EventBookingWorkspaceService.addEventPostReviewIssue({ eventId, ...payload }),
    onSuccess: () => {
      toast.success("Issue logged successfully!");
      setAddIssueOpen(false);
      setEditingIssue(null);
      refresh();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to log issue"),
  });

  const updateIssueMutation = useMutation({
    mutationFn: ({ issueId, ...payload }) =>
      EventBookingWorkspaceService.updateEventPostReviewIssue({ eventId, issueId, ...payload }),
    onSuccess: () => {
      toast.success("Issue updated successfully!");
      setAddIssueOpen(false);
      setEditingIssue(null);
      refresh();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update issue"),
  });

  const handleSaveFeedback = (formData) => {
    if (editingFeedback?._id || editingFeedback?.id) {
      const feedbackId = editingFeedback._id || editingFeedback.id;
      updateFeedbackMutation.mutate({ feedbackId, ...formData });
    } else {
      addFeedbackMutation.mutate(formData);
    }
  };

  const handleSaveIssue = (formData) => {
    if (editingIssue?._id || editingIssue?.id) {
      const issueId = editingIssue._id || editingIssue.id;
      updateIssueMutation.mutate({ issueId, ...formData });
    } else {
      addIssueMutation.mutate(formData);
    }
  };

  const handleSaveLearning = (formData) => {
    if (editingLearning?._id || editingLearning?.id) {
      updateLearningMutation.mutate({
        learningId: editingLearning._id || editingLearning.id,
        ...formData,
      });
    } else {
      addLearningMutation.mutate(formData);
    }
  };

  const handleEditClick = (item) => {
    setEditingFeedback(item);
    setAddFeedbackOpen(true);
  };

  const handleEditIssueClick = (item) => {
    setEditingIssue(item);
    setAddIssueOpen(true);
  };

  const handleUpdateIssueStatus = (item, newStatus) => {
    const issueId = item._id || item.id;
    if (issueId) {
      updateIssueMutation.mutate({ issueId, status: newStatus });
    }
  };

  if (bookingQuery?.isLoading) {
    return (
      <div className="crm-page grid min-h-[70vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-3">
      <EventSummaryCards metricItems={reviewMetrics} />

      <TabComp
        tabs={SUB_TABS.map((tab) => {
          const icon = {
            feedback: MessageSquareText,
            issues: CircleAlert,
            learnings: Lightbulb,
          }[tab.key];
          return {
            value: tab.key,
            icon,
            label: tab.label,
          };
        })}
        value={activeTab}
        onValueChange={(value) => {
          const next = new URLSearchParams(searchParams);
          if (value === "feedback") next.delete("tab");
          else next.set("tab", value);
          setSearchParams(next, { replace: true });
        }}
        variant="detail"
        distribution="content"
        density="compact"
        ariaLabel="Post-event review sections"
        className={nestedTabStyles.nestedTabs}
        listClassName="!border-0 !bg-transparent !shadow-none"
        toolbarClassName="border-b border-border bg-card px-2 py-1 xl:gap-2"
        actions={activeTab === "feedback" ? (
          <FeedbackLogToolbar
            search={feedbackSearch}
            onSearchChange={setFeedbackSearch}
            filterSource={feedbackSource}
            onSourceChange={setFeedbackSource}
            filterRole={feedbackRole}
            onRoleChange={setFeedbackRole}
            onRequestFeedback={() => setRequestFeedbackOpen(true)}
            onAddNew={() => {
              setEditingFeedback(null);
              setAddFeedbackOpen(true);
            }}
          />
        ) : activeTab === "issues" ? (
          <IssuesActionsToolbar
            searchTerm={issueSearch}
            onSearchChange={setIssueSearch}
            statusFilter={issueStatus}
            onStatusChange={setIssueStatus}
            priorityFilter={issuePriority}
            onPriorityChange={setIssuePriority}
            onAddIssue={() => {
              setEditingIssue(null);
              setAddIssueOpen(true);
            }}
          />
        ) : (
          <LearningsToolbar
            learnings={learnings}
            search={learningSearch}
            onSearchChange={setLearningSearch}
            relatedFilter={learningRelated}
            onRelatedChange={setLearningRelated}
            functionFilter={learningFunction}
            onFunctionChange={setLearningFunction}
            typeFilter={learningType}
            onTypeChange={setLearningType}
            onAddLearning={() => {
              setEditingLearning(null);
              setAddLearningOpen(true);
            }}
          />
        )}
      />

      {/* Sub Tab View Components */}
      {activeTab === "feedback" && (
        <FeedbackLogPanel
          feedbacks={feedbacks}
          search={feedbackSearch}
          filterSource={feedbackSource}
          filterRole={feedbackRole}
          onEdit={handleEditClick}
          onAddNew={() => {
            setEditingFeedback(null);
            setAddFeedbackOpen(true);
          }}
        />
      )}

      {activeTab === "issues" && (
        <IssuesActionsPanel
          issues={issues}
          searchTerm={issueSearch}
          statusFilter={issueStatus}
          priorityFilter={issuePriority}
          onAddIssue={() => {
            setEditingIssue(null);
            setAddIssueOpen(true);
          }}
          onEditIssue={handleEditIssueClick}
          onUpdateStatus={handleUpdateIssueStatus}
        />
      )}

      {activeTab === "learnings" && (
        <LearningsPanel
          learnings={learnings}
          search={learningSearch}
          relatedFilter={learningRelated}
          functionFilter={learningFunction}
          typeFilter={learningType}
          onAddLearning={() => {
            setEditingLearning(null);
            setAddLearningOpen(true);
          }}
          onEditLearning={(item) => {
            setEditingLearning(item);
            setAddLearningOpen(true);
          }}
        />
      )}

      {/* Add / Edit Feedback Dialog */}
      <AddFeedbackDialog
        open={addFeedbackOpen}
        onOpenChange={(open) => {
          if (addFeedbackMutation.isPending || updateFeedbackMutation.isPending) return;
          setAddFeedbackOpen(open);
          if (!open) setEditingFeedback(null);
        }}
        booking={booking}
        initialData={editingFeedback}
        saving={addFeedbackMutation.isPending || updateFeedbackMutation.isPending}
        onSave={handleSaveFeedback}
      />

      {/* Add / Edit Issue Dialog */}
      <AddIssueDialog
        open={addIssueOpen}
        onOpenChange={(open) => {
          if (addIssueMutation.isPending || updateIssueMutation.isPending) return;
          setAddIssueOpen(open);
          if (!open) setEditingIssue(null);
        }}
        booking={booking}
        initialData={editingIssue}
        saving={addIssueMutation.isPending || updateIssueMutation.isPending}
        onSave={handleSaveIssue}
      />

      <AddLearningDialog
        open={addLearningOpen}
        onOpenChange={(open) => {
          if (addLearningMutation.isPending || updateLearningMutation.isPending) return;
          setAddLearningOpen(open);
          if (!open) setEditingLearning(null);
        }}
        booking={booking}
        initialData={editingLearning}
        saving={addLearningMutation.isPending || updateLearningMutation.isPending}
        onSave={handleSaveLearning}
      />

      {/* Request Feedback Dialog */}
      <RequestFeedbackDialog
        open={requestFeedbackOpen}
        onOpenChange={setRequestFeedbackOpen}
        booking={booking}
      />
    </div>
  );
}



