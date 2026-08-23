import { useEffect, useRef, useState } from "react";
import Icon from "../Icon";
import { initialsFromName } from "../../data";
import { embedUrl } from "../../lib/video";
import { sendPortfolioMessage } from "../../lib/messages";
import { siteThemeStyle } from "../../lib/siteStyle";

function scrollToId(id) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Autosize({ className, value, onChange, placeholder }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      rows={1}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function HeroVideo({ item }) {
  const embed =
    item.kind === "embed" || item.host
      ? embedUrl(
          { host: item.host, videoId: item.videoId },
          { autoplay: true, mute: true, loop: true },
        )
      : null;

  if (embed) {
    return (
      <iframe
        className="psite-media-frame"
        src={embed}
        title="Showreel"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video
      className="psite-media-frame"
      src={item.url}
      autoPlay
      muted
      loop
      playsInline
    />
  );
}

function Reveal({
  as: Tag = "section",
  className = "",
  animate,
  children,
  ...props
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(!animate);

  useEffect(() => {
    if (!animate) {
      setVisible(true);
      return undefined;
    }
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        io.disconnect();
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animate]);

  return (
    <Tag
      ref={ref}
      className={`${className}${animate ? " psite-reveal" : ""}${visible ? " is-in" : ""}`.trim()}
      {...props}
    >
      {children}
    </Tag>
  );
}

function HeroCarousel({ items }) {
  const [index, setIndex] = useState(0);
  const signature = items.map((item) => item.url).join("|");

  useEffect(() => {
    setIndex(0);
  }, [signature]);

  useEffect(() => {
    if (items.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [items.length, index]);

  const current = items[index] || items[0];
  if (!current) return null;

  const many = items.length > 1;

  return (
    <div className="psite-carousel">
      <img src={current.url} alt="" className="psite-media-frame" />
      {many && (
        <>
          <button
            type="button"
            className="psite-arrow psite-arrow-prev"
            aria-label="Previous still"
            onClick={() =>
              setIndex(
                (currentIndex) =>
                  (currentIndex - 1 + items.length) % items.length,
              )
            }
          >
            <Icon name="chevron-left" />
          </button>
          <button
            type="button"
            className="psite-arrow psite-arrow-next"
            aria-label="Next still"
            onClick={() =>
              setIndex((currentIndex) => (currentIndex + 1) % items.length)
            }
          >
            <Icon name="chevron-right" />
          </button>
          <div className="psite-dots">
            {items.map((item, i) => (
              <button
                key={`${item.url}-${i}`}
                type="button"
                className={`psite-dot${i === index ? " is-on" : ""}`}
                aria-label={`Still ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HeroMedia({ media, editable, onEdit }) {
  const items = media?.items || [];
  const type = media?.type || "none";
  const empty = type === "none" || items.length === 0;

  if (empty) {
    if (!editable) return null;
    return (
      <button
        type="button"
        className="psite-media psite-media-empty"
        onClick={onEdit}
      >
        <Icon name="add-image" />
        Add a reel, stills, or video
      </button>
    );
  }

  return (
    <div className="psite-media">
      {type === "video" ? (
        <HeroVideo item={items[0]} />
      ) : (
        <HeroCarousel items={items} />
      )}
      {editable && (
        <button type="button" className="psite-media-edit" onClick={onEdit}>
          Edit media
        </button>
      )}
    </div>
  );
}

function ContactForm({ ownerId }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    if (!ownerId || busy) return;
    setError("");
    setBusy(true);
    try {
      await sendPortfolioMessage(ownerId, { name, email, message });
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err?.message || "Couldn’t send that message.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <p className="psite-form-done">
        Message sent. They’ll get it in their inbox.
      </p>
    );
  }

  return (
    <form className="psite-form" onSubmit={onSubmit}>
      <label className="field">
        <span className="field-label">Name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          required
        />
      </label>
      <label className="field">
        <span className="field-label">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
        />
      </label>
      <label className="field">
        <span className="field-label">Message</span>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message"
          rows={5}
          required
        />
      </label>
      {error ? <p className="psite-form-error">{error}</p> : null}
      <button type="submit" className="solid-btn" disabled={busy}>
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

export default function PortfolioSite({
  name = "Filmmaker",
  portfolio,
  films = [],
  editable = false,
  ownerId,
  onChange,
  onOpenFilm,
  onEditHeroMedia,
  onEditFilms,
  onAboutImageFile,
}) {
  const aboutFileRef = useRef(null);
  const displayName = name.trim() || "Filmmaker";
  const year = new Date().getFullYear();
  const animate = !editable;

  function patch(partial) {
    onChange?.(partial);
  }

  return (
    <div
      className={`psite${editable ? " is-editing" : ""} is-${portfolio.colorMode || "dark"}`}
      id="top"
      style={siteThemeStyle(portfolio)}
    >
      <header className="psite-nav">
        <a
          href="#top"
          className="psite-logo"
          onClick={(event) => {
            event.preventDefault();
            scrollToId("top");
          }}
        >
          {displayName.toLowerCase()}
          <span>.</span>
        </a>
        <nav className="psite-links">
          <button type="button" onClick={() => scrollToId("work")}>
            Work
          </button>
          <button type="button" onClick={() => scrollToId("about")}>
            About
          </button>
          <button
            type="button"
            className="psite-nav-contact"
            onClick={() => scrollToId("contact")}
          >
            Contact
          </button>
        </nav>
      </header>

      <Reveal className="psite-hero" animate={animate}>
        {editable ? (
          <Autosize
            className="psite-hero-title is-editable"
            value={portfolio.heroTitle}
            onChange={(heroTitle) => patch({ heroTitle })}
            placeholder="I’ll make your film"
          />
        ) : (
          <h1 className="psite-hero-title">
            {portfolio.heroTitle || "I’ll make your film"}
          </h1>
        )}
        {editable ? (
          <Autosize
            className="psite-hero-copy is-editable"
            value={portfolio.heroDescription}
            onChange={(heroDescription) => patch({ heroDescription })}
            placeholder="A short intro about you and the work you do."
          />
        ) : (
          <p className="psite-hero-copy">{portfolio.heroDescription}</p>
        )}
        <div className="psite-hero-actions">
          <button
            type="button"
            className="ghost-btn psite-btn-ghost"
            onClick={() => scrollToId("work")}
          >
            Work
          </button>
          <button
            type="button"
            className="solid-btn"
            onClick={() => scrollToId("contact")}
          >
            Contact
          </button>
        </div>
        <HeroMedia
          media={portfolio.heroMedia}
          editable={editable}
          onEdit={onEditHeroMedia}
        />
      </Reveal>

      <Reveal className="psite-section" id="work" animate={animate}>
        <div className="psite-section-head">
          <h2>Selected work</h2>
          <span>
            {films.length} {films.length === 1 ? "film" : "films"}
          </span>
          {editable && (
            <button
              type="button"
              className="ghost-btn psite-studio-btn"
              onClick={onEditFilms}
            >
              Choose films
            </button>
          )}
        </div>
        {films.length === 0 ? (
          editable ? (
            <button
              type="button"
              className="psite-work-empty"
              onClick={onEditFilms}
            >
              Add films from your projects — including unlisted ones.
            </button>
          ) : (
            <p className="psite-muted">Projects coming soon.</p>
          )
        ) : (
          <div className="psite-work-grid">
            {films.map((film) => (
              <button
                key={film.id}
                type="button"
                className="psite-work-card"
                onClick={() => onOpenFilm?.(film.id)}
              >
                {film.poster ? (
                  <img src={film.poster} alt="" />
                ) : (
                  <span className="psite-work-fallback" />
                )}
                <div className="psite-work-shade" />
                <div className="psite-work-copy">
                  <div className="psite-work-title">{film.title}</div>
                  <div className="psite-work-meta">
                    {[film.dur, film.genre].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Reveal>

      <Reveal
        className="psite-section psite-about-band"
        id="about"
        animate={animate}
      >
        <div className="psite-about">
          {editable ? (
            <div className="psite-about-photo is-editable">
              {portfolio.aboutImageUrl ? (
                <img src={portfolio.aboutImageUrl} alt={displayName} />
              ) : (
                <span>{initialsFromName(displayName)}</span>
              )}
              <button
                type="button"
                className="psite-media-edit"
                onClick={() => aboutFileRef.current?.click()}
              >
                Change photo
              </button>
            </div>
          ) : (
            <div className="psite-about-photo">
              {portfolio.aboutImageUrl ? (
                <img src={portfolio.aboutImageUrl} alt={displayName} />
              ) : (
                <span>{initialsFromName(displayName)}</span>
              )}
            </div>
          )}
          <div className="psite-about-copy">
            <h2>About</h2>
            {editable ? (
              <Autosize
                className="psite-about-text is-editable"
                value={portfolio.aboutText}
                onChange={(aboutText) => patch({ aboutText })}
                placeholder="A short description of you and what you do."
              />
            ) : (
              <p className="psite-about-text">{portfolio.aboutText}</p>
            )}
          </div>
          <input
            ref={aboutFileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onAboutImageFile?.(file);
              event.target.value = "";
            }}
          />
        </div>
      </Reveal>

      <Reveal
        className="psite-section psite-contact"
        id="contact"
        animate={animate}
      >
        <h2>
          Let’s make <em>something.</em>
        </h2>
        <ContactForm ownerId={ownerId} />
      </Reveal>

      <footer className="psite-foot">
        <p className="psite-copy">
          © {year} {displayName} All rights reserved
        </p>
      </footer>
      <a className="psite-float" href="/">
        <span className="psite-float-title">
          Powered by <span className="psite-float-brand">Shortwave</span>
        </span>
        <span className="psite-float-sub">Make your own free site →</span>
      </a>
    </div>
  );
}
