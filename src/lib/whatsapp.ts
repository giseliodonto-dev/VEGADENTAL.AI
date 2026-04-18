/**
 * Helpers de integração WhatsApp via wa.me (sem dependência de API).
 */

/**
 * Normaliza telefone para o formato aceito por wa.me.
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
 * Constrói URL wa.me. Se `phone` for null/undefined, gera link genérico
 * (usuário escolhe o contato no WhatsApp).
 */
export function buildWhatsAppUrl(phone: string | null | undefined, message: string): string {
  const formatted = formatWhatsAppPhone(phone ?? null);
  const text = encodeURIComponent(message);
  return formatted ? `https://wa.me/${formatted}?text=${text}` : `https://wa.me/?text=${text}`;
}
