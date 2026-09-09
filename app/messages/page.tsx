import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { getBusinessBySlug } from "@/lib/seed";

export const metadata = {
  title: "Messages",
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string | string[] }>;
}) {
  const params = await searchParams;
  const slug = Array.isArray(params.with) ? params.with[0] : params.with;
  const business = slug ? getBusinessBySlug(slug) : undefined;

  return (
    <PlaceholderPage
      eyebrow="Messages"
      title={business ? `Message ${business.name}` : "Your conversations will live here."}
      body={
        business
          ? `A chat with ${business.name} will open here. Messaging comes after the business profile — you’ll be able to send details, files, and a service request in the conversation.`
          : "Pick a business from Discover and start a conversation. The messaging interface is the next product surface after the business profile."
      }
    />
  );
}
