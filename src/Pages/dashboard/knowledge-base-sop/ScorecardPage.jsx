import React from "react";
import {
  ActivityPanel,
  ConfidentialPanel,
  FeedbackPanel,
  ListCard,
  ManagerRemarks,
  PageHeader,
  ScoreBreakdown,
  ScoreMetrics,
  scorecardData,
  TrendPanel,
} from "./components/ScorecardComponents";
import { Star, TrendingUp } from "lucide-react";

export default function ScorecardPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto max-w-[1700px] space-y-5">
        <PageHeader />
        <ScoreMetrics metrics={scorecardData.metrics} />

        <div className="grid items-start gap-4 xl:grid-cols-12">
          <ScoreBreakdown items={scorecardData.breakdown} className="xl:col-span-4 xl:row-span-2" />
          <FeedbackPanel feedback={scorecardData.feedback} className="xl:col-span-5 xl:min-h-[345px]" />
          <TrendPanel trend={scorecardData.trend} className="xl:col-span-3 xl:min-h-[345px]" />

          <ActivityPanel activity={scorecardData.activity} className="xl:col-span-8 xl:min-h-[165px]" />

          <ListCard title="Strengths" icon={Star} items={scorecardData.strengths} className="xl:col-span-4 xl:min-h-[270px]" />
          <ListCard title="Improvement Areas" icon={TrendingUp} items={scorecardData.improvements} tone="orange" className="xl:col-span-5 xl:min-h-[270px]" />
          <ManagerRemarks className="xl:col-span-3 xl:min-h-[270px]" />

          <ConfidentialPanel className="xl:col-span-12" />
        </div>
      </div>
    </div>
  );
}
