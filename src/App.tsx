import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Cpu,
  Smile,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

/**
 * Mapeamento de Cadeias Produtivas, Vocações Regionais e Efetividade de Soluções do SEBRAE
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

const SURVEY_VERSION = "sebrae-2026-nucleo-comum-customizado-v5-ux-sebrae";
const DRAFT_KEY = "sebrae_questionario_2026_draft_v5_ux_sebrae";
const SEBRAE_LGPD_URL = "https://sebrae.com.br/subsites/lgpd";
const COVER_IMAGE_URL =
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=85";

type IconComponent = typeof AlertCircle;

type CourseId = "financas" | "pessoas" | "atendimento" | "ia" | "emocional";

type ScaleResponse = 1 | 2 | 3 | 4 | 5 | 6 | 7 | "NA";

type PageKind =
  | "identification"
  | "participant-profile"
  | "company-profile"
  | "sebrae-relationship"
  | "course-evaluation"
  | "before-course"
  | "application-practice"
  | "application-changes"
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
  value: ScaleResponse;
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
  icon: IconComponent;
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
  courseFormats: string[];
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

  responses: Record<string, ScaleResponse>;
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
  courseFormats: [],
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

const NON_WORKING_CATEGORY_IDS = ["pf_estudante", "pf_desempregado"];

const worksToday = (professionalCategory: string) =>
  Boolean(professionalCategory) &&
  !NON_WORKING_CATEGORY_IDS.includes(professionalCategory);

const getFirstName = (fullName: string) => {
  const first = fullName.trim().split(/\s+/)[0] || "";
  if (!first) return "";
  return `${first.charAt(0).toLocaleUpperCase("pt-BR")}${first
    .slice(1)
    .toLocaleLowerCase("pt-BR")}`;
};

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

const LIKERT_7_WITH_NA_SCALE: ScaleOption[] = [
  { value: 1, shortLabel: "Discordo totalmente", label: "Discordo totalmente" },
  { value: 2, shortLabel: "Discordo moderadamente", label: "Discordo moderadamente" },
  { value: 3, shortLabel: "Discordo parcialmente", label: "Discordo parcialmente" },
  { value: 4, shortLabel: "Nem concordo, nem discordo", label: "Nem concordo, nem discordo" },
  { value: 5, shortLabel: "Concordo parcialmente", label: "Concordo parcialmente" },
  { value: 6, shortLabel: "Concordo moderadamente", label: "Concordo moderadamente" },
  { value: 7, shortLabel: "Concordo totalmente", label: "Concordo totalmente" },
  { value: "NA", shortLabel: "Não se aplica à minha realidade", label: "Não se aplica à minha realidade" },
];

const PROFESSIONAL_CATEGORY_OPTIONS: OptionItem[] = [
  { value: "pf_autonomo", label: "Trabalho por conta própria" },
  { value: "pf_liberal", label: "Sou profissional liberal" },
  { value: "pf_empregado_formal", label: "Trabalho com carteira assinada" },
  { value: "pf_empregado_informal", label: "Trabalho sem carteira assinada" },
  { value: "pf_estudante", label: "Sou estudante e não trabalho" },
  { value: "pf_desempregado", label: "No momento, não estou trabalhando" },
  {
    value: "pj_mei",
    label: "Sou MEI",
    description: "Meu negócio tem CNPJ de Microempreendedor Individual.",
  },
  {
    value: "pj_outros",
    label: "Tenho uma empresa que não é MEI",
    description: "Meu negócio tem outro tipo de CNPJ.",
  },
];

const PROFESSIONAL_AREA_OPTIONS: OptionItem[] = [
  { value: "agronegocio", label: "Agronegócio" },
  { value: "comercio", label: "Comércio" },
  { value: "industria", label: "Indústria" },
  { value: "servicos", label: "Serviços" },
  { value: "setor_publico", label: "Setor público" },
  { value: "tecnologia_inovacao", label: "Tecnologia e inovação" },
  { value: "economia_criativa", label: "Economia criativa" },
  { value: "turismo_gastronomia", label: "Turismo, gastronomia e hospitalidade" },
  { value: "educacao_pesquisa", label: "Educação e pesquisa" },
  { value: "profissional_liberal", label: "Atividade profissional liberal" },
  { value: "outro", label: "Outra área" },
];

const PREVIOUS_EXPERIENCE_OPTIONS: OptionItem[] = [
  { value: "agronegocio", label: "Agronegócio" },
  { value: "comercio", label: "Comércio" },
  { value: "industria", label: "Indústria" },
  { value: "servicos", label: "Serviços" },
  { value: "setor_publico", label: "Setor público" },
  { value: "tecnologia_inovacao", label: "Tecnologia e inovação" },
  { value: "economia_criativa", label: "Economia criativa (design, moda, audiovisual, artes etc.)" },
  { value: "turismo_gastronomia", label: "Turismo, gastronomia e hospitalidade" },
  { value: "educacao_pesquisa", label: "Educação e pesquisa" },
  { value: "profissional_liberal", label: "Atividade profissional liberal" },
  { value: "sem_experiencia", label: "Nunca tive experiência como empreendedor" },
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
    description: "A empresa funciona sem um local físico para atendimento.",
  },
  {
    value: "fisica",
    label: "Empresa física",
    description: "A empresa funciona em um endereço físico.",
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
  { value: "ecommerce", label: "Loja virtual própria" },
  { value: "marketplace", label: "Plataformas de venda, como Mercado Livre, Amazon e Shopee" },
  { value: "redes_sociais", label: "Redes sociais (Instagram, Facebook, WhatsApp Business etc.)" },
  { value: "apps_entrega", label: "Aplicativos de entrega (iFood, Rappi, Uber Eats etc.)" },
  { value: "telefone_whatsapp", label: "Vendas por telefone ou WhatsApp" },
  { value: "representantes", label: "Representantes comerciais ou vendedores externos" },
  { value: "feiras_eventos", label: "Feiras, eventos e exposições" },
  { value: "porta_a_porta", label: "Venda direta ao consumidor (porta a porta)" },
  { value: "b2b", label: "Venda para outras empresas" },
  { value: "governo", label: "Venda para órgãos públicos (licitações e contratos)" },
  { value: "outro", label: "Outros" },
];

const COURSE_CONTACT_OPTIONS: OptionItem[] = [
  { value: "sim", label: "Sim" },
  { value: "nenhum", label: "Não" },
];

const COURSE_FORMAT_OPTIONS: OptionItem[] = [
  {
    value: "online",
    label: "Online",
    description: "Fiz o curso pela internet.",
  },
  {
    value: "presencial",
    label: "Presencial",
    description: "Participei do curso em um local físico.",
  },
];

const COURSE_REASON_OPTIONS: OptionItem[] = [
  { value: "abrir_negocio", label: "Abrir um negócio" },
  { value: "melhorar_gestao", label: "Melhorar a gestão do meu negócio" },
  { value: "aumentar_vendas", label: "Aumentar minhas vendas e faturamento" },
  { value: "competencias", label: "Desenvolver novas habilidades profissionais" },
  { value: "atualizar", label: "Atualizar meus conhecimentos" },
  {
    value: "resolver_problema",
    label: "Resolver um problema específico do meu negócio ou da minha atividade profissional",
  },
  { value: "inovar", label: "Inovar ou desenvolver novos produtos e serviços" },
  { value: "empregabilidade", label: "Melhorar minhas chances de conseguir trabalho" },
  { value: "nova_area", label: "Aprender para trabalhar em uma nova área" },
  { value: "empresa_trabalho", label: "Atender às necessidades da empresa em que trabalho" },
  { value: "indicacao", label: "Recebi indicação do Sebrae ou de terceiros" },
  { value: "gratuito", label: "O curso era gratuito ou acessível" },
  { value: "outro", label: "Outro motivo" },
];

const CHANGES_OPTIONS: OptionItem[] = [
  { value: "competencias", label: "Melhorei meus conhecimentos e competências profissionais" },
  { value: "novas_ferramentas", label: "Passei a usar novas ferramentas, técnicas ou formas de trabalho" },
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
  { value: "networking", label: "Ampliei minha rede de contatos profissionais" },
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
  { value: "networking", label: "Oportunidades para criar contatos e parcerias" },
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

interface IBGEMunicipality {
  id: number;
  nome: string;
}

interface MunicipalityLookup {
  options: OptionItem[];
  loading: boolean;
  error: string;
  retry: () => void;
}

const MUNICIPALITY_API_URL =
  "https://servicodados.ibge.gov.br/api/v1/localidades/estados";
const municipalityCache = new Map<string, OptionItem[]>();

function useMunicipalities(uf: string): MunicipalityLookup {
  const [options, setOptions] = useState<OptionItem[]>(() =>
    uf ? municipalityCache.get(uf) || [] : [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    setError("");

    if (!uf) {
      setOptions([]);
      setLoading(false);
      return;
    }

    const cached = municipalityCache.get(uf);
    if (cached) {
      setOptions(cached);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    setOptions([]);
    setLoading(true);

    fetch(`${MUNICIPALITY_API_URL}/${encodeURIComponent(uf)}/municipios?orderBy=nome`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Falha ao consultar os municípios");
        return response.json() as Promise<IBGEMunicipality[]>;
      })
      .then((municipalities) => {
        if (!Array.isArray(municipalities)) {
          throw new Error("Resposta inválida da lista de municípios");
        }

        const nextOptions = municipalities
          .filter(
            (municipality) =>
              municipality &&
              typeof municipality.id === "number" &&
              typeof municipality.nome === "string",
          )
          .map((municipality) => ({
            value: municipality.nome,
            label: municipality.nome,
          }));

        if (nextOptions.length === 0) {
          throw new Error("A lista de municípios veio vazia");
        }

        municipalityCache.set(uf, nextOptions);
        if (active) setOptions(nextOptions);
      })
      .catch((fetchError: unknown) => {
        const errorName = fetchError instanceof Error ? fetchError.name : "";
        if (active && errorName !== "AbortError") {
          setError("Não foi possível carregar os municípios.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [requestVersion, uf]);

  const retry = () => {
    if (uf) municipalityCache.delete(uf);
    setRequestVersion((current) => current + 1);
  };

  return { options, loading, error, retry };
}

const BEFORE_QUESTIONS: SurveyQuestion[] = [
  {
    id: "common.before.planning",
    text: "Antes dos cursos, minha empresa tinha um bom planejamento.",
  },
  {
    id: "common.before.financial_control",
    text: "Antes dos cursos, minha empresa tinha um bom controle financeiro.",
  },
  {
    id: "common.before.market",
    text: "Antes dos cursos, minha empresa conhecia bem o mercado em que atuava.",
  },
  {
    id: "common.before.technology",
    text: "Antes dos cursos, minha empresa usava tecnologia de forma adequada.",
  },
  {
    id: "common.before.processes",
    text: "Antes dos cursos, os processos da empresa eram bem organizados.",
  },
  {
    id: "common.before.people",
    text: "Antes dos cursos, a gestão de pessoas da empresa era adequada.",
  },
  {
    id: "common.before.quality",
    text: "Antes dos cursos, a empresa cuidava bem da qualidade.",
  },
  {
    id: "common.before.crisis",
    text: "Antes dos cursos, a empresa estava preparada para enfrentar crises.",
  },
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
  { id: "common.results.sales", text: "Depois dos cursos, as vendas da empresa melhoraram." },
  { id: "common.results.clients", text: "Depois dos cursos, o número de clientes aumentou." },
  { id: "common.results.revenue", text: "Depois dos cursos, o faturamento da empresa aumentou." },
  { id: "common.results.costs", text: "Depois dos cursos, a empresa reduziu custos." },
  { id: "common.results.processes", text: "Depois dos cursos, os processos da empresa melhoraram." },
  { id: "common.results.innovation", text: "Depois dos cursos, a empresa passou a inovar mais." },
  { id: "common.results.quality", text: "Depois dos cursos, a qualidade melhorou." },
  { id: "common.results.services", text: "Depois dos cursos, os serviços prestados melhoraram." },
  { id: "common.results.team", text: "Depois dos cursos, o desempenho da equipe melhorou." },
  { id: "common.results.confidence", text: "Depois dos cursos, aumentou minha confiança no negócio." },
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
    title: "Inteligência Artificial (IA) na Prática para Pequenos Negócios",
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
    icon: Star,
    dimensions: [
      {
        id: "desenvolvimento_de_capacidades_empreendedoras",
        title: "Desenvolvimento de capacidades empreendedoras",
        questions: [
          { id: "q01", text: "O curso aumentou minha confiança para empreender." },
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
        courseFormats: parsed.data.courseFormats || [],
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
    add(!Object.prototype.hasOwnProperty.call(data.responses, id), id, label);

  switch (page.kind) {
    case "identification": {
      add(!validateCPF(data.cpf), "cpf", "Informe um CPF válido");
      add(!isFilled(data.fullName), "fullName", "Informe seu nome completo");
      add(!validateEmail(data.email), "email", "Informe um e-mail válido");
      add(
        data.phone.replace(/\D/g, "").length < 10,
        "phone",
        "Informe um telefone válido",
      );
      add(!data.gender, "gender", "Escolha seu gênero");
      add(
        data.gender === "outro" && !isFilled(data.genderOther),
        "genderOther",
        "Informe como prefere descrever seu gênero",
      );
      add(!data.ageRange, "ageRange", "Escolha sua faixa de idade");
      add(!data.residenceState, "residenceState", "Escolha seu estado");
      add(
        Boolean(data.residenceState) && !isFilled(data.residenceCity),
        "residenceCity",
        "Escolha seu município",
      );
      break;
    }

    case "participant-profile": {
      add(
        !data.professionalCategory,
        "professionalCategory",
        "Escolha a opção que melhor descreve você hoje",
      );

      if (worksToday(data.professionalCategory)) {
        add(!data.professionalArea, "professionalArea", "Escolha sua área de trabalho");
        add(
          data.professionalArea === "outro" && !isFilled(data.professionalAreaOther),
          "professionalAreaOther",
          "Informe a outra área de trabalho",
        );
        add(
          !isFilled(data.yearsInCurrentArea),
          "yearsInCurrentArea",
          "Informe há quanto tempo você está nessa área",
        );
      }

      add(
        !data.previousEntrepreneurialArea,
        "previousEntrepreneurialArea",
        "Informe se você já teve experiência como empreendedor",
      );
      add(
        data.previousEntrepreneurialArea === "outro" &&
          !isFilled(data.previousEntrepreneurialAreaOther),
        "previousEntrepreneurialAreaOther",
        "Informe a outra área da experiência",
      );
      break;
    }

    case "company-profile": {
      add(
        data.professionalCategory !== "pj_mei" && !data.companySize,
        "companySize",
        "Escolha o porte da empresa",
      );
      add(
        !data.companyOperatingTime,
        "companyOperatingTime",
        "Escolha há quanto tempo a empresa funciona",
      );
      add(
        data.companyOperatingTime === "outro" && !isFilled(data.companyOperatingTimeOther),
        "companyOperatingTimeOther",
        "Informe o tempo de funcionamento",
      );
      add(!data.companyLocationType, "companyLocationType", "Escolha como a empresa funciona");
      add(
        data.companyLocationType === "fisica" && !data.companyState,
        "companyState",
        "Escolha o estado da empresa",
      );
      add(
        data.companyLocationType === "fisica" &&
          Boolean(data.companyState) &&
          !isFilled(data.companyCity),
        "companyCity",
        "Escolha o município da empresa",
      );
      add(!data.companySegment, "companySegment", "Escolha o segmento da empresa");
      add(
        data.companySegment === "outro" && !isFilled(data.companySegmentOther),
        "companySegmentOther",
        "Descreva o outro segmento",
      );
      add(!isFilled(data.employeeCount), "employeeCount", "Informe o número de colaboradores");
      add(!data.revenueRange, "revenueRange", "Escolha a faixa de faturamento");
      add(data.salesChannels.length === 0, "salesChannels", "Marque pelo menos um canal de venda");
      add(
        data.salesChannels.includes("outro") && !isFilled(data.salesChannelOther),
        "salesChannelOther",
        "Descreva o outro canal de venda",
      );
      break;
    }

    case "sebrae-relationship": {
      add(!data.courseContact, "courseContact", "Informe se você já fez curso do Sebrae");
      const hasCourse = data.courseContact === "sim";
      const hasOnline = data.courseFormats.includes("online");
      const hasPresencial = data.courseFormats.includes("presencial");
      add(
        hasCourse && data.courseFormats.length === 0,
        "courseFormats",
        "Escolha como você fez o curso",
      );
      add(
        hasCourse && hasOnline && data.onlineCourses.length === 0,
        "onlineCourses",
        "Marque pelo menos um curso online",
      );
      add(
        hasCourse && hasPresencial && !isFilled(data.presencialCourse),
        "presencialCourse",
        "Informe o nome do curso presencial",
      );
      break;
    }

    case "course-evaluation": {
      add(data.courseReasons.length === 0, "courseReasons", "Marque pelo menos um motivo");
      add(
        data.courseReasons.includes("outro") && !isFilled(data.courseReasonOther),
        "courseReasonOther",
        "Descreva o outro motivo",
      );
      requireResponse("common.relationship.expectations", "Avalie suas expectativas");
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
      break;
    }

    case "application-changes": {
      add(data.changesMade.length === 0, "changesMade", "Marque pelo menos uma mudança");
      add(
        data.changesMade.includes("outro") && !isFilled(data.changesMadeOther),
        "changesMadeOther",
        "Descreva a outra mudança",
      );
      break;
    }

    case "application-areas": {
      add(data.affectedAreas.length === 0, "affectedAreas", "Marque pelo menos uma área");
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
        "Marque pelo menos uma opção",
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
      add(data.supportNeeds.length === 0, "supportNeeds", "Marque pelo menos uma opção");
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
      Confira este campo.
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
        required={required}
        placeholder={placeholder}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        className={`min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-red-500 focus:border-red-600 focus:ring-red-100"
            : "border-slate-300 focus:border-[#2F55D4] focus:ring-blue-100"
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
  disabled?: boolean;
  loading?: boolean;
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Selecione uma opção",
  disabled = false,
  loading = false,
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
        required={required}
        disabled={disabled}
        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        className={`min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${
          error
            ? "border-red-500 focus:border-red-600 focus:ring-red-100"
            : "border-slate-300 focus:border-[#2F55D4] focus:ring-blue-100"
        }`}
        aria-invalid={error || undefined}
        aria-busy={loading || undefined}
        aria-describedby={helper ? `${id}-helper` : undefined}
      >
        <option value="">{loading ? "Carregando municípios..." : placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helper ? (
        <p id={`${id}-helper`} className="mt-2 text-sm text-slate-500">
          {helper}
        </p>
      ) : null}
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
                  ? "border-[#2F55D4] bg-blue-50 text-[#1F3FB4] shadow-sm"
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
                  selected ? "border-[#2F55D4] bg-[#2F55D4]" : "border-slate-400 bg-white"
                }`}
                aria-hidden="true"
              >
                {selected ? <span className="text-xs font-black leading-none text-white">✓</span> : null}
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
                  ? "border-[#2F55D4] bg-blue-50 text-[#1F3FB4]"
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
                  selected ? "border-[#2F55D4] bg-[#2F55D4]" : "border-slate-400 bg-white"
                }`}
                aria-hidden="true"
              >
                {selected ? <span className="text-xs font-black leading-none text-white">✓</span> : null}
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
  value?: ScaleResponse;
  scale: ScaleOption[];
  onChange: (value: ScaleResponse) => void;
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
  const scoredOptions = scale.filter((option) => typeof option.value === "number");
  const notApplicableOptions = scale.filter((option) => typeof option.value !== "number");

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

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {scoredOptions.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={String(option.value)}
              className={`flex min-h-14 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition focus-within:ring-4 focus-within:ring-blue-100 lg:min-h-24 lg:flex-col lg:justify-center lg:text-center ${
                selected
                  ? "border-[#2F55D4] bg-[#2F55D4] text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
              }`}
              title={`${option.value} — ${option.label}`}
            >
              <input
                type="radio"
                name={id}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                className={`flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-sm font-black ${
                  selected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                }`}
                aria-hidden="true"
              >
                {option.value}
              </span>
              <span className="text-xs font-semibold leading-4">{option.shortLabel}</span>
            </label>
          );
        })}
      </div>

      {notApplicableOptions.length > 0 ? (
        <div className="mt-2 grid gap-2">
          {notApplicableOptions.map((option) => {
            const selected = value === option.value;
            return (
              <label
                key={String(option.value)}
                className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-center transition focus-within:ring-4 focus-within:ring-blue-100 ${
                  selected
                    ? "border-[#2F55D4] bg-[#2F55D4] text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
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
                <span className="text-sm font-semibold leading-5">{option.shortLabel}</span>
              </label>
            );
          })}
        </div>
      ) : null}

      {error ? <FieldError /> : null}
    </fieldset>
  );
}

interface InfoBannerProps {
  icon?: IconComponent;
  title?: string;
  children: React.ReactNode;
  tone?: "blue" | "slate" | "amber";
}

function InfoBanner({ icon: Icon = CheckCircle2, title, children, tone = "blue" }: InfoBannerProps) {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const firstName = useMemo(() => getFirstName(formData.fullName), [formData.fullName]);
  const isPJ = formData.professionalCategory.startsWith("pj_");
  const isWorkingToday = worksToday(formData.professionalCategory);
  const hasCourse = formData.courseContact === "sim";
  const hasOnlineCourseContact = formData.courseFormats.includes("online");
  const hasPresencialCourseContact = formData.courseFormats.includes("presencial");
  const residenceMunicipalities = useMunicipalities(formData.residenceState);
  const companyMunicipalities = useMunicipalities(
    isPJ && formData.companyLocationType === "fisica" ? formData.companyState : "",
  );
  const residenceCityOptions = useMemo(() => {
    if (
      formData.residenceCity &&
      !residenceMunicipalities.options.some(
        (option) => option.value === formData.residenceCity,
      )
    ) {
      return [
        { value: formData.residenceCity, label: formData.residenceCity },
        ...residenceMunicipalities.options,
      ];
    }
    return residenceMunicipalities.options;
  }, [formData.residenceCity, residenceMunicipalities.options]);
  const companyCityOptions = useMemo(() => {
    if (
      formData.companyCity &&
      !companyMunicipalities.options.some((option) => option.value === formData.companyCity)
    ) {
      return [
        { value: formData.companyCity, label: formData.companyCity },
        ...companyMunicipalities.options,
      ];
    }
    return companyMunicipalities.options;
  }, [companyMunicipalities.options, formData.companyCity]);
  const selectedSpecificCourses = useMemo(
    () =>
      formData.onlineCourses.filter((courseId): courseId is CourseId =>
        COURSE_IDS.includes(courseId as CourseId),
      ),
    [formData.onlineCourses],
  );
  const selectedCourseNames = useMemo(() => {
    const names = selectedSpecificCourses.map(
      (courseId) => COURSES.find((course) => course.id === courseId)?.title || courseId,
    );

    if (hasPresencialCourseContact && isFilled(formData.presencialCourse)) {
      formData.presencialCourse
        .split(/[,\n;]/)
        .map((name) => name.trim())
        .filter(Boolean)
        .forEach((name) => names.push(name));
    }

    return names;
  }, [formData.presencialCourse, hasPresencialCourseContact, selectedSpecificCourses]);

  const pages = useMemo<SurveyPage[]>(() => {
    const name = firstName || "Você";
    const result: SurveyPage[] = [
      {
        id: "identification",
        kind: "identification",
        eyebrow: "Identificação",
        title: "Diga quem é você",
        description: "Preencha seus dados para registrar a resposta e identificar sua região.",
      },
      {
        id: "participant-profile",
        kind: "participant-profile",
        eyebrow: "Sobre você",
        title: `${name}, conte como está sua vida profissional`,
        description: "Vamos fazer somente as perguntas que fazem sentido para sua situação atual.",
      },
    ];

    if (isPJ) {
      result.push({
        id: "company-profile",
        kind: "company-profile",
        eyebrow: "Sobre a empresa",
        title: `${name}, conte sobre sua empresa`,
        description: "Estas informações ajudam o Sebrae a entender o perfil do seu negócio.",
      });
    }

    result.push({
      id: "sebrae-relationship",
      kind: "sebrae-relationship",
      eyebrow: "Cursos do Sebrae",
      title: `${name}, conte quais cursos você fez`,
      description: "Primeiro diga se já fez um curso. Depois, informe se foi online ou presencial.",
    });

    if (hasCourse) {
      result.push({
        id: "course-evaluation",
        kind: "course-evaluation",
        eyebrow: "Motivos e avaliação",
        title: `${name}, por que você fez esses cursos?`,
        description: "Veja os cursos informados e conte o que levou você a escolhê-los.",
      });

      if (isPJ) {
        result.push({
          id: "before-course",
          kind: "before-course",
          eyebrow: "Antes dos cursos",
          title: `${name}, como estava a empresa antes?`,
          description: "Pense na situação da empresa antes de fazer os cursos.",
        });
      }

      result.push(
        {
          id: "application-practice",
          kind: "application-practice",
          eyebrow: "Uso do aprendizado",
          title: `${name}, você colocou o conteúdo em prática?`,
          description: "Conte se conseguiu usar o que aprendeu.",
        },
        {
          id: "application-changes",
          kind: "application-changes",
          eyebrow: "Mudanças depois dos cursos",
          title: `${name}, o que mudou depois dos cursos?`,
          description: "Marque as mudanças que aconteceram depois do aprendizado.",
        },
      );

      if (isPJ) {
        result.push({
          id: "application-areas",
          kind: "application-areas",
          eyebrow: "Áreas da empresa",
          title: `${name}, em quais áreas a empresa mudou?`,
          description: "Marque as áreas afetadas pelas mudanças.",
        });
      }

      result.push(
        {
          id: "application-difficulties",
          kind: "application-difficulties",
          eyebrow: "Dificuldades",
          title: `${name}, o que dificultou a aplicação?`,
          description: "Marque tudo o que dificultou usar o conteúdo.",
        },
        {
          id: "application-support",
          kind: "application-support",
          eyebrow: "Próximos apoios",
          title: `${name}, que apoio ajudaria agora?`,
          description: "Marque o apoio que ajudaria você a avançar.",
        },
      );

      if (isPJ) {
        result.push({
          id: "results",
          kind: "results",
          eyebrow: "Resultados percebidos",
          title: `${name}, quais resultados você percebeu?`,
          description: "Avalie as mudanças percebidas na empresa depois dos cursos.",
        });
      }

      if (hasOnlineCourseContact) {
        selectedSpecificCourses.forEach((courseId) => {
          const course = COURSES.find((item) => item.id === courseId);
          if (!course) return;
          result.push({
            id: `specific-${courseId}`,
            kind: "specific-course",
            eyebrow: "Perguntas do curso",
            title: `${name}, avalie ${course.title}`,
            description:
              "Escolha de 1 a 7. Use “Não se aplica à minha realidade” quando for necessário.",
            courseId,
          });
        });
      }
    }

    result.push({
      id: "review",
      kind: "review",
      eyebrow: "Revisão final",
      title: `${name}, confira suas respostas`,
      description: "Leia o resumo. Use “Voltar” para corrigir alguma informação.",
    });

    return result;
  }, [firstName, hasCourse, hasOnlineCourseContact, isPJ, selectedSpecificCourses]);

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

  const updateProfessionalCategory = (value: string) => {
    setFormData((previous) => {
      const doesNotWork = !worksToday(value);
      return {
        ...previous,
        professionalCategory: value,
        professionalArea: doesNotWork ? "" : previous.professionalArea,
        professionalAreaOther: doesNotWork ? "" : previous.professionalAreaOther,
        yearsInCurrentArea: doesNotWork ? "" : previous.yearsInCurrentArea,
      };
    });
  };

  const updateCourseExperience = (value: string) => {
    setFormData((previous) => ({
      ...previous,
      courseContact: value,
      courseFormats: value === "sim" ? previous.courseFormats : [],
      onlineCourses: value === "sim" ? previous.onlineCourses : [],
      onlineCourseOther: "",
      presencialCourse: value === "sim" ? previous.presencialCourse : "",
      courseReasons: value === "sim" ? previous.courseReasons : [],
      courseReasonOther: value === "sim" ? previous.courseReasonOther : "",
      changesMade: value === "sim" ? previous.changesMade : [],
      changesMadeOther: value === "sim" ? previous.changesMadeOther : "",
      affectedAreas: value === "sim" ? previous.affectedAreas : [],
      affectedAreasOther: value === "sim" ? previous.affectedAreasOther : "",
      applicationDifficulties:
        value === "sim" ? previous.applicationDifficulties : [],
      applicationDifficultiesOther:
        value === "sim" ? previous.applicationDifficultiesOther : "",
      supportNeeds: value === "sim" ? previous.supportNeeds : [],
      supportNeedsOther: value === "sim" ? previous.supportNeedsOther : "",
    }));
  };

  const toggleCourseFormat = (format: string) => {
    setFormData((previous) => {
      const courseFormats = toggleArrayValue(previous.courseFormats, format);
      return {
        ...previous,
        courseFormats,
        onlineCourses: courseFormats.includes("online") ? previous.onlineCourses : [],
        onlineCourseOther: "",
        presencialCourse: courseFormats.includes("presencial")
          ? previous.presencialCourse
          : "",
      };
    });
  };

  const updateResidenceState = (state: string) => {
    setFormData((previous) => ({
      ...previous,
      residenceState: state,
      residenceCity: previous.residenceState === state ? previous.residenceCity : "",
    }));
  };

  const updateCompanyState = (state: string) => {
    setFormData((previous) => ({
      ...previous,
      companyState: state,
      companyCity: previous.companyState === state ? previous.companyCity : "",
    }));
  };

  const updateResponse = (id: string, value: ScaleResponse) => {
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

      const normalizedCourseContact = !hasCourse
        ? "nenhum"
        : hasOnlineCourseContact && hasPresencialCourseContact
          ? "ambos"
          : hasOnlineCourseContact
            ? "online"
            : "presencial";
      const normalizedOnlineCourses = hasOnlineCourseContact ? formData.onlineCourses : [];
      const legacyCourses = normalizedOnlineCourses.map((courseId) =>
        courseId === "outro" ? "outros" : courseId,
      );
      const activeResponseLabels = Object.fromEntries(
        Object.entries(activeResponses).map(([id, response]) => [
          id,
          LIKERT_7_WITH_NA_SCALE.find((option) => option.value === response)?.label ?? String(response),
        ]),
      );

      const payload = {
        ...formData,
        professionalArea: isWorkingToday ? formData.professionalArea : "",
        professionalAreaOther: isWorkingToday ? formData.professionalAreaOther : "",
        yearsInCurrentArea: isWorkingToday ? formData.yearsInCurrentArea : "",
        courseExperience: formData.courseContact,
        courseContact: normalizedCourseContact,
        courseFormats: hasCourse ? formData.courseFormats : [],
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
        onlineCourseOther: "",
        presencialCourse: hasPresencialCourseContact ? formData.presencialCourse : "",
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
        responseLabels: activeResponseLabels,
        responseScale: {
          type: "Likert de concordância",
          points: 7,
          notApplicableValue: "NA",
          options: LIKERT_7_WITH_NA_SCALE.map((option) => ({
            value: option.value,
            label: option.label,
          })),
        },

        // Campos de compatibilidade com o payload do código anterior.
        genero: formData.gender,
        cursos: legacyCourses,
        raca: "",
        quilombola: "",
        pcd: "",
        tiposPcd: [],

        questionnaireVersion: SURVEY_VERSION,
        respondentType: isPJ ? "PJ" : "PF",
        selectedCourseTitles: selectedCourseNames,
        firstName,
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
          : `Faltam ${missing.length} respostas obrigatórias nesta etapa.`,
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
      <FieldLabel label="Quais destes cursos online você fez?" required />
      <p className="mb-4 text-sm text-slate-500">Marque um ou mais cursos.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COURSES.map((course) => {
          const selected = formData.onlineCourses.includes(course.id);
          const Icon = course.icon;
          return (
            <label
              key={course.id}
              className={`flex min-h-32 cursor-pointer flex-col justify-between rounded-2xl border p-4 transition focus-within:ring-4 focus-within:ring-blue-100 ${
                selected
                  ? "border-[#2F55D4] bg-[#F1F5FF] text-[#1F3FB4] shadow-sm"
                  : hasError("onlineCourses")
                    ? "border-red-300 hover:border-red-400"
                    : "border-[#D8E0F0] hover:border-[#91A7EA] hover:bg-[#F7F9FF]"
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
                <span className="rounded-xl bg-white p-2 text-[#2F55D4] shadow-sm">
                  <Icon size={24} aria-hidden="true" />
                </span>
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                    selected
                      ? "border-[#2F55D4] bg-[#2F55D4]"
                      : "border-slate-300 bg-white"
                  }`}
                  aria-hidden="true"
                >
                  {selected ? (
                    <span className="text-xs font-black leading-none text-white">✓</span>
                  ) : null}
                </span>
              </div>
              <span className="mt-4 text-sm font-bold leading-5">{course.title}</span>
            </label>
          );
        })}
      </div>
      {hasError("onlineCourses") ? <FieldError /> : null}
    </div>
  );

  const renderPageContent = () => {
    switch (currentPage.kind) {
      case "identification":
        return (
          <div className="space-y-8">
            <InfoBanner icon={CheckCircle2} title="Seus dados estão protegidos">
              Os dados desta pesquisa serão tratados pelo Sebrae conforme a Lei Geral de
              Proteção de Dados. {" "}
              <a
                href={SEBRAE_LGPD_URL}
                target="_blank"
                rel="noreferrer"
                className="font-bold underline decoration-blue-300 underline-offset-4 hover:text-[#1F3FB4]"
              >
                Saiba como o Sebrae protege seus dados.
              </a>
            </InfoBanner>

            <section className="space-y-5">
              <SectionHeading
                title="Seus dados"
                description="Todos os campos desta página são obrigatórios."
              />
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

              {firstName ? (
                <p className="rounded-xl bg-[#F1F5FF] px-4 py-3 text-sm font-semibold text-[#1F3FB4]">
                  Prazer, {firstName}. Agora complete os dados abaixo.
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-[#D8E0F0] bg-[#F7F9FF] p-5 sm:p-6">
              <SectionHeading
                title="Como podemos falar com você?"
                description="Informe um e-mail e um telefone válidos."
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
                  required
                  error={hasError("email")}
                />
                <TextField
                  id="phone"
                  label="Telefone ou WhatsApp"
                  value={formData.phone}
                  onChange={(value) => updateField("phone", maskPhone(value))}
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  error={hasError("phone")}
                />
              </div>
            </section>

            <section className="space-y-6">
              <SectionHeading
                title="Um pouco mais sobre você"
                description="Essas respostas ajudam o Sebrae a entender quem participa."
              />

              <ChoiceCards
                id="gender"
                label="Qual é o seu gênero?"
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
                label="Qual é a sua faixa de idade?"
                value={formData.ageRange}
                options={AGE_OPTIONS}
                onChange={(value) => updateField("ageRange", value)}
                columns="three"
                required
                error={hasError("ageRange")}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-[220px_1fr]">
                <SelectField
                  id="residenceState"
                  label="1. Estado onde você mora"
                  value={formData.residenceState}
                  options={STATES}
                  onChange={updateResidenceState}
                  placeholder="Escolha o estado"
                  required
                  error={hasError("residenceState")}
                />

                {residenceMunicipalities.error ? (
                  <div>
                    <TextField
                      id="residenceCity"
                      label="2. Município onde você mora"
                      value={formData.residenceCity}
                      onChange={(value) => updateField("residenceCity", value)}
                      placeholder="Digite o município"
                      autoComplete="address-level2"
                      helper="A lista não carregou. Digite o município ou tente novamente."
                      required
                      error={hasError("residenceCity")}
                    />
                    <button
                      type="button"
                      onClick={residenceMunicipalities.retry}
                      className="mt-2 text-sm font-bold text-[#2F55D4] underline decoration-blue-200 underline-offset-4 hover:text-[#1F3FB4] focus:outline-none focus:ring-4 focus:ring-blue-100"
                    >
                      Tentar carregar os municípios
                    </button>
                  </div>
                ) : (
                  <SelectField
                    id="residenceCity"
                    label="2. Município onde você mora"
                    value={formData.residenceCity}
                    options={residenceCityOptions}
                    onChange={(value) => updateField("residenceCity", value)}
                    placeholder={
                      formData.residenceState
                        ? "Escolha o município"
                        : "Escolha o estado primeiro"
                    }
                    disabled={!formData.residenceState || residenceMunicipalities.loading}
                    loading={residenceMunicipalities.loading}
                    helper={
                      formData.residenceState
                        ? "A lista mostra apenas os municípios do estado escolhido."
                        : "Primeiro, escolha o estado."
                    }
                    required
                    error={hasError("residenceCity")}
                  />
                )}
              </div>
            </section>
          </div>
        );

      case "participant-profile":
        return (
          <div className="space-y-8">
            <ChoiceCards
              id="professionalCategory"
              label={`${firstName || "Você"}, qual opção descreve melhor sua situação hoje?`}
              value={formData.professionalCategory}
              options={PROFESSIONAL_CATEGORY_OPTIONS}
              onChange={updateProfessionalCategory}
              columns="two"
              required
              error={hasError("professionalCategory")}
            />

            {formData.professionalCategory && !isWorkingToday ? (
              <InfoBanner
                tone="slate"
                title={firstName ? `Entendi, ${firstName}.` : "Entendi."}
              >
                Como você não está trabalhando agora, vamos pular as perguntas sobre área e tempo de trabalho.
              </InfoBanner>
            ) : null}

            {isWorkingToday ? (
              <section className="rounded-2xl border border-[#D8E0F0] bg-[#F7F9FF] p-5 sm:p-6">
                <SectionHeading title="Sobre seu trabalho atual" />
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <SelectField
                    id="professionalArea"
                    label="Em qual área você trabalha?"
                    value={formData.professionalArea}
                    options={PROFESSIONAL_AREA_OPTIONS}
                    onChange={(value) => updateField("professionalArea", value)}
                    required
                    error={hasError("professionalArea")}
                  />
                  <TextField
                    id="yearsInCurrentArea"
                    label="Há quantos anos você trabalha nessa área?"
                    value={formData.yearsInCurrentArea}
                    onChange={(value) => updateField("yearsInCurrentArea", value)}
                    type="number"
                    min="0"
                    max="80"
                    inputMode="numeric"
                    placeholder="Ex.: 4"
                    required
                    error={hasError("yearsInCurrentArea")}
                  />
                </div>

                {formData.professionalArea === "outro" ? (
                  <div className="mt-5">
                    <TextField
                      id="professionalAreaOther"
                      label="Qual é a outra área?"
                      value={formData.professionalAreaOther}
                      onChange={(value) => updateField("professionalAreaOther", value)}
                      placeholder="Digite a área"
                      required
                      error={hasError("professionalAreaOther")}
                    />
                  </div>
                ) : null}
              </section>
            ) : null}

            <SelectField
              id="previousEntrepreneurialArea"
              label="Você já teve experiência como empreendedor? Em qual área?"
              value={formData.previousEntrepreneurialArea}
              options={PREVIOUS_EXPERIENCE_OPTIONS}
              onChange={(value) => updateField("previousEntrepreneurialArea", value)}
              required
              error={hasError("previousEntrepreneurialArea")}
            />

            {formData.previousEntrepreneurialArea === "outro" ? (
              <TextField
                id="previousEntrepreneurialAreaOther"
                label="Qual foi a outra área?"
                value={formData.previousEntrepreneurialAreaOther}
                onChange={(value) => updateField("previousEntrepreneurialAreaOther", value)}
                placeholder="Digite a área"
                required
                error={hasError("previousEntrepreneurialAreaOther")}
              />
            ) : null}
          </div>
        );

      case "company-profile":
        return (
          <div className="space-y-8">
            {formData.professionalCategory === "pj_mei" ? (
              <InfoBanner icon={CheckCircle2} title="Porte da empresa: MEI">
                Você já informou que é Microempreendedor Individual (MEI). Por isso, não faremos essa
                pergunta de novo.
              </InfoBanner>
            ) : (
              <ChoiceCards
                id="companySize"
                label="Qual é o tamanho da empresa?"
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
              label="Há quanto tempo a empresa funciona?"
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
              label="A empresa funciona online ou em um endereço físico?"
              value={formData.companyLocationType}
              options={COMPANY_LOCATION_OPTIONS}
              onChange={(value) => updateField("companyLocationType", value)}
              columns="two"
              required
              error={hasError("companyLocationType")}
            />

            {formData.companyLocationType === "fisica" ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-[220px_1fr]">
                <SelectField
                  id="companyState"
                  label="1. Estado da empresa"
                  value={formData.companyState}
                  options={STATES}
                  onChange={updateCompanyState}
                  placeholder="Escolha o estado"
                  required
                  error={hasError("companyState")}
                />

                {companyMunicipalities.error ? (
                  <div>
                    <TextField
                      id="companyCity"
                      label="2. Município da empresa"
                      value={formData.companyCity}
                      onChange={(value) => updateField("companyCity", value)}
                      placeholder="Digite o município"
                      helper="A lista não carregou. Digite o nome do município ou tente de novo."
                      required
                      error={hasError("companyCity")}
                    />
                    <button
                      type="button"
                      onClick={companyMunicipalities.retry}
                      className="mt-2 text-sm font-bold text-[#2F55D4] underline decoration-blue-200 underline-offset-4 hover:text-[#1F3FB4] focus:outline-none focus:ring-4 focus:ring-blue-100"
                    >
                      Tentar carregar a lista de municípios
                    </button>
                  </div>
                ) : (
                  <SelectField
                    id="companyCity"
                    label="2. Município da empresa"
                    value={formData.companyCity}
                    options={companyCityOptions}
                    onChange={(value) => updateField("companyCity", value)}
                    placeholder={
                      formData.companyState
                        ? "Escolha o município"
                        : "Escolha o estado primeiro"
                    }
                    disabled={!formData.companyState || companyMunicipalities.loading}
                    loading={companyMunicipalities.loading}
                    helper={
                      formData.companyState
                        ? "A lista mostra os municípios do estado escolhido."
                        : "Primeiro escolha o estado."
                    }
                    required
                    error={hasError("companyCity")}
                  />
                )}
              </div>
            ) : null}

            <SelectField
              id="companySegment"
              label="Qual é a principal atividade da empresa?"
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
                label="Qual é o faturamento da empresa por ano?"
                value={formData.revenueRange}
                options={REVENUE_OPTIONS}
                onChange={(value) => updateField("revenueRange", value)}
                required
                error={hasError("revenueRange")}
              />
            </div>

            <CheckboxCards
              id="salesChannels"
              label="Onde a empresa vende?"
              values={formData.salesChannels}
              options={SALES_CHANNEL_OPTIONS}
              onToggle={(value) =>
                updateField(
                  "salesChannels",
                  toggleArrayValue(formData.salesChannels, value),
                )
              }
              columns="two"
              helper="Marque todas as opções que servem para a empresa."
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

      case "sebrae-relationship":
        return (
          <div className="space-y-8">
            <ChoiceCards
              id="courseContact"
              label={`${firstName || "Você"}, você já fez algum curso do Sebrae?`}
              value={formData.courseContact}
              options={COURSE_CONTACT_OPTIONS}
              onChange={updateCourseExperience}
              columns="two"
              required
              error={hasError("courseContact")}
            />

            {hasCourse ? (
              <CheckboxCards
                id="courseFormats"
                label="Como você fez o curso ou os cursos?"
                values={formData.courseFormats}
                options={COURSE_FORMAT_OPTIONS}
                onToggle={toggleCourseFormat}
                columns="two"
                helper="Marque online, presencial ou os dois."
                required
                error={hasError("courseFormats")}
              />
            ) : null}

            {hasCourse && hasOnlineCourseContact ? renderCourseCards() : null}

            {hasCourse && hasPresencialCourseContact ? (
              <TextField
                id="presencialCourse"
                label="Qual foi o curso presencial?"
                value={formData.presencialCourse}
                onChange={(value) => updateField("presencialCourse", value)}
                placeholder="Digite o nome do curso"
                helper="Se fez mais de um, separe os nomes por vírgula."
                required
                error={hasError("presencialCourse")}
              />
            ) : null}

            {formData.courseContact === "nenhum" ? (
              <InfoBanner
                icon={CheckCircle2}
                title={firstName ? `Tudo certo, ${firstName}.` : "Tudo certo."}
              >
                Como você ainda não fez um curso do Sebrae, vamos seguir para a revisão.
              </InfoBanner>
            ) : null}
          </div>
        );

      case "course-evaluation":
        return (
          <div className="space-y-8">
            <section className="rounded-2xl border border-[#D8E0F0] bg-[#F7F9FF] p-5">
              <p className="text-sm font-bold text-[#071D49]">Cursos que você informou</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedCourseNames.map((courseName) => (
                  <span
                    key={courseName}
                    className="rounded-full border border-[#B9C8F2] bg-white px-3 py-1.5 text-sm font-semibold text-[#1F3FB4]"
                  >
                    {courseName}
                  </span>
                ))}
              </div>
            </section>

            <CheckboxCards
              id="courseReasons"
              label={`${firstName || "Você"}, por que você buscou ${
                selectedCourseNames.length === 1 ? "esse curso" : "esses cursos"
              }?`}
              values={formData.courseReasons}
              options={COURSE_REASON_OPTIONS}
              onToggle={(value) =>
                updateField(
                  "courseReasons",
                  toggleArrayValue(formData.courseReasons, value),
                )
              }
              columns="two"
              helper="Marque todas as opções que servem para você."
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
              <InfoBanner tone="slate">
                Leia cada frase e escolha uma opção de 1 a 7. Marque “Não se aplica à minha realidade” quando necessário.
              </InfoBanner>
              <LikertQuestion
                id="common.relationship.expectations"
                question="O curso ou os cursos atenderam às minhas expectativas."
                value={formData.responses["common.relationship.expectations"]}
                scale={LIKERT_7_WITH_NA_SCALE}
                onChange={(value) => updateResponse("common.relationship.expectations", value)}
                error={hasError("common.relationship.expectations")}
              />
              <LikertQuestion
                id="common.relationship.performance"
                question="Considero que tive um bom desempenho no curso ou nos cursos."
                value={formData.responses["common.relationship.performance"]}
                scale={LIKERT_7_WITH_NA_SCALE}
                onChange={(value) => updateResponse("common.relationship.performance", value)}
                error={hasError("common.relationship.performance")}
              />
              <LikertQuestion
                id="common.relationship.workload"
                question="A carga horária do curso ou dos cursos foi adequada."
                value={formData.responses["common.relationship.workload"]}
                scale={LIKERT_7_WITH_NA_SCALE}
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
              Leia cada frase e escolha uma opção de 1 a 7. Marque “Não se aplica à minha realidade” quando necessário.
            </InfoBanner>
            {BEFORE_QUESTIONS.map((question, index) => (
              <LikertQuestion
                key={question.id}
                id={question.id}
                question={question.text}
                number={index + 1}
                value={formData.responses[question.id]}
                scale={LIKERT_7_WITH_NA_SCALE}
                onChange={(value) => updateResponse(question.id, value)}
                error={hasError(question.id)}
              />
            ))}
          </div>
        );

      case "application-practice":
        return (
          <div className="space-y-4">
            <InfoBanner tone="slate">
              Leia cada frase e escolha uma opção de 1 a 7. Marque “Não se aplica à minha realidade” quando necessário.
            </InfoBanner>
            {APPLICATION_QUESTIONS.map((question, index) => (
              <LikertQuestion
                key={question.id}
                id={question.id}
                question={question.text}
                number={index + 1}
                value={formData.responses[question.id]}
                scale={LIKERT_7_WITH_NA_SCALE}
                onChange={(value) => updateResponse(question.id, value)}
                error={hasError(question.id)}
              />
            ))}
          </div>
        );

      case "application-changes":
        return (
          <div className="space-y-8">
            <CheckboxCards
              id="changesMade"
              label="O que mudou depois dos cursos?"
              values={formData.changesMade}
              options={CHANGES_OPTIONS}
              onToggle={(value) =>
                updateField(
                  "changesMade",
                  toggleArrayValue(formData.changesMade, value, ["nenhuma_mudanca"]),
                )
              }
              columns="two"
              helper="Marque todas as opções. “Ainda não realizei mudanças” não pode ser marcada com outra opção."
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
              label="Quais áreas da empresa mudaram?"
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
              helper="Marque todas as opções. “Nenhuma” e “Ainda não percebi” não podem ser marcadas com outra opção."
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
              helper="Marque todas as opções. “Não encontrei dificuldades” não pode ser marcada com outra opção."
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
              label="Que apoio ajudaria você a aplicar melhor o conteúdo?"
              values={formData.supportNeeds}
              options={SUPPORT_OPTIONS}
              onToggle={(value) =>
                updateField(
                  "supportNeeds",
                  toggleArrayValue(formData.supportNeeds, value, ["nenhum", "nao_sei"]),
                )
              }
              columns="two"
              helper="Marque todas as opções. “Não preciso” e “Ainda não sei” não podem ser marcadas com outra opção."
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
              Leia cada frase e escolha uma opção de 1 a 7. Marque “Não se aplica à minha realidade” quando necessário.
            </InfoBanner>
            {RESULT_QUESTIONS.map((question, index) => (
              <LikertQuestion
                key={question.id}
                id={question.id}
                question={question.text}
                number={index + 1}
                value={formData.responses[question.id]}
                scale={LIKERT_7_WITH_NA_SCALE}
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
              Pense apenas neste curso ao responder.
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
                        scale={LIKERT_7_WITH_NA_SCALE}
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
        const summaryItems = [
          {
            label: "Respondente",
            value: formData.fullName,
          },
          {
            label: "Situação atual",
            value: getOptionLabel(PROFESSIONAL_CATEGORY_OPTIONS, formData.professionalCategory),
          },
          {
            label: "Residência",
            value: `${formData.residenceCity} / ${formData.residenceState}`,
          },
          {
            label: "Já fez curso do Sebrae?",
            value: getOptionLabel(COURSE_CONTACT_OPTIONS, formData.courseContact),
          },
          ...(hasCourse
            ? [
                {
                  label: "Cursos informados",
                  value:
                    selectedCourseNames.length > 0
                      ? selectedCourseNames.join(", ")
                      : "Nenhum curso informado",
                },
              ]
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

            <InfoBanner
              icon={CheckCircle2}
              title={firstName ? `Você chegou ao fim, ${firstName}.` : "Você chegou ao fim."}
            >
              Confira os dados principais antes de enviar.
            </InfoBanner>

            <label
              data-field="reviewConfirmed"
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition focus-within:ring-4 focus-within:ring-blue-100 ${
                formData.reviewConfirmed
                  ? "border-[#2F55D4] bg-blue-50"
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
                    ? "border-[#2F55D4] bg-[#2F55D4]"
                    : "border-slate-400 bg-white"
                }`}
                aria-hidden="true"
              >
                {formData.reviewConfirmed ? <span className="text-xs font-black leading-none text-white">✓</span> : null}
              </span>
              <span className="text-sm font-semibold leading-6 text-slate-800">
                Conferi o resumo e quero enviar minhas respostas ao Sebrae.
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
      <div className="min-h-screen bg-[#F5F7FC] px-4 py-10 font-sans text-[#071D49]">
        <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <section className="w-full rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-xl sm:p-12">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={44} aria-hidden="true" />
            </span>
            <h1 className="mt-7 text-3xl font-black tracking-tight text-slate-950">
              Tudo certo{firstName ? `, ${firstName}` : ""}!
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
              Recebemos suas respostas. Elas vão ajudar o Sebrae a criar soluções mais úteis para quem empreende.
            </p>
            <button
              type="button"
              onClick={resetSurvey}
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-[#2F55D4] hover:text-[#2F55D4] focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <span className="text-lg leading-none" aria-hidden="true">↻</span>
              Iniciar uma nova resposta
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-[#F5F7FC] font-sans text-[#071D49]">
        <header className="border-b border-[#D8E0F0] bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-10">
            <img
              src="https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg"
              alt="Sebrae"
              className="h-8 w-auto sm:h-9"
            />
            <p className="hidden max-w-3xl text-right text-xs font-bold leading-5 text-[#2F55D4] md:block">
              Mapeamento de Cadeias Produtivas, Vocações Regionais e Efetividade de Soluções do SEBRAE
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
          <section className="overflow-hidden rounded-[28px] bg-[#2F55D4] shadow-[0_24px_70px_rgba(32,63,180,0.18)]">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <div className="flex flex-col justify-center px-6 py-9 text-white sm:px-10 sm:py-12 lg:px-14 lg:py-16">
                <p className="max-w-3xl text-xs font-black uppercase leading-5 tracking-[0.16em] text-[#DFFF7A] sm:text-sm">
                  Mapeamento de Cadeias Produtivas, Vocações Regionais e Efetividade de Soluções do SEBRAE
                </p>
                <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  Sua experiência pode melhorar o apoio a quem empreende.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">
                  Responda e ajude o Sebrae a entender as vocações da sua região e a criar soluções mais úteis para pequenos negócios.
                </p>

                <div className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-bold text-white">
                  <Clock size={17} aria-hidden="true" />
                  Leva menos de 5 minutos
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={startSurvey}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#DFFF7A] px-7 py-4 text-base font-black text-[#17399F] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#E7FF9B] focus:outline-none focus:ring-4 focus:ring-white/30"
                  >
                    {hasDraft ? "Continuar pesquisa" : "Começar agora"}
                    <span className="text-xl leading-none" aria-hidden="true">→</span>
                  </button>
                  {hasDraft ? (
                    <button
                      type="button"
                      onClick={resetSurvey}
                      className="inline-flex min-h-14 items-center justify-center rounded-xl border border-white/35 px-7 py-4 text-base font-bold text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-white/20"
                    >
                      Recomeçar
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="relative min-h-72 lg:min-h-full">
                <img
                  src={COVER_IMAGE_URL}
                  alt="Pessoas empreendedoras conversando e trabalhando juntas"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#17399F]/45 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#2F55D4]/35 lg:via-transparent lg:to-transparent" />
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
            <div className="rounded-[24px] border border-[#D8E0F0] bg-white p-6 sm:p-8">
              <h2 className="text-xl font-black text-[#071D49]">Como funciona</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-3">
                {[
                  "Diga quem é você",
                  "Depois, diga quais cursos do Sebrae você fez",
                  "Por fim, conte o que aplicou e quais resultados percebeu.",
                ].map((text, index) => (
                  <div key={text} className="flex gap-3 sm:block">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2F55D4] text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <p className="pt-1 text-sm font-semibold leading-6 text-slate-700 sm:mt-3 sm:pt-0">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#D8E0F0] bg-[#F0F4FF] p-6 sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#2F55D4] shadow-sm">
                <CheckCircle2 size={23} aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-xl font-black text-[#071D49]">Seus dados estão protegidos</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Seus dados serão protegidos pelo Sebrae e tratados conforme a LGPD.
              </p>
              <a
                href={SEBRAE_LGPD_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-black text-[#2F55D4] underline decoration-blue-300 underline-offset-4 hover:text-[#1F3FB4]"
              >
                Conheça a proteção de dados do Sebrae
              </a>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const progress = Math.round(((currentPageIndex + 1) / pages.length) * 100);
  const isFinalPage = currentPage.kind === "review";

  return (
    <div className="min-h-screen bg-[#F5F7FC] font-sans text-[#071D49]">
      <header className="sticky top-0 z-40 border-b border-[#D8E0F0] bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src="https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg"
                alt="Sebrae"
                className="h-7 w-auto shrink-0 sm:h-8"
              />
              <div className="hidden h-7 w-px bg-slate-200 sm:block" />
              <p className="hidden max-w-xl truncate text-xs font-bold text-slate-600 md:block">
                Mapeamento de Cadeias Produtivas, Vocações Regionais e Efetividade de Soluções do SEBRAE
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
              {firstName ? (
                <span className="hidden font-bold text-[#1F3FB4] sm:inline">Olá, {firstName}</span>
              ) : null}
              <span className="rounded-full bg-[#F0F4FF] px-3 py-1.5 font-bold text-[#17399F]">
                {currentPageIndex + 1} de {pages.length}
              </span>
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#2F55D4] transition-all duration-500"
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
        <section className="overflow-hidden rounded-[24px] border border-[#D8E0F0] bg-white shadow-[0_16px_50px_rgba(30,54,120,0.08)]">
          <div className="border-b border-[#D8E0F0] bg-[#F7F9FF] px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2F55D4]">
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
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-[#2F55D4] hover:text-[#2F55D4] focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6"
              >
                <span className="text-lg leading-none" aria-hidden="true">←</span>
                Voltar
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={isSubmitting}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white shadow-lg transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 sm:px-7 ${
                  isFinalPage
                    ? "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-100"
                    : "bg-[#2F55D4] hover:bg-[#1F3FB4] focus:ring-blue-100"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                    Enviando
                  </>
                ) : isFinalPage ? (
                  <>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    Enviar respostas
                  </>
                ) : (
                  <>
                    Continuar
                    <span className="text-lg leading-none" aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          Os campos com * são obrigatórios. Seus dados são tratados pelo Sebrae conforme a LGPD.
        </p>
      </main>
    </div>
  );
}
