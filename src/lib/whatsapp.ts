/**
 * Helpers de integração WhatsApp via api.whatsapp.com (sem dependência de API).
 * Usa api.whatsapp.com/send diretamente (em vez de wa.me) para evitar redirects
 * que disparam ERR_BLOCKED_BY_RESPONSE dentro de iframes (preview do Lovable).
 */

/**
 * Normaliza telefone para o formato aceito pelo WhatsApp.
 * - Remove tudo que não é dígito.
 * - Se tiver 10 ou 11 dígitos (BR sem DDI), prefixa "55".
 * - Retorna null se não for possível formatar.
 */
export function formatWhatsAppPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D+/g, "");
  if (!digits) return null;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if (digits.length >= 12 && digits.length <= 15) return digits;
  return null;
}

/**
 * Constrói URL canônica do WhatsApp. Se `phone` for null/undefined, gera link
 * genérico (usuário escolhe o contato no WhatsApp).
 */
export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string {
  const formatted = formatWhatsAppPhone(phone ?? null);
  const text = encodeURIComponent(message);
  return formatted
    ? `https://api.whatsapp.com/send?phone=${formatted}&text=${text}`
    : `https://api.whatsapp.com/send?text=${text}`;
}

/**
 * Abre o WhatsApp em nova aba/janela de forma programática.
 * - `window.open(..., "_blank")` força navegação top-level → escapa do iframe e da CSP.
 * - Fallback para `window.top.location` se pop-up for bloqueado.
 */
export function openWhatsApp(phone: string | null | undefined, message: string): void {
  const url = buildWhatsAppUrl(phone, message);
  try {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (win) return;
  } catch {
    // ignored — fallback below
  }
  try {
    if (window.top) {
      window.top.location.href = url;
      return;
    }
  } catch {
    // ignored
  }
  window.location.href = url;
}
