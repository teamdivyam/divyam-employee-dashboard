import React from "react";
import { Badge } from "@components/components/ui/badge";

export default function BadgeStatus({ status }) {
  switch (status) {
    case "active":
      return (
        <Badge
          variant="secondary"
          className="bg-green-500 text-white dark:bg-green-600"
        >
          {status}
        </Badge>
      );
    case "inactive":
      return (
        <Badge
          variant="destructive"
          className="bg-red-500 text-white dark:bg-red-600"
        >
          {status}
        </Badge>
      );
  }

  return <Badge>{status}</Badge>;
}
