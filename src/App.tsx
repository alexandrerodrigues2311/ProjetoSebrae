import React, { useState } from "react";
import { Clock } from "lucide-react";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8yWGHJmONTFshN8rqJIhthd_VFvTpRTeV7jPk931Vab6r_lDstn0Pexf2Ea_m3Lwl/exec"; 

const maskPhone = (value: string) => {
  return value.replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
};

export default function App() {
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
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
      const dataToSave = { ...formData, Data: new Date().toISOString() };
      await fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(dataToSave) });
      alert("Enviado com sucesso!");
    } catch (e) { alert("Erro ao enviar"); } finally { setIsSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4">
      <header className="bg-white border-b py-4 px-6 mb-8 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <img src="https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg" alt="Sebrae" className="h-8" />
          <h1 className="text-[#005AA5] font-bold text-xs uppercase hidden md:block">Mapeamento de Cadeias Produtivas e Efetividade</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {step === 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-10 text-center">
            <h2 className="text-3xl font-black mb-4">Sua história inspira o futuro.</h2>
            <button onClick={() => setStep(1)} className="bg-[#005AA5] text-white py-4 px-12 rounded-full font-bold">Quero deixar minha marca</button>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border">
            <h2 className="text-2xl font-bold mb-6">Sobre Você</h2>
            <input onChange={(e) => { setFormData({...formData, cpf: e.target.value}); setIsCpfValid(validateCPF(e.target.value)); }} placeholder="Digite seu CPF" className="w-full p-4 mb-6 border rounded-xl" />
            
            {isCpfValid && (
              <div className="space-y-6 animate-in fade-in duration-700">
                <input onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Como quer ser chamado?" className="w-full p-4 border rounded-xl" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="E-mail" className="p-4 border rounded-xl" />
                  <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} placeholder="(DD) 9XXXX-XXXX" className="p-4 border rounded-xl" />
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-bold mb-4">Identidade de Gênero</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: "Mulher Cis", d: "Identifica-se como mulher e foi registrada com esse gênero ao nascer." },
                      { l: "Homem Cis", d: "Identifica-se como homem e foi registrado com esse gênero ao nascer." },
                      { l: "Mulher Trans", d: "Identifica-se como mulher, mas foi registrada com outro gênero ao nascer." },
                      { l: "Homem Trans", d: "Identifica-se como homem, mas foi registrado com outro gênero ao nascer." },
                      { l: "Não binário", d: "Não se identifica exclusivamente como homem ou como mulher." },
                      { l: "Prefiro não informar", d: "" }
                    ].map(g => (
                      <button key={g.l} onClick={() => setFormData({...formData, genero: g.l})} className={`p-4 border rounded-xl text-left ${formData.genero === g.l ? 'bg-blue-50 border-blue-500' : ''}`}>
                        <div className="font-bold text-sm">{g.l}</div>
                        <div className="text-xs text-gray-500">{g.d}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                    <h3 className="font-bold mb-4">Você é Pessoa com Deficiência (PcD)?</h3>
                    <div className="flex gap-4 mb-4">
                        {['Não', 'Sim'].map(o => (
                            <button key={o} onClick={() => setFormData({...formData, pcd: o})} className={`flex-1 p-4 border rounded-xl ${formData.pcd === o ? 'bg-green-600 text-white' : ''}`}>{o}</button>
                        ))}
                    </div>
                    {formData.pcd === 'Sim' && (
                        <select onChange={(e) => setFormData({...formData, tiposPcd: e.target.value})} className="w-full p-4 border rounded-xl">
                            {["Deficiência Auditiva", "Deficiência Física", "Deficiência Intelectual", "Deficiência Psicossocial", "Deficiência Visual", "Autismo (TEA)", "Prefiro não informar"].map(t => <option key={t}>{t}</option>)}
                        </select>
                    )}
                </div>

                <button onClick={saveData} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Finalizar</button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
