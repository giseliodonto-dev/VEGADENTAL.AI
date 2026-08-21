export interface PaymentOption {
  key: "avista" | "cartao" | "boleto";
  label: string;
  detail: string;
  highlight?: string;
}

const fmt = (n: number) =>
  `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const CASH_DISCOUNT_PCT = 5;
export const MAX_INSTALLMENTS = 12;

/**
 * Condições de pagamento oferecidas pela clínica, calculadas sobre o valor final
 * do plano de tratamento. Não altera nada no banco — é apresentação.
 */
export function buildPaymentOptions(finalValue: number): PaymentOption[] {
  const cash = finalValue * (1 - CASH_DISCOUNT_PCT / 100);
  const perInstallment = finalValue / MAX_INSTALLMENTS;

  return [
    {
      key: "avista",
      label: "À vista — PIX, dinheiro ou débito",
      detail: `${CASH_DISCOUNT_PCT}% de desconto sobre o valor final`,
      highlight: fmt(cash),
    },
    {
      key: "cartao",
      label: "Cartão de crédito parcelado",
      detail: `Em até ${MAX_INSTALLMENTS}x de ${fmt(perInstallment)}`,
      highlight: fmt(finalValue),
    },
    {
      key: "boleto",
      label: "Boleto / carnê",
      detail: "Parcelamento próprio mediante análise, conforme combinado na clínica",
      highlight: fmt(finalValue),
    },
  ];
}

/** Identifica qual condição foi escolhida a partir da nota salva no orçamento. */
export function selectedPaymentKey(note?: string | null): PaymentOption["key"] | null {
  if (!note) return null;
  const n = note.toLowerCase();
  if (n.includes("pix") || n.includes("vista") || n.includes("dinheiro") || n.includes("debito") || n.includes("débito")) return "avista";
  if (n.includes("cart") || n.includes("parcel")) return "cartao";
  if (n.includes("boleto") || n.includes("carn")) return "boleto";
  return null;
}
