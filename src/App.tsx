import React, { useState } from "react";
import { Clock, AlertCircle, TrendingUp, Users, Smile, Cpu, Star, PlusCircle, CheckCircle2 } from "lucide-react";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8yWGHJmONTFshN8rqJIhthd_VFvTpRTeV7jPk931Vab6r_lDstn0Pexf2Ea_m3Lwl/exec"; 

const COURSES = [
  { id: "financas", title: "Gestão Financeira", icon: TrendingUp },
  { id: "pessoas", title: "Gestão de Pessoas", icon: Users },
  { id: "atendimento", title: "Atendimento ao Cliente", icon: Smile },
  { id: "ia", title: "IA na Prática", icon: Cpu },
  { id: "emocional", title: "Inteligência Emocional", icon: Star }
];

const LIKERT = ["Discordo totalmente", "Discordo parcialmente", "Nem concordo, nem discordo", "Concordo parcialmente", "Concordo totalmente", "Não se aplica"];

export default function App() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    cpf: "", fullName: "", email: "", phone: "", genero: "", raca: "", quilombola: "", pcd: "", tiposPcd: [] as string[], cursos: [] as string[], responses: {} as any, receiveResults: false
  });

  const saveData = async () => {
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, timestamp: new Date().toISOString() })
      });
      setStep(4); // Página de agradecimento
    } catch (e) { alert("Erro ao salvar. Tente novamente."); }
  };

  const renderLikert = (id: string, question: string) => (
    <div key={id} className="mb-6 p-4 bg-white border rounded-xl shadow-sm">
      <p className="font-bold mb-3 text-gray-800">{question}</p>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {LIKERT.map((opt, i) => (
          <button key={i} onClick={() => setFormData(p => ({...p, responses: {...p.responses, [id]: i + 1}}))} 
            className={`p-2 text-xs border rounded-lg ${formData.responses[id] === i + 1 ? 'bg-[#005AA5] text-white' : 'border-[#005AA5] text-[#005AA5]'}`}>
            {i + 1}. {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b py-4 px-6 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <img src="https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg" alt="Sebrae" className="h-8" />
          <h1 className="text-[#005AA5] font-bold text-[10px] uppercase">Mapeamento de Cadeias Produtivas</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {step === 0 && (
          <div className="text-center animate-in zoom-in">
            <h2 className="text-3xl font-black text-gray-800 mb-4">Sua história inspira o futuro.</h2>
            <p className="text-gray-600 mb-8">Participe da nossa pesquisa e ajude a fortalecer as soluções do Sebrae para quem empreende.</p>
            <button onClick={() => setStep(1)} className="bg-[#005AA5] text-white py-4 px-12 rounded-full font-bold">Quero deixar minha marca</button>
          </div>
        )}

        {step === 1 && (
          <div className="animate-in slide-in-from-right">
             {/* [Logica de Identificação completa aqui...] */}
             <button onClick={() => setStep(2)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Continuar</button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right">
             {/* [Blocos Likert 1-5 Comuns aqui...] */}
             <button onClick={() => setStep(3)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Próximo</button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right">
            {/* [Blocos Específicos do Curso aqui...] */}
            <button onClick={saveData} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Enviar Respostas</button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center animate-in zoom-in">
            <CheckCircle2 size={64} className="mx-auto text-[#005AA5] mb-4"/>
            <h2 className="text-2xl font-bold">Obrigado pela sua contribuição!</h2>
            <label className="block mt-6 cursor-pointer">
              <input type="checkbox" onChange={(e) => setFormData(p => ({...p, receiveResults: e.target.checked}))}/> Desejo receber os resultados.
            </label>
          </div>
        )}
      </main>
    </div>
  );
}
