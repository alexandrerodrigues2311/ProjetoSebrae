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
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-xAKrwx_EQlrwEUz1pYoyGf64vHXotEAVkt_titDDyvWczMDxaHz3nJLqNzX_e3Si/exec"; 

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

const ErrorMessage = ({ message }: { message: string }) => (
  <p className="text-red-500 text-xs mt-1 flex items-center gap-1 font-medium animate-pulse">
    <AlertCircle size={14} /> {message}
  </p>
);

const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  return (
    <div className="w-full bg-gray-100 h-2 rounded-full mb-8 overflow-hidden shadow-inner">
      <div className="bg-[#005AA5] h-2 transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({ cpf: "", fullName: "", email: "", courseId: "", evaluations: {} as Record<number, number> });

  const handleChange = (field: string, value: string) => {
    if (field === "cpf") value = cpfMask(value);
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleEvaluation = (questionIndex: number, value: number) => {
    setFormData((prev) => ({ ...prev, evaluations: { ...prev.evaluations, [questionIndex]: value } }));
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    if (currentStep === 1) {
      if (!formData.cpf || !validateCPF(formData.cpf)) newErrors.cpf = "CPF inválido.";
      if (!formData.fullName.trim() || formData.fullName.split(" ").length < 2) newErrors.fullName = "Digite seu nome completo.";
      if (!formData.email.trim() || !formData.email.includes("@")) newErrors.email = "E-mail inválido.";
    }
    if (currentStep === 2 && !formData.courseId) newErrors.courseId = "Selecione o curso.";
    if (currentStep === 3) {
      const questionsCount = QUESTIONS_BY_COURSE[formData.courseId]?.length || 0;
      for (let i = 0; i < questionsCount; i++) {
        if (formData.evaluations[i] === undefined) {
          newErrors.evaluations = "Responda todas as afirmativas.";
          break;
        }
      }
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); isValid = false; }
    return isValid;
  };

  const saveData = async () => {
    setIsSaving(true);
    try {
      const dataToSave = { ...formData, submittedAt: new Date().toISOString() };
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(dataToSave),
      });
      setIsSubmitted(true);
    } catch (error) {
      alert("Erro ao enviar dados: " + error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => { if (validateStep(step)) step < 3 ? setStep(step + 1) : saveData(); };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans p-4">
      <main className="max-w-3xl mx-auto py-10">
        {!isSubmitted && step > 0 && <ProgressBar currentStep={step - 1} totalSteps={3} />}
        {step === 0 && (
          <div className="text-center py-20">
            <h1 className="text-4xl font-black text-[#005AA5] mb-6">Mapeamento SEBRAE</h1>
            <button onClick={() => setStep(1)} className="bg-[#005AA5] text-white py-4 px-10 rounded-full font-bold">Iniciar Pesquisa</button>
          </div>
        )}
        {step === 1 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Identificação</h2>
            <input value={formData.cpf} onChange={(e) => handleChange("cpf", e.target.value)} placeholder="CPF" className="w-full p-4 mb-4 border rounded-xl" />
            {errors.cpf && <ErrorMessage message={errors.cpf} />}
            <input value={formData.fullName} onChange={(e) => handleChange("fullName", e.target.value)} placeholder="Nome Completo" className="w-full p-4 mb-4 border rounded-xl" />
            <input value={formData.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="E-mail" className="w-full p-4 mb-4 border rounded-xl" />
            <button onClick={handleNext} className="w-full bg-[#005AA5] text-white p-4 rounded-xl">Avançar</button>
          </div>
        )}
        {step === 2 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Selecione o Curso</h2>
            {COURSES.map(c => (
              <div key={c.id} onClick={() => handleChange("courseId", c.id)} className={`p-4 border-2 rounded-xl mb-3 cursor-pointer ${formData.courseId === c.id ? 'border-[#005AA5] bg-blue-50' : ''}`}>
                {c.title}
              </div>
            ))}
            <button onClick={handleNext} className="w-full bg-[#005AA5] text-white p-4 rounded-xl mt-4">Avançar</button>
          </div>
        )}
        {step === 3 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg">
            {QUESTIONS_BY_COURSE[formData.courseId].map((q, i) => (
              <div key={i} className="mb-6">
                <p className="font-bold mb-3">{q}</p>
                <div className="flex gap-2">
                  {LIKERT_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => handleEvaluation(i, opt.value)} className={`p-2 border rounded ${formData.evaluations[i] === opt.value ? 'bg-[#005AA5] text-white' : ''}`}>{opt.value}</button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={handleNext} disabled={isSaving} className="w-full bg-[#005AA5] text-white p-4 rounded-xl">{isSaving ? 'Enviando...' : 'Finalizar'}</button>
          </div>
        )}
        {isSubmitted && <div className="text-center py-20 font-bold text-2xl">Obrigado pela sua colaboração!</div>}
      </main>
    </div>
  );
}
