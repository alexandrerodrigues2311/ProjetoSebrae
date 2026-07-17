/**
 * Vercel Serverless Function
 *
 * Recebe a resposta do formulário no mesmo domínio e encaminha ao Google Apps Script.
 * Isso elimina o mode="no-cors" e permite que o formulário confirme o salvamento real.
 */

const DEFAULT_GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw8yWGHJmONTFshN8rqJIhthd_VFvTpRTeV7jPk931Vab6r_lDstn0Pexf2Ea_m3Lwl/exec";

export default async function handler(request: any, response: any) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({
      status: "erro",
      message: "Método não permitido.",
    });
  }

  try {
    const payload = parseBody(request.body);
    const serialized = JSON.stringify(payload);

    if (serialized.length > 1_000_000) {
      return response.status(413).json({
        status: "erro",
        message: "O conteúdo enviado é maior do que o permitido.",
      });
    }

    const googleScriptUrl =
      process.env.GOOGLE_SCRIPT_URL || DEFAULT_GOOGLE_SCRIPT_URL;

    const upstreamResponse = await fetch(googleScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: serialized,
      redirect: "follow",
    });

    const upstreamText = await upstreamResponse.text();
    const upstreamResult = parseJson(upstreamText);

    if (!upstreamResponse.ok) {
      return response.status(502).json({
        status: "erro",
        message: "O Google Apps Script não aceitou o envio.",
      });
    }

    if (!upstreamResult || upstreamResult.status !== "sucesso") {
      return response.status(502).json({
        status: "erro",
        message:
          upstreamResult?.message ||
          "O serviço respondeu, mas não confirmou o salvamento.",
      });
    }

    return response.status(200).json(upstreamResult);
  } catch (error) {
    console.error("Falha ao encaminhar resposta do questionário:", error);

    return response.status(500).json({
      status: "erro",
      message: "Não foi possível registrar a resposta agora. Tente novamente.",
    });
  }
}

function parseBody(body: unknown): Record<string, unknown> {
  if (typeof body === "string") {
    const parsed = JSON.parse(body);
    return ensureObject(parsed);
  }

  return ensureObject(body);
}

function ensureObject(value: unknown): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    throw new Error("Corpo da requisição inválido.");
  }

  return value as Record<string, unknown>;
}

function parseJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
