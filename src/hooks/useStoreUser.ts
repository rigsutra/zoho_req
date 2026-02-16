import { useUser, useAuth } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";

export function useStoreUser() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const ensureMe = useMutation(api.users.ensureMe);
  const [hasSynced, setHasSynced] = useState(false);
  const retryCount = useRef(0);

  useEffect(() => {
    if (!isAuthLoaded || !isUserLoaded || !isSignedIn || !user || hasSynced) return;

    const sync = async () => {
      try {
        await ensureMe({
          email: user.primaryEmailAddress?.emailAddress ?? "",
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? undefined,
          imageUrl: user.imageUrl ?? undefined,
        });
        setHasSynced(true);
      } catch (err) {
        console.error(
          "Failed to sync user to Convex (attempt " +
            (retryCount.current + 1) +
            "):",
          err
        );
        // Retry up to 5 times — Convex auth token may not be ready yet
        if (retryCount.current < 5) {
          retryCount.current += 1;
          setTimeout(sync, 1000 * retryCount.current);
        }
      }
    };
    sync();
  }, [isAuthLoaded, isUserLoaded, isSignedIn, user, hasSynced, ensureMe]);

  return hasSynced;
}
