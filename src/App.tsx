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
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8yWGHJmONTFshN8rqJIhthd_VFvTpRTeV7jPk931Vab6r_lDstn0Pexf2Ea_m3Lwl/exec"; 

// ==========================================
// DADOS E METODOLOGIA
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
  { value: 1, label: "1" }, { value: 2, label: "2" }, { value: 3, label: "3" }, 
  { value: 4, label: "4" }, { value: 5, label: "5" }, { value: 0, label: "N/A" }
];

const QUESTIONS_BY_COURSE: Record<string, string[]> = {
  financas: ["Após o curso, passei a organizar melhor as finanças do meu negócio ou projeto.", "O curso contribuiu para melhorar meu controle de custos, despesas e receitas.", "Passei a utilizar informações financeiras para tomar decisões com mais segurança."],
  pessoas: ["O curso contribuiu para melhorar a forma como organizo e conduzo as pessoas.", "Passei a valorizar mais a comunicação, o treinamento e o acompanhamento da equipe.", "O curso ajudou a definir melhor funções, responsabilidades e rotinas."],
  atendimento: ["Após o curso, passei a entender melhor como atender e tratar bem os clientes.", "O curso contribuiu para fortalecer a fidelização dos clientes.", "Busco utilizar alternativas digitais para atrair antigos e novos clientes."],
  ia: ["Após o curso, passei a entender melhor o que é Inteligência Artificial e como usá-la.", "O curso mostrou formas de usar IA para aumentar produtividade e reduzir tempo.", "Passei a ter mais atenção com dados pessoais e sigilosos ao utilizar IA."],
  emocional: ["O curso contribuiu para aumentar minha confiança para enfrentar desafios.", "O curso me ajudou a lidar melhor com pressões, conflitos ou situações desafiadoras.", "Passei a agir com mais equilíbrio e clareza em situações difíceis."],
  outro: ["O curso estava relacionado às minhas necessidades.", "O curso contribuiu para melhorar minha forma de gerir.", "As orientações foram claras para a prática."]
};

export default function App() {
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({ cpf: "", fullName: "", email: "", courseId: "", evaluations: {} as Record<number, number> });

  const saveData = async () => {
    setIsSaving(true);
    try {
      const dataToSave = {
        "Data": new Date().toISOString(),
        "CPF": formData.cpf,
        "Nome": formData.fullName,
        "Email": formData.email,
        "Curso": formData.courseId,
        "Avaliacoes": JSON.stringify(formData.evaluations)
      };

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* HEADER ATUALIZADO COM LOGO SEBRAE E TÍTULO */}
      <header className="bg-white shadow-sm border-b-[6px] border-[#005AA5] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center gap-4">
          <img src="https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg" alt="Logo SEBRAE" className="h-10 w-auto" />
          <div className="text-center md:text-left border-l-0 md:border-l border-gray-200 md:pl-4">
            <h1 className="text-[#005AA5] font-bold text-sm md:text-lg leading-tight tracking-tight uppercase">
              Mapeamento de Cadeias Produtivas, Vocações Regionais e Efetividade das Soluções do SEBRAE
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {step === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-lg border border-gray-100">
            <h1 className="text-3xl font-black text-[#005AA5] mb-6">Bem-vindo à Pesquisa</h1>
            <button onClick={() => setStep(1)} className="bg-[#005AA5] text-white py-4 px-10 rounded-full font-bold shadow-xl">Iniciar Pesquisa</button>
          </div>
        )}
        {step === 1 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-[#005AA5]">Identificação</h2>
            <input onChange={(e) => setFormData({...formData, cpf: e.target.value})} placeholder="CPF" className="w-full p-4 mb-4 border rounded-xl" />
            <input onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Nome Completo" className="w-full p-4 mb-4 border rounded-xl" />
            <input onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="E-mail" className="w-full p-4 mb-4 border rounded-xl" />
            <button onClick={() => setStep(2)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl">Avançar</button>
          </div>
        )}
        {step === 2 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-[#005AA5]">Selecione o Curso</h2>
            {COURSES.map(c => (
              <div key={c.id} onClick={() => setFormData({...formData, courseId: c.id})} className={`p-4 border-2 rounded-xl mb-3 cursor-pointer ${formData.courseId === c.id ? 'border-[#005AA5] bg-blue-50' : ''}`}>
                {c.title}
              </div>
            ))}
            <button onClick={() => setStep(3)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl mt-4">Avançar</button>
          </div>
        )}
        {step === 3 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg">
            {QUESTIONS_BY_COURSE[formData.courseId].map((q, i) => (
              <div key={i} className="mb-6">
                <p className="font-bold mb-3">{q}</p>
                <div className="flex gap-2">
                  {LIKERT_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setFormData({...formData, evaluations: {...formData.evaluations, [i]: opt.value}})} className={`p-3 border rounded ${formData.evaluations[i] === opt.value ? 'bg-[#005AA5] text-white' : ''}`}>{opt.label}</button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={saveData} disabled={isSaving} className="w-full bg-[#005AA5] text-white p-4 rounded-xl">{isSaving ? 'Enviando...' : 'Finalizar'}</button>
          </div>
        )}
        {isSubmitted && <div className="text-center py-20 font-bold text-2xl text-[#005AA5]">Dados enviados com sucesso!</div>}
      </main>
    </div>
  );
}
