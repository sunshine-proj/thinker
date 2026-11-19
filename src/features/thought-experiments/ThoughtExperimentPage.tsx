import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChoicePrediction, LineChart, MeasurementGrid, RangeControl } from "../../components/common";
import { useProgressStore } from "../../store/progressStore";
import { StatementList } from "./StatementList";
import type { PredictionQuestion, ThoughtExperiment } from "./thoughtExperimentTypes";

function Comparison({ question, answer }: { readonly question: PredictionQuestion; readonly answer: string }) {
  const correct = answer === question.answerId;
  const label = (id: string) => question.options.find((option) => option.id === id)?.label ?? id;
  return (
    <div className={`prediction-check prediction-check--${correct ? "match" : "miss"}`} role="status">
      <strong>{correct ? "✓ Your prediction matched the result." : "✗ The result differs from your prediction."}</strong>
      <span>You predicted: {label(answer)}</span>
      {!correct && <span>The physics says: {label(question.answerId)}</span>}
    </div>
  );
}

/** One thought experiment: scenario → prediction → numerical run → comparison → explanation → harder variation. */
export function ThoughtExperimentPage({ experiment }: { readonly experiment: ThoughtExperiment }) {
  const hydrate = useProgressStore((state) => state.hydrate);
  const recordPrediction = useProgressStore((state) => state.recordPrediction);
  const predictions = useProgressStore((state) => state.predictions);
  const [value, setValue] = useState(experiment.parameter.initial);
  const [ran, setRan] = useState(false);
  const [lockedThisVisit, setLockedThisVisit] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const stored = (questionId: string) =>
    predictions.find((prediction) => prediction.activityId === experiment.id && prediction.questionId === questionId)?.answer ?? null;
  const mainAnswer = stored(experiment.question.id);
  const variationAnswer = stored(experiment.variation.question.id);
  // A learner returning to an experiment they already predicted goes straight to the results;
  // a fresh prediction waits for "Run the experiment".
  const showResults = mainAnswer !== null && (ran || !lockedThisVisit);

  const result = useMemo(() => experiment.run(value), [experiment, value]);
  const lock = (question: PredictionQuestion) => (answer: string) => {
    if (question.id === experiment.question.id) {
      setLockedThisVisit(true);
    }
    void recordPrediction({
      activityId: experiment.id,
      activityKind: "thought-experiment",
      questionId: question.id,
      answer,
      correct: answer === question.answerId,
    });
  };
  const { parameter } = experiment;
  const display = parameter.format ? parameter.format(value) : `${value} ${parameter.unit}`.trim();

  return (
    <div className="lab-page thought-page">
      <header className="worlds-page__header">
        <p className="eyebrow">
          <Link className="text-link" to="/thought-experiments">Thought Experiments</Link>
        </p>
        <h1>{experiment.title}</h1>
        <p>{experiment.scenario}</p>
      </header>

      <section aria-labelledby="thought-assumptions" className="lab-panel">
        <h2 id="thought-assumptions">What we take as given</h2>
        <StatementList statements={experiment.statements} />
      </section>

      <section aria-labelledby="thought-predict" className="lab-panel">
        <h2 id="thought-predict">1. Predict</h2>
        <ChoicePrediction
          lockedAnswer={mainAnswer}
          onLock={lock(experiment.question)}
          options={experiment.question.options}
          prompt={experiment.question.prompt}
        />
        {mainAnswer !== null && !showResults && (
          <button className="lab-button lab-button--primary" onClick={() => setRan(true)} type="button">
            Run the experiment
          </button>
        )}
      </section>

      {showResults && mainAnswer !== null && (
        <>
          <section aria-labelledby="thought-run" className="lab-panel">
            <h2 id="thought-run">2. Experiment and observe</h2>
            <RangeControl
              displayValue={display}
              id="thought-parameter"
              label={parameter.label}
              maximum={parameter.maximum}
              minimum={parameter.minimum}
              onChange={setValue}
              step={parameter.step}
              value={value}
            />
            <MeasurementGrid items={result.rows.map((row) => ({ label: row.label.toUpperCase(), value: row.value }))} />
            <p aria-live="polite" className="thought-page__summary">{result.summary}</p>
          </section>
          {result.chart && (
            <LineChart
              description={result.chart.description}
              series={result.chart.series}
              title={result.chart.title}
              xDomain={result.chart.xDomain}
              xLabel={result.chart.xLabel}
              yDomain={result.chart.yDomain}
              yLabel={result.chart.yLabel}
            />
          )}
          <section aria-labelledby="thought-compare" className="lab-panel">
            <h2 id="thought-compare">3. Compare and understand</h2>
            <Comparison answer={mainAnswer} question={experiment.question} />
            <StatementList statements={experiment.explanation} />
          </section>
          <section aria-labelledby="thought-variation" className="lab-panel">
            <h2 id="thought-variation">4. A harder variation</h2>
            <ChoicePrediction
              lockedAnswer={variationAnswer}
              onLock={lock(experiment.variation.question)}
              options={experiment.variation.question.options}
              prompt={experiment.variation.question.prompt}
            />
            {variationAnswer !== null && (
              <>
                <Comparison answer={variationAnswer} question={experiment.variation.question} />
                <StatementList statements={experiment.variation.explanation} />
              </>
            )}
          </section>
          <section aria-labelledby="thought-related" className="lab-panel">
            <h2 id="thought-related">Explore the same physics</h2>
            <ul className="thought-page__related">
              {experiment.related.map((item) => (
                <li key={item.path}>
                  <Link className="text-link" to={item.path}>{item.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
