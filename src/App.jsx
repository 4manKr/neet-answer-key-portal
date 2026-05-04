import { useEffect, useMemo, useState } from "react";

const paperCodes = [
  { key: "11", label: "C-11", full: "Paper Code 11" },
  { key: "12", label: "C-12", full: "Paper Code 12" },
  { key: "13", label: "C-13", full: "Paper Code 13" },
  { key: "14", label: "C-14", full: "Paper Code 14" },
];

const initialForm = { name: "", phoneNumber: "" };

const sampleInstitutes = [
  {
    id: "sample-allen",
    instituteName: "Allen Career Institute",
    codes: {
      "11": "https://drive.google.com/uc?export=download&id=1sampleCode11",
      "12": "https://drive.google.com/uc?export=download&id=1sampleCode12",
      "13": "https://drive.google.com/uc?export=download&id=1sampleCode13",
      "14": "",
    },
  },
  {
    id: "sample-aakash",
    instituteName: "Aakash Institute",
    codes: {
      "11": "https://drive.google.com/uc?export=download&id=1sampleCode21",
      "12": "",
      "13": "https://drive.google.com/uc?export=download&id=1sampleCode23",
      "14": "https://drive.google.com/uc?export=download&id=1sampleCode24",
    },
  },
];

function App() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadInstitutes() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/institutes");
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load answer keys.");
        if (!cancelled) {
          setInstitutes(
            payload.source === "sample"
              ? sampleInstitutes
              : Array.isArray(payload.institutes)
              ? payload.institutes
              : []
          );
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to load answer keys.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadInstitutes();
    return () => { cancelled = true; };
  }, []);

  const totalAvailable = useMemo(
    () =>
      institutes.reduce(
        (sum, inst) =>
          sum + paperCodes.filter((pc) => Boolean(inst.codes?.[pc.key])).length,
        0
      ),
    [institutes]
  );

  function openLeadForm(institute, requestedCode) {
    setSelectedRequest({
      instituteName: institute.instituteName,
      requestedCode,
      fileUrl: institute.codes?.[requestedCode] || "",
    });
    setFormData(initialForm);
    setFormError("");
    setDownloaded(false);
  }

  function closeLeadForm(force = false) {
    if (submitting && !force) return;
    setSelectedRequest(null);
    setFormData(initialForm);
    setFormError("");
    setDownloaded(false);
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((cur) => ({ ...cur, [name]: value }));
  }

  function validateForm() {
    const name = formData.name.trim();
    const phone = formData.phoneNumber.trim();
    if (!name) return "Enter your name.";
    if (!phone) return "Enter your phone number.";
    if (!/^\d{10,15}$/.test(phone)) return "Enter a valid 10-digit number.";
    if (!selectedRequest?.fileUrl) return "This answer key is not available.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validateForm();
    if (err) { setFormError(err); return; }

    try {
      setSubmitting(true);
      setFormError("");

      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          instituteName: selectedRequest.instituteName,
          requestedCode: selectedRequest.requestedCode,
          fileUrl: selectedRequest.fileUrl,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to process download.");

      if (payload.downloadUrl) {
        // Download in the same tab — Google Drive attachment URLs don't navigate away
        window.location.href = payload.downloadUrl;
      }

      setDownloaded(true);
      setTimeout(() => closeLeadForm(true), 1800);
    } catch (submitErr) {
      setFormError(submitErr.message || "Unable to process download.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell">
      <main className="portal">
        <header className="hero">
          <div className="hero-top">
            <div className="live-pill">
              <span className="live-dot" />
              NEET 2026 &nbsp;·&nbsp; May 3
            </div>
            {!loading && !error && institutes.length > 0 && (
              <div className="hero-stats">
                <span>{institutes.length} institutes</span>
                <span className="stat-sep">·</span>
                <span>{totalAvailable} keys available</span>
              </div>
            )}
          </div>
          <h1>Official Answer Keys</h1>
          <p className="hero-sub">Enter your details once — your file downloads instantly.</p>
        </header>

        <section className="table-wrap" aria-label="Institute answer keys">
          <div className="col-header" role="row">
            <span>Institute</span>
            {paperCodes.map((pc) => (
              <span key={pc.key} className={`code-badge code-badge--${pc.key}`}>
                {pc.label}
              </span>
            ))}
          </div>

          {loading && (
            <div className="skeleton-list">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="skeleton-row" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="status-card status-card--error">
              <span className="status-icon">⚠</span> {error}
            </div>
          )}

          {!loading && !error && institutes.length === 0 && (
            <div className="status-card">No answer keys available yet.</div>
          )}

          {!loading && !error && institutes.length > 0 && (
            <ul className="inst-list">
              {institutes.map((inst, i) => (
                <li
                  className="inst-row"
                  key={inst.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <span className="inst-name">{inst.instituteName}</span>
                  {paperCodes.map((pc) => {
                    const available = Boolean(inst.codes?.[pc.key]);
                    return (
                      <div key={pc.key} className="dl-cell">
                        <span className={`mobile-code code-badge code-badge--${pc.key}`}>
                          {pc.full}
                        </span>
                        <button
                          type="button"
                          className={`dl-btn dl-btn--${pc.key}${available ? "" : " dl-btn--na"}`}
                          onClick={() => available && openLeadForm(inst, pc.key)}
                          disabled={!available}
                          aria-label={available ? `Download ${pc.full} – ${inst.instituteName}` : `${pc.full} not available`}
                        >
                          {available ? (
                            <>
                              <svg className="dl-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M8 1v9m0 0L5 7m3 3 3-3M2 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              PDF
                            </>
                          ) : (
                            "—"
                          )}
                        </button>
                      </div>
                    );
                  })}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {selectedRequest && (
        <div className="backdrop" role="presentation" onClick={closeLeadForm}>
          <div
            className={`modal${downloaded ? " modal--done" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {downloaded ? (
              <div className="done-state">
                <div className="done-icon">✓</div>
                <p className="done-text">Download started!</p>
              </div>
            ) : (
              <>
                <div className="modal-meta">
                  <span className={`code-badge code-badge--${selectedRequest.requestedCode}`}>
                    Paper Code {selectedRequest.requestedCode}
                  </span>
                  <span className="modal-inst">{selectedRequest.instituteName}</span>
                </div>
                <h2 id="modal-title">Get Answer Key</h2>

                <form className="lead-form" onSubmit={handleSubmit}>
                  <label className="field">
                    <span>Full Name</span>
                    <input
                      name="name"
                      type="text"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleInputChange}
                      autoComplete="name"
                      autoFocus
                    />
                  </label>
                  <label className="field">
                    <span>Phone Number</span>
                    <input
                      name="phoneNumber"
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      autoComplete="tel"
                    />
                  </label>

                  {formError && <p className="form-error">{formError}</p>}

                  <div className="modal-actions">
                    <button type="button" className="btn-ghost" onClick={closeLeadForm}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? (
                        <span className="spinner" />
                      ) : (
                        <>
                          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="14" height="14">
                            <path d="M8 1v9m0 0L5 7m3 3 3-3M2 13h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Download
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
