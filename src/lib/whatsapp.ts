/**
 * Helper de WhatsApp sem dependência de wa.me ou api.whatsapp.com.
 * - Mobile  → protocolo nativo `whatsapp://send`
 * - Desktop → `https://web.whatsapp.com/send`
 *
 * Não há validação bloqueante: clique sempre abre o WhatsApp do dispositivo
 * do usuário logado. Prefixo 55 (Brasil) é adicionado automaticamente.
 */

function cleanDigits(raw?: string | null): string {
  return (raw ?? "").replace(/\D/g, "");
}

function stripBrazilPrefix(digits: string): string {
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits;
}

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}

/**
 * Constrói URL canônica do WhatsApp evitando `wa.me` (que redireciona para
 * api.whatsapp.com e é bloqueado em iframes/preview).
 */
export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string {
  const digits = stripBrazilPrefix(cleanDigits(phone));
  const text = encodeURIComponent(message);
  const phoneParam = digits ? `phone=55${digits}&` : "";
  if (isMobileDevice()) {
    return `whatsapp://send?${phoneParam}text=${text}`;
  }
  return `https://web.whatsapp.com/send?${phoneParam}text=${text}`;
}

/**
 * Handler puro: abre WhatsApp em nova aba sem qualquer validação.
 */
export function handleWhatsapp(phone: string | null | undefined, message: string): void {
  const url = buildWhatsAppUrl(phone, message);
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Alias para compatibilidade com imports existentes. */
export const openWhatsApp = handleWhatsapp;

/**
 * Normaliza telefone para exibição/persistência (apenas dígitos, sem validação).
 * Mantido para compatibilidade — retorna null se vazio.
 */
export function formatWhatsAppPhone(raw?: string | null): string | null {
  const digits = cleanDigits(raw);
  return digits || null;
}

/**
 * Formata para exibição amigável (não-bloqueante: nunca falha, sempre devolve
 * algo legível).
 */
export function displayWhatsAppPhone(raw?: string | null): string {
  const digits = cleanDigits(raw);
  if (!digits) return raw ?? "";
  const local = stripBrazilPrefix(digits);
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return `+${digits}`;
}
