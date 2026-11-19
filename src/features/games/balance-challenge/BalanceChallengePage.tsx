import { RangeControl } from "../../../components/common";
import { RoundGamePage } from "../../../game-engine/rounds";
import { getControlRange, summarizeTorques } from "./balanceChallengeModel";
import { balanceChallenge } from "./balanceChallengeRoundGame";
import { BalancePlot, formatNumber, getControlUnit } from "./BalancePlot";

export function BalanceChallengePage() {
  return (
    <RoundGamePage
      definition={balanceChallenge}
      renderControls={(game) => {
        const range = getControlRange(game.round);
        const unit = getControlUnit(game.round);
        return (
          <RangeControl
            disabled={!game.canEdit}
            displayValue={`${formatNumber(game.control)} ${unit}`}
            id="balance-control"
            label={game.round.control.kind === "position" ? "Position of your mass" : "Mass of your block"}
            maximum={range.maximum}
            minimum={range.minimum}
            onChange={(value) => game.setControl(value)}
            step={range.step}
            value={game.control}
          />
        );
      }}
      renderMeasurements={(game) => {
        const release = game.last ? { controlValue: game.last.control, result: game.last.outcome.result } : null;
        const torques = release ? summarizeTorques(game.round, release.controlValue) : null;
        return [
          { label: "CLOCKWISE TORQUE", value: torques ? `${formatNumber(torques.clockwiseNewtonMeters)} N·m` : "—" },
          { label: "COUNTER-CLOCKWISE", value: torques ? `${formatNumber(torques.counterClockwiseNewtonMeters)} N·m` : "—" },
          { label: "NET TORQUE", value: release ? `${formatNumber(release.result.netTorqueNewtonMeters)} N·m` : "—" },
          { label: "PIVOT SUPPORT FORCE", value: release ? `${formatNumber(release.result.supportForceNewtons)} N` : "—" },
        ];
      }}
      renderVisual={(game) => (
        <BalancePlot
          controlValue={game.control}
          release={game.last ? { controlValue: game.last.control, result: game.last.outcome.result } : null}
          round={game.round}
        />
      )}
    />
  );
}
