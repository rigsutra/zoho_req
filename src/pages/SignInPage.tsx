import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { useRole } from "@/hooks/useRole";

export function SignInPage() {
  const { isSignedIn } = useAuth();
  const { role } = useRole();

  if (isSignedIn && role) {
    const redirectTo = role === "admin" ? "/admin" : "/employee";
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignIn routing="hash" />
    </div>
  );
}
