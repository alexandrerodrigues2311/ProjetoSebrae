import React, { useState } from "react";
import { Clock, AlertCircle, TrendingUp, Users, Smile, Cpu, Star, PlusCircle, CheckCircle2 } from "lucide-react";

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
  const [cpfError, setCpfError] = useState("");
  const [isCpfValid, setIsCpfValid] = useState(false);
  const [formData, setFormData] = useState({ 
    cpf: "", fullName: "", email: "", phone: "", genero: "", raca: "", quilombola: "", pcd: "", tiposPcd: [] as string[], cursos: [] as string[], responses: {} as any, receiveResults: false 
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

  const isFormValid = () => formData.fullName && formData.email && formData.phone && formData.genero && formData.raca && formData.quilombola && formData.pcd;

  const renderLikert = (id: string, question: string) => (
    <div key={id} className="mb-8 p-6 bg-white border border-[#005AA5]/20 rounded-2xl shadow-sm">
      <p className="font-bold mb-4 text-gray-800">{question}</p>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {LIKERT.map((opt, i) => (
          <button key={i} onClick={() => setFormData(p => ({...p, responses: {...p.responses, [id]: i + 1}}))} className={`p-3 text-xs border rounded-xl transition-all ${formData.responses[id] === i + 1 ? 'bg-[#005AA5] text-white' : 'border-[#005AA5] text-[#005AA5] hover:bg-blue-50'}`}>
            {i + 1}. {opt}
          </button>
        ))}
      </div>
    </div>
  );

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
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000" className="w-full h-72 object-cover object-center" />
            <div className="p-10 text-center">
              <h2 className="text-3xl font-black text-gray-800 mb-4">Sua história inspira o futuro.</h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg">Participe da nossa pesquisa e ajude a fortalecer as soluções do Sebrae para quem empreende.</p>
              <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600 font-medium mb-6">
                <Clock size={16} /> É rapidinho: leva menos de 5 minutos.
              </div>
              <button onClick={() => setStep(1)} className="block w-full md:w-auto mx-auto bg-[#005AA5] text-white py-4 px-12 rounded-full font-bold text-lg hover:bg-blue-800 transition-all shadow-lg">Quero deixar minha marca</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border animate-in slide-in-from-right duration-500 space-y-6">
            {!isCpfValid ? (
              <>
                <h2 className="text-2xl font-bold text-[#005AA5]">Identificação: informe seu CPF</h2>
                <input value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14)})} placeholder="000.000.000-00" className="w-full p-4 border-2 rounded-xl" />
                {cpfError && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle size={16}/> {cpfError}</p>}
                <button onClick={() => validateCPF(formData.cpf) ? setIsCpfValid(true) : setCpfError("CPF inválido.")} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Validar</button>
              </>
            ) : (
              <div className="animate-fade-in space-y-6">
                <h2 className="text-2xl font-bold text-[#005AA5]">Sobre Você</h2>
                <div><label className="block font-bold mb-1 text-sm">Nome Completo</label><input onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Como prefere ser tratada(o)?" className="w-full p-4 border rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block font-bold mb-1 text-sm">E-mail</label><input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="exemplo@dominio.com" className="w-full p-4 border rounded-xl" /></div>
                  <div><label className="block font-bold mb-1 text-sm">Telefone / WhatsApp</label><input onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="(31) 99999-9999" className="w-full p-4 border rounded-xl" /></div>
                </div>
                <div className="border-t pt-6"><h3 className="font-bold mb-4">Identidade</h3><div className="grid grid-cols-2 gap-3">{["Mulher Cis", "Homem Cis", "Mulher Trans", "Homem Trans", "Não binário", "Prefiro não informar"].map(g => (<button key={g} onClick={() => setFormData({...formData, genero: g})} className={`p-4 border rounded-xl text-left ${formData.genero === g ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>{g}</button>))}</div></div>
                <div className="border-t pt-6"><h3 className="font-bold mb-3">Qual sua cor ou raça?</h3><div className="grid grid-cols-3 gap-2">{["Amarela", "Branca", "Indígena", "Parda", "Preta", "Prefiro não informar"].map(r => (<button key={r} onClick={() => setFormData({...formData, raca: r})} className={`p-3 border rounded-xl ${formData.raca === r ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>{r}</button>))}</div></div>
                <div className="border-t pt-6"><h3 className="font-bold mb-3">Pessoa quilombola?</h3><div className="flex gap-4">{["Não", "Sim", "Prefiro não informar"].map(q => (<button key={q} onClick={() => setFormData({...formData, quilombola: q})} className={`flex-1 p-3 border rounded-xl ${formData.quilombola === q ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>{q}</button>))}</div></div>
                <div className="border-t pt-6"><h3 className="font-bold mb-3">PcD?</h3><div className="flex gap-4">{["Não", "Sim"].map(o => (<button key={o} onClick={() => setFormData({...formData, pcd: o})} className={`flex-1 p-4 border rounded-xl ${formData.pcd === o ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>{o}</button>))}</div>
                  {formData.pcd === 'Sim' && (<div className="grid grid-cols-1 gap-2 mt-4">{["Deficiência Auditiva", "Deficiência Física", "Deficiência Intelectual", "Deficiência Psicossocial", "Deficiência Visual", "Autismo (TEA)", "Prefiro não informar"].map(t => (<button key={t} onClick={() => setFormData(p => ({...p, tiposPcd: p.tiposPcd.includes(t) ? p.tiposPcd.filter(i => i !== t) : [...p.tiposPcd, t]}))} className={`p-3 border rounded-xl ${formData.tiposPcd.includes(t) ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>{t}</button>))}</div>)}
                </div>
                <div className="flex gap-4 pt-6"><button onClick={() => { setIsCpfValid(false); setFormData({...formData, cpf: ''}); }} className="flex-1 p-4 border border-[#005AA5] text-[#005AA5] rounded-xl font-bold">Voltar</button><button onClick={() => setStep(2)} disabled={!isFormValid()} className={`flex-1 p-4 rounded-xl font-bold ${isFormValid() ? 'bg-[#005AA5] text-white' : 'bg-gray-300'}`}>Continuar</button></div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border animate-in slide-in-from-right duration-500">
            <h2 className="text-2xl font-bold text-[#005AA5] mb-6">Quais cursos você realizou no Sebrae?</h2>
            <div className="grid grid-cols-2 gap-4">
              {COURSES.map(c => (
                <button key={c.id} onClick={() => setFormData({...formData, cursos: formData.cursos.includes(c.id) ? formData.cursos.filter(i => i !== c.id) : [...formData.cursos, c.id]})} className={`p-6 border-2 rounded-2xl flex flex-col items-center text-center ${formData.cursos.includes(c.id) ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>
                  <c.icon className="mb-2" size={32} />
                  <span className="font-bold text-sm">{c.title}</span>
                </button>
              ))}
              <button onClick={() => setFormData({...formData, cursos: formData.cursos.includes('outros') ? formData.cursos.filter(i => i !== 'outros') : [...formData.cursos, 'outros']})} className={`p-6 border-2 rounded-2xl flex flex-col items-center ${formData.cursos.includes('outros') ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>
                  <PlusCircle className="mb-2" size={32} />
                  <span className="font-bold text-sm">Outros</span>
              </button>
            </div>
            <div className="flex gap-4 mt-8"><button onClick={() => setStep(1)} className="flex-1 p-4 border border-[#005AA5] text-[#005AA5] rounded-xl font-bold">Voltar</button><button onClick={() => setStep(3)} className="flex-1 bg-[#005AA5] text-white p-4 rounded-xl font-bold">Continuar</button></div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right">
            {renderLikert("c1", "O curso estava relacionado às minhas necessidades?")}
            {renderLikert("c2", "Tenho um negócio onde o conteúdo pode ser aplicado?")}
            {renderLikert("c3", "O apoio do SEBRAE foi relevante?")}
            <div className="flex gap-4"><button onClick={() => setStep(2)} className="flex-1 p-4 border border-[#005AA5] text-[#005AA5] rounded-xl font-bold">Voltar</button><button onClick={() => setStep(4)} className="flex-1 bg-[#005AA5] text-white p-4 rounded-xl font-bold">Finalizar</button></div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white p-10 rounded-3xl shadow-lg text-center animate-in zoom-in">
            <CheckCircle2 size={64} className="mx-auto text-[#005AA5] mb-4"/>
            <h2 className="text-2xl font-bold mb-4">Obrigado pela sua contribuição!</h2>
            <label className="block mt-6 cursor-pointer"><input type="checkbox" onChange={(e) => setFormData(p => ({...p, receiveResults: e.target.checked}))}/> Desejo receber os resultados desta pesquisa.</label>
          </div>
        )}
      </main>
    </div>
  );
}
