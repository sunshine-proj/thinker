import { useEffect, useState } from "react";
import { isAudioSupported, isMuted, playTone, setMuted, subscribeMuted, type ToneOptions } from "../../services/audio/tonePlayer";

export interface ListenTone extends ToneOptions {
  readonly label: string;
}

/** Buttons that play tones, with a mute switch. The frequencies are always shown as text too. */
export function ListenButtons({ tones }: { readonly tones: readonly ListenTone[] }) {
  const [muted, setMutedState] = useState(isMuted);
  const supported = isAudioSupported();
  useEffect(() => subscribeMuted(setMutedState), []);

  return (
    <div aria-label="Listen" className="listen-buttons" role="group">
      {tones.map((tone) => (
        <button
          className="lab-button"
          disabled={!supported || muted}
          key={tone.label}
          onClick={() => playTone(tone)}
          type="button"
        >
          <span aria-hidden="true">♪ </span>
          {tone.label} ({tone.frequency.toFixed(1)} Hz)
        </button>
      ))}
      <label className="listen-buttons__mute">
        <input checked={muted} onChange={(event) => setMuted(event.currentTarget.checked)} type="checkbox" />
        Mute sounds
      </label>
      {!supported && <p className="listen-buttons__note">Sound is not available in this browser; the frequencies above tell the same story.</p>}
    </div>
  );
}
