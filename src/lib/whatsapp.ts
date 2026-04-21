/**
 * Helper minimalista de WhatsApp via wa.me.
 * Sem validações bloqueantes — clique sempre abre o WhatsApp do dispositivo
 * do usuário logado (navegador/celular). O número é normalizado e prefixado
 * com 55 (Brasil).
 */

/** Normaliza telefone removendo tudo que não é dígito. */
function cleanDigits(raw?: string | null): string {
  return (raw ?? "").replace(/\D/g, "");
}

/** Remove prefixo 55 duplicado caso o usuário já tenha cadastrado com DDI. */
function stripBrazilPrefix(digits: string): string {
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * Handler puro de WhatsApp. Sempre abre wa.me em nova aba, sem toast de erro
 * e sem return antecipado. Se o telefone for vazio, abre wa.me sem destino.
 */
export function handleWhatsapp(phone: string | null | undefined, message: string): void {
  const digits = stripBrazilPrefix(cleanDigits(phone));
  const text = encodeURIComponent(message);
  const url = digits
    ? `https://wa.me/55${digits}?text=${text}`
    : `https://wa.me/?text=${text}`;
  window.open(url, "_blank");
}

/** Alias para compatibilidade com imports existentes. */
export const openWhatsApp = handleWhatsapp;

/**
 * Constrói URL canônica do WhatsApp (wa.me). Útil para componentes que
 * precisam do href direto (links, share buttons).
 */
export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string {
  const digits = stripBrazilPrefix(cleanDigits(phone));
  const text = encodeURIComponent(message);
  return digits
    ? `https://wa.me/55${digits}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

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
