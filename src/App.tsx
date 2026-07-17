import React, { useState } from "react";
import { Clock, AlertCircle, TrendingUp, Users, Smile, Cpu, Star, XCircle } from "lucide-react";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8yWGHJmONTFshN8rqJIhthd_VFvTpRTeV7jPk931Vab6r_lDstn0Pexf2Ea_m3Lwl/exec"; 

const maskPhone = (value: string) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
const maskCPF = (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);

const COURSES = [
  { id: "financas", title: "Gestão Financeira", icon: TrendingUp },
  { id: "pessoas", title: "Gestão de Pessoas", icon: Users },
  { id: "atendimento", title: "Atendimento ao Cliente", icon: Smile },
  { id: "ia", title: "IA na Prática", icon: Cpu },
  { id: "emocional", title: "Inteligência Emocional", icon: Star }
];

export default function App() {
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [cpfError, setCpfError] = useState("");
  const [isCpfValid, setIsCpfValid] = useState(false);
  const [formData, setFormData] = useState({ 
    cpf: "", fullName: "", email: "", phone: "", genero: "", raca: "", quilombola: "", pcd: "", tiposPcd: "", cursos: [] as string[] 
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

  const handleCpfSubmit = () => {
    if (validateCPF(formData.cpf)) {
      setCpfError("");
      setIsCpfValid(true);
    } else {
      setCpfError("CPF inválido. Por favor, verifique.");
      setIsCpfValid(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-0">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto grid grid-cols-[120px_1fr_120px] items-center">
          <img src="https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg" alt="Sebrae" className="h-8" />
          <h1 className="text-[#005AA5] font-bold text-xs uppercase text-center truncate px-4">
            Mapeamento de Cadeias Produtivas, Vocações Regionais e Efetividade das Soluções do Sebrae
          </h1>
          <div /> 
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {step === 0 && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in duration-500">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000" 
              alt="Empreendedores focados" 
              className="w-full h-72 object-cover object-center" 
            />
            <div className="p-10 text-center">
              <h2 className="text-3xl font-black text-gray-800 mb-4">Sua história inspira o futuro.</h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                Participe da nossa pesquisa e ajude a fortalecer as soluções do Sebrae para quem empreende. Sua voz é o motor da nossa inovação.
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

        {step === 1 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border animate-in slide-in-from-right duration-500 space-y-6">
            {!isCpfValid ? (
              <>
                <h2 className="text-2xl font-bold text-[#005AA5]">Identificação</h2>
                <input value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})} placeholder="Digite seu CPF" className="w-full p-4 border-2 rounded-xl" />
                {cpfError && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle size={16}/> {cpfError}</p>}
                <div className="flex gap-4">
                    <button onClick={() => setStep(0)} className="flex-1 p-4 border border-[#005AA5] rounded-xl font-bold">Voltar</button>
                    <button onClick={handleCpfSubmit} className="flex-1 bg-[#005AA5] text-white p-4 rounded-xl font-bold">Validar</button>
                </div>
              </>
            ) : (
              <div className="animate-fade-in space-y-6">
                <h2 className="text-2xl font-bold text-[#005AA5]">Sobre Você</h2>
                <div><label className="block font-bold mb-1 text-sm">Nome Completo</label><input onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Como prefere ser tratada(o)?" className="w-full p-4 border rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block font-bold mb-1 text-sm">E-mail</label><input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-4 border rounded-xl" /></div>
                  <div><label className="block font-bold mb-1 text-sm">Telefone / WhatsApp</label><input value={formData.phone} onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} className="w-full p-4 border rounded-xl" /></div>
                </div>
                <div className="border-t pt-6">
                  <h3 className="font-bold mb-4 text-lg">Identidade</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: "Mulher Cis", d: "Registrada mulher ao nascer." }, { l: "Homem Cis", d: "Registrado homem ao nascer." },
                      { l: "Mulher Trans", d: "Identifica-se mulher, registrada outro." }, { l: "Homem Trans", d: "Identifica-se homem, registrado outro." },
                      { l: "Não binário", d: "Não se identifica exclusivamente." }, { l: "Prefiro não informar", d: "" }
                    ].map(g => (
                      <button key={g.l} onClick={() => setFormData({...formData, genero: g.l})} className={`p-4 border rounded-xl text-left ${formData.genero === g.l ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>
                        <div className="font-bold text-sm">{g.l}</div>
                        <div className="text-xs opacity-80">{g.d}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-6">
                    <h3 className="font-bold mb-3">Qual sua cor ou raça?</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {["Amarela", "Branca", "Indígena", "Parda", "Preta", "Prefiro não informar"].map(r => (
                        <button key={r} onClick={() => setFormData({...formData, raca: r})} className={`p-3 border rounded-xl ${formData.raca === r ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>{r}</button>
                        ))}
                    </div>
                </div>
                <div className="border-t pt-6">
                    <h3 className="font-bold mb-3">Pessoa quilombola?</h3>
                    <div className="flex gap-4">
                        {["Não", "Sim", "Prefiro não informar"].map(q => (
                            <button key={q} onClick={() => setFormData({...formData, quilombola: q})} className={`flex-1 p-3 border rounded-xl ${formData.quilombola === q ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>{q}</button>
                        ))}
                    </div>
                </div>
                <div className="border-t pt-6">
                  <h3 className="font-bold mb-3">Pessoa com Deficiência (PcD)?</h3>
                  <div className="flex gap-4">
                    {["Não", "Sim"].map(o => (
                      <button key={o} onClick={() => setFormData({...formData, pcd: o})} className={`flex-1 p-4 border rounded-xl ${formData.pcd === o ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>{o}</button>
                    ))}
                  </div>
                  {formData.pcd === 'Sim' && (
                    <div className="grid grid-cols-1 gap-2 mt-4">
                        {["Auditiva", "Física", "Intelectual", "Psicossocial", "Visual", "Autismo (TEA)", "Prefiro não informar"].map(t => (
                            <button key={t} onClick={() => setFormData({...formData, tiposPcd: t})} className={`p-3 border rounded-xl ${formData.tiposPcd === t ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>{t}</button>
                        ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-4 pt-4">
                    <button onClick={() => setIsCpfValid(false)} className="flex-1 p-4 border border-[#005AA5] rounded-xl font-bold">Voltar</button>
                    <button onClick={() => setStep(2)} className="flex-1 bg-[#005AA5] text-white p-4 rounded-xl font-bold">Continuar</button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border animate-in slide-in-from-right duration-500">
            <h2 className="text-2xl font-bold text-[#005AA5] mb-6">Quais cursos realizou?</h2>
            <div className="grid grid-cols-2 gap-4">
              {COURSES.map(c => (
                <button key={c.id} onClick={() => setFormData({...formData, cursos: formData.cursos.includes(c.id) ? formData.cursos.filter(i => i !== c.id) : [...formData.cursos, c.id]})} className={`p-6 border-2 rounded-2xl flex flex-col items-center text-center ${formData.cursos.includes(c.id) ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>
                  <c.icon className="mb-2" size={32} />
                  <span className="font-bold">{c.title}</span>
                </button>
              ))}
              <button onClick={() => setFormData({...formData, cursos: ['nenhum']})} className={`p-6 border-2 rounded-2xl flex flex-col items-center ${formData.cursos.includes('nenhum') ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>
                  <XCircle className="mb-2" size={32} />
                  <span className="font-bold">Nenhum</span>
              </button>
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(1)} className="flex-1 p-4 border border-[#005AA5] rounded-xl font-bold">Voltar</button>
              <button onClick={() => alert("Finalizado!")} className="flex-1 bg-[#005AA5] text-white p-4 rounded-xl font-bold">Finalizar</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
