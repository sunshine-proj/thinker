import { useSearchParams } from "react-router-dom";
import { LABS } from "./index";
import { LabPage } from "./LabPage";

/** Route component for one of the data-defined labs; opens a saved run when `?saved=` is present. */
export function LabRoute({ labId }: { readonly labId: string }) {
  const [searchParams] = useSearchParams();
  const definition = LABS.find((lab) => lab.id === labId);
  if (!definition) {
    throw new RangeError(`Unknown lab ${labId}.`);
  }
  return <LabPage definition={definition} savedExperimentId={searchParams.get("saved") ?? undefined} />;
}
