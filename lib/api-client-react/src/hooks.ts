import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface GoalRevenue {
  goal: number;
  current: number;
  projected: number;
  percentage: number;
  daysLeft: number;
  onTrack: boolean;
}

export interface GoalMargin {
  goal: number;
  current: number;
  percentage: number;
  onTrack: boolean;
}

export interface GoalsSummary {
  hasGoals: boolean;
  revenue?: GoalRevenue;
  margin?: GoalMargin;
}

export function useGoalsSummary() {
  return useQuery({
    queryKey: ["/api/dashboard/goals"],
    queryFn: ({ signal }) =>
      customFetch<GoalsSummary>("/api/dashboard/goals", { signal }),
  });
}
