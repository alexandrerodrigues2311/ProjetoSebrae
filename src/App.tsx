import React, { useState } from "react";
import { Clock, AlertCircle } from "lucide-react";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8yWGHJmONTFshN8rqJIhthd_VFvTpRTeV7jPk931Vab6r_lDstn0Pexf2Ea_m3Lwl/exec"; 

const maskPhone = (value: string) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
const maskCPF = (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);

export default function App() {
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isCpfValid, setIsCpfValid] = useState(false);
  const [formData, setFormData] = useState({ 
    cpf: "", fullName: "", email: "", phone: "", genero: "", raca: "", quilombola: "", pcd: "", tiposPcd: "" 
  });

  const validateCPF = (cpf: string) => {
    const clean = cpf.replace(/[^\d]+/g, '');
    if (clean.length !== 11 || /^(\d)\1+$/.test(clean)) return false;
    let soma = 0;
    for (let i = 1; i <= 9; i++) soma += parseInt(clean.substring(i - 1, i)) * (11 - i);
    let resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(clean.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(clean.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    return resto === parseInt(clean.substring(10, 11));
  };

  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-0">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto grid grid-cols-[120px_1fr_120px] items-center">
          <img src="https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg" alt="Sebrae" className="h-8" />
          <h1 className="text-[#005AA5] font-bold text-xs uppercase text-center truncate px-4">Mapeamento de Cadeias Produtivas e Efetividade</h1>
          <div /> 
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {step === 0 && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in duration-500">
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000" className="w-full h-72 object-cover" />
            <div className="p-10 text-center">
              <h2 className="text-3xl font-black text-gray-800 mb-4">Sua história inspira o futuro.</h2>
              <button onClick={() => setStep(1)} className="bg-[#005AA5] text-white py-4 px-12 rounded-full font-bold text-lg hover:bg-blue-800 transition-all shadow-lg">Quero deixar minha marca</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border animate-in slide-in-from-right duration-500 space-y-6">
            <h2 className="text-2xl font-bold text-[#005AA5]">Sobre Você</h2>
            
            <input 
              value={formData.cpf} 
              onChange={(e) => { 
                setFormData({...formData, cpf: maskCPF(e.target.value)}); 
                setIsCpfValid(validateCPF(e.target.value)); 
              }} 
              placeholder="CPF" className="w-full p-4 border-2 rounded-xl" 
            />

            {isCpfValid && (
              <div className="space-y-6 animate-fade-in">
                <div><label className="block font-bold mb-1">Como quer ser chamado?</label><input onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Nome completo" className="w-full p-4 border rounded-xl" /></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block font-bold mb-1">E-mail</label><input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="exemplo@email.com" className={`w-full p-4 border rounded-xl ${formData.email && !validateEmail(formData.email) ? 'border-red-500' : ''}`} /></div>
                  <div><label className="block font-bold mb-1">Telefone / WhatsApp</label><input value={formData.phone} onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} placeholder="(DD) 9XXXX-XXXX" className="w-full p-4 border rounded-xl" /></div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-bold mb-4">Identidade</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: "Mulher Cis", d: "Registrada mulher ao nascer." }, { l: "Homem Cis", d: "Registrado homem ao nascer." },
                      { l: "Mulher Trans", d: "Identifica-se mulher, registrada outro." }, { l: "Homem Trans", d: "Identifica-se homem, registrado outro." },
                      { l: "Não binário", d: "Não se identifica exclusivamente." }, { l: "Prefiro não informar", d: "" }
                    ].map(g => (
                      <button key={g.l} onClick={() => setFormData({...formData, genero: g.l})} className={`p-4 border rounded-xl text-left ${formData.genero === g.l ? 'bg-blue-50 border-[#005AA5]' : ''}`}>
                        <div className="font-bold text-sm">{g.l}</div>
                        <div className="text-xs text-gray-500">{g.d}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                    <h3 className="font-bold mb-3">Pessoa com Deficiência (PcD)?</h3>
                    <div className="flex gap-4">
                        {['Não', 'Sim'].map(o => (
                            <button key={o} onClick={() => setFormData({...formData, pcd: o})} className={`flex-1 p-4 border rounded-xl font-bold ${formData.pcd === o ? 'bg-[#005AA5] text-white' : ''}`}>{o}</button>
                        ))}
                    </div>
                    {formData.pcd === 'Sim' && (
                        <div className="grid grid-cols-1 gap-2 mt-4">
                            {["Auditiva", "Física", "Intelectual", "Psicossocial", "Visual", "Autismo (TEA)", "Prefiro não informar"].map(t => (
                                <button key={t} onClick={() => setFormData({...formData, tiposPcd: t})} className={`p-3 border rounded-xl ${formData.tiposPcd === t ? 'bg-[#005AA5] text-white' : ''}`}>{t}</button>
                            ))}
                        </div>
                    )}
                </div>

                <button onClick={() => alert("Próximo passo")} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold shadow-lg hover:bg-blue-800 transition-all">Continuar</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
