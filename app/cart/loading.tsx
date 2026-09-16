import { CartLoadingState, LaunchLoadingState } from "@/components/loading-states";
import { commerceEnabled } from "@/lib/features";

export default function Loading() {
  return commerceEnabled ? <CartLoadingState /> : <LaunchLoadingState />;
}
