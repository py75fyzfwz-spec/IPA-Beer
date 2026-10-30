"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NewPasswordForm } from "@/components/NewPasswordForm";
import { saveNewPerDay } from "@/lib/progress";
import { createClient } from "@/lib/supabase/client";

const OPTIONS = [5, 10, 15, 20, 30];

export function AccountSettings() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [newPerDay, setNewPerDay] = useState(10);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUser({ id: data.user.id, email: data.user.email });
      const profile = await supabase.from("profiles").select("new_per_day").maybeSingle();
      if (profile.data) setNewPerDay(profile.data.new_per_day);
    })();
  }, []);

  async function changeLimit(value: number) {
    if (!user) return;
    setNewPerDay(value);
    setSaved(null);
    try {
      await saveNewPerDay(createClient(), user.id, value);
      setSaved("Saved.");
    } catch {
      setSaved("Couldn't save. Check your connection and try again.");
    }
  }

  async function logOut() {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Account</h1>
        {user?.email && <p className="text-muted">{user.email}</p>}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">New cards per day</h2>
        <p className="text-sm text-muted">Reviews of cards you already know are never limited.</p>
        <select
          id="new-per-day"
          value={newPerDay}
          onChange={(e) => changeLimit(Number(e.target.value))}
          className="self-start rounded-md border border-line bg-surface px-3 py-2"
        >
          {OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {saved && <p className="text-sm text-muted" role="status">{saved}</p>}
      </section>

      <section className="flex max-w-sm flex-col gap-2">
        <h2 className="font-bold">Change password</h2>
        <NewPasswordForm />
      </section>

      <button type="button" onClick={logOut} className="self-start text-sm underline">
        Log out
      </button>
    </div>
  );
}
