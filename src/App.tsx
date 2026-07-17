import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Cpu,
  GraduationCap,
  HeartHandshake,
  Info,
  Loader2,
  LockKeyhole,
  RotateCcw,
  Send,
  Smile,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Questionário Sebrae 2026
 *
 * Dependências esperadas no projeto:
 * - React
 * - Tailwind CSS
 * - lucide-react
 *
 * O endpoint foi preservado do código original. Como o envio usa mode="no-cors",
 * o navegador não consegue ler a resposta do Google Apps Script. O código considera
 * o envio concluído quando a requisição é aceita pelo navegador sem erro de rede.
 */

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw8yWGHJmONTFshN8rqJIhthd_VFvTpRTeV7jPk931Vab6r_lDstn0Pexf2Ea_m3Lwl/exec";

const SURVEY_VERSION = "sebrae-2026-nucleo-comum-customizado-v2";
const DRAFT_KEY = "sebrae_questionario_2026_draft_v2";

type CourseId = "financas" | "pessoas" | "atendimento" | "ia" | "emocional";

type PageKind =
  | "identification"
  | "participant-profile"
  | "company-profile"
  | "sebrae-relationship"
  | "course-evaluation"
  | "before-course"
  | "application-practice"
  | "application-areas"
  | "application-difficulties"
  | "application-support"
  | "results"
  | "specific-course"
  | "review";

interface OptionItem {
  value: string;
  label: string;
  description?: string;
}

interface ScaleOption {
  value: number;
  label: string;
  shortLabel: string;
}

interface SurveyQuestion {
  id: string;
  text: string;
}

interface CourseDimension {
  id: string;
  title: string;
  questions: SurveyQuestion[];
}

interface CourseDefinition {
  id: CourseId;
  title: string;
  icon: LucideIcon;
  dimensions: CourseDimension[];
}

interface SurveyPage {
  id: string;
  kind: PageKind;
  eyebrow: string;
  title: string;
  description: string;
  courseId?: CourseId;
}

interface SurveyFormData {
  cpf: string;
  fullName: string;
  email: string;
  phone: string;

  professionalCategory: string;
  professionalArea: string;
  professionalAreaOther: string;
  yearsInCurrentArea: string;
  previousEntrepreneurialArea: string;
  previousEntrepreneurialAreaOther: string;
  residenceCity: string;
  residenceState: string;
  gender: string;
  genderOther: string;
  ageRange: string;

  companySize: string;
  companyOperatingTime: string;
  companyOperatingTimeOther: string;
  companyLocationType: string;
  companyCity: string;
  companyState: string;
  companySegment: string;
  companySegmentOther: string;
  employeeCount: string;
  revenueRange: string;
  salesChannels: string[];
  salesChannelOther: string;

  courseContact: string;
  onlineCourses: string[];
  onlineCourseOther: string;
  presencialCourse: string;
  courseReasons: string[];
  courseReasonOther: string;

  changesMade: string[];
  changesMadeOther: string;
  affectedAreas: string[];
  affectedAreasOther: string;
  applicationDifficulties: string[];
  applicationDifficultiesOther: string;
  supportNeeds: string[];
  supportNeedsOther: string;

  responses: Record<string, number>;
  reviewConfirmed: boolean;
}

interface StoredDraft {
  version: string;
  started: boolean;
  startedAt: string;
  currentPageId: string;
  data: SurveyFormData;
}

interface MissingItem {
  id: string;
  label: string;
}

const createEmptyForm = (): SurveyFormData => ({
  cpf: "",
  fullName: "",
  email: "",
  phone: "",

  professionalCategory: "",
  professionalArea: "",
  professionalAreaOther: "",
  yearsInCurrentArea: "",
  previousEntrepreneurialArea: "",
  previousEntrepreneurialAreaOther: "",
  residenceCity: "",
  residenceState: "",
  gender: "",
  genderOther: "",
  ageRange: "",

  companySize: "",
  companyOperatingTime: "",
  companyOperatingTimeOther: "",
  companyLocationType: "",
  companyCity: "",
  companyState: "",
  companySegment: "",
  companySegmentOther: "",
  employeeCount: "",
  revenueRange: "",
  salesChannels: [],
  salesChannelOther: "",

  courseContact: "",
  onlineCourses: [],
  onlineCourseOther: "",
  presencialCourse: "",
  courseReasons: [],
  courseReasonOther: "",

  changesMade: [],
  changesMadeOther: "",
  affectedAreas: [],
  affectedAreasOther: "",
  applicationDifficulties: [],
  applicationDifficultiesOther: "",
  supportNeeds: [],
  supportNeedsOther: "",

  responses: {},
  reviewConfirmed: false,
});

const maskCPF = (value: string) =>
  value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);

const maskPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 14);
  }

  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
};

const validateCPF = (cpf: string) => {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11 || /^(\d)\1+$/.test(clean)) return false;

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(clean[index]) * (10 - index);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(clean[9])) return false;

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(clean[index]) * (11 - index);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === Number(clean[10]);
};

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const isFilled = (value: string) => value.trim().length > 0;

const toggleArrayValue = (
  current: string[],
  value: string,
  exclusiveValues: string[] = [],
) => {
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }

  if (exclusiveValues.includes(value)) {
    return [value];
  }

  return [...current.filter((item) => !exclusiveValues.includes(item)), value];
};

const AGREEMENT_SCALE: ScaleOption[] = [
  { value: 1, shortLabel: "Discordo totalmente", label: "Discordo totalmente" },
  { value: 2, shortLabel: "Discordo parcialmente", label: "Discordo parcialmente" },
  { value: 3, shortLabel: "Neutro", label: "Nem concordo, nem discordo" },
  { value: 4, shortLabel: "Concordo parcialmente", label: "Concordo parcialmente" },
  { value: 5, shortLabel: "Concordo totalmente", label: "Concordo totalmente" },
];

const AGREEMENT_WITH_NA_SCALE: ScaleOption[] = [
  ...AGREEMENT_SCALE,
  { value: 6, shortLabel: "Não se aplica", label: "Não se aplica à minha realidade" },
];

const EXPECTATION_SCALE: ScaleOption[] = [
  { value: 1, shortLabel: "Muito abaixo", label: "Muito abaixo das expectativas" },
  { value: 2, shortLabel: "Abaixo", label: "Abaixo das expectativas" },
  { value: 3, shortLabel: "Parcialmente", label: "Atendeu parcialmente" },
  { value: 4, shortLabel: "Atendeu", label: "Atendeu às expectativas" },
  { value: 5, shortLabel: "Superou", label: "Superou as expectativas" },
];

const PERFORMANCE_SCALE: ScaleOption[] = [
  { value: 1, shortLabel: "Muito ruim", label: "Muito ruim" },
  { value: 2, shortLabel: "Ruim", label: "Ruim" },
  { value: 3, shortLabel: "Regular", label: "Regular" },
  { value: 4, shortLabel: "Bom", label: "Bom" },
  { value: 5, shortLabel: "Muito bom", label: "Muito bom" },
];

const WORKLOAD_SCALE: ScaleOption[] = [
  { value: 1, shortLabel: "Muito inadequada", label: "Muito inadequada" },
  { value: 2, shortLabel: "Inadequada", label: "Inadequada" },
  { value: 3, shortLabel: "Razoável", label: "Razoável" },
  { value: 4, shortLabel: "Adequada", label: "Adequada" },
  { value: 5, shortLabel: "Muito adequada", label: "Muito adequada" },
];

const BEFORE_SCALE: ScaleOption[] = [
  { value: 1, shortLabel: "Muito ruim", label: "Muito ruim" },
  { value: 2, shortLabel: "Ruim", label: "Ruim" },
  { value: 3, shortLabel: "Regular", label: "Regular" },
  { value: 4, shortLabel: "Boa", label: "Boa" },
  { value: 5, shortLabel: "Muito boa", label: "Muito boa" },
];

const PROFESSIONAL_CATEGORY_OPTIONS: OptionItem[] = [
  { value: "pf_autonomo", label: "Pessoa Física — autônomo" },
  { value: "pf_liberal", label: "Pessoa Física — profissional liberal" },
  { value: "pf_empregado_formal", label: "Pessoa Física — empregado formal" },
  { value: "pf_empregado_informal", label: "Pessoa Física — empregado informal" },
  { value: "pf_estudante", label: "Pessoa Física — estudante" },
  { value: "pf_desempregado", label: "Pessoa Física — desempregado" },
  { value: "pj_mei", label: "Pessoa Jurídica — MEI" },
  { value: "pj_outros", label: "Pessoa Jurídica — outros" },
];

const PROFESSIONAL_AREA_OPTIONS: OptionItem[] = [
  { value: "agronegocio", label: "Agronegócio" },
  { value: "comercio", label: "Comércio" },
  { value: "industria", label: "Indústria" },
  { value: "servicos", label: "Serviços" },
  { value: "setor_publico", label: "Setor público" },
  { value: "tecnologia_inovacao", label: "Tecnologia e inovação" },
  { value: "economia_criativa", label: "Economia criativa (design, moda, audiovisual, artes etc.)" },
  { value: "turismo_gastronomia", label: "Turismo, Gastronomia e Hospitalidade" },
  { value: "educacao_pesquisa", label: "Educação e Pesquisa" },
  { value: "profissional_liberal", label: "Profissional liberal/autônomo" },
  { value: "estudante", label: "Estudante" },
  { value: "nao_atuo", label: "Ainda não atuo profissionalmente" },
  { value: "outro", label: "Outro" },
];

const PREVIOUS_EXPERIENCE_OPTIONS: OptionItem[] = [
  { value: "agronegocio", label: "Agronegócio" },
  { value: "comercio", label: "Comércio" },
  { value: "industria", label: "Indústria" },
  { value: "servicos", label: "Serviços" },
  { value: "setor_publico", label: "Setor público" },
  { value: "tecnologia_inovacao", label: "Tecnologia e inovação" },
  { value: "economia_criativa", label: "Economia criativa (design, moda, audiovisual, artes etc.)" },
  { value: "turismo_gastronomia", label: "Turismo, Gastronomia e Hospitalidade" },
  { value: "educacao_pesquisa", label: "Educação e Pesquisa" },
  { value: "profissional_liberal", label: "Profissional liberal/autônomo" },
  { value: "sem_experiencia", label: "Não tive experiência empreendedora prévia anterior" },
  { value: "outro", label: "Outro" },
];

const GENDER_OPTIONS: OptionItem[] = [
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
  { value: "outro", label: "Outro" },
];

const AGE_OPTIONS: OptionItem[] = [
  { value: "18_25", label: "Entre 18 e 25 anos" },
  { value: "26_35", label: "Entre 26 e 35 anos" },
  { value: "36_45", label: "Entre 36 e 45 anos" },
  { value: "46_55", label: "Entre 46 e 55 anos" },
  { value: "56_mais", label: "Acima de 56 anos" },
];

const COMPANY_SIZE_OPTIONS: OptionItem[] = [
  { value: "mei", label: "Microempreendedor Individual (MEI)" },
  { value: "me", label: "Microempresa (ME)" },
  { value: "epp", label: "Empresa de Pequeno Porte (EPP)" },
  { value: "media", label: "Média empresa" },
  { value: "grande", label: "Grande empresa" },
];

const COMPANY_TIME_OPTIONS: OptionItem[] = [
  { value: "menos_1", label: "Menos de 1 ano" },
  { value: "1_2", label: "Entre 1 e 2 anos" },
  { value: "2_3", label: "Entre 2 e 3 anos" },
  { value: "3_4", label: "Entre 3 e 4 anos" },
  { value: "4_5", label: "Entre 4 e 5 anos" },
  { value: "outro", label: "Outro período" },
];

const COMPANY_LOCATION_OPTIONS: OptionItem[] = [
  {
    value: "online",
    label: "Empresa online",
    description: "A operação não depende de um endereço físico de atendimento.",
  },
  {
    value: "fisica",
    label: "Empresa física",
    description: "Informe o município e o estado da instalação principal.",
  },
];

const COMPANY_SEGMENT_OPTIONS: OptionItem[] = [
  { value: "alimentos_bebidas", label: "Alimentos e bebidas" },
  { value: "beleza_estetica", label: "Beleza e estética" },
  { value: "comercio_varejista", label: "Comércio varejista" },
  { value: "construcao_civil", label: "Construção civil" },
  { value: "consultoria", label: "Consultoria e serviços especializados" },
  { value: "educacao", label: "Educação e capacitação" },
  { value: "industria", label: "Indústria e transformação" },
  { value: "marketing", label: "Marketing e comunicação" },
  { value: "moda", label: "Moda e vestuário" },
  { value: "saude", label: "Saúde e bem-estar" },
  { value: "tecnologia", label: "Tecnologia da informação e inovação" },
  { value: "turismo", label: "Turismo, hotelaria e gastronomia" },
  { value: "transporte_logistica", label: "Transporte e logística" },
  { value: "agronegocio", label: "Agronegócio" },
  { value: "servicos_financeiros", label: "Serviços financeiros" },
  { value: "economia_criativa", label: "Economia criativa (artesanato, design, audiovisual, cultura, entre outros)" },
  { value: "outro", label: "Outro" },
];

const REVENUE_OPTIONS: OptionItem[] = [
  { value: "ate_81_mil", label: "Até R$ 81 mil por ano" },
  { value: "81_360_mil", label: "De R$ 81.000,01 a R$ 360 mil por ano" },
  { value: "360_mil_4_8_mi", label: "De R$ 360.000,01 a R$ 4,8 milhões por ano" },
  { value: "4_8_300_mi", label: "De R$ 4,8 milhões a R$ 300 milhões por ano" },
  { value: "acima_300_mi", label: "Acima de R$ 300 milhões por ano" },
];

const SALES_CHANNEL_OPTIONS: OptionItem[] = [
  { value: "loja_fisica", label: "Loja física" },
  { value: "ecommerce", label: "Loja virtual (e-commerce próprio)" },
  { value: "marketplace", label: "Marketplace (Mercado Livre, Amazon, Shopee etc.)" },
  { value: "redes_sociais", label: "Redes sociais (Instagram, Facebook, WhatsApp Business etc.)" },
  { value: "apps_entrega", label: "Aplicativos de entrega (iFood, Rappi, Uber Eats etc.)" },
  { value: "telefone_whatsapp", label: "Vendas por telefone ou WhatsApp" },
  { value: "representantes", label: "Representantes comerciais ou vendedores externos" },
  { value: "feiras_eventos", label: "Feiras, eventos e exposições" },
  { value: "porta_a_porta", label: "Venda direta ao consumidor (porta a porta)" },
  { value: "b2b", label: "Venda para outras empresas (B2B)" },
  { value: "governo", label: "Venda para órgãos públicos (licitações e contratos)" },
  { value: "outro", label: "Outros" },
];

const COURSE_CONTACT_OPTIONS: OptionItem[] = [
  { value: "online", label: "Sim, curso online" },
  { value: "presencial", label: "Sim, curso presencial" },
  { value: "ambos", label: "Sim, cursos online e presenciais" },
  { value: "nenhum", label: "Não tive contato com nenhum curso do Sebrae" },
];

const COURSE_REASON_OPTIONS: OptionItem[] = [
  { value: "abrir_negocio", label: "Abrir um negócio" },
  { value: "melhorar_gestao", label: "Melhorar a gestão do meu negócio" },
  { value: "aumentar_vendas", label: "Aumentar minhas vendas e faturamento" },
  { value: "competencias", label: "Desenvolver novas competências profissionais" },
  { value: "atualizar", label: "Atualizar meus conhecimentos" },
  {
    value: "resolver_problema",
    label: "Resolver um problema específico do meu negócio ou da minha atividade profissional",
  },
  { value: "inovar", label: "Inovar ou desenvolver novos produtos e serviços" },
  { value: "empregabilidade", label: "Melhorar minha empregabilidade ou oportunidades de trabalho" },
  { value: "nova_area", label: "Obter capacitação para uma nova área de atuação" },
  { value: "empresa_trabalho", label: "Atender às necessidades da empresa em que trabalho" },
  { value: "indicacao", label: "Recebi indicação do Sebrae ou de terceiros" },
  { value: "gratuito", label: "O curso era gratuito ou acessível" },
  { value: "outro", label: "Outro motivo" },
];

const CHANGES_OPTIONS: OptionItem[] = [
  { value: "competencias", label: "Melhorei meus conhecimentos e competências profissionais" },
  { value: "novas_ferramentas", label: "Passei a utilizar novas ferramentas, técnicas ou metodologias no meu trabalho" },
  { value: "organizacao", label: "Melhorei a organização e o planejamento das minhas atividades" },
  { value: "gestao_negocio", label: "Implementei melhorias na gestão do meu negócio" },
  { value: "produtos_servicos", label: "Desenvolvi ou aperfeiçoei produtos e/ou serviços" },
  { value: "canais_venda", label: "Ampliei meus canais de divulgação e de vendas" },
  { value: "relacionamento", label: "Melhorei meu relacionamento com clientes e fornecedores" },
  { value: "produtividade", label: "Aumentei minha produtividade" },
  { value: "novo_negocio", label: "Iniciei um novo negócio ou uma nova atividade profissional" },
  { value: "formalizacao", label: "Formalizei meu negócio (MEI, ME, entre outros)" },
  { value: "contratacao", label: "Contratei novos colaboradores ou ampliei minha equipe" },
  { value: "vendas_faturamento", label: "Obtive aumento nas vendas ou no faturamento" },
  { value: "ferramentas_digitais", label: "Passei a utilizar ferramentas digitais ou tecnologias no meu negócio" },
  { value: "networking", label: "Ampliei minha rede de contatos profissionais (networking)" },
  { value: "oportunidades", label: "Passei a identificar novas oportunidades de mercado" },
  { value: "nenhuma_mudanca", label: "Ainda não realizei mudanças decorrentes do curso" },
  { value: "outro", label: "Outra mudança" },
];

const AFFECTED_AREA_OPTIONS: OptionItem[] = [
  { value: "gestao_planejamento", label: "Gestão e planejamento do negócio" },
  { value: "marketing", label: "Marketing e divulgação" },
  { value: "vendas", label: "Vendas e relacionamento com clientes" },
  { value: "financas", label: "Finanças e controle financeiro" },
  { value: "rh", label: "Recursos humanos e gestão de pessoas" },
  { value: "producao", label: "Produção e operações" },
  { value: "produtos_servicos", label: "Desenvolvimento de produtos e/ou serviços" },
  { value: "inovacao", label: "Inovação e tecnologia" },
  { value: "presenca_digital", label: "Presença digital e comércio eletrônico" },
  { value: "atendimento", label: "Atendimento ao cliente" },
  { value: "processos", label: "Processos internos e organização do trabalho" },
  { value: "estrategia", label: "Estratégia e tomada de decisão" },
  { value: "formalizacao", label: "Formalização e aspectos legais do negócio" },
  { value: "sustentabilidade", label: "Sustentabilidade e responsabilidade socioambiental" },
  { value: "nenhuma", label: "Nenhuma área foi afetada" },
  { value: "ainda_nao_percebi", label: "Ainda não foi possível perceber os impactos do curso" },
  { value: "outro", label: "Outra área" },
];

const DIFFICULTY_OPTIONS: OptionItem[] = [
  { value: "nenhuma", label: "Não encontrei dificuldades na aplicação dos conhecimentos adquiridos" },
  { value: "tempo", label: "Falta de tempo para implementar as mudanças" },
  { value: "recursos", label: "Falta de recursos financeiros" },
  { value: "conhecimento", label: "Falta de conhecimento técnico complementar" },
  { value: "infraestrutura", label: "Falta de equipamentos ou de infraestrutura adequados" },
  { value: "adaptacao", label: "Dificuldade em adaptar os conhecimentos à minha realidade profissional ou empresarial" },
  { value: "resistencia", label: "Resistência à mudança por parte da equipe ou dos parceiros" },
  { value: "falta_apoio", label: "Falta de apoio da empresa ou da gestão" },
  { value: "nao_atendeu", label: "Os conteúdos do curso não atenderam às minhas necessidades" },
  { value: "sem_oportunidade", label: "Ainda não tive oportunidade de aplicar os conhecimentos" },
  { value: "investimento_alto", label: "As mudanças necessárias demandam investimentos elevados" },
  { value: "ferramentas", label: "Dificuldade em utilizar as ferramentas ou tecnologias apresentadas no curso" },
  { value: "mao_obra", label: "Falta de mão de obra qualificada para implementar as mudanças" },
  { value: "curso_recente", label: "O curso foi muito recente e ainda estou no processo de aplicar os conhecimentos" },
  { value: "outro", label: "Outra dificuldade" },
];

const SUPPORT_OPTIONS: OptionItem[] = [
  { value: "nenhum", label: "Não preciso de apoio adicional" },
  { value: "consultoria", label: "Consultoria especializada" },
  { value: "mentoria", label: "Mentoria ou acompanhamento individual" },
  { value: "cursos", label: "Cursos complementares ou avançados" },
  { value: "capacitacao_pratica", label: "Capacitação prática (oficinas e treinamentos)" },
  { value: "financeiro", label: "Orientação sobre gestão financeira" },
  { value: "marketing", label: "Orientação em marketing e vendas" },
  { value: "inovacao", label: "Orientação sobre inovação e tecnologia" },
  { value: "planos", label: "Apoio à elaboração de planos de negócios ou de planejamento estratégico" },
  { value: "formalizacao", label: "Apoio à formalização ou à regularização do negócio" },
  { value: "juridico", label: "Orientação jurídica ou tributária" },
  { value: "credito", label: "Acesso a linhas de crédito ou de financiamento" },
  { value: "materiais", label: "Ferramentas e materiais de apoio para implementação das mudanças" },
  { value: "networking", label: "Oportunidades de networking e parcerias" },
  { value: "pos_curso", label: "Acompanhamento pós-curso para implementação das ações" },
  { value: "nao_sei", label: "Ainda não sei qual apoio seria necessário" },
  { value: "outro", label: "Outro apoio" },
];

const STATES: OptionItem[] = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

const BEFORE_QUESTIONS: SurveyQuestion[] = [
  { id: "common.before.planning", text: "Planejamento" },
  { id: "common.before.financial_control", text: "Controle financeiro" },
  { id: "common.before.market", text: "Mercado" },
  { id: "common.before.technology", text: "Uso de tecnologia" },
  { id: "common.before.processes", text: "Processos" },
  { id: "common.before.people", text: "Gestão de pessoas" },
  { id: "common.before.quality", text: "Gestão da qualidade" },
  { id: "common.before.crisis", text: "Capacidade de enfrentar crises" },
];

const APPLICATION_QUESTIONS: SurveyQuestion[] = [
  {
    id: "common.application.applied",
    text: "Apliquei na prática os conteúdos que aprendi no(s) curso(s).",
  },
  {
    id: "common.application.immediate",
    text: "Consegui aplicar os conteúdos aprendidos no(s) curso(s) assim que tive acesso a eles.",
  },
];

const RESULT_QUESTIONS: SurveyQuestion[] = [
  { id: "common.results.sales", text: "Vendas" },
  { id: "common.results.clients", text: "Número de clientes" },
  { id: "common.results.revenue", text: "Faturamento" },
  { id: "common.results.costs", text: "Redução de custos" },
  { id: "common.results.processes", text: "Processos" },
  { id: "common.results.innovation", text: "Inovação" },
  { id: "common.results.quality", text: "Qualidade" },
  { id: "common.results.services", text: "Serviços prestados" },
  { id: "common.results.team", text: "Desempenho da equipe" },
  { id: "common.results.confidence", text: "Confiança no negócio" },
];

const COURSES: CourseDefinition[] = [
  {
    id: "financas",
    title: "Gestão Financeira",
    icon: TrendingUp,
    dimensions: [
      {
        id: "melhoria_da_gestao_financeira",
        title: "Melhoria da gestão financeira",
        questions: [
          { id: "q01", text: "O curso contribuiu para melhorar o controle financeiro da empresa." },
          { id: "q02", text: "Após o curso, minha empresa passou a controlar melhor custos e despesas." },
          { id: "q03", text: "O conhecimento adquirido ajudou a melhorar a saúde financeira do negócio." },
        ],
      },
      {
        id: "melhoria_da_gestao_estrategica",
        title: "Melhoria da gestão estratégica",
        questions: [
          { id: "q04", text: "Após o curso, minha empresa passou a definir metas de forma mais clara." },
          { id: "q05", text: "O curso contribuiu para melhorar o planejamento estratégico do negócio." },
          {
            id: "q06",
            text: "Passei a tomar decisões empresariais de forma mais estruturada e baseada em informações.",
          },
        ],
      },
      {
        id: "gestao_de_riscos_e_capacidade_preventiva",
        title: "Gestão de riscos e capacidade preventiva",
        questions: [
          { id: "q07", text: "O curso ajudou minha empresa a identificar riscos e vulnerabilidades do negócio." },
          {
            id: "q08",
            text: "Após o curso, passei a tomar decisões mais preventivas para evitar perdas e problemas futuros.",
          },
          {
            id: "q09",
            text: "O conhecimento adquirido aumentou minha capacidade de lidar com situações de incerteza e risco empresarial.",
          },
        ],
      },
      {
        id: "capacidade_de_investimento_e_acesso_a_oportunidades",
        title: "Capacidade de investimento e acesso a oportunidades",
        questions: [
          {
            id: "q10",
            text: "O curso ajudou minha empresa a identificar oportunidades de investimento e crescimento.",
          },
          { id: "q11", text: "Após o curso, minha empresa passou a buscar novas oportunidades de expansão." },
          {
            id: "q12",
            text: "O conhecimento adquirido ampliou minha capacidade de avaliar oportunidades de negócio.",
          },
        ],
      },
      {
        id: "geracao_de_renda_e_crescimento_economico",
        title: "Geração de renda e crescimento econômico",
        questions: [
          { id: "q13", text: "O curso contribuiu para ampliar a geração de renda da empresa." },
          {
            id: "q14",
            text: "Após o curso, minha empresa passou a identificar mais oportunidades de crescimento econômico.",
          },
          { id: "q15", text: "O curso ajudou minha empresa a aumentar seu potencial de expansão." },
        ],
      },
    ],
  },
  {
    id: "pessoas",
    title: "Gestão de Pessoas",
    icon: Users,
    dimensions: [
      {
        id: "gestao_de_pessoas",
        title: "Gestão de pessoas",
        questions: [
          { id: "q01", text: "O curso contribuiu para melhorar a gestão das pessoas na empresa." },
          {
            id: "q02",
            text: "Após o curso, passei a valorizar mais o treinamento, motivação e organização dos colaboradores.",
          },
          {
            id: "q03",
            text: "O conhecimento adquirido ajudou a melhorar o relacionamento e a coordenação da equipe de trabalho.",
          },
        ],
      },
      {
        id: "organizacao_e_profissionalizacao_da_empresa",
        title: "Organização e profissionalização da empresa",
        questions: [
          { id: "q04", text: "O curso contribuiu para tornar a gestão da empresa mais profissional." },
          { id: "q05", text: "Após o curso, minha empresa passou a ter processos mais organizados." },
          { id: "q06", text: "O curso ajudou a estruturar melhor as rotinas administrativas do negócio." },
        ],
      },
      {
        id: "produtividade_e_eficiencia_operacional",
        title: "Produtividade e eficiência operacional",
        questions: [
          { id: "q07", text: "O curso ajudou minha empresa a otimizar processos internos." },
          { id: "q08", text: "Após o curso, percebi melhora na produtividade da empresa." },
          { id: "q09", text: "O curso contribuiu para reduzir desperdícios e retrabalho." },
        ],
      },
      {
        id: "melhoria_da_gestao_estrategica",
        title: "Melhoria da gestão estratégica",
        questions: [
          { id: "q10", text: "Após o curso, minha empresa passou a definir metas de forma mais clara." },
          { id: "q11", text: "O curso contribuiu para melhorar o planejamento estratégico do negócio." },
          {
            id: "q12",
            text: "Passei a tomar decisões empresariais de forma mais estruturada e baseada em informações.",
          },
        ],
      },
    ],
  },
  {
    id: "atendimento",
    title: "Atendimento ao Cliente",
    icon: Smile,
    dimensions: [
      {
        id: "relacionamento_com_clientes",
        title: "Relacionamento com clientes",
        questions: [
          { id: "q01", text: "O curso ajudou minha empresa a melhorar o atendimento aos clientes." },
          {
            id: "q02",
            text: "Após o curso, minha empresa passou a compreender melhor as necessidades dos consumidores.",
          },
          { id: "q03", text: "O curso contribuiu para fortalecer a fidelização de clientes." },
        ],
      },
      {
        id: "qualidade_dos_produtos_servicos_e_atendimento",
        title: "Qualidade dos produtos, serviços e atendimento",
        questions: [
          {
            id: "q04",
            text: "O curso contribuiu para melhorar a qualidade dos produtos ou serviços oferecidos pela empresa.",
          },
          {
            id: "q05",
            text: "Após o curso, minha empresa passou a se preocupar mais com padrões de qualidade e satisfação dos clientes.",
          },
          {
            id: "q06",
            text: "O conhecimento adquirido ajudou a melhorar a qualidade do atendimento e das vendas.",
          },
        ],
      },
      {
        id: "marketing_e_posicionamento_competitivo",
        title: "Marketing e posicionamento competitivo",
        questions: [
          { id: "q07", text: "O curso ajudou minha empresa a melhorar estratégias de marketing e divulgação." },
          { id: "q08", text: "Após o curso, minha empresa passou a se posicionar melhor no mercado." },
          { id: "q09", text: "O curso contribuiu para fortalecer a imagem e a reputação da empresa." },
        ],
      },
      {
        id: "crescimento_de_mercado_e_clientes",
        title: "Crescimento de mercado e clientes",
        questions: [
          { id: "q10", text: "Após o curso, minha empresa ampliou sua base de clientes." },
          { id: "q11", text: "O curso ajudou a identificar novos mercados e oportunidades comerciais." },
          { id: "q12", text: "Minha empresa passou a alcançar públicos que antes não conseguia atingir." },
        ],
      },
      {
        id: "expansao_das_vendas_e_faturamento",
        title: "Expansão das vendas e faturamento",
        questions: [
          { id: "q13", text: "O curso contribuiu para aumentar as vendas da empresa." },
          { id: "q14", text: "Após o curso, percebi crescimento no faturamento do negócio." },
          { id: "q15", text: "As estratégias aprendidas ajudaram a melhorar os resultados comerciais da empresa." },
        ],
      },
    ],
  },
  {
    id: "ia",
    title: "IA na Prática para Pequenos Negócios",
    icon: Cpu,
    dimensions: [
      {
        id: "transformacao_digital",
        title: "Transformação digital",
        questions: [
          {
            id: "q01",
            text: "O curso contribuiu para introduzir ou ampliar o uso de tecnologias digitais na empresa.",
          },
          { id: "q02", text: "O curso ajudou minha empresa a se adaptar melhor às mudanças tecnológicas." },
          { id: "q03", text: "O curso apresentou tecnologias úteis para o processo de gestão da empresa." },
        ],
      },
      {
        id: "inovacao_empresarial",
        title: "Inovação empresarial",
        questions: [
          { id: "q04", text: "O curso estimulou a adoção de novas ideias, produtos ou serviços." },
          { id: "q05", text: "Minha empresa passou a buscar mais inovação após o curso." },
          {
            id: "q06",
            text: "O curso ajudou a desenvolver soluções mais criativas para os desafios do negócio.",
          },
        ],
      },
      {
        id: "produtividade_e_eficiencia_operacional",
        title: "Produtividade e eficiência operacional",
        questions: [
          { id: "q07", text: "O curso ajudou minha empresa a otimizar processos internos." },
          { id: "q08", text: "Após o curso, percebi melhora na produtividade da empresa." },
          { id: "q09", text: "O curso contribuiu para reduzir desperdícios e retrabalho." },
        ],
      },
      {
        id: "capacidade_de_adaptacao_ao_mercado",
        title: "Capacidade de adaptação ao mercado",
        questions: [
          {
            id: "q10",
            text: "O curso preparou minha empresa para lidar melhor com mudanças econômicas e de mercado.",
          },
          { id: "q11", text: "Após o curso, minha empresa tornou-se mais flexível diante de crises e desafios." },
          {
            id: "q12",
            text: "O curso ajudou minha empresa a responder mais rapidamente às mudanças do mercado.",
          },
        ],
      },
      {
        id: "capacidade_de_investimento_e_acesso_a_oportunidades",
        title: "Capacidade de investimento e acesso a oportunidades",
        questions: [
          {
            id: "q13",
            text: "O curso ajudou minha empresa a identificar oportunidades de investimento e crescimento.",
          },
          { id: "q14", text: "Após o curso, minha empresa passou a buscar novas oportunidades de expansão." },
          {
            id: "q15",
            text: "O conhecimento adquirido ampliou minha capacidade de avaliar oportunidades de negócio.",
          },
        ],
      },
    ],
  },
  {
    id: "emocional",
    title: "Inteligência Emocional",
    icon: HeartHandshake,
    dimensions: [
      {
        id: "desenvolvimento_de_capacidades_empreendedoras",
        title: "Desenvolvimento de capacidades empreendedoras",
        questions: [
          { id: "q01", text: "O curso aumentou minha confiança como empreendedor(a)." },
          { id: "q02", text: "Após o curso, sinto-me mais preparado para enfrentar desafios empresariais." },
          { id: "q03", text: "O curso fortaleceu minha capacidade de identificar oportunidades de negócio." },
        ],
      },
      {
        id: "resiliencia_e_confianca_no_negocio",
        title: "Resiliência e confiança no negócio",
        questions: [
          {
            id: "q04",
            text: "Antes do curso, eu pensava em desistir do negócio, mas o conhecimento adquirido ajudou a recuperar minha motivação.",
          },
          { id: "q05", text: "O curso fortaleceu minha confiança na continuidade e no futuro da empresa." },
          { id: "q06", text: "Após o curso, passei a enxergar novas possibilidades para o crescimento do negócio." },
        ],
      },
      {
        id: "capacidade_de_adaptacao_ao_mercado",
        title: "Capacidade de adaptação ao mercado",
        questions: [
          {
            id: "q07",
            text: "O curso preparou minha empresa para lidar melhor com mudanças econômicas e de mercado.",
          },
          { id: "q08", text: "Após o curso, minha empresa tornou-se mais flexível diante de crises e desafios." },
          {
            id: "q09",
            text: "O curso ajudou minha empresa a responder mais rapidamente às mudanças do mercado.",
          },
        ],
      },
      {
        id: "gestao_de_pessoas",
        title: "Gestão de pessoas",
        questions: [
          { id: "q10", text: "O curso contribuiu para melhorar a gestão das pessoas na empresa." },
          {
            id: "q11",
            text: "Após o curso, passei a valorizar mais o treinamento, motivação e organização dos colaboradores.",
          },
          {
            id: "q12",
            text: "O conhecimento adquirido ajudou a melhorar o relacionamento e a coordenação da equipe de trabalho.",
          },
        ],
      },
      {
        id: "resiliencia_e_continuidade_empresarial",
        title: "Resiliência e continuidade empresarial",
        questions: [
          {
            id: "q13",
            text: "Em momentos de dificuldade, o conhecimento adquirido no curso ajudou minha empresa a continuar funcionando.",
          },
          {
            id: "q14",
            text: "O curso aumentou minha capacidade de enfrentar crises e períodos de instabilidade econômica.",
          },
          { id: "q15", text: "Após o curso, senti-me mais preparado para evitar o fechamento do negócio." },
        ],
      },
    ],
  },
];

const COURSE_IDS = COURSES.map((course) => course.id);

const readStoredDraft = (): StoredDraft | null => {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredDraft>;
    if (parsed.version !== SURVEY_VERSION || !parsed.data) return null;

    return {
      version: SURVEY_VERSION,
      started: Boolean(parsed.started),
      startedAt: parsed.startedAt || new Date().toISOString(),
      currentPageId: parsed.currentPageId || "identification",
      data: {
        ...createEmptyForm(),
        ...parsed.data,
        responses: parsed.data.responses || {},
        salesChannels: parsed.data.salesChannels || [],
        onlineCourses: parsed.data.onlineCourses || [],
        courseReasons: parsed.data.courseReasons || [],
        changesMade: parsed.data.changesMade || [],
        affectedAreas: parsed.data.affectedAreas || [],
        applicationDifficulties: parsed.data.applicationDifficulties || [],
        supportNeeds: parsed.data.supportNeeds || [],
      },
    };
  } catch {
    return null;
  }
};

const getSpecificQuestionId = (courseId: CourseId, questionId: string) =>
  `specific.${courseId}.${questionId}`;

const getCourseQuestions = (course: CourseDefinition) =>
  course.dimensions.flatMap((dimension) => dimension.questions);

const getMissingItems = (
  page: SurveyPage,
  data: SurveyFormData,
  isPJ: boolean,
): MissingItem[] => {
  const missing: MissingItem[] = [];
  const add = (condition: boolean, id: string, label: string) => {
    if (condition) missing.push({ id, label });
  };
  const requireResponse = (id: string, label: string) =>
    add(!data.responses[id], id, label);

  switch (page.kind) {
    case "identification": {
      add(!validateCPF(data.cpf), "cpf", "Informe um CPF válido");
      add(!isFilled(data.fullName), "fullName", "Informe o nome completo");
      add(Boolean(data.email) && !validateEmail(data.email), "email", "Revise o e-mail informado");
      add(
        Boolean(data.phone) && data.phone.replace(/\D/g, "").length < 10,
        "phone",
        "Revise o telefone informado",
      );
      break;
    }

    case "participant-profile": {
      add(!data.professionalCategory, "professionalCategory", "Selecione a categoria de atuação");
      add(!data.professionalArea, "professionalArea", "Selecione a área de atuação");
      add(
        data.professionalArea === "outro" && !isFilled(data.professionalAreaOther),
        "professionalAreaOther",
        "Descreva a outra área de atuação",
      );
      const requiresYears = !["estudante", "nao_atuo"].includes(data.professionalArea);
      add(
        requiresYears && !isFilled(data.yearsInCurrentArea),
        "yearsInCurrentArea",
        "Informe o tempo na área atual",
      );
      add(
        !data.previousEntrepreneurialArea,
        "previousEntrepreneurialArea",
        "Selecione a experiência empreendedora prévia",
      );
      add(
        data.previousEntrepreneurialArea === "outro" &&
          !isFilled(data.previousEntrepreneurialAreaOther),
        "previousEntrepreneurialAreaOther",
        "Descreva a experiência empreendedora prévia",
      );
      add(!isFilled(data.residenceCity), "residenceCity", "Informe o município de residência");
      add(!data.residenceState, "residenceState", "Selecione o estado de residência");
      add(!data.gender, "gender", "Selecione o gênero");
      add(
        data.gender === "outro" && !isFilled(data.genderOther),
        "genderOther",
        "Informe como prefere descrever seu gênero",
      );
      add(!data.ageRange, "ageRange", "Selecione a faixa etária");
      break;
    }

    case "company-profile": {
      add(
        data.professionalCategory !== "pj_mei" && !data.companySize,
        "companySize",
        "Selecione o porte da empresa",
      );
      add(!data.companyOperatingTime, "companyOperatingTime", "Selecione o tempo de funcionamento");
      add(
        data.companyOperatingTime === "outro" && !isFilled(data.companyOperatingTimeOther),
        "companyOperatingTimeOther",
        "Informe o tempo de funcionamento",
      );
      add(!data.companyLocationType, "companyLocationType", "Selecione o tipo de localização");
      add(
        data.companyLocationType === "fisica" && !isFilled(data.companyCity),
        "companyCity",
        "Informe o município da empresa",
      );
      add(
        data.companyLocationType === "fisica" && !data.companyState,
        "companyState",
        "Selecione o estado da empresa",
      );
      add(!data.companySegment, "companySegment", "Selecione o segmento da empresa");
      add(
        data.companySegment === "outro" && !isFilled(data.companySegmentOther),
        "companySegmentOther",
        "Descreva o outro segmento",
      );
      add(!isFilled(data.employeeCount), "employeeCount", "Informe o número de colaboradores");
      add(!data.revenueRange, "revenueRange", "Selecione a faixa de faturamento");
      add(data.salesChannels.length === 0, "salesChannels", "Selecione ao menos um canal de venda");
      add(
        data.salesChannels.includes("outro") && !isFilled(data.salesChannelOther),
        "salesChannelOther",
        "Descreva o outro canal de venda",
      );
      break;
    }

    case "sebrae-relationship": {
      add(!data.courseContact, "courseContact", "Selecione sua relação com os cursos do Sebrae");
      const hasOnline = ["online", "ambos"].includes(data.courseContact);
      const hasPresencial = ["presencial", "ambos"].includes(data.courseContact);
      add(hasOnline && data.onlineCourses.length === 0, "onlineCourses", "Selecione ao menos um curso online");
      add(
        hasOnline && data.onlineCourses.includes("outro") && !isFilled(data.onlineCourseOther),
        "onlineCourseOther",
        "Informe o outro curso online",
      );
      add(
        hasPresencial && !isFilled(data.presencialCourse),
        "presencialCourse",
        "Informe o curso presencial",
      );
      break;
    }

    case "course-evaluation": {
      add(data.courseReasons.length === 0, "courseReasons", "Selecione ao menos um motivo");
      add(
        data.courseReasons.includes("outro") && !isFilled(data.courseReasonOther),
        "courseReasonOther",
        "Descreva o outro motivo",
      );
      requireResponse("common.relationship.expectations", "Avalie o atendimento às expectativas");
      requireResponse("common.relationship.performance", "Avalie seu desempenho");
      requireResponse("common.relationship.workload", "Avalie a carga horária");
      break;
    }

    case "before-course": {
      BEFORE_QUESTIONS.forEach((question) => requireResponse(question.id, question.text));
      break;
    }

    case "application-practice": {
      APPLICATION_QUESTIONS.forEach((question) => requireResponse(question.id, question.text));
      add(data.changesMade.length === 0, "changesMade", "Selecione ao menos uma mudança");
      add(
        data.changesMade.includes("outro") && !isFilled(data.changesMadeOther),
        "changesMadeOther",
        "Descreva a outra mudança",
      );
      break;
    }

    case "application-areas": {
      add(data.affectedAreas.length === 0, "affectedAreas", "Selecione ao menos uma área");
      add(
        data.affectedAreas.includes("outro") && !isFilled(data.affectedAreasOther),
        "affectedAreasOther",
        "Descreva a outra área",
      );
      break;
    }

    case "application-difficulties": {
      add(
        data.applicationDifficulties.length === 0,
        "applicationDifficulties",
        "Selecione ao menos uma alternativa",
      );
      add(
        data.applicationDifficulties.includes("outro") &&
          !isFilled(data.applicationDifficultiesOther),
        "applicationDifficultiesOther",
        "Descreva a outra dificuldade",
      );
      break;
    }

    case "application-support": {
      add(data.supportNeeds.length === 0, "supportNeeds", "Selecione ao menos uma alternativa");
      add(
        data.supportNeeds.includes("outro") && !isFilled(data.supportNeedsOther),
        "supportNeedsOther",
        "Descreva o outro apoio",
      );
      break;
    }

    case "results": {
      RESULT_QUESTIONS.forEach((question) => requireResponse(question.id, question.text));
      break;
    }

    case "specific-course": {
      const course = COURSES.find((item) => item.id === page.courseId);
      course?.dimensions.forEach((dimension) =>
        dimension.questions.forEach((question) =>
          requireResponse(getSpecificQuestionId(course.id, question.id), question.text),
        ),
      );
      break;
    }

    case "review": {
      add(!data.reviewConfirmed, "reviewConfirmed", "Confirme a revisão das respostas");
      break;
    }

    default:
      break;
  }

  if (!isPJ && page.kind === "company-profile") return [];
  return missing;
};

const getOptionLabel = (options: OptionItem[], value: string) =>
  options.find((option) => option.value === value)?.label || value || "Não informado";

interface FieldBaseProps {
  id: string;
  label: string;
  required?: boolean;
  helper?: string;
  error?: boolean;
}

function FieldLabel({ label, required }: Pick<FieldBaseProps, "label" | "required">) {
  return (
    <span className="mb-2 block text-sm font-semibold text-slate-800">
      {label}
      {required ? <span className="ml-1 text-red-600">*</span> : null}
    </span>
  );
}

function FieldError() {
  return (
    <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-700">
      <AlertCircle size={15} aria-hidden="true" />
      Revise este campo antes de continuar.
    </p>
  );
}

interface TextFieldProps extends FieldBaseProps {
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  min?: string;
  max?: string;
  autoComplete?: string;
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputMode,
  min,
  max,
  autoComplete,
  required,
  helper,
  error,
}: TextFieldProps) {
  return (
    <div data-field={id}>
      <label htmlFor={id}>
        <FieldLabel label={label} required={required} />
      </label>
      <input
        id={id}
        name={id}
        value={value}
        type={type}
        inputMode={inputMode}
        min={min}
        max={max}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        className={`min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-red-500 focus:border-red-600 focus:ring-red-100"
            : "border-slate-300 focus:border-[#005AA5] focus:ring-blue-100"
        }`}
        aria-invalid={error || undefined}
        aria-describedby={helper ? `${id}-helper` : undefined}
      />
      {helper ? (
        <p id={`${id}-helper`} className="mt-2 text-sm text-slate-500">
          {helper}
        </p>
      ) : null}
      {error ? <FieldError /> : null}
    </div>
  );
}

interface SelectFieldProps extends FieldBaseProps {
  value: string;
  options: OptionItem[];
  onChange: (value: string) => void;
  placeholder?: string;
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Selecione uma opção",
  required,
  helper,
  error,
}: SelectFieldProps) {
  return (
    <div data-field={id}>
      <label htmlFor={id}>
        <FieldLabel label={label} required={required} />
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        className={`min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:ring-4 ${
          error
            ? "border-red-500 focus:border-red-600 focus:ring-red-100"
            : "border-slate-300 focus:border-[#005AA5] focus:ring-blue-100"
        }`}
        aria-invalid={error || undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
      {error ? <FieldError /> : null}
    </div>
  );
}

interface ChoiceCardsProps extends FieldBaseProps {
  value: string;
  options: OptionItem[];
  onChange: (value: string) => void;
  columns?: "one" | "two" | "three";
}

function ChoiceCards({
  id,
  label,
  value,
  options,
  onChange,
  required,
  helper,
  error,
  columns = "two",
}: ChoiceCardsProps) {
  const columnClass =
    columns === "one"
      ? "grid-cols-1"
      : columns === "three"
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";

  return (
    <fieldset data-field={id}>
      <legend className="w-full">
        <FieldLabel label={label} required={required} />
      </legend>
      {helper ? <p className="mb-3 text-sm text-slate-500">{helper}</p> : null}
      <div className={`grid gap-3 ${columnClass}`}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`relative flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border p-4 transition focus-within:ring-4 focus-within:ring-blue-100 ${
                selected
                  ? "border-[#005AA5] bg-blue-50 text-[#004b8b] shadow-sm"
                  : error
                    ? "border-red-300 bg-white hover:border-red-400"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-[#005AA5] bg-[#005AA5]" : "border-slate-400 bg-white"
                }`}
                aria-hidden="true"
              >
                {selected ? <Check size={13} className="text-white" /> : null}
              </span>
              <span>
                <span className="block text-sm font-semibold leading-5">{option.label}</span>
                {option.description ? (
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      {error ? <FieldError /> : null}
    </fieldset>
  );
}

interface CheckboxCardsProps extends FieldBaseProps {
  values: string[];
  options: OptionItem[];
  onToggle: (value: string) => void;
  columns?: "one" | "two" | "three";
}

function CheckboxCards({
  id,
  label,
  values,
  options,
  onToggle,
  required,
  helper,
  error,
  columns = "two",
}: CheckboxCardsProps) {
  const columnClass =
    columns === "one"
      ? "grid-cols-1"
      : columns === "three"
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";

  return (
    <fieldset data-field={id}>
      <legend className="w-full">
        <FieldLabel label={label} required={required} />
      </legend>
      {helper ? <p className="mb-3 text-sm text-slate-500">{helper}</p> : null}
      <div className={`grid gap-3 ${columnClass}`}>
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <label
              key={option.value}
              className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition focus-within:ring-4 focus-within:ring-blue-100 ${
                selected
                  ? "border-[#005AA5] bg-blue-50 text-[#004b8b]"
                  : error
                    ? "border-red-300 bg-white hover:border-red-400"
                    : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggle(option.value)}
                className="sr-only"
              />
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                  selected ? "border-[#005AA5] bg-[#005AA5]" : "border-slate-400 bg-white"
                }`}
                aria-hidden="true"
              >
                {selected ? <Check size={14} className="text-white" /> : null}
              </span>
              <span className="text-sm font-medium leading-5">{option.label}</span>
            </label>
          );
        })}
      </div>
      {error ? <FieldError /> : null}
    </fieldset>
  );
}

interface LikertQuestionProps {
  id: string;
  question: string;
  value?: number;
  scale: ScaleOption[];
  onChange: (value: number) => void;
  error?: boolean;
  number?: number;
}

function LikertQuestion({
  id,
  question,
  value,
  scale,
  onChange,
  error,
  number,
}: LikertQuestionProps) {
  const gridClass =
    scale.length === 6
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5";

  return (
    <fieldset
      data-field={id}
      className={`rounded-2xl border p-4 sm:p-5 ${
        error ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-white"
      }`}
    >
      <legend className="w-full px-0 text-sm font-semibold leading-6 text-slate-800 sm:text-base">
        {typeof number === "number" ? (
          <span className="mr-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-bold text-slate-600">
            {number}
          </span>
        ) : null}
        {question}
      </legend>
      <div className={`mt-4 grid gap-2 ${gridClass}`}>
        {scale.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left transition focus-within:ring-4 focus-within:ring-blue-100 lg:flex-col lg:justify-center lg:text-center ${
                selected
                  ? "border-[#005AA5] bg-[#005AA5] text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
              }`}
              title={option.label}
            >
              <input
                type="radio"
                name={id}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                  selected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {option.value === 6 ? "N/A" : option.value}
              </span>
              <span className="text-xs font-semibold leading-4">{option.shortLabel}</span>
            </label>
          );
        })}
      </div>
      {error ? <FieldError /> : null}
    </fieldset>
  );
}

interface InfoBannerProps {
  icon?: LucideIcon;
  title?: string;
  children: React.ReactNode;
  tone?: "blue" | "slate" | "amber";
}

function InfoBanner({ icon: Icon = Info, title, children, tone = "blue" }: InfoBannerProps) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : tone === "slate"
        ? "border-slate-200 bg-slate-50 text-slate-700"
        : "border-blue-200 bg-blue-50 text-blue-950";

  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${toneClass}`}>
      <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="text-sm leading-6">
        {title ? <p className="font-bold">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
    </div>
  );
}

export default function App() {
  const [initialDraft] = useState<StoredDraft | null>(() => readStoredDraft());
  const [hasDraft, setHasDraft] = useState(Boolean(initialDraft));
  const [started, setStarted] = useState(initialDraft?.started ?? false);
  const [startedAt, setStartedAt] = useState(
    initialDraft?.startedAt ?? new Date().toISOString(),
  );
  const [currentPageId, setCurrentPageId] = useState(
    initialDraft?.currentPageId ?? "identification",
  );
  const [formData, setFormData] = useState<SurveyFormData>(
    initialDraft?.data ?? createEmptyForm(),
  );
  const [showErrors, setShowErrors] = useState(false);
  const [pageError, setPageError] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isPJ = formData.professionalCategory.startsWith("pj_");
  const hasCourse = Boolean(formData.courseContact && formData.courseContact !== "nenhum");
  const hasOnlineCourseContact = ["online", "ambos"].includes(formData.courseContact);
  const selectedSpecificCourses = useMemo(
    () =>
      formData.onlineCourses.filter((courseId): courseId is CourseId =>
        COURSE_IDS.includes(courseId as CourseId),
      ),
    [formData.onlineCourses],
  );

  const pages = useMemo<SurveyPage[]>(() => {
    const result: SurveyPage[] = [
      {
        id: "identification",
        kind: "identification",
        eyebrow: "Identificação",
        title: "Vamos começar pelos dados essenciais",
        description:
          "O CPF e o nome identificam a resposta. E-mail e telefone são opcionais.",
      },
      {
        id: "participant-profile",
        kind: "participant-profile",
        eyebrow: "Núcleo comum · Bloco 1",
        title: "Perfil do participante",
        description:
          "Estas respostas ajudam a compreender o contexto profissional de quem realizou a pesquisa.",
      },
    ];

    if (isPJ) {
      result.push({
        id: "company-profile",
        kind: "company-profile",
        eyebrow: "Núcleo comum · Bloco 2",
        title: "Perfil da empresa",
        description:
          "Este bloco aparece apenas para quem informou atuação como Pessoa Jurídica.",
      });
    }

    result.push({
      id: "sebrae-relationship",
      kind: "sebrae-relationship",
      eyebrow: "Núcleo comum · Bloco 3",
      title: "Sua relação com os cursos do Sebrae",
      description:
        "A seleção feita aqui define automaticamente os próximos blocos do formulário.",
    });

    if (hasCourse) {
      result.push({
        id: "course-evaluation",
        kind: "course-evaluation",
        eyebrow: "Núcleo comum · Bloco 3",
        title: "Motivação e avaliação geral",
        description: "Considere o conjunto de cursos com os quais você teve contato.",
      });

      if (isPJ) {
        result.push({
          id: "before-course",
          kind: "before-course",
          eyebrow: "Núcleo comum · Bloco 4",
          title: "Situação percebida antes dos cursos",
          description:
            "Avalie como estava sua empresa antes de realizar o(s) curso(s).",
        });
      }

      result.push({
        id: "application-practice",
        kind: "application-practice",
        eyebrow: "Núcleo comum · Bloco 5",
        title: "Aplicação do aprendizado",
        description: "Conte o que conseguiu colocar em prática após os cursos.",
      });

      if (isPJ) {
        result.push({
          id: "application-areas",
          kind: "application-areas",
          eyebrow: "Núcleo comum · Bloco 5",
          title: "Áreas impactadas na empresa",
          description: "Selecione todas as áreas que foram afetadas pelas mudanças.",
        });
      }

      result.push(
        {
          id: "application-difficulties",
          kind: "application-difficulties",
          eyebrow: "Núcleo comum · Bloco 5",
          title: "Dificuldades de aplicação",
          description: "Selecione todas as alternativas que representam sua experiência.",
        },
        {
          id: "application-support",
          kind: "application-support",
          eyebrow: "Núcleo comum · Bloco 5",
          title: "Apoios necessários",
          description: "Indique o que ajudaria a aplicar melhor os conhecimentos adquiridos.",
        },
      );

      if (isPJ) {
        result.push({
          id: "results",
          kind: "results",
          eyebrow: "Núcleo comum · Resultados percebidos",
          title: "Resultados percebidos na empresa",
          description:
            "Avalie em que medida os conhecimentos dos cursos contribuíram para cada resultado.",
        });
      }

      if (hasOnlineCourseContact) {
        selectedSpecificCourses.forEach((courseId) => {
          const course = COURSES.find((item) => item.id === courseId);
          if (!course) return;
          result.push({
            id: `specific-${courseId}`,
            kind: "specific-course",
            eyebrow: "Núcleo customizado",
            title: course.title,
            description:
              "Indique seu grau de concordância. Use “Não se aplica” quando a afirmativa não corresponder à sua realidade.",
            courseId,
          });
        });
      }
    }

    result.push({
      id: "review",
      kind: "review",
      eyebrow: "Revisão final",
      title: "Revise antes de enviar",
      description:
        "Confira o resumo abaixo. Você pode voltar para alterar qualquer resposta.",
    });

    return result;
  }, [hasCourse, hasOnlineCourseContact, isPJ, selectedSpecificCourses]);

  const currentPageIndex = Math.max(
    0,
    pages.findIndex((page) => page.id === currentPageId),
  );
  const currentPage = pages[currentPageIndex] ?? pages[0];
  const missingItems = useMemo(
    () => getMissingItems(currentPage, formData, isPJ),
    [currentPage, formData, isPJ],
  );

  const hasError = (id: string) =>
    showErrors && missingItems.some((item) => item.id === id);

  const updateField = <Key extends keyof SurveyFormData>(
    key: Key,
    value: SurveyFormData[Key],
  ) => {
    setFormData((previous) => ({ ...previous, [key]: value }));
  };

  const updateResponse = (id: string, value: number) => {
    setFormData((previous) => ({
      ...previous,
      responses: { ...previous.responses, [id]: value },
    }));
  };

  useEffect(() => {
    if (!started || submitted || typeof window === "undefined") return;

    const timeout = window.setTimeout(() => {
      const draft: StoredDraft = {
        version: SURVEY_VERSION,
        started: true,
        startedAt,
        currentPageId,
        data: formData,
      };
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setHasDraft(true);
      setSavedAt(new Date());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [currentPageId, formData, started, startedAt, submitted]);

  useEffect(() => {
    if (!pages.some((page) => page.id === currentPageId)) {
      setCurrentPageId(pages[0]?.id ?? "identification");
    }
  }, [currentPageId, pages]);

  useEffect(() => {
    if (showErrors && missingItems.length === 0) {
      setPageError("");
    }
  }, [missingItems, showErrors]);

  const startSurvey = () => {
    setStarted(true);
    if (!hasDraft) {
      const now = new Date().toISOString();
      setStartedAt(now);
      setCurrentPageId("identification");
    }
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const resetSurvey = () => {
    if (typeof window !== "undefined") window.sessionStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setStarted(false);
    setSubmitted(false);
    setFormData(createEmptyForm());
    setCurrentPageId("identification");
    setStartedAt(new Date().toISOString());
    setShowErrors(false);
    setPageError("");
    setSubmitError("");
    setSavedAt(null);
  };

  const moveToPage = (pageId: string) => {
    setCurrentPageId(pageId);
    setShowErrors(false);
    setPageError("");
    setSubmitError("");
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const goBack = () => {
    if (currentPageIndex === 0) {
      setStarted(false);
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      return;
    }
    moveToPage(pages[currentPageIndex - 1].id);
  };

  const buildActiveResponseIds = () => {
    const activeIds = new Set<string>();

    if (hasCourse) {
      activeIds.add("common.relationship.expectations");
      activeIds.add("common.relationship.performance");
      activeIds.add("common.relationship.workload");
      APPLICATION_QUESTIONS.forEach((question) => activeIds.add(question.id));

      if (isPJ) {
        BEFORE_QUESTIONS.forEach((question) => activeIds.add(question.id));
        RESULT_QUESTIONS.forEach((question) => activeIds.add(question.id));
      }

      selectedSpecificCourses.forEach((courseId) => {
        const course = COURSES.find((item) => item.id === courseId);
        if (!course) return;
        getCourseQuestions(course).forEach((question) =>
          activeIds.add(getSpecificQuestionId(courseId, question.id)),
        );
      });
    }

    return activeIds;
  };

  const submitSurvey = async () => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const activeResponseIds = buildActiveResponseIds();
      const activeResponses = Object.fromEntries(
        Object.entries(formData.responses).filter(([id]) => activeResponseIds.has(id)),
      );

      const normalizedOnlineCourses = hasOnlineCourseContact ? formData.onlineCourses : [];
      const legacyCourses = normalizedOnlineCourses.map((courseId) =>
        courseId === "outro" ? "outros" : courseId,
      );

      const payload = {
        ...formData,
        companySize:
          isPJ && formData.professionalCategory === "pj_mei"
            ? "mei"
            : isPJ
              ? formData.companySize
              : "",
        companyOperatingTime: isPJ ? formData.companyOperatingTime : "",
        companyOperatingTimeOther: isPJ ? formData.companyOperatingTimeOther : "",
        companyLocationType: isPJ ? formData.companyLocationType : "",
        companyCity:
          isPJ && formData.companyLocationType === "fisica" ? formData.companyCity : "",
        companyState:
          isPJ && formData.companyLocationType === "fisica" ? formData.companyState : "",
        companySegment: isPJ ? formData.companySegment : "",
        companySegmentOther: isPJ ? formData.companySegmentOther : "",
        employeeCount: isPJ ? formData.employeeCount : "",
        revenueRange: isPJ ? formData.revenueRange : "",
        salesChannels: isPJ ? formData.salesChannels : [],
        salesChannelOther: isPJ ? formData.salesChannelOther : "",
        onlineCourses: normalizedOnlineCourses,
        onlineCourseOther: hasOnlineCourseContact ? formData.onlineCourseOther : "",
        presencialCourse: ["presencial", "ambos"].includes(formData.courseContact)
          ? formData.presencialCourse
          : "",
        courseReasons: hasCourse ? formData.courseReasons : [],
        courseReasonOther: hasCourse ? formData.courseReasonOther : "",
        changesMade: hasCourse ? formData.changesMade : [],
        changesMadeOther: hasCourse ? formData.changesMadeOther : "",
        affectedAreas: hasCourse && isPJ ? formData.affectedAreas : [],
        affectedAreasOther: hasCourse && isPJ ? formData.affectedAreasOther : "",
        applicationDifficulties: hasCourse ? formData.applicationDifficulties : [],
        applicationDifficultiesOther: hasCourse
          ? formData.applicationDifficultiesOther
          : "",
        supportNeeds: hasCourse ? formData.supportNeeds : [],
        supportNeedsOther: hasCourse ? formData.supportNeedsOther : "",
        responses: activeResponses,

        // Campos de compatibilidade com o payload do código anterior.
        genero: formData.gender,
        cursos: legacyCourses,
        raca: "",
        quilombola: "",
        pcd: "",
        tiposPcd: [],

        questionnaireVersion: SURVEY_VERSION,
        respondentType: isPJ ? "PJ" : "PF",
        selectedCourseTitles: selectedSpecificCourses.map(
          (courseId) => COURSES.find((course) => course.id === courseId)?.title || courseId,
        ),
        startedAt,
        timestamp: new Date().toISOString(),
      };

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        keepalive: true,
      });

      if (typeof window !== "undefined") window.sessionStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
      setSubmitted(true);
      setStarted(false);
    } catch {
      setSubmitError(
        "Não foi possível enviar agora. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = async () => {
    const missing = getMissingItems(currentPage, formData, isPJ);
    if (missing.length > 0) {
      setShowErrors(true);
      setPageError(
        missing.length === 1
          ? missing[0].label
          : `Ainda faltam ${missing.length} respostas obrigatórias nesta etapa.`,
      );
      window.requestAnimationFrame(() => {
        const firstField = document.querySelector<HTMLElement>(
          `[data-field="${missing[0].id}"]`,
        );
        firstField?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    if (currentPage.kind === "review") {
      await submitSurvey();
      return;
    }

    moveToPage(pages[currentPageIndex + 1].id);
  };

  const renderCourseCards = () => (
    <div data-field="onlineCourses">
      <FieldLabel label="Quais cursos online você já realizou ou acessou?" required />
      <p className="mb-4 text-sm text-slate-500">Você pode selecionar mais de um.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COURSES.map((course) => {
          const selected = formData.onlineCourses.includes(course.id);
          const Icon = course.icon;
          return (
            <label
              key={course.id}
              className={`flex min-h-32 cursor-pointer flex-col justify-between rounded-2xl border p-4 transition focus-within:ring-4 focus-within:ring-blue-100 ${
                selected
                  ? "border-[#005AA5] bg-blue-50 text-[#004b8b] shadow-sm"
                  : hasError("onlineCourses")
                    ? "border-red-300 hover:border-red-400"
                    : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() =>
                  updateField(
                    "onlineCourses",
                    toggleArrayValue(formData.onlineCourses, course.id),
                  )
                }
                className="sr-only"
              />
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-xl bg-white p-2 shadow-sm">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                    selected ? "border-[#005AA5] bg-[#005AA5]" : "border-slate-300 bg-white"
                  }`}
                  aria-hidden="true"
                >
                  {selected ? <Check size={14} className="text-white" /> : null}
                </span>
              </div>
              <span className="mt-4 text-sm font-bold leading-5">{course.title}</span>
            </label>
          );
        })}

        <label
          className={`flex min-h-32 cursor-pointer flex-col justify-between rounded-2xl border p-4 transition focus-within:ring-4 focus-within:ring-blue-100 ${
            formData.onlineCourses.includes("outro")
              ? "border-[#005AA5] bg-blue-50 text-[#004b8b] shadow-sm"
              : hasError("onlineCourses")
                ? "border-red-300 hover:border-red-400"
                : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
          }`}
        >
          <input
            type="checkbox"
            checked={formData.onlineCourses.includes("outro")}
            onChange={() =>
              updateField(
                "onlineCourses",
                toggleArrayValue(formData.onlineCourses, "outro"),
              )
            }
            className="sr-only"
          />
          <div className="flex items-start justify-between gap-3">
            <span className="rounded-xl bg-white p-2 shadow-sm">
              <GraduationCap size={24} aria-hidden="true" />
            </span>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                formData.onlineCourses.includes("outro")
                  ? "border-[#005AA5] bg-[#005AA5]"
                  : "border-slate-300 bg-white"
              }`}
              aria-hidden="true"
            >
              {formData.onlineCourses.includes("outro") ? (
                <Check size={14} className="text-white" />
              ) : null}
            </span>
          </div>
          <span className="mt-4 text-sm font-bold leading-5">Outro curso online</span>
        </label>
      </div>
      {hasError("onlineCourses") ? <FieldError /> : null}
    </div>
  );

  const renderPageContent = () => {
    switch (currentPage.kind) {
      case "identification":
        return (
          <div className="space-y-7">
            <InfoBanner icon={LockKeyhole} title="Rascunho protegido nesta sessão" tone="slate">
              O preenchimento é salvo somente nesta aba do navegador e apagado após o envio.
            </InfoBanner>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField
                id="cpf"
                label="CPF"
                value={formData.cpf}
                onChange={(value) => updateField("cpf", maskCPF(value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                autoComplete="off"
                required
                error={hasError("cpf")}
              />
              <TextField
                id="fullName"
                label="Nome completo"
                value={formData.fullName}
                onChange={(value) => updateField("fullName", value)}
                placeholder="Digite seu nome"
                autoComplete="name"
                required
                error={hasError("fullName")}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <SectionHeading
                title="Contato opcional"
                description="Preencha somente caso deseje registrar um canal de contato junto à resposta."
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TextField
                  id="email"
                  label="E-mail"
                  value={formData.email}
                  onChange={(value) => updateField("email", value)}
                  type="email"
                  placeholder="nome@dominio.com"
                  autoComplete="email"
                  error={hasError("email")}
                />
                <TextField
                  id="phone"
                  label="Telefone / WhatsApp"
                  value={formData.phone}
                  onChange={(value) => updateField("phone", maskPhone(value))}
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  autoComplete="tel"
                  error={hasError("phone")}
                />
              </div>
            </div>
          </div>
        );

      case "participant-profile": {
        const requiresYears = !["estudante", "nao_atuo"].includes(
          formData.professionalArea,
        );
        return (
          <div className="space-y-8">
            <ChoiceCards
              id="professionalCategory"
              label="Qual a categoria da sua atuação profissional?"
              value={formData.professionalCategory}
              options={PROFESSIONAL_CATEGORY_OPTIONS}
              onChange={(value) => updateField("professionalCategory", value)}
              columns="two"
              required
              error={hasError("professionalCategory")}
            />

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SelectField
                id="professionalArea"
                label="Qual a sua área de atuação profissional?"
                value={formData.professionalArea}
                options={PROFESSIONAL_AREA_OPTIONS}
                onChange={(value) => updateField("professionalArea", value)}
                required
                error={hasError("professionalArea")}
              />
              {requiresYears ? (
                <TextField
                  id="yearsInCurrentArea"
                  label="Há quanto tempo está nessa área?"
                  value={formData.yearsInCurrentArea}
                  onChange={(value) => updateField("yearsInCurrentArea", value)}
                  type="number"
                  min="0"
                  max="80"
                  inputMode="numeric"
                  placeholder="Quantidade de anos"
                  required
                  error={hasError("yearsInCurrentArea")}
                />
              ) : (
                <InfoBanner tone="slate">
                  Como você informou que é estudante ou ainda não atua profissionalmente, a pergunta
                  sobre tempo de atuação não é necessária.
                </InfoBanner>
              )}
            </div>

            {formData.professionalArea === "outro" ? (
              <TextField
                id="professionalAreaOther"
                label="Qual é a outra área de atuação?"
                value={formData.professionalAreaOther}
                onChange={(value) => updateField("professionalAreaOther", value)}
                placeholder="Descreva a área"
                required
                error={hasError("professionalAreaOther")}
              />
            ) : null}

            <SelectField
              id="previousEntrepreneurialArea"
              label="Qual a área da sua experiência empreendedora prévia à atuação atual?"
              value={formData.previousEntrepreneurialArea}
              options={PREVIOUS_EXPERIENCE_OPTIONS}
              onChange={(value) => updateField("previousEntrepreneurialArea", value)}
              required
              error={hasError("previousEntrepreneurialArea")}
            />

            {formData.previousEntrepreneurialArea === "outro" ? (
              <TextField
                id="previousEntrepreneurialAreaOther"
                label="Qual foi a outra área dessa experiência?"
                value={formData.previousEntrepreneurialAreaOther}
                onChange={(value) => updateField("previousEntrepreneurialAreaOther", value)}
                placeholder="Descreva a área"
                required
                error={hasError("previousEntrepreneurialAreaOther")}
              />
            ) : null}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_220px]">
              <TextField
                id="residenceCity"
                label="Município de residência"
                value={formData.residenceCity}
                onChange={(value) => updateField("residenceCity", value)}
                placeholder="Ex.: Belo Horizonte"
                autoComplete="address-level2"
                required
                error={hasError("residenceCity")}
              />
              <SelectField
                id="residenceState"
                label="Estado"
                value={formData.residenceState}
                options={STATES}
                onChange={(value) => updateField("residenceState", value)}
                placeholder="Selecione a UF"
                required
                error={hasError("residenceState")}
              />
            </div>

            <ChoiceCards
              id="gender"
              label="Qual o seu gênero?"
              value={formData.gender}
              options={GENDER_OPTIONS}
              onChange={(value) => updateField("gender", value)}
              columns="three"
              required
              error={hasError("gender")}
            />

            {formData.gender === "outro" ? (
              <TextField
                id="genderOther"
                label="Como você prefere descrever seu gênero?"
                value={formData.genderOther}
                onChange={(value) => updateField("genderOther", value)}
                placeholder="Digite sua resposta"
                required
                error={hasError("genderOther")}
              />
            ) : null}

            <ChoiceCards
              id="ageRange"
              label="Qual a sua idade?"
              value={formData.ageRange}
              options={AGE_OPTIONS}
              onChange={(value) => updateField("ageRange", value)}
              columns="three"
              required
              error={hasError("ageRange")}
            />
          </div>
        );
      }

      case "company-profile":
        return (
          <div className="space-y-8">
            {formData.professionalCategory === "pj_mei" ? (
              <InfoBanner icon={Building2} title="Porte identificado: MEI">
                Como você já informou que atua como Pessoa Jurídica — MEI, não repetiremos essa
                pergunta.
              </InfoBanner>
            ) : (
              <ChoiceCards
                id="companySize"
                label="Qual o porte da sua empresa?"
                value={formData.companySize}
                options={COMPANY_SIZE_OPTIONS}
                onChange={(value) => updateField("companySize", value)}
                columns="three"
                required
                error={hasError("companySize")}
              />
            )}

            <ChoiceCards
              id="companyOperatingTime"
              label="Qual o tempo de funcionamento da sua empresa?"
              value={formData.companyOperatingTime}
              options={COMPANY_TIME_OPTIONS}
              onChange={(value) => updateField("companyOperatingTime", value)}
              columns="three"
              required
              error={hasError("companyOperatingTime")}
            />

            {formData.companyOperatingTime === "outro" ? (
              <TextField
                id="companyOperatingTimeOther"
                label="Informe o tempo de funcionamento"
                value={formData.companyOperatingTimeOther}
                onChange={(value) => updateField("companyOperatingTimeOther", value)}
                placeholder="Ex.: 8 anos"
                required
                error={hasError("companyOperatingTimeOther")}
              />
            ) : null}

            <ChoiceCards
              id="companyLocationType"
              label="Onde sua empresa está instalada?"
              value={formData.companyLocationType}
              options={COMPANY_LOCATION_OPTIONS}
              onChange={(value) => updateField("companyLocationType", value)}
              columns="two"
              required
              error={hasError("companyLocationType")}
            />

            {formData.companyLocationType === "fisica" ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_220px]">
                <TextField
                  id="companyCity"
                  label="Município da empresa"
                  value={formData.companyCity}
                  onChange={(value) => updateField("companyCity", value)}
                  placeholder="Ex.: Belo Horizonte"
                  required
                  error={hasError("companyCity")}
                />
                <SelectField
                  id="companyState"
                  label="Estado"
                  value={formData.companyState}
                  options={STATES}
                  onChange={(value) => updateField("companyState", value)}
                  placeholder="Selecione a UF"
                  required
                  error={hasError("companyState")}
                />
              </div>
            ) : null}

            <SelectField
              id="companySegment"
              label="Qual o segmento da sua atividade?"
              value={formData.companySegment}
              options={COMPANY_SEGMENT_OPTIONS}
              onChange={(value) => updateField("companySegment", value)}
              required
              error={hasError("companySegment")}
            />

            {formData.companySegment === "outro" ? (
              <TextField
                id="companySegmentOther"
                label="Qual é o outro segmento?"
                value={formData.companySegmentOther}
                onChange={(value) => updateField("companySegmentOther", value)}
                placeholder="Descreva o segmento"
                required
                error={hasError("companySegmentOther")}
              />
            ) : null}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <TextField
                id="employeeCount"
                label="Quantos colaboradores há na empresa?"
                value={formData.employeeCount}
                onChange={(value) => updateField("employeeCount", value)}
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Inclua zero se não houver"
                required
                error={hasError("employeeCount")}
              />
              <SelectField
                id="revenueRange"
                label="Faixa de faturamento médio anual"
                value={formData.revenueRange}
                options={REVENUE_OPTIONS}
                onChange={(value) => updateField("revenueRange", value)}
                required
                error={hasError("revenueRange")}
              />
            </div>

            <CheckboxCards
              id="salesChannels"
              label="Quais são os canais de venda da empresa?"
              values={formData.salesChannels}
              options={SALES_CHANNEL_OPTIONS}
              onToggle={(value) =>
                updateField(
                  "salesChannels",
                  toggleArrayValue(formData.salesChannels, value),
                )
              }
              columns="two"
              helper="Selecione todos os canais utilizados."
              required
              error={hasError("salesChannels")}
            />

            {formData.salesChannels.includes("outro") ? (
              <TextField
                id="salesChannelOther"
                label="Qual é o outro canal de venda?"
                value={formData.salesChannelOther}
                onChange={(value) => updateField("salesChannelOther", value)}
                placeholder="Descreva o canal"
                required
                error={hasError("salesChannelOther")}
              />
            ) : null}
          </div>
        );

      case "sebrae-relationship": {
        const hasOnline = ["online", "ambos"].includes(formData.courseContact);
        const hasPresencial = ["presencial", "ambos"].includes(formData.courseContact);
        return (
          <div className="space-y-8">
            <ChoiceCards
              id="courseContact"
              label="Você já realizou ou teve contato com algum curso do Sebrae?"
              value={formData.courseContact}
              options={COURSE_CONTACT_OPTIONS}
              onChange={(value) => updateField("courseContact", value)}
              columns="two"
              required
              error={hasError("courseContact")}
            />

            {hasOnline ? (
              <>
                {renderCourseCards()}
                {formData.onlineCourses.includes("outro") ? (
                  <TextField
                    id="onlineCourseOther"
                    label="Qual foi o outro curso online?"
                    value={formData.onlineCourseOther}
                    onChange={(value) => updateField("onlineCourseOther", value)}
                    placeholder="Digite o nome do curso"
                    required
                    error={hasError("onlineCourseOther")}
                  />
                ) : null}
              </>
            ) : null}

            {hasPresencial ? (
              <TextField
                id="presencialCourse"
                label="Qual curso presencial você realizou ou acessou?"
                value={formData.presencialCourse}
                onChange={(value) => updateField("presencialCourse", value)}
                placeholder="Digite o nome do curso"
                required
                error={hasError("presencialCourse")}
              />
            ) : null}

            {formData.courseContact === "nenhum" ? (
              <InfoBanner icon={Sparkles} title="O formulário será encurtado">
                Como você informou que ainda não teve contato com cursos do Sebrae, os blocos de
                avaliação e aplicação serão automaticamente ignorados.
              </InfoBanner>
            ) : null}
          </div>
        );
      }

      case "course-evaluation":
        return (
          <div className="space-y-8">
            <CheckboxCards
              id="courseReasons"
              label="Quais foram os principais motivos da sua busca pelo(s) curso(s)?"
              values={formData.courseReasons}
              options={COURSE_REASON_OPTIONS}
              onToggle={(value) =>
                updateField(
                  "courseReasons",
                  toggleArrayValue(formData.courseReasons, value),
                )
              }
              columns="two"
              helper="Selecione todos os motivos aplicáveis."
              required
              error={hasError("courseReasons")}
            />

            {formData.courseReasons.includes("outro") ? (
              <TextField
                id="courseReasonOther"
                label="Qual foi o outro motivo?"
                value={formData.courseReasonOther}
                onChange={(value) => updateField("courseReasonOther", value)}
                placeholder="Descreva o motivo"
                required
                error={hasError("courseReasonOther")}
              />
            ) : null}

            <div className="space-y-4">
              <LikertQuestion
                id="common.relationship.expectations"
                question="Quanto o(s) curso(s) atendeu/atenderam às suas expectativas?"
                value={formData.responses["common.relationship.expectations"]}
                scale={EXPECTATION_SCALE}
                onChange={(value) => updateResponse("common.relationship.expectations", value)}
                error={hasError("common.relationship.expectations")}
              />
              <LikertQuestion
                id="common.relationship.performance"
                question="Como você avalia o seu desempenho no(s) curso(s)?"
                value={formData.responses["common.relationship.performance"]}
                scale={PERFORMANCE_SCALE}
                onChange={(value) => updateResponse("common.relationship.performance", value)}
                error={hasError("common.relationship.performance")}
              />
              <LikertQuestion
                id="common.relationship.workload"
                question="Quanto você considerou adequada a carga horária do(s) curso(s)?"
                value={formData.responses["common.relationship.workload"]}
                scale={WORKLOAD_SCALE}
                onChange={(value) => updateResponse("common.relationship.workload", value)}
                error={hasError("common.relationship.workload")}
              />
            </div>
          </div>
        );

      case "before-course":
        return (
          <div className="space-y-4">
            <InfoBanner tone="slate">
              Use a mesma referência para todos os itens: como você avaliava sua empresa antes dos
              cursos.
            </InfoBanner>
            {BEFORE_QUESTIONS.map((question, index) => (
              <LikertQuestion
                key={question.id}
                id={question.id}
                question={question.text}
                number={index + 1}
                value={formData.responses[question.id]}
                scale={BEFORE_SCALE}
                onChange={(value) => updateResponse(question.id, value)}
                error={hasError(question.id)}
              />
            ))}
          </div>
        );

      case "application-practice":
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              {APPLICATION_QUESTIONS.map((question, index) => (
                <LikertQuestion
                  key={question.id}
                  id={question.id}
                  question={question.text}
                  number={index + 1}
                  value={formData.responses[question.id]}
                  scale={AGREEMENT_SCALE}
                  onChange={(value) => updateResponse(question.id, value)}
                  error={hasError(question.id)}
                />
              ))}
            </div>

            <CheckboxCards
              id="changesMade"
              label="Quais mudanças foram realizadas com base nos conhecimentos adquiridos?"
              values={formData.changesMade}
              options={CHANGES_OPTIONS}
              onToggle={(value) =>
                updateField(
                  "changesMade",
                  toggleArrayValue(formData.changesMade, value, ["nenhuma_mudanca"]),
                )
              }
              columns="two"
              helper="Selecione todas as mudanças aplicáveis. A opção “Ainda não realizei mudanças” é exclusiva."
              required
              error={hasError("changesMade")}
            />

            {formData.changesMade.includes("outro") ? (
              <TextField
                id="changesMadeOther"
                label="Qual foi a outra mudança?"
                value={formData.changesMadeOther}
                onChange={(value) => updateField("changesMadeOther", value)}
                placeholder="Descreva a mudança"
                required
                error={hasError("changesMadeOther")}
              />
            ) : null}
          </div>
        );

      case "application-areas":
        return (
          <div className="space-y-8">
            <CheckboxCards
              id="affectedAreas"
              label="Quais áreas da empresa foram afetadas pelas mudanças?"
              values={formData.affectedAreas}
              options={AFFECTED_AREA_OPTIONS}
              onToggle={(value) =>
                updateField(
                  "affectedAreas",
                  toggleArrayValue(formData.affectedAreas, value, [
                    "nenhuma",
                    "ainda_nao_percebi",
                  ]),
                )
              }
              columns="two"
              helper="Selecione todas as áreas aplicáveis. “Nenhuma” e “Ainda não foi possível perceber” são opções exclusivas."
              required
              error={hasError("affectedAreas")}
            />

            {formData.affectedAreas.includes("outro") ? (
              <TextField
                id="affectedAreasOther"
                label="Qual foi a outra área afetada?"
                value={formData.affectedAreasOther}
                onChange={(value) => updateField("affectedAreasOther", value)}
                placeholder="Descreva a área"
                required
                error={hasError("affectedAreasOther")}
              />
            ) : null}
          </div>
        );

      case "application-difficulties":
        return (
          <div className="space-y-8">
            <CheckboxCards
              id="applicationDifficulties"
              label="Quais dificuldades você encontrou para aplicar os conhecimentos?"
              values={formData.applicationDifficulties}
              options={DIFFICULTY_OPTIONS}
              onToggle={(value) =>
                updateField(
                  "applicationDifficulties",
                  toggleArrayValue(formData.applicationDifficulties, value, ["nenhuma"]),
                )
              }
              columns="two"
              helper="Selecione todas as alternativas aplicáveis. “Não encontrei dificuldades” é uma opção exclusiva."
              required
              error={hasError("applicationDifficulties")}
            />

            {formData.applicationDifficulties.includes("outro") ? (
              <TextField
                id="applicationDifficultiesOther"
                label="Qual foi a outra dificuldade?"
                value={formData.applicationDifficultiesOther}
                onChange={(value) => updateField("applicationDifficultiesOther", value)}
                placeholder="Descreva a dificuldade"
                required
                error={hasError("applicationDifficultiesOther")}
              />
            ) : null}
          </div>
        );

      case "application-support":
        return (
          <div className="space-y-8">
            <CheckboxCards
              id="supportNeeds"
              label="De que apoio adicional você precisaria para aplicar melhor os conhecimentos?"
              values={formData.supportNeeds}
              options={SUPPORT_OPTIONS}
              onToggle={(value) =>
                updateField(
                  "supportNeeds",
                  toggleArrayValue(formData.supportNeeds, value, ["nenhum", "nao_sei"]),
                )
              }
              columns="two"
              helper="Selecione todas as alternativas aplicáveis. “Não preciso” e “Ainda não sei” são opções exclusivas."
              required
              error={hasError("supportNeeds")}
            />

            {formData.supportNeeds.includes("outro") ? (
              <TextField
                id="supportNeedsOther"
                label="Qual é o outro apoio necessário?"
                value={formData.supportNeedsOther}
                onChange={(value) => updateField("supportNeedsOther", value)}
                placeholder="Descreva o apoio"
                required
                error={hasError("supportNeedsOther")}
              />
            ) : null}
          </div>
        );

      case "results":
        return (
          <div className="space-y-4">
            <InfoBanner tone="slate">
              Complete a frase para cada item: “A partir dos conhecimentos adquiridos, percebo que
              minha empresa melhorou em termos de...”
            </InfoBanner>
            {RESULT_QUESTIONS.map((question, index) => (
              <LikertQuestion
                key={question.id}
                id={question.id}
                question={question.text}
                number={index + 1}
                value={formData.responses[question.id]}
                scale={AGREEMENT_WITH_NA_SCALE}
                onChange={(value) => updateResponse(question.id, value)}
                error={hasError(question.id)}
              />
            ))}
          </div>
        );

      case "specific-course": {
        const course = COURSES.find((item) => item.id === currentPage.courseId);
        if (!course) return null;
        return (
          <div className="space-y-7">
            <InfoBanner icon={course.icon} title={`Sobre o curso ${course.title}`}>
              Considere os conhecimentos adquiridos nesse curso ao responder às afirmativas.
            </InfoBanner>

            {course.dimensions.map((dimension) => (
              <section key={dimension.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
                <SectionHeading title={dimension.title} />
                <div className="space-y-4">
                  {dimension.questions.map((question) => {
                    const responseId = getSpecificQuestionId(course.id, question.id);
                    return (
                      <LikertQuestion
                        key={responseId}
                        id={responseId}
                        question={question.text}
                        number={Number(question.id.replace("q", ""))}
                        value={formData.responses[responseId]}
                        scale={AGREEMENT_WITH_NA_SCALE}
                        onChange={(value) => updateResponse(responseId, value)}
                        error={hasError(responseId)}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        );
      }

      case "review": {
        const selectedCourseLabels = selectedSpecificCourses.map(
          (courseId) => COURSES.find((course) => course.id === courseId)?.title || courseId,
        );
        if (formData.onlineCourses.includes("outro") && formData.onlineCourseOther) {
          selectedCourseLabels.push(formData.onlineCourseOther);
        }

        const summaryItems = [
          {
            label: "Respondente",
            value: `${formData.fullName} · ${isPJ ? "Pessoa Jurídica" : "Pessoa Física"}`,
          },
          {
            label: "Atuação",
            value: getOptionLabel(PROFESSIONAL_AREA_OPTIONS, formData.professionalArea),
          },
          {
            label: "Residência",
            value: `${formData.residenceCity} / ${formData.residenceState}`,
          },
          {
            label: "Relação com o Sebrae",
            value: getOptionLabel(COURSE_CONTACT_OPTIONS, formData.courseContact),
          },
          ...(hasOnlineCourseContact
            ? [
                {
                  label: "Cursos online",
                  value:
                    selectedCourseLabels.length > 0
                      ? selectedCourseLabels.join(", ")
                      : "Nenhum curso selecionado",
                },
              ]
            : []),
          ...(["presencial", "ambos"].includes(formData.courseContact)
            ? [{ label: "Curso presencial", value: formData.presencialCourse }]
            : []),
        ];

        return (
          <div className="space-y-7">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {summaryItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>

            <InfoBanner icon={CheckCircle2} title="Fluxo personalizado concluído">
              Foram exibidos somente os blocos compatíveis com seu perfil, sua relação com o Sebrae e
              os cursos selecionados.
            </InfoBanner>

            <label
              data-field="reviewConfirmed"
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition focus-within:ring-4 focus-within:ring-blue-100 ${
                formData.reviewConfirmed
                  ? "border-[#005AA5] bg-blue-50"
                  : hasError("reviewConfirmed")
                    ? "border-red-400 bg-red-50"
                    : "border-slate-300 bg-white hover:border-blue-300"
              }`}
            >
              <input
                type="checkbox"
                checked={formData.reviewConfirmed}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  updateField("reviewConfirmed", event.target.checked)
                }
                className="sr-only"
              />
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                  formData.reviewConfirmed
                    ? "border-[#005AA5] bg-[#005AA5]"
                    : "border-slate-400 bg-white"
                }`}
                aria-hidden="true"
              >
                {formData.reviewConfirmed ? <Check size={15} className="text-white" /> : null}
              </span>
              <span className="text-sm font-semibold leading-6 text-slate-800">
                Revisei o resumo e desejo enviar minhas respostas.
              </span>
            </label>
            {hasError("reviewConfirmed") ? <FieldError /> : null}

            {submitError ? (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <AlertCircle size={20} className="mt-0.5 shrink-0" />
                <p>{submitError}</p>
              </div>
            ) : null}
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 font-sans text-slate-900">
        <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <section className="w-full rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-12">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={44} aria-hidden="true" />
            </span>
            <h1 className="mt-7 text-3xl font-black tracking-tight text-slate-950">
              Obrigado pela sua contribuição!
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
              Suas respostas foram encaminhadas. A sua experiência ajuda a aperfeiçoar as soluções do
              Sebrae.
            </p>
            <button
              type="button"
              onClick={resetSurvey}
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-[#005AA5] hover:text-[#005AA5] focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <RotateCcw size={18} aria-hidden="true" />
              Iniciar uma nova resposta
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-white">
        <main className="relative isolate overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(0,174,239,0.26),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(0,90,165,0.45),transparent_40%)]" />
          <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
            <section>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#005AA5]">
                  <BriefcaseBusiness size={18} aria-hidden="true" />
                </span>
                Pesquisa Sebrae · 2026
              </div>

              <h1 className="mt-8 max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Sua experiência ajuda a melhorar as soluções para quem empreende.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                O formulário se adapta ao seu perfil e aos cursos selecionados. Você responderá
                somente às perguntas que fazem sentido para a sua realidade.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-slate-200">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <CheckCircle2 size={17} aria-hidden="true" />
                  Fluxo personalizado
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <Clock3 size={17} aria-hidden="true" />
                  Tempo variável conforme os cursos
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  <LockKeyhole size={17} aria-hidden="true" />
                  Rascunho nesta sessão
                </span>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={startSurvey}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-black text-[#005AA5] shadow-xl transition hover:-translate-y-0.5 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-white/30"
                >
                  {hasDraft ? "Continuar preenchimento" : "Iniciar pesquisa"}
                  <ArrowRight size={20} aria-hidden="true" />
                </button>
                {hasDraft ? (
                  <button
                    type="button"
                    onClick={resetSurvey}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-4 text-base font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/20"
                  >
                    <RotateCcw size={19} aria-hidden="true" />
                    Recomeçar
                  </button>
                ) : null}
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
                <img
                  src="https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg"
                  alt="Sebrae"
                  className="h-9 w-auto"
                />
                <div className="h-8 w-px bg-slate-200" />
                <p className="text-xs font-bold uppercase leading-5 tracking-wide text-slate-500">
                  Efetividade das soluções
                </p>
              </div>

              <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-950">
                Como o questionário funciona
              </h2>
              <div className="mt-6 space-y-5">
                {[
                  {
                    icon: UserRound,
                    title: "Perfil",
                    text: "Identificamos se as perguntas devem seguir o fluxo de Pessoa Física ou Jurídica.",
                  },
                  {
                    icon: GraduationCap,
                    title: "Cursos",
                    text: "Os blocos específicos aparecem apenas para os cursos online selecionados.",
                  },
                  {
                    icon: Sparkles,
                    title: "Aplicação e resultados",
                    text: "Perguntas condicionais evitam repetições e alternativas incompatíveis.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#005AA5]">
                        <Icon size={21} aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-900">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  const progress = Math.round(((currentPageIndex + 1) / pages.length) * 100);
  const isFinalPage = currentPage.kind === "review";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src="https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg"
                alt="Sebrae"
                className="h-7 w-auto shrink-0 sm:h-8"
              />
              <div className="hidden h-7 w-px bg-slate-200 sm:block" />
              <p className="hidden truncate text-xs font-bold uppercase tracking-wide text-slate-500 md:block">
                Questionário Núcleo Comum e Customizado
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
              <span className="hidden items-center gap-1.5 sm:inline-flex">
                <Clock3 size={14} aria-hidden="true" />
                {savedAt ? "Rascunho salvo" : "Salvando rascunho"}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 font-bold text-slate-700">
                {currentPageIndex + 1} de {pages.length}
              </span>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#005AA5] transition-all duration-500"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-label="Progresso do questionário"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#005AA5]">
              {currentPage.eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {currentPage.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              {currentPage.description}
            </p>
          </div>

          <div className="px-5 py-6 sm:px-8 sm:py-8">{renderPageContent()}</div>

          <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
            {pageError ? (
              <div
                className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
                role="alert"
              >
                <AlertCircle size={17} className="shrink-0" aria-hidden="true" />
                {pageError}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={isSubmitting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-[#005AA5] hover:text-[#005AA5] focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
              >
                <ArrowLeft size={18} aria-hidden="true" />
                Voltar
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={isSubmitting}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white shadow-lg transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 sm:px-7 ${
                  isFinalPage
                    ? "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-100"
                    : "bg-[#005AA5] hover:bg-[#004b8b] focus:ring-blue-100"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                    Enviando
                  </>
                ) : isFinalPage ? (
                  <>
                    <Send size={18} aria-hidden="true" />
                    Enviar respostas
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight size={18} aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Campos marcados com * são obrigatórios. As perguntas exibidas variam conforme suas
          respostas.
        </p>
      </main>
    </div>
  );
}
