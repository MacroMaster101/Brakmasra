import { ProductLoadingState } from "@/components/loading-states";
import { commerceEnabled } from "@/lib/features";

export default function Loading() {
  return <ProductLoadingState comingSoon={!commerceEnabled} />;
}
