import { ActiveRequests } from "./ActiveRequests";
import { OrbitNote } from "./OrbitNote";

export function DiscoverPanel() {
  return (
    <div className="xl:sticky xl:top-8">
      <ActiveRequests />
      <OrbitNote />
    </div>
  );
}
