import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import Service from '@/services/central-command.service';
import { errorMessage } from './centralCommand.utils';

export function useCommandQuery(path, params = {}, enabled = true, poll = false) {
  return useQuery({
    queryKey: ['central-command', path, params],
    queryFn: ({ signal }) => Service.list(path, params, signal),
    enabled, retry: false, refetchInterval: poll ? query => query.state.error ? false : 15000 : false, refetchIntervalInBackground: false,
  });
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
