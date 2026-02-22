import { useAuth, UserButton } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  requiredRole: "admin" | "employee";
  children: React.ReactNode;
}

export function ProtectedRoute({
  requiredRole,
  children,
}: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const data = useQuery(api.users.getMeWithEmployee);

  if (!isLoaded || data === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  // User record not yet created in Convex
  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Setting up your account...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we configure your profile.
          </p>
        </div>
      </div>
    );
  }

  const role = data.user.role;

  // Wrong role for this route — redirect
  if (role !== requiredRole) {
    const redirectTo = role === "admin" ? "/admin" : "/employee";
    return <Navigate to={redirectTo} replace />;
  }

  // Employee must have an employee profile created by admin
  if (requiredRole === "employee" && !data.employee) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md rounded-lg border bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl">
            &#128336;
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Profile Not Set Up Yet
          </h2>
          <p className="text-muted-foreground mb-4">
            Welcome, {data.user.firstName}! Your account has been created, but
            an admin needs to set up your employee profile before you can access
            the portal.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Please contact your HR administrator to complete the setup.
          </p>
          <div className="flex justify-center">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
