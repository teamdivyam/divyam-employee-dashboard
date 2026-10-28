import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import SuspenseLoader from "../components/components/SuspenseLoader";
import useAuthSession from "../hooks/useAuthSession";
import { useQueryClient } from '@tanstack/react-query';
import { disconnectSocket } from '../services/socket';

// Route element children are supplied by the router configuration.
// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { data: session, isPending, isError, refetch } = useAuthSession();
  const client = useQueryClient();
  const accountId = session?.employeeId;

  useEffect(() => {
    if (!accountId || isError) return;
    return () => {
      disconnectSocket();
      void client.cancelQueries({ queryKey: ['central-command'] });
      client.removeQueries({ queryKey: ['central-command'] });
    };
  }, [accountId, isError, client]);

  useEffect(() => {
    const handleUnauthorized = () => refetch();
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [refetch]);

  if (isPending) {
    return <SuspenseLoader />;
  }

  if (isError || !session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
