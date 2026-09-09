import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <PlaceholderPage
      eyebrow="Settings"
      title="Account, location, and notifications."
      body="You’ll manage how Orbit finds you and how you’re notified from here. Authentication isn’t connected in this milestone."
    />
  );
}
