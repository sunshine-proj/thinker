import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateCyclotronFrequency,
  calculateLorentzForce,
  calculateRelativisticCyclotronFrequency,
  getParticleSpecies,
} from "../../physics/electromagnetism";
import { SPEED_OF_LIGHT, Vector3 } from "../../physics/core";
import type {
  SimulationSnapshot,
  SimulationStatus,
} from "../../simulation/engine";
import { RangeControl, ToggleControl } from "../../components/common";
import { useSimulationCanvas } from "../../hooks/useSimulationCanvas";
import { formatMeasurementValue } from "../../simulation/measurements";
import { useProgressStore } from "../../store/progressStore";
import { ResultExplanation } from "./components/ResultExplanation";
import { SavedExperimentsPanel } from "./components/SavedExperimentsPanel";
import {
  ELECTRON_EXPERIMENT_ID,
  ELECTRON_EXPERIMENT_NAME,
  ELECTRON_LIMITS,
  collectElectronMeasurements,
  describeElectronSetup,
  explainElectronResult,
  parseElectronParameters,
  serializeElectronParameters,
} from "./electronExperiment";
import {
  DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
  getSimulationTiming,
  TARGET_POSITION_METERS,
  TARGET_RADIUS_METERS,
  createElectronTrajectoryModel,
  createInitialElectronTrajectoryState,
  getElectricField,
  getElectronTrajectoryMeasurements,
  getMagneticField,
  type ElectronTrajectoryParameters,
  type ElectronTrajectoryState,
  type ParticleKind,
} from "./electronTrajectoryModel";
const INITIAL_PARAMETERS = DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS;
const SIMULATION_MODEL = createElectronTrajectoryModel();
const MAX_FIELD_MICROTESLAS = ELECTRON_LIMITS.maxFieldMicroteslas;
const MAX_ELECTRIC_FIELD_VOLTS_PER_METER =
  ELECTRON_LIMITS.maxElectricFieldVoltsPerMeter;
const MAX_ENTRY_POSITION_METERS = ELECTRON_LIMITS.maxEntryPositionMeters;
const MAX_INTERACTIVE_SPEED_METERS_PER_SECOND =
  ELECTRON_LIMITS.maxSpeedMetersPerSecond;

function speedLimit(relativistic: boolean): number {
  return relativistic ? ELECTRON_LIMITS.maxRelativisticSpeedMetersPerSecond : MAX_INTERACTIVE_SPEED_METERS_PER_SECOND;
}

function fieldLimit(relativistic: boolean): number {
  return relativistic ? ELECTRON_LIMITS.maxRelativisticFieldMicroteslas : MAX_FIELD_MICROTESLAS;
}

function createInitialSnapshot(): SimulationSnapshot<
  ElectronTrajectoryState,
  ElectronTrajectoryParameters
> {
  return {
    state: createInitialElectronTrajectoryState(INITIAL_PARAMETERS),
    parameters: INITIAL_PARAMETERS,
    status: "ready",
    timeSeconds: 0,
    droppedTimeSeconds: 0,
    error: null,
  };
}

const formatScientific = formatMeasurementValue;

function formatPosition(value: number): string {
  return `${value.toFixed(3)} m`;
}

function formatDuration(seconds: number): string {
  return seconds === 0 ? "0 s" : `${seconds.toExponential(2)} s`;
}

export type TrajectoryView = "projection" | "top";

/** Looking down the −Y axis onto the x–z plane: x to the right, z down the screen. */
function projectTop(point: Vector3): { x: number; y: number } {
  return { x: point.x, y: -point.z };
}

/** Short text for the field direction, e.g. "+Y" or "tilted 45° from +Y". */
export function describeFieldDirection(parameters: ElectronTrajectoryParameters): string {
  const { fieldPolarDegrees: polar, fieldAzimuthDegrees: azimuth, magneticFieldReversed: reversed } = parameters;
  if (polar === 0 || polar === 180) {
    return (polar === 0) !== reversed ? "+Y" : "−Y";
  }
  return `${reversed ? "reversed, " : ""}tilted ${polar}° from +Y toward ${azimuth}°`;
}

function project(point: Vector3): { x: number; y: number } {
  return {
    x: point.x + point.z * 0.55,
    y: point.y - point.z * 0.35,
  };
}

function drawArrow(
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: string,
  width = 2,
): void {
  const angle = Math.atan2(endY - startY, endX - startX);
  const headLength = 8;

  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = width;
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.moveTo(
    endX - headLength * Math.cos(angle - Math.PI / 6),
    endY - headLength * Math.sin(angle - Math.PI / 6),
  );
  context.lineTo(endX, endY);
  context.lineTo(
    endX - headLength * Math.cos(angle + Math.PI / 6),
    endY - headLength * Math.sin(angle + Math.PI / 6),
  );
  context.stroke();
}

function drawTrajectory(
  canvas: HTMLCanvasElement,
  snapshot: SimulationSnapshot<
    ElectronTrajectoryState,
    ElectronTrajectoryParameters
  >,
  view: TrajectoryView = "projection",
): void {
  const projectPoint = view === "top" ? projectTop : project;
  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (width === 0 || height === 0) {
    return;
  }

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("A 2D canvas context is required to draw the trajectory.");
  }

  if (
    canvas.width !== Math.round(width * pixelRatio) ||
    canvas.height !== Math.round(height * pixelRatio)
  ) {
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#f9faff";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "#e9edf5";
  context.lineWidth = 1;
  context.beginPath();
  for (let x = 0; x <= width; x += 44) {
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }
  for (let y = 0; y <= height; y += 44) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.stroke();

  const magneticField = getMagneticField(snapshot.parameters);
  const hasMagneticField = magneticField.magnitude > 0;
  if (hasMagneticField) {
    const unit = magneticField.scale(1 / magneticField.magnitude);
    // In the top view the line of sight is −Y: B toward the viewer (+Y) is drawn as
    // dots ⊙ and B away from the viewer as crosses ⊗ (PRD §6.5).
    const towardViewer = view === "top" ? unit.y : 0;
    const inPlane = projectPoint(unit);
    const inPlaneLength = Math.hypot(inPlane.x, inPlane.y);
    context.save();
    context.globalAlpha = 0.42;
    for (let x = 35; x < width; x += 72) {
      for (let y = 35; y < height; y += 70) {
        if (Math.abs(towardViewer) > 0.2) {
          context.strokeStyle = "#7180d8";
          context.fillStyle = "#7180d8";
          context.lineWidth = 1.4;
          context.beginPath();
          context.arc(x, y, 6, 0, 2 * Math.PI);
          context.stroke();
          if (towardViewer > 0) {
            context.beginPath();
            context.arc(x, y, 1.8, 0, 2 * Math.PI);
            context.fill();
          } else {
            context.beginPath();
            context.moveTo(x - 4, y - 4);
            context.lineTo(x + 4, y + 4);
            context.moveTo(x + 4, y - 4);
            context.lineTo(x - 4, y + 4);
            context.stroke();
          }
        }
        if (inPlaneLength > 0.2) {
          const length = 13 * Math.min(1, inPlaneLength);
          drawArrow(
            context,
            x + 12,
            y,
            x + 12 + (inPlane.x / inPlaneLength) * length,
            y - (inPlane.y / inPlaneLength) * length,
            "#7180d8",
            1.2,
          );
        }
      }
    }
    context.restore();
  }

  const origin = snapshot.state.trail[0] ?? snapshot.state.position;
  const points = snapshot.state.trail.map(projectPoint);
  if (snapshot.parameters.targetChallengeEnabled) {
    points.push(projectPoint(TARGET_POSITION_METERS));
  }
  points.push(projectPoint(origin));

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const spanX = Math.max(maxX - minX, 0.08);
  const spanY = Math.max(maxY - minY, 0.08);
  const scale = Math.min((width - 72) / spanX, (height - 72) / spanY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const toCanvas = (point: Vector3) => {
    const projected = projectPoint(point);
    return {
      x: width / 2 + (projected.x - centerX) * scale,
      y: height / 2 - (projected.y - centerY) * scale,
    };
  };

  context.fillStyle = "#6673c5";
  context.font = "600 10px 'DM Sans', sans-serif";
  context.fillText(
    hasMagneticField
      ? `MAGNETIC FIELD · ${describeFieldDirection(snapshot.parameters)}${view === "top" ? " · TOP VIEW (⊙ OUT, ⊗ IN)" : ""}`
      : `MAGNETIC FIELD · OFF${view === "top" ? " · TOP VIEW" : ""}`,
    15,
    20,
  );
  if (snapshot.parameters.electricFieldVoltsPerMeter !== 0) {
    context.fillStyle = "#268c78";
    context.fillText(
      `E FIELD · ${snapshot.parameters.electricFieldVoltsPerMeter > 0 ? "+" : ""}${snapshot.parameters.electricFieldVoltsPerMeter} V/m along −Z`,
      15,
      36,
    );
  }

  if (snapshot.parameters.targetChallengeEnabled) {
    const target = toCanvas(TARGET_POSITION_METERS);
    context.beginPath();
    context.arc(target.x, target.y, Math.max(TARGET_RADIUS_METERS * scale, 7), 0, 2 * Math.PI);
    context.strokeStyle = snapshot.state.targetHit ? "#2aab83" : "#df9a43";
    context.lineWidth = 2;
    context.setLineDash([4, 4]);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = snapshot.state.targetHit ? "#2aab83" : "#df9a43";
    context.font = "700 9px 'DM Sans', sans-serif";
    context.fillText("TARGET", target.x + 10, target.y - 9);
  }

  if (snapshot.state.trail.length > 1) {
    context.beginPath();
    for (const [index, point] of snapshot.state.trail.entries()) {
      const screen = toCanvas(point);
      if (index === 0) {
        context.moveTo(screen.x, screen.y);
      } else {
        context.lineTo(screen.x, screen.y);
      }
    }
    context.strokeStyle = "#596be0";
    context.lineWidth = 2.4;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.stroke();
  }

  const start = toCanvas(origin);
  context.beginPath();
  context.arc(start.x, start.y, 3.5, 0, 2 * Math.PI);
  context.fillStyle = "#a1a8bc";
  context.fill();

  const particle = toCanvas(snapshot.state.position);
  const velocity = projectPoint(snapshot.state.velocity);
  const species = getParticleSpecies(snapshot.parameters.particle);
  const force = projectPoint(
    calculateLorentzForce(
      species.chargeCoulombs,
      snapshot.state.velocity,
      getElectricField(snapshot.parameters),
      magneticField,
    ),
  );
  const velocityMagnitude = Math.hypot(velocity.x, velocity.y);
  if (velocityMagnitude > 0) {
    drawArrow(
      context,
      particle.x,
      particle.y,
      particle.x + (velocity.x / velocityMagnitude) * 44,
      particle.y - (velocity.y / velocityMagnitude) * 44,
      "#dd8d3d",
    );
  }

  const forceMagnitude = Math.hypot(force.x, force.y);
  if (forceMagnitude > 0) {
    drawArrow(
      context,
      particle.x,
      particle.y,
      particle.x + (force.x / forceMagnitude) * 35,
      particle.y - (force.y / forceMagnitude) * 35,
      "#d65b79",
    );
  }

  context.beginPath();
  context.arc(particle.x, particle.y, 7, 0, 2 * Math.PI);
  context.fillStyle = snapshot.parameters.particle === "electron" ? "#5365d5" : "#e27945";
  context.shadowColor = context.fillStyle;
  context.shadowBlur = 12;
  context.fill();
  context.shadowBlur = 0;
  context.lineWidth = 2;
  context.strokeStyle = "#fff";
  context.stroke();

  context.font = "600 9px 'DM Sans', sans-serif";
  context.fillStyle = "#dd8d3d";
  context.fillText("v", particle.x + 48, particle.y - 13);
  if (forceMagnitude > 0) {
    context.fillStyle = "#d65b79";
    context.fillText("F", particle.x + 35, particle.y + 13);
  }

  const legendY = height - 14;
  context.fillStyle = snapshot.parameters.particle === "electron" ? "#5365d5" : "#e27945";
  context.beginPath();
  context.arc(17, legendY - 3, 4, 0, 2 * Math.PI);
  context.fill();
  context.fillStyle = "#687187";
  context.font = "500 9px 'DM Sans', sans-serif";
  context.fillText(
    snapshot.parameters.particle === "electron" ? "Particle" : "Proton",
    27,
    legendY,
  );
  context.strokeStyle = "#596be0";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(95, legendY - 3);
  context.lineTo(112, legendY - 3);
  context.stroke();
  context.fillStyle = "#687187";
  context.fillText("Trajectory", 118, legendY);
  if (hasMagneticField) {
    drawArrow(context, 196, legendY - 4, 196, legendY - 13, "#7180d8", 1.2);
    context.fillStyle = "#687187";
    context.fillText("Magnetic field", 204, legendY);
  }
}

function StatusLabel({ status }: { status: SimulationStatus }) {
  const labels: Record<SimulationStatus, string> = {
    ready: "Ready",
    running: "In motion",
    paused: "Paused",
    completed: "Target reached",
    error: "Simulation stopped",
    disposed: "Closed",
  };

  return (
    <span className={`lab-status lab-status--${status}`}>
      <span aria-hidden="true" />
      {labels[status]}
    </span>
  );
}

export function ElectronTrajectoryLabPage({
  savedExperimentId,
}: {
  /** When set, the lab opens with that saved experiment's setup. */
  readonly savedExperimentId?: string;
} = {}) {
  const [parameters, setParameters] = useState(INITIAL_PARAMETERS);
  const [view, setView] = useState<TrajectoryView>("projection");
  // The canvas is drawn outside React, so it reads the view from a ref.
  const viewRef = useRef<TrajectoryView>("projection");
  const {
    canvasRef,
    snapshot,
    canvasError,
    reducedMotion,
    start,
    pause,
    resume,
    reset,
    setParameters: setEngineParameters,
    setTiming,
  } = useSimulationCanvas({
    model: SIMULATION_MODEL,
    initialParameters: INITIAL_PARAMETERS,
    initialSnapshot: createInitialSnapshot(),
    engineOptions: {
      ...getSimulationTiming(INITIAL_PARAMETERS),
      maxFrameDeltaSeconds: 0.1,
      maxSubSteps: 128,
    },
    draw: (canvas, current) => drawTrajectory(canvas, current, viewRef.current),
  });

  /** Applies new parameters, switching the engine's timing when the model changes. */
  const applyToEngine = (next: ElectronTrajectoryParameters, previous: ElectronTrajectoryParameters) => {
    if (next.relativistic !== previous.relativistic) {
      setTiming(getSimulationTiming(next));
    }
    setEngineParameters(next, true);
  };

  const setRelativistic = (relativistic: boolean) => {
    const next = {
      ...parameters,
      relativistic,
      speedMetersPerSecond: relativistic
        ? Math.max(parameters.speedMetersPerSecond, 0.5 * SPEED_OF_LIGHT)
        : Math.min(parameters.speedMetersPerSecond, MAX_INTERACTIVE_SPEED_METERS_PER_SECOND),
      magneticFieldMicroteslas: relativistic
        ? Math.max(parameters.magneticFieldMicroteslas, 2000)
        : Math.min(parameters.magneticFieldMicroteslas, MAX_FIELD_MICROTESLAS),
    };
    setParameters(next);
    applyToEngine(next, parameters);
  };

  const changeView = (next: TrajectoryView) => {
    viewRef.current = next;
    setView(next);
    // Redraw the current frame in the new view without resetting the run.
    setEngineParameters(parameters, false);
  };

  const updateParameters = (
    changes: Partial<ElectronTrajectoryParameters>,
  ) => {
    const nextParameters = { ...parameters, ...changes };
    setParameters(nextParameters);
    applyToEngine(nextParameters, parameters);
  };

  const applyParameters = (raw: Readonly<Record<string, unknown>>): boolean => {
    const restored = parseElectronParameters(raw);
    if (!restored) {
      return false;
    }
    setParameters(restored);
    applyToEngine(restored, parameters);
    return true;
  };

  const hydrateProgress = useProgressStore((state) => state.hydrate);
  useEffect(() => {
    void hydrateProgress();
  }, [hydrateProgress]);
  useEffect(() => {
    if (!savedExperimentId) {
      return;
    }
    let cancelled = false;
    void hydrateProgress().then(() => {
      if (cancelled) {
        return;
      }
      const target = useProgressStore
        .getState()
        .experiments.find((experiment) => experiment.id === savedExperimentId);
      const restored = target ? parseElectronParameters(target.parameters) : null;
      if (restored) {
        setParameters(restored);
        if (restored.relativistic) {
          setTiming(getSimulationTiming(restored));
        }
        setEngineParameters(restored, true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [savedExperimentId, hydrateProgress, setEngineParameters, setTiming]);

  const handlePlayPause = () => {
    if (snapshot.status === "running") {
      pause();
    } else if (snapshot.status === "paused") {
      resume();
    } else if (snapshot.status === "ready") {
      start();
    }
  };

  const handleReset = reset;

  const measurements = getElectronTrajectoryMeasurements(
    snapshot.state,
    snapshot.parameters,
  );
  const particle = getParticleSpecies(snapshot.parameters.particle);
  const magneticField = getMagneticField(snapshot.parameters);
  const cyclotronFrequency = snapshot.parameters.relativistic
    ? calculateRelativisticCyclotronFrequency(particle.chargeCoulombs, particle.massKilograms, magneticField, snapshot.state.velocity)
    : calculateCyclotronFrequency(particle.chargeCoulombs, particle.massKilograms, magneticField);
  const hasMagneticField = magneticField.magnitude > 0;
  const explanations = useMemo(
    () => explainElectronResult(parameters),
    [parameters],
  );
  const serializedParameters = useMemo(
    () => serializeElectronParameters(parameters),
    [parameters],
  );
  const experimentResults = collectElectronMeasurements(
    snapshot.state,
    snapshot.parameters,
    snapshot.timeSeconds,
  );
  const isRunning = snapshot.status === "running";
  const isComplete = snapshot.status === "completed" && snapshot.state.targetHit;

  return (
    <div className="trajectory-lab">
      <header className="trajectory-lab__header">
        <div>
          <p className="eyebrow">
            <span aria-hidden="true">✦</span>
            EXPERIMENT LAB · ELECTRICITY & MAGNETISM
          </p>
          <h1>Electron Trajectory Lab</h1>
          <p className="trajectory-lab__intro">
            Predict how a charged particle moves, then shape its path by
            changing the fields around it.
          </p>
        </div>
        <span className="trajectory-lab__model-tag">
          {parameters.relativistic ? "RELATIVISTIC MODEL · ADVANCED" : "CLASSICAL MODEL"}
        </span>
      </header>

      <div className="trajectory-lab__layout">
        <section
          aria-label="Charged particle simulation"
          className="trajectory-visual"
        >
          <div className="trajectory-visual__heading">
            <div>
              <span className="trajectory-visual__eyebrow">LIVE SIMULATION</span>
              <h2>Particle motion</h2>
            </div>
            <StatusLabel status={snapshot.status} />
          </div>
          <div className="trajectory-visual__canvas-wrap">
            <canvas
              aria-describedby="trajectory-canvas-description trajectory-vector-description"
              aria-label="Three-dimensional projection of the charged particle trajectory, magnetic field direction, velocity, and Lorentz force"
              className="trajectory-canvas"
              ref={canvasRef}
              role="img"
            />
            <p className="visually-hidden" id="trajectory-canvas-description">
              {view === "top"
                ? "Top view looking down the Y-axis onto the x–z plane. Field pointing toward you is drawn as dots, away from you as crosses."
                : "The drawing shows the particle path projected into a two dimensional view."}{" "}
              The magnetic field points {describeFieldDirection(parameters)}. The
              orange arrow is velocity and the red arrow is Lorentz force.
              Numeric measurements and particle components are provided below.
            </p>
            <p className="visually-hidden" id="trajectory-vector-description">
              Particle position in meters: x{" "}
              {snapshot.state.position.x.toExponential(3)}, y{" "}
              {snapshot.state.position.y.toExponential(3)}, z{" "}
              {snapshot.state.position.z.toExponential(3)}. Velocity in meters
              per second: x {snapshot.state.velocity.x.toExponential(3)}, y{" "}
              {snapshot.state.velocity.y.toExponential(3)}, z{" "}
              {snapshot.state.velocity.z.toExponential(3)}. Lorentz force in
              newtons: x {measurements.forceNewtons.x.toExponential(3)}, y{" "}
              {measurements.forceNewtons.y.toExponential(3)}, z{" "}
              {measurements.forceNewtons.z.toExponential(3)}.
            </p>
          </div>
          {reducedMotion && (
            <p className="trajectory-lab__motion-note">
              Reduced motion is on: the drawing updates once per second while
              the simulation runs. The physics and measurements are unchanged.
            </p>
          )}
          {canvasError && (
            <p className="lab-error" role="alert">
              Visualization error: {canvasError}
            </p>
          )}
          {snapshot.status === "error" && (
            <p className="lab-error" role="alert">
              {snapshot.error instanceof Error
                ? snapshot.error.message
                : "The simulation stopped because of an unexpected error."}
            </p>
          )}
          {isComplete && (
            <p className="lab-success" role="status">
              Target reached. Your particle passed through the target region.
            </p>
          )}

          <div aria-label="Particle measurements" className="trajectory-stats">
            <div className="trajectory-stat">
              <span>PARTICLE SPEED</span>
              <strong>
                {formatScientific(measurements.speedMetersPerSecond, "m/s")}
              </strong>
            </div>
            <div className="trajectory-stat">
              <span>LORENTZ FORCE</span>
              <strong>
                {formatScientific(measurements.forceNewtons.magnitude, "N")}
              </strong>
            </div>
            <div className="trajectory-stat">
              <span>GYRORADIUS</span>
              <strong>
                {formatScientific(measurements.orbitRadiusMeters, "m")}
              </strong>
            </div>
            <div className="trajectory-stat">
              <span>SIMULATION TIME</span>
              <strong>{formatDuration(snapshot.timeSeconds)}</strong>
            </div>
            <div className="trajectory-stat">
              <span>KINETIC ENERGY</span>
              <strong>
                {formatScientific(measurements.kineticEnergyJoules, "J")}
              </strong>
            </div>
          </div>
          <div className="trajectory-visual__position">
            <span>POSITION · x, y, z</span>
            <strong>
              {formatPosition(snapshot.state.position.x)}
              <span> / </span>
              {formatPosition(snapshot.state.position.y)}
              <span> / </span>
              {formatPosition(snapshot.state.position.z)}
            </strong>
          </div>

          <div className="trajectory-visual__actions">
            <button
              className="lab-button lab-button--primary"
              disabled={
                snapshot.status === "completed" ||
                snapshot.status === "error" ||
                snapshot.status === "disposed"
              }
              onClick={handlePlayPause}
              aria-label={isRunning ? "Pause experiment" : snapshot.status === "paused" ? "Resume experiment" : "Start experiment"}
              type="button"
            >
              <span aria-hidden="true">{isRunning ? "Ⅱ" : "▶"}</span>
              {isRunning
                ? "Pause"
                : snapshot.status === "paused"
                  ? "Resume"
                  : snapshot.status === "completed"
                    ? "Target reached"
                    : snapshot.status === "error"
                      ? "Reset to continue"
                      : "Start experiment"}
            </button>
            <button
              className="lab-button lab-button--secondary"
              onClick={handleReset}
              type="button"
            >
              Reset
            </button>
            {hasMagneticField && (
              <span className="trajectory-visual__frequency">
                Cyclotron frequency{" "}
                {formatScientific(cyclotronFrequency, "Hz")}
              </span>
            )}
            <span className="trajectory-visual__slow-motion">
              Slow-motion playback · {parameters.relativistic ? "1,000,000,000×" : "1,000,000×"}
            </span>
            <label className="lab-select trajectory-view" htmlFor="trajectory-view">
              <span>View</span>
              <select
                id="trajectory-view"
                onChange={(event) => changeView(event.currentTarget.value === "top" ? "top" : "projection")}
                value={view}
              >
                <option value="projection">3D projection</option>
                <option value="top">Top view (dots and crosses)</option>
              </select>
            </label>
          </div>
        </section>

        <aside aria-label="Simulation controls" className="trajectory-controls">
          <div className="trajectory-controls__heading">
            <div>
              <span className="trajectory-visual__eyebrow">YOUR SETUP</span>
              <h2>Change the conditions</h2>
            </div>
            <span aria-hidden="true" className="trajectory-controls__spark">
              ✳
            </span>
          </div>

          <label className="lab-select" htmlFor="particle-kind">
            <span>Particle</span>
            <select
              id="particle-kind"
              onChange={(event) => {
                const selected: ParticleKind =
                  event.currentTarget.value === "proton" ? "proton" : "electron";
                updateParameters({ particle: selected });
              }}
              value={parameters.particle}
            >
              <option value="electron">Electron (−e)</option>
              <option value="proton">Proton (+e)</option>
            </select>
          </label>

          <RangeControl
            displayValue={formatScientific(
              parameters.speedMetersPerSecond,
              "m/s",
            )}
            id="initial-speed"
            label="Initial speed"
            maximum={speedLimit(parameters.relativistic)}
            minimum={0}
            onChange={(speedMetersPerSecond) =>
              updateParameters({ speedMetersPerSecond })
            }
            step={parameters.relativistic ? 1_000_000 : 100_000}
            value={parameters.speedMetersPerSecond}
          />

          <RangeControl
            displayValue={`${parameters.pitchAngleDegrees}°`}
            id="pitch-angle"
            label="Angle to magnetic field"
            maximum={90}
            minimum={0}
            onChange={(pitchAngleDegrees) =>
              updateParameters({ pitchAngleDegrees })
            }
            step={1}
            value={parameters.pitchAngleDegrees}
          />
          <p className="lab-control__hint">
            90° gives circular motion; a smaller angle adds motion along the
            field, creating a helix.
          </p>

          <RangeControl
            displayValue={`${parameters.magneticFieldMicroteslas.toFixed(1)} µT`}
            id="magnetic-field"
            label="Magnetic field strength"
            maximum={fieldLimit(parameters.relativistic)}
            minimum={0}
            onChange={(magneticFieldMicroteslas) =>
              updateParameters({ magneticFieldMicroteslas })
            }
            step={parameters.relativistic ? 10 : 0.1}
            value={parameters.magneticFieldMicroteslas}
          />
          <ToggleControl
            checked={parameters.magneticFieldReversed}
            description="Flip B to point the opposite way"
            id="reverse-field"
            label="Reverse magnetic field"
            onChange={(magneticFieldReversed) =>
              updateParameters({ magneticFieldReversed })
            }
          />
          <RangeControl
            displayValue={`${parameters.fieldPolarDegrees}°`}
            id="field-tilt"
            label="Field tilt from +Y"
            maximum={180}
            minimum={0}
            onChange={(fieldPolarDegrees) => updateParameters({ fieldPolarDegrees })}
            step={5}
            value={parameters.fieldPolarDegrees}
          />
          <RangeControl
            disabled={parameters.fieldPolarDegrees === 0 || parameters.fieldPolarDegrees === 180}
            displayValue={`${parameters.fieldAzimuthDegrees}°`}
            id="field-azimuth"
            label="Tilt direction (from +X toward +Z)"
            maximum={360}
            minimum={0}
            onChange={(fieldAzimuthDegrees) => updateParameters({ fieldAzimuthDegrees })}
            step={5}
            value={parameters.fieldAzimuthDegrees}
          />
          <p className="lab-control__hint">
            The launch angle is measured from the field, so a tilted field tilts the whole orbit.
          </p>

          <RangeControl
            displayValue={`${parameters.electricFieldVoltsPerMeter} V/m`}
            id="electric-field"
            label="Crossed electric field (−Z)"
            maximum={MAX_ELECTRIC_FIELD_VOLTS_PER_METER}
            minimum={-MAX_ELECTRIC_FIELD_VOLTS_PER_METER}
            onChange={(electricFieldVoltsPerMeter) =>
              updateParameters({ electricFieldVoltsPerMeter })
            }
            step={0.5}
            value={parameters.electricFieldVoltsPerMeter}
          />
          <p className="lab-control__hint">
            For a perpendicular beam, E = vB balances the magnetic force.
          </p>

          <fieldset className="position-controls">
            <legend>Initial position · meters</legend>
            {(["x", "y", "z"] as const).map((axis) => (
              <label className="position-control" htmlFor={`position-${axis}`} key={axis}>
                <span>{axis.toUpperCase()}</span>
                <input
                  id={`position-${axis}`}
                  max={MAX_ENTRY_POSITION_METERS}
                  min={-MAX_ENTRY_POSITION_METERS}
                  onChange={(event) => {
                    const coordinate = Number(event.currentTarget.value);
                    updateParameters({
                      initialPositionMeters: new Vector3(
                        axis === "x"
                          ? coordinate
                          : parameters.initialPositionMeters.x,
                        axis === "y"
                          ? coordinate
                          : parameters.initialPositionMeters.y,
                        axis === "z"
                          ? coordinate
                          : parameters.initialPositionMeters.z,
                      ),
                    });
                  }}
                  step={0.01}
                  type="number"
                  value={parameters.initialPositionMeters[axis]}
                />
              </label>
            ))}
          </fieldset>

          <ToggleControl
            checked={parameters.relativistic}
            description="Advanced: relativistic Boris integration up to 0.99c, fields up to 20 mT"
            id="relativistic-mode"
            label="Relativistic mode"
            onChange={setRelativistic}
          />
          {parameters.relativistic && (
            <p className="lab-control__hint">
              Relativistic mode uses p = γmv. Orbits grow by γ, and the particle never reaches c however strong the electric field.
            </p>
          )}

          <ToggleControl
            checked={parameters.targetChallengeEnabled}
            className="lab-toggle--challenge"
            description="Guide the particle through the target region"
            id="target-challenge"
            label="Target challenge"
            onChange={(targetChallengeEnabled) =>
              updateParameters({ targetChallengeEnabled })
            }
          />
          {parameters.targetChallengeEnabled && (
            <p className="lab-challenge-hint">
              Adjust the field, speed, and entry direction to reach the marked
              target. Changing a parameter resets your trajectory.
            </p>
          )}
        </aside>
      </div>

      <ResultExplanation
        explanations={explanations}
        heading={`What this ${parameters.particle} experiment shows`}
      />

      <SavedExperimentsPanel
        describe={(saved) => {
          const restored = parseElectronParameters(saved);
          return restored ? describeElectronSetup(restored) : "Setup unavailable";
        }}
        experimentId={ELECTRON_EXPERIMENT_ID}
        experimentName={ELECTRON_EXPERIMENT_NAME}
        onLoad={applyParameters}
        parameters={serializedParameters}
        results={experimentResults}
      />

      <section aria-labelledby="physics-explainer-title" className="lab-explainer">
        <div className="lab-explainer__intro">
          <p className="eyebrow">The physics behind the path</p>
          <h2 id="physics-explainer-title">A magnetic field steers; it doesn’t speed up.</h2>
          <p>
            The Lorentz force is perpendicular to velocity when only a magnetic
            field is present. It changes the direction of motion, not the
            particle’s kinetic energy.
          </p>
        </div>
        <div className="lab-explainer__formula">
          <span>LORENTZ FORCE</span>
          <strong>F = q(E + v × B)</strong>
          <small>
            q is signed charge · E in V/m · B in teslas · v in m/s
          </small>
        </div>
        <div className="lab-explainer__formula">
          <span>PERPENDICULAR ORBIT</span>
          <strong>r = m v⊥ / (|q| B)</strong>
          <small>
            {parameters.relativistic
              ? "Relativistic mode: r = γ m v⊥ / (|q| B), with γ = 1/√(1 − v²/c²)"
              : "For a uniform magnetic field and non-relativistic speed"}
          </small>
        </div>
        <p className="lab-explainer__assumption">
          Model assumptions: uniform, time-independent fields; no radiation or
          collisions.{" "}
          {parameters.relativistic
            ? "Relativistic mode (advanced) integrates the momentum p = γmv with the relativistic Boris scheme at a 20 ps step, valid up to 0.99c."
            : "Classical (non-relativistic) motion below 0.1c; the Boris integrator advances the particle at a fixed 20 ns step."}
        </p>
      </section>
    </div>
  );
}
