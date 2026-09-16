import { CheckoutLoadingState, LaunchLoadingState } from "@/components/loading-states";
import { commerceEnabled } from "@/lib/features";

export default function Loading() {
  return commerceEnabled ? <CheckoutLoadingState /> : <LaunchLoadingState />;
}
