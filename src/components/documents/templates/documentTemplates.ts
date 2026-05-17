export type DocType =
  | "comparecimento"
  | "atestado"
  | "relatorio_ortodontico"
  | "encaminhamento";

export const DOC_TITLES: Record<DocType, string> = {
  comparecimento: "Declaração de Comparecimento",
  atestado: "Atestado Odontológico",
  relatorio_ortodontico: "Relatório de Tratamento Ortodôntico",
  encaminhamento: "Encaminhamento",
};

export interface PatientLike {
  name: string;
  cpf?: string | null;
  rg?: string | null;
}

function fmtDateBr(value?: string): string {
  if (!value) return "____/____/______";
  // value is yyyy-mm-dd
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

function v(value?: string | number | null, fallback = "________"): string {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

// === Comparecimento ===
export interface ComparecimentoData {
  data_consulta: string; // yyyy-mm-dd
  hora_inicio: string; // HH:MM
  hora_fim: string;
}

export function renderComparecimento(p: PatientLike, d: ComparecimentoData): string {
  return `Declaramos, para os devidos fins de direito, que o(a) Sr(a). ${v(p.name)}, inscrito(a) no CPF sob o nº ${v(p.cpf)}, compareceu a esta unidade clínica para a realização de procedimentos odontológicos no dia ${fmtDateBr(d.data_consulta)}. O referido atendimento compreendeu rigorosamente o intervalo das ${v(d.hora_inicio, "__:__")} às ${v(d.hora_fim, "__:__")}, permanecendo este período sob nossa responsabilidade técnica.`;
}

// === Atestado ===
export interface AtestadoData {
  numero_de_dias: number | string;
  data_inicio_afastamento: string;
  cid_privado: boolean;
  campo_cid?: string;
}

export function renderAtestado(p: PatientLike, d: AtestadoData): string {
  const base = `Atesto, para os devidos fins de direito e sob as penas da lei (Art. 1º, Inciso III da Lei Federal nº 5.081/66 e Código de Ética Odontológica), que o(a) Sr(a). ${v(p.name)}, inscrito(a) no CPF sob o nº ${v(p.cpf)}, foi submetido(a) a procedimento cirúrgico/odontológico nesta data. Em decorrência do tratamento efetuado, necessita o(a) paciente de ${v(d.numero_de_dias)} dia(s) de convalescença e afastamento total de suas atividades laborativas e escolares, a contar a partir de ${fmtDateBr(d.data_inicio_afastamento)}.`;

  const cidLine = d.cid_privado
    ? "A pedido do(a) paciente, o diagnóstico clínico/CID foi omitido para resguardar sua privacidade."
    : `CID/Diagnóstico preenchido a pedido do paciente: ${v(d.campo_cid)}.`;

  return `${base}\n\n${cidLine}`;
}

// === Relatório Ortodôntico ===
export interface RelatorioOrtoData {
  diagnostico: string;
  aparelho: string;
  data_inicio: string;
  fase_atual: string;
  nivel_cooperacao: "Boa" | "Regular" | "Ruim" | "";
  meses_estimados: number | string;
}

export function renderRelatorioOrto(p: PatientLike, d: RelatorioOrtoData): string {
  return `Ao(À) Dr(a). / À Empresa / A quem possa interessar,\n\nAtravés do presente relatório clínico, informamos que o(a) paciente ${v(p.name)}, inscrito(a) no CPF sob o nº ${v(p.cpf)}, encontra-se sob cuidados odontológicos ativos e regulares nesta clínica para tratamento de correção ortodôntica.\n\n1. Diagnóstico Clínico Inicial: ${v(d.diagnostico)}.\n2. Dispositivo Ortodôntico Utilizado: ${v(d.aparelho)}.\n3. Estágio Atual e Cooperação: O tratamento teve início em ${fmtDateBr(d.data_inicio)}. Atualmente o(a) paciente encontra-se na fase clínica de ${v(d.fase_atual)}, apresentando assiduidade e cooperação ${v(d.nivel_cooperacao).toLowerCase()} com as orientações profissionais. A previsão estimada para a conclusão do tratamento é de aproximadamente ${v(d.meses_estimados)} meses, estando este prazo sujeito a variações de resposta biológica e à frequência do(a) paciente às consultas agendadas.`;
}
