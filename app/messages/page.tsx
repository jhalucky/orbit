import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MessagesView } from "@/components/chat/MessagesView";

export default function MessagesPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="px-6 py-12 text-sm text-ink-soft">Opening messages…</div>
        }
      >
        <MessagesView />
      </Suspense>
    </AppShell>
  );
}
