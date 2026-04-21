import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Fire-and-forget: aceita convites pendentes em qualquer login
        if (event === "SIGNED_IN" && session?.user?.email) {
          const uid = session.user.id;
          const email = session.user.email;
          setTimeout(() => {
            supabase
              .rpc("accept_pending_invites", { _user_id: uid, _email: email })
              .then(({ error }) => {
                if (error) console.warn("accept_pending_invites (auth):", error);
              });
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, user, loading, signOut };
}
