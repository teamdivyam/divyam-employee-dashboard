import { useQuery } from "@tanstack/react-query";
import EmployeeV2Service from "../services/employee-v2.service";

export const CURRENT_EMPLOYEE_QUERY_KEY = ["employee", "me"];

export const fetchCurrentEmployee = async () => {
  const response = await EmployeeV2Service.me();
  return response.data?.data?.employee ?? null;
};

const useCurrentEmployee = (options = {}) => useQuery({
  queryKey: CURRENT_EMPLOYEE_QUERY_KEY,
  queryFn: fetchCurrentEmployee,
  retry: false,
  staleTime: 5 * 60 * 1000,
  refetchOnMount: true,
  ...options,
});

export default useCurrentEmployee;
