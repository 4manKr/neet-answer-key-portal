import { fetchInstitutesFromScript } from "./_lib/apps-script.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({
      error: "Method not allowed.",
    });
  }

  try {
    const result = await fetchInstitutesFromScript();

    return response.status(200).json({
      institutes: result.institutes,
      source: result.source,
    });
  } catch (error) {
    return response.status(500).json({
      error: error.message || "Unable to load answer keys.",
    });
  }
}
