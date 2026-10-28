import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import Service from '@/services/central-command.service';
import { errorMessage } from './centralCommand.utils';
import useAuthSession from '@/hooks/useAuthSession';

export function useCommandQuery(path, params = {}, enabled = true) {
  const { data: session } = useAuthSession();
  const query = useQuery({
    queryKey: ['central-command', path, params, session?.employeeId],
    queryFn: ({ signal }) => Service.list(path, params, signal),
    enabled: enabled && !!session?.employeeId, retry: false,
  });
  // Never expose previously cached records after HTTP revokes access.
  return [401, 403, 404].includes(query.error?.response?.status) ? { ...query, data: undefined } : query;
}
export function useCommandMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: operation => operation(),
    onSuccess: () => client.invalidateQueries({ queryKey: ['central-command'] }),
    onError: error => {
      toast.error(errorMessage(error));
      if ([403, 404, 409].includes(error.response?.status)) client.invalidateQueries({ queryKey: ['central-command'] });
    },
  });
}
