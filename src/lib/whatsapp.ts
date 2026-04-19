/**
 * Helpers de integração WhatsApp via api.whatsapp.com (sem dependência de API).
 * Usa api.whatsapp.com/send diretamente (em vez de wa.me) para evitar redirects
 * que disparam ERR_BLOCKED_BY_RESPONSE dentro de iframes (preview do Lovable).
 */
import { toast } from "sonner";

/**
 * Normaliza telefone para o formato aceito pelo WhatsApp.
 * - Remove tudo que não é dígito.
 * - 10-11 dígitos (BR sem DDI): prefixa "55".
 * - 12-13 dígitos começando com "55": usa como está (BR com DDI).
 * - 12-15 dígitos (DDI internacional): usa como está.
 * - Caso contrário: retorna null.
 */
export function formatWhatsAppPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D+/g, "");
  // BR sem DDI (10 ou 11 dígitos) → prefixa 55
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  // Já tem DDI internacional (12-15 dígitos) → usa como está
  if (digits.length >= 12 && digits.length <= 15) return digits;
  return null;
}

/**
 * Formata para exibição amigável.
 * - 10-11 dígitos (BR sem DDI): (11) 98888-7777
 * - 12-13 dígitos começando com 55 (BR com DDI): +55 (11) 98888-7777
 * - Outros: +<digits>
 * Retorna o próprio input se não conseguir formatar.
 */
export function displayWhatsAppPhone(raw?: string | null): string {
  const formatted = formatWhatsAppPhone(raw);
  if (!formatted) return raw ?? "";
  if (formatted.length === 10 || formatted.length === 11) {
    const ddd = formatted.slice(0, 2);
    const rest = formatted.slice(2);
    if (rest.length === 9) return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  if (formatted.startsWith("55") && (formatted.length === 12 || formatted.length === 13)) {
    const ddd = formatted.slice(2, 4);
    const rest = formatted.slice(4);
    if (rest.length === 9) return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  return `+${formatted}`;
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
 * - Se `phone` foi passado mas é inválido, mostra toast de erro e NÃO abre.
 * - Se `phone` é null/undefined explicitamente, abre WhatsApp genérico.
 * - `window.open(..., "_blank")` força navegação top-level → escapa do iframe e da CSP.
 * - Fallback para `window.top.location` se pop-up for bloqueado.
 */
export function openWhatsApp(phone: string | null | undefined, message: string): void {
  const rawPhone = phone ?? null;
  const formattedPhone = formatWhatsAppPhone(rawPhone);
  const phoneWasProvided = rawPhone !== null && rawPhone !== undefined && String(rawPhone).trim() !== "";

  console.log("[WhatsApp] open requested", {
    rawPhone,
    formattedPhone,
    hasMessage: Boolean(message),
    inIframe: window.top !== window,
  });

  if (phoneWasProvided && !formattedPhone) {
    toast.error("Telefone inválido", {
      description: "Verifique o cadastro do paciente — precisa ter DDD + número ou DDI completo.",
    });
    return;
  }

  const url = buildWhatsAppUrl(rawPhone, message);

  try {
    if (window.top && window.top !== window) {
      window.top.location.href = url;
      return;
    }
  } catch {
    // ignored — fallback below
  }

  try {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (win) return;
  } catch {
    // ignored — fallback below
  }

  window.location.href = url;
}
