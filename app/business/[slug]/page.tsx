import { AppShell } from "@/components/layout/AppShell";
import { BusinessPage } from "@/components/businesses/BusinessPage";

export const metadata = { title: "Shop" };

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <AppShell>
      <BusinessPage slug={slug} />
    </AppShell>
  );
}
