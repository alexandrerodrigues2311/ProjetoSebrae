import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  User,
  Briefcase,
  Star,
  Send,
  AlertCircle,
  Cpu,
  Smile,
  Users,
  TrendingUp,
  BookOpen,
  Loader2
} from "lucide-react";

// ==========================================
// CONFIGURAÇÃO GOOGLE SHEETS
// ==========================================
// A URL do seu Web App do Google Apps Script entrará aqui:
const GOOGLE_SCRIPT_URL = ""; 

// ==========================================
// BASE DE DADOS E METODOLOGIA (SEBRAE)
// ==========================================

const COURSES = [
  { id: "financas", title: "Gestão Financeira", icon: TrendingUp },
  { id: "pessoas", title: "Gestão de Pessoas", icon: Users },
  { id: "atendimento", title: "Atendimento ao Cliente", icon: Smile },
  { id: "ia", title: "IA na Prática para Pequenos Negócios", icon: Cpu },
  { id: "emocional", title: "Inteligência Emocional", icon: Star },
  { id: "outro", title: "Outro Curso", icon: BookOpen },
];

const LIKERT_OPTIONS = [
  { value: 1, label: "Discordo totalmente" },
  { value: 2, label: "Discordo parcialmente" },
  { value: 3, label: "Neutro" },
  { value: 4, label: "Concordo parcialmente" },
  { value: 5, label: "Concordo totalmente" },
  { value: 0, label: "Não se aplica" },
];

const QUESTIONS_BY_COURSE: Record<string, string[]> = {
  financas: [
    "Após o curso, passei a organizar melhor as finanças do meu negócio ou projeto.",
    "O curso contribuiu para melhorar meu controle de custos, despesas e receitas.",
    "Passei a utilizar informações financeiras para tomar decisões com mais segurança."
  ],
  pessoas: [
    "O curso contribuiu para melhorar a forma como organizo e conduzo as pessoas.",
    "Passei a valorizar mais a comunicação, o treinamento e o acompanhamento da equipe.",
    "O curso ajudou a definir melhor funções, responsabilidades e rotinas."
  ],
  atendimento: [
    "Após o curso, passei a entender melhor como atender e tratar bem os clientes.",
    "O curso contribuiu para fortalecer a fidelização dos clientes.",
    "Busco utilizar alternativas digitais para atrair antigos e novos clientes."
  ],
  ia: [
    "Após o curso, passei a entender melhor o que é Inteligência Artificial e como usá-la.",
    "O curso mostrou formas de usar IA para aumentar produtividade e reduzir tempo.",
    "Passei a ter mais atenção com dados pessoais e sigilosos ao utilizar IA."
  ],
  emocional: [
    "O curso contribuiu para aumentar minha confiança para enfrentar desafios.",
    "O curso me ajudou a lidar melhor com pressões, conflitos ou situações desafiadoras.",
    "Passei a agir com mais equilíbrio e clareza em situações difíceis."
  ],
  outro: [
    "O curso estava relacionado às minhas necessidades no momento em que o realizei.",
    "O curso contribuiu para melhorar minha forma de gerir ou atuar profissionalmente.",
    "As orientações do curso foram claras o suficiente para apoiar sua aplicação prática."
  ]
};

// ==========================================
// FUNÇÕES UTILITÁRIAS
// ==========================================

const validateCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if ((resto === 10) || (resto === 11)) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;
  return true;
};

const cpfMask = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

// ==========================================
// COMPONENTES DE UI
// ==========================================

const ErrorMessage = ({ message }: { message: string }) => (
  <p className="text-red-500 text-xs mt-1 flex items-center gap-1 font-medium animate-pulse">
    <AlertCircle size={14} /> {message}
  </p>
);

const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  return (
    <div className="w-full bg-gray-100 h-2 rounded-full mb-8 overflow-hidden shadow-inner">
      <div
        className="bg-[#005AA5] h-2 transition-all duration-700 ease-out"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

// ==========================================
// APLICATIVO PRINCIPAL
// ==========================================

export default function App() {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    cpf: "",
    fullName: "",
    email: "",
    courseId: "",
    evaluations: {} as Record<number, number>
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setErrors({});
  }, [step]);

  const handleChange = (field: string, value: string) => {
    if (field === "cpf") value = cpfMask(value);
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleEvaluation = (questionIndex: number, value: number) => {
    setFormData((prev) => ({
      ...prev,
      evaluations: { ...prev.evaluations, [questionIndex]: value }
    }));
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.cpf || !validateCPF(formData.cpf)) newErrors.cpf = "CPF inválido.";
      if (!formData.fullName.trim() || formData.fullName.split(" ").length < 2) newErrors.fullName = "Digite seu nome completo.";
      if (!formData.email.trim() || !formData.email.includes("@")) newErrors.email = "E-mail inválido.";
    }

    if (currentStep === 2) {
      if (!formData.courseId) newErrors.courseId = "Selecione o curso que deseja avaliar.";
    }

    if (currentStep === 3) {
      const questionsCount = QUESTIONS_BY_COURSE[formData.courseId]?.length || 0;
      for (let i = 0; i < questionsCount; i++) {
        if (formData.evaluations[i] === undefined) {
          newErrors.evaluations = "Por favor, responda todas as afirmativas antes de avançar.";
          break;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      isValid = false;
    }
    return isValid;
  };

  const saveData = async () => {
    setIsSaving(true);
    try {
      const dataToSave = { ...formData, submittedAt: new Date().toISOString() };
      if (GOOGLE_SCRIPT_URL) {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSave),
        });
      }
      setTimeout(() => {
        setIsSubmitted(true);
        setIsSaving(false);
      }, 1500); 
    } catch (error) {
      console.error("Erro ao salvar:", error);
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 3) setStep(step + 1);
      else saveData();
    }
  };

  // --- RENDERIZADORES DE ETAPA ---

  const renderWelcome = () => (
    <div className="text-center space-y-8 py-6 animate-fade-in px-4">
      <div className="relative w-full h-72 rounded-3xl overflow-hidden shadow-2xl mb-8 group">
        <img
          src="https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=1932"
          alt="Pessoas em ambiente de negócios"
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#005AA5]/90 via-[#005AA5]/40 to-transparent flex flex-col justify-end p-8 md:p-12">
          <h1 className="text-white font-extrabold text-3xl md:text-5xl drop-shadow-lg text-left tracking-tight">
            Transformando Dados em <br/><span className="text-blue-200">Evolução.</span>
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
          Mapeamento de Efetividade SEBRAE
        </h2>
        <p className="text-gray-600 text-lg leading-relaxed">
          Sua experiência é fundamental para avaliarmos a aplicabilidade e o impacto das nossas soluções no desenvolvimento de negócios em todo o Brasil.
        </p>
      </div>

      <button
        onClick={() => setStep(1)}
        className="bg-[#005AA5] hover:bg-blue-800 text-white font-bold py-4 px-10 rounded-full shadow-[0_10px_20px_rgba(0,90,165,0.3)] transform transition hover:-translate-y-1 text-lg flex items-center gap-3 mx-auto focus:ring-4 focus:ring-blue-300 outline-none"
      >
        Iniciar Pesquisa <ChevronRight />
      </button>
    </div>
  );

  const renderStep1_Identificacao = () => (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-[#005AA5] flex items-center justify-center gap-3">
          <User size={28} /> Identificação
        </h2>
        <p className="text-gray-500 mt-2">Validação e dados básicos do respondente.</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-xl shadow-blue-900/5 space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">CPF</label>
          <input
            type="text"
            value={formData.cpf}
            onChange={(e) => handleChange("cpf", e.target.value)}
            placeholder="000.000.000-00"
            maxLength={14}
            className={`w-full p-4 border-2 rounded-xl focus:ring-0 outline-none transition-colors text-lg tracking-wide ${
              errors.cpf ? "border-red-400 bg-red-50 text-red-900" : "border-gray-200 focus:border-[#005AA5] bg-gray-50"
            }`}
          />
          {errors.cpf && <ErrorMessage message={errors.cpf} />}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Nome Completo</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            placeholder="Como devemos chamar você?"
            className={`w-full p-4 border-2 rounded-xl focus:ring-0 outline-none transition-colors text-lg ${
              errors.fullName ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#005AA5] bg-gray-50"
            }`}
          />
          {errors.fullName && <ErrorMessage message={errors.fullName} />}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">E-mail Profissional</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="seu@email.com"
            className={`w-full p-4 border-2 rounded-xl focus:ring-0 outline-none transition-colors text-lg ${
              errors.email ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#005AA5] bg-gray-50"
            }`}
          />
          {errors.email && <ErrorMessage message={errors.email} />}
        </div>
      </div>
    </div>
  );

  const renderStep2_CourseSelection = () => (
    <div className="space-y-8 animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[#005AA5] flex items-center justify-center gap-3">
          <Briefcase size={28} /> Solução Avaliada
        </h2>
        <p className="text-gray-500 mt-2">Qual curso você realizou e deseja avaliar hoje?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COURSES.map((course) => {
          const isSelected = formData.courseId === course.id;
          const Icon = course.icon;
          return (
            <div
              key={course.id}
              onClick={() => handleChange("courseId", course.id)}
              className={`cursor-pointer p-6 rounded-2xl border-2 flex items-center gap-4 transition-all duration-300 transform ${
                isSelected
                  ? "border-[#005AA5] bg-blue-50 scale-[1.02] shadow-lg shadow-blue-900/10"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              }`}
            >
              <div className={`p-3 rounded-full ${isSelected ? "bg-[#005AA5] text-white" : "bg-gray-100 text-gray-500"}`}>
                <Icon size={24} />
              </div>
              <h3 className={`font-bold text-lg ${isSelected ? "text-[#005AA5]" : "text-gray-700"}`}>
                {course.title}
              </h3>
            </div>
          );
        })}
      </div>
      {errors.courseId && <div className="text-center mt-4"><ErrorMessage message={errors.courseId} /></div>}
    </div>
  );

  const renderStep3_DynamicEvaluation = () => {
    const questions = QUESTIONS_BY_COURSE[formData.courseId] || [];
    const courseTitle = COURSES.find(c => c.id === formData.courseId)?.title;

    return (
      <div className="space-y-8 animate-slide-up">
        <div className="text-center mb-10">
          <span className="inline-block py-1 px-4 rounded-full bg-blue-100 text-[#005AA5] font-bold text-sm mb-4">
            {courseTitle}
          </span>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <Star className="text-[#005AA5]" size={28} /> Efetividade Percebida
          </h2>
          <p className="text-gray-500 mt-2">Indique seu grau de concordância com as afirmativas abaixo.</p>
        </div>

        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <label className="block text-base md:text-lg font-medium text-gray-800 mb-6 leading-relaxed">
                {question}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {LIKERT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleEvaluation(index, opt.value)}
                    className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                      formData.evaluations[index] === opt.value
                        ? "bg-[#005AA5] border-[#005AA5] text-white shadow-md transform scale-105"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {errors.evaluations && <div className="text-center mt-6"><ErrorMessage message={errors.evaluations} /></div>}
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="text-center py-16 animate-fade-in space-y-6 px-4">
      <div className="inline-flex bg-green-100 text-green-600 p-6 rounded-full mb-4 shadow-inner">
        <CheckCircle size={64} />
      </div>
      <h2 className="text-3xl font-black text-gray-800 tracking-tight">
        Pesquisa Concluída!
      </h2>
      <p className="text-gray-600 text-lg max-w-lg mx-auto">
        Muito obrigado, {formData.fullName.split(" ")[0]}! Seus dados foram computados e nos ajudarão a direcionar o futuro do empreendedorismo no Brasil.
      </p>
      <div className="pt-8 mt-8 border-t border-gray-100">
        <img src="/image_466204.png" alt="Logo SEBRAE" className="h-12 w-auto mx-auto grayscale opacity-50" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-900 selection:bg-blue-200 selection:text-[#005AA5]">
      
      {/* HEADER CINEMÁTICO */}
      <header className="bg-white shadow-sm border-b-[6px] border-[#005AA5] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src="/image_466204.png" alt="Logo SEBRAE" className="h-10 md:h-12 w-auto" />
          {!isSubmitted && step > 0 && (
            <span className="text-sm font-bold text-[#005AA5] px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
              Passo {step} de 3
            </span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 w-full relative">
        {isSubmitted ? (
          renderSuccess()
        ) : step === 0 ? (
          renderWelcome()
        ) : (
          <div className="bg-white rounded-[2rem] shadow-2xl p-6 md:p-10 border border-gray-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#005AA5] rounded-bl-full opacity-5 pointer-events-none"></div>

            <ProgressBar currentStep={step - 1} totalSteps={3} />

            <div className="min-h-[400px]">
              {step === 1 && renderStep1_Identificacao()}
              {step === 2 && renderStep2_CourseSelection()}
              {step === 3 && renderStep3_DynamicEvaluation()}
            </div>

            <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-100">
              <button
                onClick={() => setStep(step - 1)}
                disabled={isSaving}
                className="text-gray-400 hover:text-[#005AA5] font-bold px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={20} /> Voltar
              </button>

              <button
                onClick={handleNext}
                disabled={isSaving}
                className="bg-[#005AA5] hover:bg-blue-800 text-white font-bold py-4 px-10 rounded-xl shadow-lg transform transition hover:scale-[1.02] flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <><Loader2 className="animate-spin" size={20} /> Salvando...</>
                ) : (
                  <>{step === 3 ? "Finalizar" : "Avançar"} {step === 3 ? <Send size={18} /> : <ChevronRight size={20} />}</>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
