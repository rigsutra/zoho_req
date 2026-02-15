import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useRole() {
  const user = useQuery(api.users.getMe);
  return {
    role: user?.role ?? null,
    isAdmin: user?.role === "admin",
    isEmployee: user?.role === "employee",
    isLoading: user === undefined,
    user,
  };
}
