const SAMPLE_INSTITUTES = [
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

function getAppsScriptUrl() {
  return (
    process.env.GOOGLE_SCRIPT_URL?.trim() ||
    process.env.VITE_GOOGLE_SCRIPT_URL?.trim() ||
    ""
  );
}

export async function fetchInstitutesFromScript() {
  const scriptUrl = getAppsScriptUrl();

  if (!scriptUrl) {
    return {
      institutes: SAMPLE_INSTITUTES,
      source: "sample",
    };
  }

  const response = await fetch(`${scriptUrl}?action=institutes`, {
    method: "GET",
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Apps Script returned an invalid response. Ensure it is deployed as a web app and the spreadsheet is configured correctly.");
  }

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Unable to load answer keys.");
  }

  return {
    institutes: Array.isArray(payload.institutes) ? payload.institutes : [],
    source: "apps-script",
  };
}

export async function sendLeadToScript(lead) {
  const scriptUrl = getAppsScriptUrl();

  if (!scriptUrl) {
    throw new Error("Google Apps Script URL is not configured.");
  }

  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(lead),
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("Apps Script returned an invalid response. Ensure it is deployed as a web app and the spreadsheet is configured correctly.");
  }

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Unable to process download.");
  }

  return payload;
}
