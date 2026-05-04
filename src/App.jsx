import { useEffect, useMemo, useState } from "react";

const paperCodes = [
  { key: "11", label: "Paper Code 11" },
  { key: "12", label: "Paper Code 12" },
  { key: "13", label: "Paper Code 13" },
  { key: "14", label: "Paper Code 14" },
];

const initialForm = {
  name: "",
  phoneNumber: "",
};

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

  useEffect(() => {
    let cancelled = false;

    async function loadInstitutes() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/institutes");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load answer keys.");
        }

        if (!cancelled) {
          if (payload.source === "sample") {
            setInstitutes(sampleInstitutes);
          } else {
            setInstitutes(Array.isArray(payload.institutes) ? payload.institutes : []);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Unable to load answer keys.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInstitutes();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasInstitutes = useMemo(() => institutes.length > 0, [institutes]);

  function openLeadForm(institute, requestedCode) {
    setSelectedRequest({
      instituteName: institute.instituteName,
      requestedCode,
      fileUrl: institute.codes?.[requestedCode] || "",
    });
    setFormData(initialForm);
    setFormError("");
  }

  function closeLeadForm(force = false) {
    if (submitting && !force) {
      return;
    }

    setSelectedRequest(null);
    setFormData(initialForm);
    setFormError("");
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function validateForm() {
    const name = formData.name.trim();
    const phoneNumber = formData.phoneNumber.trim();

    if (!name) {
      return "Enter your name.";
    }

    if (!phoneNumber) {
      return "Enter your phone number.";
    }

    if (!/^\d{10,15}$/.test(phoneNumber)) {
      return "Enter a valid phone number.";
    }

    if (!selectedRequest?.fileUrl) {
      return "This answer key is not available.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    let pendingWindow = null;

    try {
      setSubmitting(true);
      setFormError("");
      pendingWindow = window.open("", "_blank", "noopener,noreferrer");

      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          instituteName: selectedRequest.instituteName,
          requestedCode: selectedRequest.requestedCode,
          fileUrl: selectedRequest.fileUrl,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        pendingWindow?.close();
        throw new Error(payload.error || "Unable to process download.");
      }

      if (payload.downloadUrl) {
        if (pendingWindow) {
          pendingWindow.location.href = payload.downloadUrl;
        } else {
          window.open(payload.downloadUrl, "_blank", "noopener,noreferrer");
        }
      }

      closeLeadForm(true);
    } catch (submitError) {
      pendingWindow?.close();
      setFormError(submitError.message || "Unable to process download.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell">
      <main className="portal">
        <header className="hero">
          <p className="eyebrow">NEET 2026</p>
          <h1>Answer Key Downloads</h1>
          <p className="hero-copy">
            Download institute answer keys for the exam held on May 3, 2026.
          </p>
        </header>

        <section className="list-section" aria-label="Institute answer keys">
          <div className="table-header" role="row">
            <span>Institute Name</span>
            {paperCodes.map((paperCode) => (
              <span key={paperCode.key}>{paperCode.label}</span>
            ))}
          </div>

          {loading ? (
            <div className="status-card">Loading answer keys...</div>
          ) : null}

          {!loading && error ? (
            <div className="status-card status-card--error">{error}</div>
          ) : null}

          {!loading && !error && !hasInstitutes ? (
            <div className="status-card">No answer keys are available yet.</div>
          ) : null}

          {!loading && !error && hasInstitutes ? (
            <div className="institute-list">
              {institutes.map((institute) => (
                <article className="institute-row" key={institute.id}>
                  <div className="institute-name">{institute.instituteName}</div>

                  {paperCodes.map((paperCode) => {
                    const fileUrl = institute.codes?.[paperCode.key];
                    const isAvailable = Boolean(fileUrl);

                    return (
                      <div className="download-cell" key={paperCode.key}>
                        <span className="mobile-label">{paperCode.label}</span>
                        <button
                          type="button"
                          className="download-button"
                          onClick={() => openLeadForm(institute, paperCode.key)}
                          disabled={!isAvailable}
                        >
                          {isAvailable ? "Download" : "Unavailable"}
                        </button>
                      </div>
                    );
                  })}
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </main>

      {selectedRequest ? (
        <div className="modal-backdrop" role="presentation" onClick={closeLeadForm}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="download-form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="download-form-title">Download {`Paper Code ${selectedRequest.requestedCode}`}</h2>
            <p className="modal-copy">{selectedRequest.instituteName}</p>

            <form className="lead-form" onSubmit={handleSubmit}>
              <label className="field">
                <span>Name</span>
                <input
                  name="name"
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleInputChange}
                  autoComplete="name"
                />
              </label>

              <label className="field">
                <span>Phone Number</span>
                <input
                  name="phoneNumber"
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter your phone number"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  autoComplete="tel"
                />
              </label>

              {formError ? <p className="form-error">{formError}</p> : null}

              <div className="modal-actions">
                <button type="button" className="ghost-button" onClick={closeLeadForm}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? "Please wait..." : "Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
