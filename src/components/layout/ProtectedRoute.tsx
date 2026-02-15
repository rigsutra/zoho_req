import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { useRole } from "@/hooks/useRole";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  requiredRole: "admin" | "employee";
  children: React.ReactNode;
}

export function ProtectedRoute({ requiredRole, children }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const { role, isLoading } = useRole();

  if (!isLoaded || isLoading) {
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

  if (!role) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Setting up your account...</h2>
          <p className="text-muted-foreground">Please wait while we configure your profile.</p>
        </div>
      </div>
    );
  }

  if (role !== requiredRole) {
    const redirectTo = role === "admin" ? "/admin" : "/employee";
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
