// Edge Function de Supabase: avisa por correo a José cada vez que un cliente
// se registra. Se dispara con un Database Webhook (INSERT en public.solicitudes)
// y envía el correo vía Resend (https://resend.com, plan gratis).
//
// Variables de entorno (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY   -> API key de Resend (empieza con "re_")
//   NOTIFY_TO        -> correo destino (por defecto j.arroyo@montblancchile.com)
//   NOTIFY_FROM      -> remitente verificado en Resend (para probar: "Regalo IA <onboarding@resend.dev>")
//   WEBHOOK_SECRET   -> texto secreto compartido con el webhook (evita disparos falsos)
//
// Desplegar:  supabase functions deploy notificar-solicitud --no-verify-jwt

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const esc = (v: unknown) =>
  String(v ?? "—").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));

serve(async (req) => {
  try {
    // Seguridad: el webhook debe enviar la cabecera x-webhook-secret
    const secret = Deno.env.get("WEBHOOK_SECRET");
    if (secret && req.headers.get("x-webhook-secret") !== secret) {
      return new Response(JSON.stringify({ ok: false, error: "no autorizado" }), {
        status: 401, headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const r = body.record ?? body; // Database Webhook -> { type, record, ... }

    const RESEND = Deno.env.get("RESEND_API_KEY");
    const TO = Deno.env.get("NOTIFY_TO") ?? "j.arroyo@montblancchile.com";
    const FROM = Deno.env.get("NOTIFY_FROM") ?? "Regalo IA Montblanc <onboarding@resend.dev>";
    if (!RESEND) {
      return new Response(JSON.stringify({ ok: false, error: "falta RESEND_API_KEY" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const fila = (k: string, v: unknown) =>
      `<tr><td style="padding:6px 14px 6px 0;color:#6f7788;font:13px Tahoma,Arial,sans-serif">${k}</td>` +
      `<td style="padding:6px 0;color:#2c3a4f;font:600 14px Tahoma,Arial,sans-serif">${esc(v)}</td></tr>`;

    const html =
      `<div style="max-width:560px;margin:0 auto;font-family:Tahoma,Arial,sans-serif;color:#2c3a4f">` +
      `<div style="background:#223a5e;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">` +
      `<div style="font-size:11px;letter-spacing:.14em;color:#e7c9bd;text-transform:uppercase">Regalo de fin de año · Montblanc</div>` +
      `<div style="font-size:19px;font-weight:bold;margin-top:4px">Nueva solicitud de curso</div></div>` +
      `<div style="border:1px solid #e6ddcd;border-top:0;border-radius:0 0 12px 12px;padding:16px 22px">` +
      `<table style="border-collapse:collapse;width:100%">` +
      fila("Nombre", r.nombre) + fila("Correo", r.email) + fila("Empresa", r.empresa) +
      fila("Objetivo", r.tema) + fila("Herramienta", r.herramienta) +
      fila("Nivel IA", r.nivel_ia) + fila("Nivel tema", r.nivel_tema) +
      fila("Curso solicitado", r.curso) +
      (r.url_curso ? fila("Enlace curso", r.url_curso) : "") +
      `</table></div></div>`;

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: r.email || undefined,
        subject: `Nueva solicitud de curso — ${r.empresa ?? ""} (${r.nombre ?? ""})`,
        html,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return new Response(JSON.stringify({ ok: false, error: `Resend ${resp.status}: ${txt}` }), {
        status: 502, headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
