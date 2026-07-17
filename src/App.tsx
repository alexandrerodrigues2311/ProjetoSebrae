import React, { useState } from "react";
import { TrendingUp, Users, Smile, Cpu, Star, BookOpen, Clock } from "lucide-react";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8yWGHJmONTFshN8rqJIhthd_VFvTpRTeV7jPk931Vab6r_lDstn0Pexf2Ea_m3Lwl/exec"; 

const COURSES = [
  { id: "financas", title: "Gestão Financeira", icon: TrendingUp },
  { id: "pessoas", title: "Gestão de Pessoas", icon: Users },
  { id: "atendimento", title: "Atendimento ao Cliente", icon: Smile },
  { id: "ia", title: "IA na Prática para Pequenos Negócios", icon: Cpu },
  { id: "emocional", title: "Inteligência Emocional", icon: Star },
  { id: "outro", title: "Outro Curso", icon: BookOpen },
];

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
      {/* Cabeçalho centralizado com título completo */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <img src="https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg" alt="Sebrae" className="h-8" />
          <h1 className="text-gray-700 font-bold text-sm md:text-sm uppercase tracking-wide text-center">
            Mapeamento de Cadeias Produtivas, Vocações Regionais e Efetividade das Soluções do Sebrae
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {step === 0 && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2000" 
              alt="Ambiente de negócios" 
              className="w-full h-72 object-cover object-center" 
            />
            <div className="p-10 text-center">
              <h2 className="text-3xl font-black text-gray-800 mb-4">Sua experiência constrói o futuro do seu negócio.</h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                Sua jornada com o Sebrae é única. Ao compartilhar sua visão nesta pesquisa, você nos ajuda a aprimorar as soluções que impulsionam o sucesso de milhares de empreendedores como você. <b>Sua voz é o motor da nossa inovação.</b>
              </p>
              
              <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600 font-medium mb-6">
                <Clock size={16} /> É rapidinho: leva menos de 5 minutos.
              </div>
              <button onClick={() => setStep(1)} className="block w-full md:w-auto mx-auto bg-[#005AA5] text-white py-4 px-12 rounded-full font-bold text-lg hover:bg-blue-800 transition-all shadow-lg">
                Quero deixar minha marca
              </button>
              
              <p className="text-gray-400 text-xs mt-6">Seus dados estarão protegidos pelo Sebrae (LGPD - Lei nº 13.709/2018).</p>
            </div>
          </div>
        )}
        {/* ... restante do formulário mantido igual ... */}
      </main>
    </div>
  );
}
