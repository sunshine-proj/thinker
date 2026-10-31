import { useEffect, useRef, useState } from "react";
import {
  calculateCyclotronFrequency,
  calculateLorentzForce,
  getParticleSpecies,
} from "../../physics/electromagnetism";
import { Vector3 } from "../../physics/core";
import type {
  SimulationSnapshot,
  SimulationStatus,
} from "../../simulation/engine";
import { SimulationEngine } from "../../simulation/engine";
import {
  DEFAULT_ELECTRON_TRAJECTORY_PARAMETERS,
  ELECTRON_TRAJECTORY_TIME_STEP_SECONDS,
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
const MAX_FIELD_MICROTESLAS = 20;
const MAX_ELECTRIC_FIELD_VOLTS_PER_METER = 20;
const MAX_ENTRY_POSITION_METERS = 0.5;
const MAX_INTERACTIVE_SPEED_METERS_PER_SECOND = 29_000_000;

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

function formatScientific(value: number | null, unit: string): string {
  if (value === null) {
    return "—";
  }

  if (value === 0) {
    return `0 ${unit}`;
  }

  const magnitude = Math.abs(value);
  const formatted =
    magnitude >= 1e3 || magnitude < 1e-2
      ? value.toExponential(2)
      : value.toPrecision(3);

  return `${formatted} ${unit}`;
}

function formatPosition(value: number): string {
  return `${value.toFixed(3)} m`;
}

function formatDuration(seconds: number): string {
  return seconds === 0 ? "0 s" : `${seconds.toExponential(2)} s`;
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
): void {
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

  const fieldIsReversed = snapshot.parameters.magneticFieldReversed;
  const magneticField = getMagneticField(snapshot.parameters);
  const hasMagneticField = magneticField.magnitude > 0;
  if (hasMagneticField) {
    context.save();
    context.globalAlpha = 0.38;
    for (let x = 35; x < width; x += 72) {
      for (let y = 35; y < height; y += 70) {
        drawArrow(
          context,
          x,
          y,
          x,
          y + (fieldIsReversed ? 13 : -13),
          "#7180d8",
          1.2,
        );
      }
    }
    context.restore();
  }

  const origin = snapshot.state.trail[0] ?? snapshot.state.position;
  const points = snapshot.state.trail.map(project);
  if (snapshot.parameters.targetChallengeEnabled) {
    points.push(project(TARGET_POSITION_METERS));
  }
  points.push(project(origin));

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
    const projected = project(point);
    return {
      x: width / 2 + (projected.x - centerX) * scale,
      y: height / 2 - (projected.y - centerY) * scale,
    };
  };

  context.fillStyle = "#6673c5";
  context.font = "600 10px 'DM Sans', sans-serif";
  context.fillText(
    hasMagneticField
      ? `MAGNETIC FIELD · ${fieldIsReversed ? "−Y" : "+Y"}`
      : "MAGNETIC FIELD · OFF",
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
  const velocity = project(snapshot.state.velocity);
  const species = getParticleSpecies(snapshot.parameters.particle);
  const force = project(
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

interface RangeControlProps {
  id: string;
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
}

function RangeControl({
  id,
  label,
  value,
  minimum,
  maximum,
  step,
  displayValue,
  onChange,
}: RangeControlProps) {
  return (
    <label className="lab-control" htmlFor={id}>
      <span className="lab-control__heading">
        <span>{label}</span>
        <output htmlFor={id}>{displayValue}</output>
      </span>
      <input
        id={id}
        max={maximum}
        min={minimum}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        step={step}
        type="range"
        value={value}
      />
      <span className="lab-control__bounds">
        <span>{minimum}</span>
        <span>{maximum}</span>
      </span>
    </label>
  );
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

export function ElectronTrajectoryLabPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<
    SimulationEngine<ElectronTrajectoryState, ElectronTrajectoryParameters> | null
  >(null);
  const [parameters, setParameters] = useState(INITIAL_PARAMETERS);
  const [snapshot, setSnapshot] = useState(createInitialSnapshot);
  const [canvasError, setCanvasError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const engine = new SimulationEngine(
      createElectronTrajectoryModel(),
      INITIAL_PARAMETERS,
      {
        fixedTimeStepSeconds: ELECTRON_TRAJECTORY_TIME_STEP_SECONDS,
        timeScale: 1e-6,
        maxFrameDeltaSeconds: 0.1,
        maxSubSteps: 128,
        onRender: (nextSnapshot) => {
          try {
            drawTrajectory(canvas, nextSnapshot);
          } catch (error) {
            setCanvasError(
              error instanceof Error
                ? error.message
                : "The trajectory could not be drawn.",
            );
            throw error;
          }
        },
      },
    );
    engineRef.current = engine;

    let lastReactUpdateTime = 0;
    let lastStatus: SimulationStatus | null = null;
    const unsubscribe = engine.subscribe((nextSnapshot) => {
      const currentTime = performance.now();
      if (
        nextSnapshot.status !== lastStatus ||
        nextSnapshot.status !== "running" ||
        currentTime - lastReactUpdateTime >= 100
      ) {
        lastReactUpdateTime = currentTime;
        lastStatus = nextSnapshot.status;
        setSnapshot(nextSnapshot);
      }
    });

    const resizeCanvas = () => {
      drawTrajectory(canvas, engine.getSnapshot());
    };
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(resizeCanvas);
    if (resizeObserver) {
      resizeObserver.observe(canvas);
    } else {
      window.addEventListener("resize", resizeCanvas);
    }
    engine.reset();

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      unsubscribe();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const updateParameters = (
    changes: Partial<ElectronTrajectoryParameters>,
  ) => {
    const nextParameters = { ...parameters, ...changes };
    setParameters(nextParameters);
    engineRef.current?.setParameters(nextParameters, { reset: true });
  };

  const handlePlayPause = () => {
    const engine = engineRef.current;
    if (!engine) {
      return;
    }

    if (snapshot.status === "running") {
      engine.pause();
    } else if (snapshot.status === "paused") {
      engine.resume();
    } else if (snapshot.status === "ready") {
      engine.start();
    }
  };

  const handleReset = () => {
    engineRef.current?.reset();
    setCanvasError(null);
  };

  const measurements = getElectronTrajectoryMeasurements(
    snapshot.state,
    snapshot.parameters,
  );
  const particle = getParticleSpecies(snapshot.parameters.particle);
  const magneticField = getMagneticField(snapshot.parameters);
  const cyclotronFrequency = calculateCyclotronFrequency(
    particle.chargeCoulombs,
    particle.massKilograms,
    magneticField,
  );
  const hasMagneticField = magneticField.magnitude > 0;
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
        <span className="trajectory-lab__model-tag">CLASSICAL MODEL</span>
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
              The drawing shows the particle path projected into a two
              dimensional view. The magnetic field points along the vertical
              Y-axis. The orange arrow is velocity and the red arrow is
              Lorentz force. Numeric measurements and particle components are
              provided below.
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
              Slow-motion playback · 1,000,000×
            </span>
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
                const particle: ParticleKind =
                  event.currentTarget.value === "proton" ? "proton" : "electron";
                updateParameters({ particle });
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
            maximum={MAX_INTERACTIVE_SPEED_METERS_PER_SECOND}
            minimum={0}
            onChange={(speedMetersPerSecond) =>
              updateParameters({ speedMetersPerSecond })
            }
            step={100_000}
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
            maximum={MAX_FIELD_MICROTESLAS}
            minimum={0}
            onChange={(magneticFieldMicroteslas) =>
              updateParameters({ magneticFieldMicroteslas })
            }
            step={0.1}
            value={parameters.magneticFieldMicroteslas}
          />
          <label className="lab-toggle" htmlFor="reverse-field">
            <input
              checked={parameters.magneticFieldReversed}
              id="reverse-field"
              onChange={(event) =>
                updateParameters({
                  magneticFieldReversed: event.currentTarget.checked,
                })
              }
              type="checkbox"
            />
            <span className="lab-toggle__track" aria-hidden="true">
              <span />
            </span>
            <span>
              Reverse magnetic field
              <small>Flip B from +Y to −Y</small>
            </span>
          </label>

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

          <label className="lab-toggle lab-toggle--challenge" htmlFor="target-challenge">
            <input
              checked={parameters.targetChallengeEnabled}
              id="target-challenge"
              onChange={(event) =>
                updateParameters({
                  targetChallengeEnabled: event.currentTarget.checked,
                })
              }
              type="checkbox"
            />
            <span className="lab-toggle__track" aria-hidden="true">
              <span />
            </span>
            <span>
              Target challenge
              <small>Guide the particle through the target region</small>
            </span>
          </label>
          {parameters.targetChallengeEnabled && (
            <p className="lab-challenge-hint">
              Adjust the field, speed, and entry direction to reach the marked
              target. Changing a parameter resets your trajectory.
            </p>
          )}
        </aside>
      </div>

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
          <small>For a uniform magnetic field and non-relativistic speed</small>
        </div>
        <p className="lab-explainer__assumption">
          Model assumptions: uniform, time-independent fields; classical
          (non-relativistic) motion below 0.1c; no radiation or collisions.
          The Boris integrator advances the particle at a fixed timestep.
        </p>
      </section>
    </div>
  );
}
