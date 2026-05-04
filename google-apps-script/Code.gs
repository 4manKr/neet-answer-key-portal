var SPREADSHEET_ID = "YOUR_SPREADSHEET_ID";
var INSTITUTES_SHEET = "institutes";
var LEADS_SHEET = "leads";

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "";

  if (action === "institutes") {
    return jsonResponse({
      ok: true,
      institutes: getInstitutes_()
    });
  }

  return jsonResponse({
    ok: false,
    error: "Unsupported action."
  });
}

function doPost(e) {
  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var validationError = validateLead_(payload);

    if (validationError) {
      return jsonResponse({
        ok: false,
        error: validationError
      });
    }

    var directDownloadUrl = toDirectDownloadUrl_(payload.fileUrl);
    appendLead_(payload, directDownloadUrl);

    return jsonResponse({
      ok: true,
      downloadUrl: directDownloadUrl
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.message || "Unable to save download request."
    });
  }
}

function getInstitutes_() {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(INSTITUTES_SHEET);
  var values = sheet.getDataRange().getValues();

  if (!values || values.length < 2) {
    return [];
  }

  var headers = values[0].map(function(header) {
    return String(header || "").trim();
  });

  var indexes = {
    instituteName: headers.indexOf("instituteName"),
    instituteCode: headers.indexOf("instituteCode"),
    code11Link: headers.indexOf("code11Link"),
    code12Link: headers.indexOf("code12Link"),
    code13Link: headers.indexOf("code13Link"),
    code14Link: headers.indexOf("code14Link")
  };

  Object.keys(indexes).forEach(function(key) {
    if (indexes[key] === -1) {
      throw new Error("Missing required column: " + key);
    }
  });

  return values.slice(1).filter(function(row) {
    return row.join("").trim() !== "";
  }).map(function(row, index) {
    var instituteName = String(row[indexes.instituteName] || "").trim();
    var instituteCode = String(row[indexes.instituteCode] || "").trim();

    return {
      id: instituteCode || instituteName || "row-" + (index + 1),
      instituteName: instituteName,
      instituteCode: instituteCode,
      codes: {
        "11": toDirectDownloadUrl_(row[indexes.code11Link]),
        "12": toDirectDownloadUrl_(row[indexes.code12Link]),
        "13": toDirectDownloadUrl_(row[indexes.code13Link]),
        "14": toDirectDownloadUrl_(row[indexes.code14Link])
      }
    };
  });
}

function appendLead_(payload, directDownloadUrl) {
  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(LEADS_SHEET);

  sheet.appendRow([
    new Date(),
    String(payload.name || "").trim(),
    String(payload.phoneNumber || "").trim(),
    String(payload.instituteName || "").trim(),
    String(payload.instituteCode || "").trim(),
    String(payload.requestedCode || "").trim(),
    String(payload.fileUrl || "").trim(),
    directDownloadUrl
  ]);
}

function validateLead_(payload) {
  var name = String(payload.name || "").trim();
  var phoneNumber = String(payload.phoneNumber || "").trim();
  var instituteName = String(payload.instituteName || "").trim();
  var instituteCode = String(payload.instituteCode || "").trim();
  var requestedCode = String(payload.requestedCode || "").trim();
  var fileUrl = String(payload.fileUrl || "").trim();

  if (!name) {
    return "Name is required.";
  }

  if (!phoneNumber) {
    return "Phone number is required.";
  }

  if (!/^\d{10,15}$/.test(phoneNumber)) {
    return "Enter a valid phone number.";
  }

  if (!instituteName || !instituteCode || !requestedCode || !fileUrl) {
    return "Incomplete download request.";
  }

  return "";
}

function toDirectDownloadUrl_(fileUrl) {
  var value = String(fileUrl || "").trim();
  var match;

  if (!value) {
    return "";
  }

  match = value.match(/\/file\/d\/([^/]+)/);
  if (match && match[1]) {
    return "https://drive.google.com/uc?export=download&id=" + match[1];
  }

  match = value.match(/[?&]id=([^&]+)/);
  if (match && match[1]) {
    return "https://drive.google.com/uc?export=download&id=" + match[1];
  }

  match = value.match(/\/open\?id=([^&]+)/);
  if (match && match[1]) {
    return "https://drive.google.com/uc?export=download&id=" + match[1];
  }

  return value;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
