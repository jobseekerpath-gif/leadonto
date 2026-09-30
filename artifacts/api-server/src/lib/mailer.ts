import { logger } from "./logger";

const FROM = "Lead Onto <email@leadonto.com>";

export function isEmailConfigured(): boolean {
  return !!process.env["RESEND_API_KEY"];
}

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<{ ok: boolean; dev?: boolean; error?: string; id?: string }> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    logger.error("[mailer] RESEND_API_KEY is not configured");
    return { ok: false, error: "resend-not-configured" };
  }

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      logger.error({ status: resp.status, detail: detail.slice(0, 300), to: opts.to }, "[mailer] Resend send failed");
      return { ok: false, error: `resend-${resp.status}` };
    }

    const body = await resp.json().catch(() => ({})) as { id?: unknown };
    return { ok: true, id: typeof body.id === "string" ? body.id : undefined };
  } catch (err) {
    logger.error({ err: (err as Error).message, to: opts.to }, "[mailer] Resend send error");
    return { ok: false, error: "network-error" };
  }
}
function shell(inner: string): string {
  return `<div style="font-family:sans-serif;max-width:520px;margin:auto;color:#1e293b">
    <h2 style="color:#f97316;margin-bottom:4px">Lead Onto</h2>
    ${inner}
    <p style="color:#94a3b8;font-size:12px;margin-top:24px">You're receiving this because you have a Lead Onto account.</p>
  </div>`;
}

export type PaymentEmailKind = "received" | "approved" | "rejected" | "reversed";

/** Notify a user about a change to their UPI credit top-up. Fire-and-forget friendly. */
export async function sendPaymentEmail(
  to: string,
  kind: PaymentEmailKind,
  data: { credits: number; utr: string; reason?: string | null },
): Promise<{ ok: boolean; dev?: boolean }> {
  const subject: Record<PaymentEmailKind, string> = {
    received: "Your Lead Onto credits are available",
    approved: "Your Lead Onto credits have been added",
    rejected: "Your top-up request was declined",
    reversed: "Your credits were reversed",
  };
  const body: Record<PaymentEmailKind, string> = {
    received: `<p>Thanks! We've received your UPI top-up for <b>${data.credits} credits (â‚¹${data.credits})</b> and made the credits available immediately.</p>
      <p>UTR: <b>${data.utr}</b></p>
      <p>Our team will audit the payment against our account. If the payment cannot be confirmed, the credits may be reversed and you'll receive a separate email.</p>`,
    approved: `<p>Good news â€” your payment is verified and <b>${data.credits} credits</b> have been added to your account.</p>
      <p>UTR: <b>${data.utr}</b>. Happy learning!</p>`,
    rejected: `<p>We couldn't verify your UPI top-up for <b>${data.credits} credits</b> (UTR: <b>${data.utr}</b>), so it was declined and no credits were added.</p>
      ${data.reason ? `<p><b>Reason:</b> ${data.reason}</p>` : ""}
      <p>If you believe this is a mistake, reply to this email with your payment screenshot.</p>`,
    reversed: `<p>Your earlier top-up of <b>${data.credits} credits</b> (UTR: <b>${data.utr}</b>) has been reversed because the payment could not be confirmed in our account.</p>
      ${data.reason ? `<p><b>Reason:</b> ${data.reason}</p>` : ""}
      <p>If this is a mistake, please contact support with proof of payment.</p>`,
  };
  return sendEmail({ to, subject: subject[kind], html: shell(body[kind]) });
}

