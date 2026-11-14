import { useLandingController } from "../controllers/useLandingController";
import { BotanicalArtIcon, Glyph } from "../ui/icons";
import { SoundToggle } from "../ui/SoundToggle";
import type { RouteKey } from "../app/router";

export function FarmerWebsiteLanding({
  onEnterDashboard,
  onStartPreview,
  onNavigate,
}: {
  onEnterDashboard: () => void;
  onStartPreview?: () => void;
  onNavigate?: (route: RouteKey) => void;
}) {
  const { slides, activeSlide, current, handleSelectSlide, handleActionClick } =
    useLandingController(onEnterDashboard);

  return (
    <main className="landing">
      <div
        className="landing__ambient"
        aria-hidden="true"
        style={{ backgroundImage: `url(${current.imageUri})` }}
      />

      <header className="landing__top">
        <a
          className="landing__brand"
          href="#/"
          onClick={(event) => event.preventDefault()}
        >
          <span className="landing__mark">
            <BotanicalArtIcon name="sprout" size={20} />
          </span>
          <span>
            <strong>AgroRotate</strong>
            <small>Evidence-first rotations</small>
          </span>
        </a>
        {onNavigate && (
          <nav className="landing__nav" aria-label="Reference pages">
            {(
              [
                ["method", "Method & limits"],
                ["crops", "Crop evidence"],
                ["evidence", "Evidence room"],
              ] as [RouteKey, string][]
            ).map(([key, label]) => (
              <button key={key} type="button" onClick={() => onNavigate(key)}>
                {label}
              </button>
            ))}
            <SoundToggle compact={false} />
          </nav>
        )}
      </header>

      <section className="landing__hero">
        <div className="landing__copy">
          <span className="landing__pill">
            <BotanicalArtIcon
              name={current.iconKey}
              size={18}
              animation="pulse"
            />
            AgroRotate · NASA Space Apps 2026
          </span>
          <p className="landing__script">~ {current.script} ~</p>
          <h1 className="landing__title">{current.title}</h1>
          <p className="landing__subtitle">{current.subtitle}</p>
          <div className="landing__actions">
            {onStartPreview && (
              <button
                type="button"
                className="landing__cta landing__cta--ghost"
                onClick={onStartPreview}
                data-sound="whoosh"
              >
                <Glyph name="play" size={17} />
                Preview the five steps
              </button>
            )}
            <button
              type="button"
              className="landing__cta"
              onClick={handleActionClick}
              data-sound="whoosh"
            >
              <BotanicalArtIcon name="compass" size={20} />
              Open my field
            </button>
          </div>
          <div className="landing__proof">
            <span>Live NASA POWER</span>
            <span>30 crop profiles · source-labeled</span>
            <span>No invented numbers</span>
          </div>
        </div>

        <div
          className="landing__visual"
          style={{ borderColor: current.accentColor }}
        >
          <img
            src={current.imageUri}
            alt={current.cardTitle}
            loading="eager"
            decoding="async"
          />
          <div className="landing__visual-caption">
            <BotanicalArtIcon name={current.iconKey} size={18} />
            <div>
              <strong>{current.cardTitle}</strong>
              <span>{current.cardDesc}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing__slides" aria-label="Highlights">
        {slides.map((slide) => {
          const isCurrent = activeSlide === slide.index;
          return (
            <button
              key={slide.cardTitle}
              type="button"
              className={`landing__slide${isCurrent ? " is-active" : ""}`}
              onClick={() => handleSelectSlide(slide.index)}
              style={{ borderColor: isCurrent ? slide.accentColor : undefined }}
            >
              <img
                src={slide.imageUri}
                alt=""
                loading="lazy"
                decoding="async"
              />
              <span className="landing__slide-shade" />
              <span className="landing__slide-copy">
                <BotanicalArtIcon name={slide.iconKey} size={17} />
                <strong>{slide.cardTitle}</strong>
                <small>{slide.cardDesc}</small>
              </span>
            </button>
          );
        })}
      </section>

      <footer className="landing__foot">
        <span>NASA POWER · FAO-56 · FAO salinity tables</span>
        <span>Evidence-grounded decision support</span>
      </footer>
    </main>
  );
}
