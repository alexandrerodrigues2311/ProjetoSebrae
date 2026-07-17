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
  const [isCpfValid, setIsCpfValid] = useState(false);
  
  const [formData, setFormData] = useState({ 
    cpf: "", fullName: "", email: "", phone: "", genero: "", raca: "", quilombola: "", pcd: "", tiposPcd: "" 
  });

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

  const saveData = async () => {
    setIsSaving(true);
    try {
      const dataToSave = { 
        "Data": new Date().toISOString(), 
        "CPF": formData.cpf, 
        "Nome": formData.fullName, 
        "Email": formData.email, 
        "Telefone": formData.phone,
        "Genero": formData.genero,
        "Raca": formData.raca,
        "Quilombola": formData.quilombola,
        "Pcd": formData.pcd,
        "TiposPcd": formData.tiposPcd
      };
      await fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(dataToSave) });
      setIsSubmitted(true);
    } catch (error) { alert("Erro ao enviar: " + error); } finally { setIsSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto grid grid-cols-[120px_1fr] items-center">
          <img src="https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg" alt="Sebrae" className="h-8" />
          <h1 className="text-[#005AA5] font-bold text-sm uppercase text-center pr-[120px]">Mapeamento de Cadeias Produtivas e Efetividade</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {step === 0 && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000" className="w-full h-72 object-cover" />
            <div className="p-10 text-center">
              <h2 className="text-3xl font-black text-gray-800 mb-4">Sua história inspira o futuro.</h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg">Participe da nossa pesquisa e ajude a fortalecer as soluções do Sebrae para quem empreende. Sua voz é o motor da nossa inovação.</p>
              <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600 font-medium mb-6">
                <Clock size={16} /> É rapidinho: leva menos de 5 minutos.
              </div>
              <button onClick={() => setStep(1)} className="block w-full md:w-auto mx-auto bg-[#005AA5] text-white py-4 px-12 rounded-full font-bold text-lg hover:bg-blue-800 transition-all shadow-lg">Quero deixar minha marca</button>
              <p className="text-gray-400 text-xs mt-6">Seus dados estarão protegidos pelo Sebrae (LGPD - Lei nº 13.709/2018).</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white p-8 rounded-3xl shadow-md border border-gray-100 animate-slide-up">
            <h2 className="text-2xl font-bold mb-6 text-[#005AA5]">Sobre Você</h2>
            <input 
              onChange={(e) => { setFormData({...formData, cpf: e.target.value}); setIsCpfValid(validateCPF(e.target.value)); }} 
              placeholder="Digite seu CPF" 
              className="w-full p-4 mb-6 border-2 border-gray-200 rounded-xl focus:border-[#005AA5] outline-none" 
            />
            
            {isCpfValid && (
              <div className="space-y-6 animate-fade-in">
                <input onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Nome Completo" className="w-full p-4 border rounded-xl" />
                <div className="grid grid-cols-2 gap-4">
                  <input onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="E-mail" className="p-4 border rounded-xl" />
                  <input onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="WhatsApp" className="p-4 border rounded-xl" />
                </div>
                <div>
                  <h3 className="font-bold mb-3 text-sm">Gênero</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["Mulher Cis", "Homem Cis", "Mulher Trans", "Homem Trans", "Não binário", "Prefiro não informar"].map(g => (
                      <button key={g} onClick={() => setFormData({...formData, genero: g})} className={`p-2 border rounded-xl text-sm ${formData.genero === g ? 'bg-[#005AA5] text-white' : ''}`}>{g}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold mb-3 text-sm">Você é Pessoa com Deficiência (PcD)?</h3>
                  <div className="flex gap-4">
                    {["Não", "Sim"].map(p => (
                      <button key={p} onClick={() => setFormData({...formData, pcd: p})} className={`flex-1 p-3 border rounded-xl ${formData.pcd === p ? 'bg-[#005AA5] text-white' : ''}`}>{p}</button>
                    ))}
                  </div>
                  {formData.pcd === 'Sim' && (
                    <select onChange={(e) => setFormData({...formData, tiposPcd: e.target.value})} className="w-full mt-4 p-3 border rounded-xl">
                      <option>Selecione o tipo de deficiência</option>
                      {["Auditiva", "Física", "Intelectual", "Psicossocial", "Visual", "Autismo (TEA)", "Prefiro não informar"].map(t => <option key={t}>{t}</option>)}
                    </select>
                  )}
                </div>
                <button onClick={() => setStep(2)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Continuar</button>
              </div>
            )}
          </div>
        )}
        
        {isSubmitted && <div className="text-center py-20 font-bold text-2xl text-[#005AA5] animate-fade-in">Dados enviados com sucesso!</div>}
      </main>
    </div>
  );
}
