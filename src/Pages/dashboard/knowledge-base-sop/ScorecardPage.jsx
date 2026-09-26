import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Star, TrendingUp, UsersRound } from "lucide-react";
import EmployeeV2Service from "@/services/employee-v2.service";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import TabComp from "@components/components/tab-comp";
import {
  FeedbackSummary,
  GoalDialog,
  GoalsPanel,
  InsightList,
  RecentComments,
  ScoreBreakdown,
  ScorecardError,
  ScorecardHeader,
  ScorecardSkeleton,
  ScoreOverview,
  TeamFeedbackPanel,
  TeamFeedbackDialog,
  TrendPanel,
} from "./components/ScorecardComponents";

const SCORECARD_TABS = [
  { value: "performance", label: "My Performance", icon: TrendingUp },
  { value: "team-feedback", label: "Team Feedback", icon: UsersRound },
];
const VALID_TABS = new Set(SCORECARD_TABS.map((tab) => tab.value));

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const emptyFeedbackForm = () => ({
  ratings: {
    teamworkSupport: 0,
    responsibilityReliability: 0,
    communication: 0,
    professionalConduct: 0,
  },
  notObserved: {
    teamworkSupport: false,
    responsibilityReliability: false,
    communication: false,
    professionalConduct: false,
  },
  appreciation: "",
  improvementSuggestion: "",
});

export default function ScorecardPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = VALID_TABS.has(requestedTab) ? requestedTab : "performance";
  const [month, setMonth] = useState(currentMonth);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [feedbackForm, setFeedbackForm] = useState(emptyFeedbackForm);
  const [feedbackFilters, setFeedbackFilters] = useState({
    search: "",
    status: "All",
  });
  const [selectedFeedbackEmployee, setSelectedFeedbackEmployee] = useState(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const debouncedFeedbackSearch = useDebouncedValue(feedbackFilters.search, 300);

  useEffect(() => {
    if (requestedTab && !VALID_TABS.has(requestedTab)) {
      const next = new URLSearchParams(searchParams);
      next.delete("tab");
      setSearchParams(next, { replace: true });
    }
  }, [requestedTab, searchParams, setSearchParams]);

  const handleTabChange = (value) => {
    const next = new URLSearchParams(searchParams);
    if (value === "performance") next.delete("tab");
    else next.set("tab", value);
    setSearchParams(next);
  };

  const scorecardQuery = useQuery({
    queryKey: ["my-scorecard", month],
    queryFn: async ({ signal }) => {
      const response = await EmployeeV2Service.getMyScorecard({
        month,
        signal,
      });
      return response.data?.data ?? null;
    },
    enabled: activeTab === "performance" && Boolean(month),
    staleTime: 60 * 1000,
  });

  const teamFeedbackQuery = useQuery({
    queryKey: ["my-team-feedback", month, debouncedFeedbackSearch, feedbackFilters.status],
    queryFn: async ({ signal }) => {
      const response = await EmployeeV2Service.getMyTeamFeedbackDashboard({
        month,
        search: debouncedFeedbackSearch || undefined,
        status: feedbackFilters.status,
        signal,
      });
      return response.data?.data ?? null;
    },
    enabled: activeTab === "team-feedback",
    placeholderData: (previous) => previous,
    staleTime: 30 * 1000,
  });

  const feedbackSubmissionQuery = useQuery({
    queryKey: ["my-team-feedback-submission", month, selectedFeedbackEmployee?._id],
    queryFn: async ({ signal }) => {
      const response = await EmployeeV2Service.getMyTeamFeedbackSubmission({
        employeeId: selectedFeedbackEmployee._id,
        month,
        signal,
      });
      return response.data?.data?.submission ?? null;
    },
    enabled:
      feedbackDialogOpen &&
      selectedFeedbackEmployee?.status === "Completed",
  });

  const invalidateScorecard = () =>
    queryClient.invalidateQueries({ queryKey: ["my-scorecard", month] });

  const addGoalMutation = useMutation({
    mutationFn: (text) => EmployeeV2Service.addMyScorecardGoal({ month, text }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Goal added successfully");
      setGoalText("");
      setGoalDialogOpen(false);
      invalidateScorecard();
    },
    onError: (error) => toast.error(errorMessage(error, "Unable to add goal")),
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ goalId, isCompleted }) =>
      EmployeeV2Service.updateMyScorecardGoal({ goalId, isCompleted }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Goal updated");
      invalidateScorecard();
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Unable to update goal")),
  });

  const feedbackMutation = useMutation({
    mutationFn: (form) =>
      EmployeeV2Service.submitScorecardFeedback({
        ratings: Object.fromEntries(
          Object.entries(form.ratings).map(([key, rating]) => [
            key,
            form.notObserved[key] ? null : rating,
          ]),
        ),
        appreciation: form.appreciation,
        improvementSuggestion: form.improvementSuggestion,
        employeeId: selectedFeedbackEmployee?._id,
        month,
      }),
    onSuccess: (response) => {
      toast.success(
        response.data?.message || "Feedback submitted successfully",
      );
      const nextPendingEmployee = teamFeedbackQuery.data?.employees?.find(
        (employee) =>
          employee.status === "Pending" &&
          employee._id !== selectedFeedbackEmployee?._id,
      );
      setFeedbackForm(emptyFeedbackForm());
      if (nextPendingEmployee) {
        setSelectedFeedbackEmployee(nextPendingEmployee);
      } else {
        setFeedbackDialogOpen(false);
        setSelectedFeedbackEmployee(null);
      }
      queryClient.invalidateQueries({ queryKey: ["my-team-feedback"] });
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Unable to submit feedback")),
  });

  const data = scorecardQuery.data;
  const scorecard = data?.scorecard;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-4 text-foreground md:p-5">
      <div className="mx-auto max-w-[1800px] space-y-4">
        <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
          <TabComp
            tabs={SCORECARD_TABS}
            value={activeTab}
            onValueChange={handleTabChange}
            variant="detail"
            distribution="content"
            density="compact"
            display="inline-block"
            className="shrink-0"
            ariaLabel="Scorecard sections"
          />
          <ScorecardHeader
            month={month}
            onMonthChange={(value) => value && setMonth(value)}
            status={scorecard?.status}
            showStatus={activeTab === "performance"}
            helpMode={activeTab === "team-feedback" ? "feedback" : "scorecard"}
          />
        </div>

        {activeTab === "team-feedback" && teamFeedbackQuery.isError ? (
          <ScorecardError
            message={errorMessage(teamFeedbackQuery.error, "Please try again.")}
            onRetry={() => teamFeedbackQuery.refetch()}
          />
        ) : activeTab === "team-feedback" ? (
          <TeamFeedbackPanel
            dashboard={teamFeedbackQuery.data}
            filters={feedbackFilters}
            setFilters={setFeedbackFilters}
            isLoading={teamFeedbackQuery.isLoading}
            onOpenSubmission={(employee) => {
              setSelectedFeedbackEmployee(employee);
              setFeedbackForm(emptyFeedbackForm());
              setFeedbackDialogOpen(true);
            }}
          />
        ) : scorecardQuery.isLoading ? (
          <ScorecardSkeleton />
        ) : scorecardQuery.isError ? (
          <ScorecardError
            message={errorMessage(scorecardQuery.error, "Please try again.")}
            onRetry={() => scorecardQuery.refetch()}
          />
        ) : (
          <div className="space-y-4">
            <ScoreOverview scorecard={scorecard} />

            <div className="grid items-start gap-4 2xl:grid-cols-[1.2fr_1fr]">
              <ScoreBreakdown components={scorecard?.components} />
              <div className="space-y-4">
                <TrendPanel trend={data?.trend} />
                <FeedbackSummary
                  feedback={data?.feedbackSummary}
                  notice={data?.confidentialityNotice}
                />
              </div>
            </div>

            <div className="grid items-stretch gap-4 md:grid-cols-2 2xl:grid-cols-4">
              <InsightList
                title="Your Strengths"
                subtitle="What you are doing really well."
                icon={Star}
                items={data?.strengths}
              />
              <InsightList
                title="Top Areas for Improvement"
                subtitle="Focus on these areas to grow further."
                icon={TrendingUp}
                items={data?.improvementAreas}
                numbered
              />
              <GoalsPanel
                goals={data?.goals}
                onAdd={() => setGoalDialogOpen(true)}
                onToggle={(goal) =>
                  updateGoalMutation.mutate({
                    goalId: goal._id,
                    isCompleted: !goal.isCompleted,
                  })
                }
                isUpdating={updateGoalMutation.isPending}
              />
              <RecentComments comments={data?.recentComments} />
            </div>
          </div>
        )}
      </div>

      <GoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        value={goalText}
        onValueChange={setGoalText}
        onSubmit={(event) => {
          event.preventDefault();
          if (goalText.trim()) addGoalMutation.mutate(goalText.trim());
        }}
        isSubmitting={addGoalMutation.isPending}
      />
      <TeamFeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={(open) => {
          setFeedbackDialogOpen(open);
          if (!open) setSelectedFeedbackEmployee(null);
        }}
        employee={selectedFeedbackEmployee}
        submission={feedbackSubmissionQuery.data}
        summary={teamFeedbackQuery.data?.summary}
        month={month}
        isLoading={feedbackSubmissionQuery.isLoading}
        form={feedbackForm}
        setForm={setFeedbackForm}
        onSubmit={(event) => {
          event.preventDefault();
          feedbackMutation.mutate(feedbackForm);
        }}
        isSubmitting={feedbackMutation.isPending}
      />
    </div>
  );
}
