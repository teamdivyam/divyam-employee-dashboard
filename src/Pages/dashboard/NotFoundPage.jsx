import React from "react";
import { NavLink } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";

import { Button } from "@components/components/ui/button";
import {
  Card,
  CardContent,
} from "@components/components/ui/card";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
      <Card className="w-full max-w-lg border-border shadow-sm">
        <CardContent className="flex flex-col items-center p-10 text-center">
          <div
            className="
              mb-6
              flex
              h-16
              w-16
              items-center
              justify-center
              rounded-2xl
              bg-primary/10
              text-primary
            "
          >
            <AlertTriangle className="h-8 w-8" />
          </div>

          <div className="text-6xl font-bold tracking-tight text-primary">
            404
          </div>

          <h1 className="mt-3 text-xl font-semibold">
            Page Not Found
          </h1>

          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            The page you are looking for does not exist, has been moved,
            or you may not have permission to access it.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              variant="default"
            >
              <NavLink to="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </NavLink>
            </Button>

            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}