/**
 * Vercel Function — ponte entre o questionário e o Google Apps Script.
 *
 * Coloque este arquivo em /api/submit.js, no mesmo nível do package.json.
 * A rota GET serve como diagnóstico e a rota POST salva as respostas.
 */

const FALLBACK_GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw8yWGHJmONTFshN8rqJIhthd_VFvTpRTeV7jPk931Vab6r_lDstn0Pexf2Ea_m3Lwl/exec";

const MAX_BODY_BYTES = 900_000;
const REQUEST_TIMEOUT_MS = 25_000;

module.exports = async function handler(request, response) {
  const requestId =
    normalizeHeader(request.headers && request.headers["x-request-id"]) ||
    createRequestId();

  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("X-Request-Id", requestId);

  if (request.method === "GET") {
    return handleHealthCheck(response, requestId);
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return sendJson(response, 405, {
      status: "erro",
      code: "METHOD_NOT_ALLOWED",
      message: "Método não permitido.",
      requestId,
      retryable: false,
    });
  }

  try {
    const payload = parseBody(request.body);
    const serializedPayload = JSON.stringify({
      ...payload,
      integrationRequestId: requestId,
      integrationToken: process.env.SUBMISSION_SECRET || "",
    });

    if (Buffer.byteLength(serializedPayload, "utf8") > MAX_BODY_BYTES) {
      return sendJson(response, 413, {
        status: "erro",
        code: "PAYLOAD_TOO_LARGE",
        message: "As respostas ultrapassaram o limite permitido.",
        requestId,
        retryable: false,
      });
    }

    const googleScriptUrl = getGoogleScriptUrl();
    const upstream = await fetchWithTimeout(googleScriptUrl, {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
        "Content-Type": "text/plain;charset=utf-8",
        "User-Agent": "sebrae-questionario-vercel-v9",
      },
      body: serializedPayload,
      redirect: "follow",
    });

    const upstreamText = await upstream.text();
    const upstreamResult = parseJsonSafely(upstreamText);

    if (!upstream.ok) {
      logFailure("GOOGLE_HTTP_ERROR", requestId, {
        httpStatus: upstream.status,
        contentType: upstream.headers.get("content-type") || "",
      });

      return sendJson(response, 502, {
        status: "erro",
        code: "GOOGLE_HTTP_ERROR",
        message: "O serviço de armazenamento não aceitou o envio.",
        requestId,
        retryable: true,
      });
    }

    if (!upstreamResult) {
      const looksLikeHtml = /<!doctype html|<html[\s>]/i.test(upstreamText);
      const code = looksLikeHtml
        ? "GOOGLE_DEPLOYMENT_NOT_PUBLIC"
        : "GOOGLE_INVALID_RESPONSE";

      logFailure(code, requestId, {
        httpStatus: upstream.status,
        contentType: upstream.headers.get("content-type") || "",
        responsePreview: sanitizePreview(upstreamText),
      });

      return sendJson(response, 502, {
        status: "erro",
        code,
        message: looksLikeHtml
          ? "O Google Apps Script não está publicado para acesso do formulário."
          : "O serviço de armazenamento devolveu uma resposta inválida.",
        requestId,
        retryable: false,
      });
    }

    if (upstreamResult.status !== "sucesso") {
      const code = upstreamResult.code || "GOOGLE_REJECTED_SUBMISSION";
      logFailure(code, requestId, {
        upstreamMessage: String(upstreamResult.message || "").slice(0, 500),
      });

      return sendJson(response, 422, {
        status: "erro",
        code,
        message:
          upstreamResult.message ||
          "O serviço de armazenamento não confirmou as respostas.",
        requestId,
        retryable: Boolean(upstreamResult.retryable),
      });
    }

    return sendJson(response, 200, {
      status: "sucesso",
      action: upstreamResult.action,
      submissionId: upstreamResult.submissionId,
      scriptVersion: upstreamResult.scriptVersion,
      requestId,
    });
  } catch (error) {
    const isTimeout = error && error.name === "AbortError";
    const code = isTimeout ? "GOOGLE_TIMEOUT" : "VERCEL_BRIDGE_ERROR";

    logFailure(code, requestId, {
      errorName: error && error.name ? String(error.name) : "Error",
      errorMessage:
        error && error.message ? String(error.message).slice(0, 500) : "",
    });

    return sendJson(response, isTimeout ? 504 : 500, {
      status: "erro",
      code,
      message: isTimeout
        ? "O armazenamento demorou mais do que o esperado. Tente novamente."
        : "Não foi possível acessar o serviço de armazenamento agora.",
      requestId,
      retryable: true,
    });
  }
};

async function handleHealthCheck(response, requestId) {
  try {
    const googleScriptUrl = getGoogleScriptUrl();
    const separator = googleScriptUrl.includes("?") ? "&" : "?";
    const healthUrl = `${googleScriptUrl}${separator}health=1`;

    const upstream = await fetchWithTimeout(healthUrl, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
        "User-Agent": "sebrae-questionario-vercel-v9-health",
      },
      redirect: "follow",
    });

    const upstreamText = await upstream.text();
    const upstreamResult = parseJsonSafely(upstreamText);

    if (
      upstream.ok &&
      upstreamResult &&
      upstreamResult.status === "online"
    ) {
      return sendJson(response, 200, {
        status: "online",
        bridge: "online",
        storage: upstreamResult.storage || "online",
        scriptVersion: upstreamResult.scriptVersion || "",
        requestId,
      });
    }

    const looksLikeHtml = /<!doctype html|<html[\s>]/i.test(upstreamText);
    return sendJson(response, 502, {
      status: "erro",
      bridge: "online",
      storage: "indisponivel",
      code: looksLikeHtml
        ? "GOOGLE_DEPLOYMENT_NOT_PUBLIC"
        : "GOOGLE_HEALTHCHECK_FAILED",
      message: looksLikeHtml
        ? "O Google Apps Script não está público ou a URL de implantação está incorreta."
        : upstreamResult && upstreamResult.message
          ? upstreamResult.message
          : "O Google Apps Script não confirmou que está pronto.",
      requestId,
      retryable: false,
    });
  } catch (error) {
    const isTimeout = error && error.name === "AbortError";
    return sendJson(response, isTimeout ? 504 : 500, {
      status: "erro",
      bridge: "online",
      storage: "indisponivel",
      code: isTimeout ? "GOOGLE_TIMEOUT" : "GOOGLE_HEALTHCHECK_ERROR",
      message: isTimeout
        ? "O Google Apps Script demorou para responder."
        : "Não foi possível consultar o Google Apps Script.",
      requestId,
      retryable: true,
    });
  }
}

function getGoogleScriptUrl() {
  const value = String(
    process.env.GOOGLE_SCRIPT_URL || FALLBACK_GOOGLE_SCRIPT_URL,
  ).trim();

  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:\?.*)?$/.test(value)) {
    throw new Error(
      "GOOGLE_SCRIPT_URL inválida. Use a URL pública terminada em /exec.",
    );
  }

  return value;
}

function parseBody(body) {
  if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
    if (Array.isArray(body)) {
      throw new Error("O corpo da requisição não pode ser uma lista.");
    }
    return body;
  }

  if (Buffer.isBuffer(body)) {
    return parseJsonObject(body.toString("utf8"));
  }

  if (typeof body === "string" && body.trim()) {
    return parseJsonObject(body);
  }

  throw new Error("A requisição chegou sem respostas.");
}

function parseJsonObject(value) {
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("O corpo da requisição é inválido.");
  }
  return parsed;
}

function parseJsonSafely(value) {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function sendJson(response, statusCode, body) {
  return response.status(statusCode).json(body);
}

function normalizeHeader(value) {
  if (Array.isArray(value)) return String(value[0] || "").slice(0, 120);
  return value ? String(value).slice(0, 120) : "";
}

function createRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function sanitizePreview(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .slice(0, 240);
}

function logFailure(stage, requestId, details) {
  console.error(
    JSON.stringify({
      service: "sebrae-questionario",
      stage,
      requestId,
      ...details,
    }),
  );
}
