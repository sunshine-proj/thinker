import { STATEMENT_LABELS, type Statement } from "./thoughtExperimentTypes";

/** Statements tagged with how certain they are, so hypotheses never read as facts. */
export function StatementList({ statements }: { readonly statements: readonly Statement[] }) {
  return (
    <ul className="statement-list">
      {statements.map((statement) => (
        <li className={`statement statement--${statement.kind}`} key={statement.text}>
          <span className="statement__tag">{STATEMENT_LABELS[statement.kind]}</span>
          <span>{statement.text}</span>
        </li>
      ))}
    </ul>
  );
}
