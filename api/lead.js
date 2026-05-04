import { sendLeadToScript } from "./_lib/apps-script.js";

function validateLead(body = {}) {
  const name = String(body.name || "").trim();
  const phoneNumber = String(body.phoneNumber || "").trim();
  const instituteName = String(body.instituteName || "").trim();
  const requestedCode = String(body.requestedCode || "").trim();
  const fileUrl = String(body.fileUrl || "").trim();

  if (!name) {
    return "Name is required.";
  }

  if (!phoneNumber) {
    return "Phone number is required.";
  }

  if (!/^\d{10,15}$/.test(phoneNumber)) {
    return "Enter a valid phone number.";
  }

  if (!instituteName || !requestedCode || !fileUrl) {
    return "Incomplete download request.";
  }

  return "";
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({
      error: "Method not allowed.",
    });
  }

  try {
    const validationError = validateLead(request.body);

    if (validationError) {
      return response.status(400).json({
        error: validationError,
      });
    }

    const payload = await sendLeadToScript(request.body);

    return response.status(200).json({
      ok: true,
      downloadUrl: payload.downloadUrl || "",
    });
  } catch (error) {
    return response.status(500).json({
      error: error.message || "Unable to process download.",
    });
  }
}
