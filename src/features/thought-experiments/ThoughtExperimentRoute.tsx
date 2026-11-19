import { useParams } from "react-router-dom";
import { NotFoundPage } from "../../app/NotFoundPage";
import { ThoughtExperimentPage } from "./ThoughtExperimentPage";
import { findThoughtExperiment } from "./thoughtExperiments";

export function ThoughtExperimentRoute() {
  const { experimentId = "" } = useParams();
  const experiment = findThoughtExperiment(experimentId);
  return experiment ? <ThoughtExperimentPage experiment={experiment} key={experiment.id} /> : <NotFoundPage />;
}
