import { cn } from "@/lib/utils";

interface WhatsAppIconProps {
  className?: string;
  /** Cor do glifo (telefone). Default: branco para contraste sobre o fundo dourado. */
  glyphColor?: string;
  /** Cor do círculo de fundo. Default: dourado da identidade VEGA. */
  bgColor?: string;
  /** Tamanho em px. Default 18. */
  size?: number;
  /** Sem círculo de fundo — apenas o glifo. Útil sobre superfícies já coloridas. */
  bare?: boolean;
}

/**
 * Ícone oficial do WhatsApp estilizado com a paleta VEGA
 * (Dourado #D4A845 com glifo branco; ou Azul Petróleo #103444 quando `bare`).
 */
export function WhatsAppIcon({
  className,
  glyphColor = "#FFFFFF",
  bgColor = "#D4A845",
  size = 18,
  bare = false,
}: WhatsAppIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("inline-block flex-shrink-0", className)}
      aria-hidden="true"
    >
      {!bare && <circle cx="16" cy="16" r="16" fill={bgColor} />}
      <path
        fill={bare ? bgColor : glyphColor}
        d="M16.02 6.4c-5.3 0-9.6 4.3-9.6 9.6 0 1.69.44 3.34 1.28 4.79L6.4 25.6l4.94-1.29a9.6 9.6 0 0 0 4.68 1.21h.01c5.3 0 9.6-4.3 9.6-9.6 0-2.56-1-4.97-2.81-6.78a9.54 9.54 0 0 0-6.8-2.74Zm0 17.55h-.01a7.97 7.97 0 0 1-4.06-1.11l-.29-.17-2.93.77.78-2.86-.19-.3a7.97 7.97 0 0 1-1.22-4.27c0-4.4 3.59-7.98 8-7.98 2.13 0 4.13.83 5.64 2.34a7.93 7.93 0 0 1 2.34 5.65c0 4.4-3.59 7.98-8 7.98Zm4.38-5.98c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.63-1.19-1.42-1.33-1.66-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"
      />
    </svg>
  );
}
