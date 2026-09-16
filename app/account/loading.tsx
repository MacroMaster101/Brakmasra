import { AccountLoadingState, LaunchLoadingState } from "@/components/loading-states";
import { authEnabled } from "@/lib/features";

export default function Loading() {
  return authEnabled ? <AccountLoadingState /> : <LaunchLoadingState />;
}
