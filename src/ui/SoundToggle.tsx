import { Glyph } from "./icons";
import { useSoundMuted } from "./sound";

export function SoundToggle({ compact = true }: { compact?: boolean }) {
  const [muted, setMuted] = useSoundMuted();
  const label = muted ? "Turn interface sounds on" : "Mute interface sounds";

  return (
    <button
      type="button"
      className={compact ? "icon-btn" : "landing__sound"}
      data-sound="off"
      aria-pressed={!muted}
      aria-label={label}
      title={muted ? "Interface sounds off" : "Interface sounds on"}
      onClick={() => setMuted(!muted)}
    >
      <Glyph name={muted ? "volumeOff" : "volume"} size={compact ? 15 : 13} />
      {!compact && <span>{muted ? "Sound off" : "Sound on"}</span>}
    </button>
  );
}