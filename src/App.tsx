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
// BASE DE DADOS E METODOLOGIA
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
      const dataToSave = { "Data": new Date().toISOString(), "CPF": formData.cpf, "Nome": formData.fullName, "Email": formData.email, "Curso": formData.courseId, "Avaliacoes": JSON.stringify(formData.evaluations) };
      await fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(dataToSave) });
      setIsSubmitted(true);
    } catch (error) { alert("Erro ao enviar: " + error); } finally { setIsSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <img src="https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg" alt="Sebrae" className="h-8" />
          <h1 className="text-gray-500 font-bold text-xs uppercase hidden md:block">Mapeamento de Cadeias Produtivas e Efetividade</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {step === 0 && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in border border-gray-100">
            {/* Imagem diversa e voltada a negócios */}
            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=2000" alt="Diversidade no trabalho" className="w-full h-72 object-cover" />
            <div className="p-10 text-center">
              <h2 className="text-3xl font-black text-gray-800 mb-4">Sua história transforma o mercado.</h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                Participe do nosso mapeamento e ajude a fortalecer as soluções do Sebrae para quem empreende.
              </p>
              
              <button onClick={() => setStep(1)} className="bg-[#005AA5] text-white py-4 px-12 rounded-full font-bold text-lg hover:bg-blue-800 transition-all shadow-lg w-full md:w-auto">
                Quero deixar minha marca
              </button>
              
              {/* LGPD discreto conforme solicitado */}
              <p className="text-gray-400 text-xs mt-6">Seus dados estão protegidos (LGPD - Lei nº 13.709/2018).</p>
            </div>
          </div>
        )}

        {step > 0 && step < 4 && (
            <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100 animate-slide-up">
                {step === 1 && (
                    <>
                        <h2 className="text-2xl font-bold mb-6 text-[#005AA5]">Identificação</h2>
                        <input onChange={(e) => setFormData({...formData, cpf: e.target.value})} placeholder="CPF" className="w-full p-4 mb-4 border rounded-xl" />
                        <input onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Nome Completo" className="w-full p-4 mb-4 border rounded-xl" />
                        <input onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="E-mail" className="w-full p-4 mb-4 border rounded-xl" />
                        <button onClick={() => setStep(2)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Avançar</button>
                    </>
                )}
                {step === 2 && (
                    <>
                        <h2 className="text-2xl font-bold mb-6 text-[#005AA5]">Selecione o Curso</h2>
                        {COURSES.map(c => (
                        <div key={c.id} onClick={() => setFormData({...formData, courseId: c.id})} className={`p-4 border-2 rounded-xl mb-3 cursor-pointer ${formData.courseId === c.id ? 'border-[#005AA5] bg-blue-50' : ''}`}>
                            {c.title}
                        </div>
                        ))}
                        <button onClick={() => setStep(3)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl mt-4 font-bold">Avançar</button>
                    </>
                )}
                {step === 3 && (
                    <>
                        <h2 className="text-2xl font-bold mb-6 text-[#005AA5]">Avaliação</h2>
                        {QUESTIONS_BY_COURSE[formData.courseId].map((q, i) => (
                        <div key={i} className="mb-6">
                            <p className="font-bold mb-3 text-gray-700">{q}</p>
                            <div className="flex gap-2">
                            {LIKERT_OPTIONS.map(opt => (
                                <button key={opt.value} onClick={() => setFormData({...formData, evaluations: {...formData.evaluations, [i]: opt.value}})} className={`p-3 border rounded font-bold w-12 ${formData.evaluations[i] === opt.value ? 'bg-[#005AA5] text-white' : ''}`}>{opt.label}</button>
                            ))}
                            </div>
                        </div>
                        ))}
                        <button onClick={saveData} disabled={isSaving} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">{isSaving ? 'Enviando...' : 'Finalizar'}</button>
                    </>
                )}
            </div>
        )}

        {isSubmitted && <div className="text-center py-20 font-bold text-2xl text-[#005AA5] animate-fade-in">Dados enviados com sucesso!</div>}
      </main>
    </div>
  );
}
