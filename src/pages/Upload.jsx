import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomButton from "../components/CustomButton.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const steps = [
  {
    id: 1,
    title: "Paste your YouTube link below",
    help: "Upload a video to YouTube (public or unlisted), and paste the share link here.",
  },
  {
    id: 2,
    title: "What is the title of your short?",
    help: "This is the public, searchable name for your film",
  },
  {
    id: 3,
    title: "What is a quick log line that describes your short?",
    help: "This should be one sentence that describes the basic story of your film",
  },
  {
    id: 4,
    title: "Add some tags to your short",
    help: "Tags represent the class/club the film was made for, the genre of the film, and more",
  },
];

export default function Upload() {
  const [step, setStep] = useState(1);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [logline, setLogline] = useState("");
  const [tags, setTags] = useState("");
  const [animClass, setAnimClass] = useState("");
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [filteredTags, setFilteredTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const availableTags = [
    "RTF 304",
    "DKA Blue Chip",
    "BFP",
    "The Collective",
    "The New Project",
    "Directing Workshop",
    "Advanced Narrative",
  ];

  const current = steps[step - 1];

  const getYouTubeId = (url) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const parts = u.pathname.split("/");
      const embedIndex = parts.indexOf("embed");
      if (embedIndex !== -1 && parts[embedIndex + 1])
        return parts[embedIndex + 1];
      return "";
    } catch {
      return "";
    }
  };

  const getYouTubeThumbnail = (url) => {
    const id = getYouTubeId(url);
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
  };

  const handleTagInput = (e) => {
    const value = e.target.value;
    setTags(value);

    if (value.trim().length > 0) {
      const filtered = availableTags
        .filter((tag) => !selectedTags.includes(tag))
        .filter((tag) => tag.toLowerCase().includes(value.toLowerCase()));
      setFilteredTags(filtered);
      setShowTagMenu(true);
    } else {
      const remaining = availableTags.filter(
        (tag) => !selectedTags.includes(tag)
      );
      setFilteredTags(remaining);
      setShowTagMenu(true);
    }
  };

  const selectTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
    setTags("");
    const remaining = availableTags.filter(
      (t) => !selectedTags.includes(t) && t !== tag
    );
    setFilteredTags(remaining);
    setShowTagMenu(true);
  };

  const removeTag = (tag) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
    // Refresh suggestions if input is focused/visible
    const value = tags.trim().toLowerCase();
    const remaining = availableTags
      .filter((t) => t !== tag)
      .filter((t) => !selectedTags.filter((st) => st !== tag).includes(t));
    const filtered = value
      ? remaining.filter((t) => t.toLowerCase().includes(value))
      : remaining;
    setFilteredTags(filtered);
    setShowTagMenu(filtered.length > 0);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return youtubeUrl.trim().length > 0;
      case 2:
        return title.trim().length > 0;
      case 3:
        return logline.trim().length > 0;
      case 4:
        return true; // tags are optional
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setSubmitting(true);
      const thumbnailUrl = getYouTubeThumbnail(youtubeUrl);
      await addDoc(collection(db, "films"), {
        ownerUid: user.uid,
        youtubeUrl: youtubeUrl.trim(),
        thumbnailUrl: thumbnailUrl,
        title: title.trim(),
        logline: logline.trim(),
        tags: selectedTags,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate("/");
    } catch (err) {
      // Simple fallback; in a real app, surface a toast/error UI
      console.error("Failed to save film:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <section className="hero">
        <div className="container" style={{ textAlign: "left" }}>
          {/* Card */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: 28,
              minHeight: 520,
              display: "flex",
              alignItems: "flex-start",
              flexDirection: "column",
              textAlign: "left",
            }}
          >
            {/* Progress dots */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                marginBottom: 50,
              }}
            >
              {steps.map((s, idx) => {
                const isCompleted = step > s.id;
                const isCurrent = step === s.id;
                return (
                  <div
                    key={s.id}
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: isCompleted ? "#ffffff" : "transparent",
                        border: `2px solid ${
                          isCompleted || isCurrent
                            ? "#ffffff"
                            : "rgba(255,255,255,0.25)"
                        }`,
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-sans)",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {isCurrent ? s.id : ""}
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        style={{
                          width: 24,
                          height: 2,
                          background:
                            step > s.id ? "#ffffff" : "rgba(255,255,255,0.25)",
                          margin: 0,
                          borderRadius: 2,
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Title */}
            <h1
              className="page-title"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 44,
                textAlign: "left",
                marginTop: 0,
                alignSelf: "flex-start",
              }}
            >
              {current.title}
            </h1>
            <p
              className="page-lead"
              style={{
                textAlign: "left",
                marginBottom: 35,
                alignSelf: "stretch",
              }}
            >
              {current.help}
            </p>
            <div className={animClass} style={{ width: "100%" }}>
              {step === 1 && (
                <input
                  className="search-input"
                  placeholder="https://www.youtube.com/myfilm"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  style={{ width: "100%" }}
                />
              )}

              {step === 2 && (
                <input
                  className="search-input"
                  placeholder="The Best Short Ever"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: "100%" }}
                />
              )}

              {step === 3 && (
                <input
                  className="search-input"
                  placeholder="A genius film student creates a world changing site called Shortwave"
                  value={logline}
                  onChange={(e) => setLogline(e.target.value)}
                  style={{ width: "100%" }}
                />
              )}

              {step === 4 && (
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    className="search-input"
                    placeholder="Search for tags…"
                    value={tags}
                    onChange={handleTagInput}
                    onFocus={() => {
                      const value = tags.trim().toLowerCase();
                      const remaining = availableTags.filter(
                        (tag) => !selectedTags.includes(tag)
                      );
                      const filtered = value
                        ? remaining.filter((tag) =>
                            tag.toLowerCase().includes(value)
                          )
                        : remaining;
                      setFilteredTags(filtered);
                      setShowTagMenu(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const value = tags.trim();
                        const remaining = availableTags.filter(
                          (t) => !selectedTags.includes(t)
                        );
                        const exactAvailable = remaining.find(
                          (t) => t.toLowerCase() === value.toLowerCase()
                        );
                        if (value.length === 0) return;
                        if (exactAvailable) {
                          selectTag(exactAvailable);
                        } else {
                          // Create custom tag
                          selectTag(value);
                        }
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding to allow clicking on menu items
                      setTimeout(() => setShowTagMenu(false), 150);
                    }}
                    style={{ width: "100%" }}
                  />
                  {showTagMenu && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: 4,
                        background: "#1a1a1a",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 10,
                        boxShadow: "0 6px 24px rgba(0,0,0,0.3)",
                        overflow: "hidden",
                        zIndex: 30,
                        maxHeight: 200,
                        overflowY: "auto",
                      }}
                    >
                      {filteredTags.map((tag, idx) => (
                        <button
                          key={tag}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 12px",
                            background: "transparent",
                            color: "rgba(255,255,255,0.8)",
                            border: "none",
                            cursor: "pointer",
                            fontFamily: "var(--font-sans)",
                            borderBottom:
                              idx < filteredTags.length - 1
                                ? "1px solid rgba(255,255,255,0.08)"
                                : "none",
                          }}
                          onClick={() => selectTag(tag)}
                          onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                        >
                          {tag}
                        </button>
                      ))}
                      {(() => {
                        const value = tags.trim();
                        const remaining = availableTags.filter(
                          (t) => !selectedTags.includes(t)
                        );
                        const exactAvailable = remaining.some(
                          (t) => t.toLowerCase() === value.toLowerCase()
                        );
                        const alreadySelected = selectedTags.some(
                          (t) => t.toLowerCase() === value.toLowerCase()
                        );
                        const shouldShowCreate =
                          value.length > 0 &&
                          !alreadySelected &&
                          !exactAvailable;
                        if (!shouldShowCreate) return null;
                        return (
                          <button
                            key="__create__"
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 12px",
                              background: "transparent",
                              color: "rgba(255,255,255,0.9)",
                              border: "none",
                              cursor: "pointer",
                              fontFamily: "var(--font-sans)",
                              borderTop:
                                filteredTags.length > 0
                                  ? "1px solid rgba(255,255,255,0.08)"
                                  : "none",
                            }}
                            onClick={() => selectTag(value)}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            {`Create "${value}"`}
                          </button>
                        );
                      })()}
                    </div>
                  )}
                  {/* Selected tag chips (below input) */}
                  {selectedTags.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        marginTop: 10,
                      }}
                    >
                      {selectedTags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            background: "#ffffff",
                            color: "#000000",
                            borderRadius: 999,
                            padding: "6px 10px",
                            fontFamily: "var(--font-sans)",
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          {tag}
                          <button
                            aria-label={`Remove ${tag}`}
                            onClick={() => removeTag(tag)}
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 999,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "#000000",
                              lineHeight: 0,
                              padding: 0,
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Footer actions */}
            <div
              style={{ marginTop: "auto", alignSelf: "stretch", width: "100%" }}
            >
              <div
                style={{
                  height: 1,
                  background: "rgba(255,255,255,0.12)",
                  marginBottom: 12,
                  width: "calc(100% + 56px)",
                  marginLeft: -28,
                  marginRight: -28,
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  paddingBottom: 0,
                  marginTop: 15,
                }}
              >
                <CustomButton
                  className="btn"
                  secondary
                  onClick={() => {
                    if (step > 1) {
                      setAnimClass("slide-out-right");
                      setTimeout(() => {
                        setStep((s) => Math.max(1, s - 1));
                        setAnimClass("slide-in-left");
                        setTimeout(() => setAnimClass(""), 200);
                      }, 180);
                    } else {
                      navigate("/");
                    }
                  }}
                >
                  {step > 1 ? "Back" : "Cancel"}
                </CustomButton>
                {step < 4 ? (
                  <CustomButton
                    className="btn btn--light"
                    disabled={!isStepValid()}
                    onClick={() => {
                      setAnimClass("slide-out-left");
                      setTimeout(() => {
                        setStep((s) => Math.min(4, s + 1));
                        setAnimClass("slide-in-right");
                        setTimeout(() => setAnimClass(""), 200);
                      }, 180);
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      opacity: isStepValid() ? 1 : 0.5,
                    }}
                  >
                    <span
                      style={{ display: "inline-flex", alignItems: "center" }}
                    >
                      Continue
                      <span
                        aria-hidden="true"
                        style={{
                          marginLeft: 8,
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14" />
                          <path d="M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </span>
                  </CustomButton>
                ) : (
                  <CustomButton
                    className="btn btn--light"
                    onClick={handleSubmit}
                    disabled={
                      submitting ||
                      !youtubeUrl.trim() ||
                      !title.trim() ||
                      !logline.trim()
                    }
                    style={{ opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? "Uploading…" : "Upload Short"}
                  </CustomButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
