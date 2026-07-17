import React, { useState } from "react";
import { Clock, AlertCircle, TrendingUp, Users, Smile, Cpu, Star, CheckCircle2 } from "lucide-react";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8yWGHJmONTFshN8rqJIhthd_VFvTpRTeV7jPk931Vab6r_lDstn0Pexf2Ea_m3Lwl/exec"; 

const maskPhone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);

const COURSES = [
  { id: "financas", title: "Gestão Financeira", icon: TrendingUp, qs: ["Passei a organizar melhor as finanças do meu negócio.", "Melhorei o controle de custos, despesas e receitas.", "Ajuda a separar gastos pessoais e do negócio.", "Decisões com mais segurança.", "Compreendo melhor fluxo de caixa e precificação.", "Identifico riscos financeiros.", "Avalio melhor oportunidades de investimento.", "Gestão financeira mais organizada e sustentável."] },
  { id: "pessoas", title: "Gestão de Pessoas", icon: Users, qs: ["Melhorei a organização e condução de pessoas.", "Valorizo comunicação e acompanhamento da equipe.", "Melhorei o relacionamento e coordenação.", "Defini melhor funções e rotinas.", "Acompanho melhor metas e resultados.", "Reduzi falhas de comunicação e retrabalho.", "Cuidados importantes na contratação.", "Melhorei o ambiente de trabalho."] },
  { id: "atendimento", title: "Atendimento ao Cliente", icon: Smile, qs: ["Entendo melhor como atender e tratar bem os clientes.", "Evito erros no atendimento.", "Realizo ajustes nas expectativas dos clientes.", "Pratico conteúdos aprendidos.", "Melhorei o relacionamento com os clientes.", "Fortaleci a fidelização.", "Observo o perfil e necessidades individuais.", "Atendo levando em conta o perfil.", "Agrego valor ao atendimento.", "Organizo informações dos clientes.", "Fortaleço conexões e vínculos.", "Soluciono reclamações da melhor maneira.", "Utilizo alternativas digitais para atrair clientes.", "Atendo com qualidade nas mídias digitais.", "Utilizo IA para personalizar contatos."] },
  { id: "ia", title: "IA na Prática", icon: Cpu, qs: ["Entendo melhor o que é IA.", "Diferencio fatos de mitos sobre IA.", "Identifico situações onde IA é útil.", "Sinto-me preparado para utilizar IA.", "Elaboro comandos claros.", "Confiança para testar ferramentas.", "Uso IA para tarefas do dia a dia.", "Identifico processos que podem melhorar com IA.", "Uso IA para aumentar produtividade.", "IA estimula novas formas de criar conteúdos.", "Compreendo cuidados ao usar IA.", "Atenção com dados pessoais ao usar IA."] },
  { id: "emocional", title: "Inteligência Emocional", icon: Star, qs: ["Confiança para enfrentar desafios.", "Compreendo como emoções influenciam decisões.", "Lido melhor com pressões e conflitos.", "Melhorei comunicação com clientes e equipe.", "Ajo com equilíbrio em situações difíceis.", "Fortaleci liderança e autocontrole.", "Melhorei o ambiente de trabalho.", "Sinto-me preparado para conduzir o negócio."] }
];

const COMMON_BLOCKS = [
  { id: "B1", title: "Contexto", questions: ["Curso relacionado às minhas necessidades.", "Conteúdo aplicável ao meu negócio/projeto.", "Tenho autonomia para aplicar os conhecimentos.", "Acompanhei o curso adequadamente."] },
  { id: "B2", title: "Aplicabilidade", questions: ["Conteúdos úteis para minha realidade.", "Identifiquei formas de aplicar o aprendido.", "Orientações claras para prática.", "Refleti sobre melhorias no meu trabalho/gestão."] },
  { id: "B3", title: "Efetividade", questions: ["Contribuiu para melhorar minha gestão/atuação.", "Aplicação gera melhorias concretas no desempenho.", "Tomo decisões de forma mais estruturada.", "Fortaleceu capacidade de lidar com problemas."] },
  { id: "B4", title: "Valor Institucional", questions: ["Apoio do SEBRAE foi relevante.", "Soluções SEBRAE fortalecem pequenos negócios.", "Recomendaria este curso para outras pessoas."] },
  { id: "B5", title: "Barreiras", questions: ["Falta de tempo dificultou a aplicação.", "Falta de recursos dificultou a aplicação.", "Preciso de apoio adicional.", "Ainda não tive oportunidade de aplicar."] }
];

export default function App() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ cpf: "", fullName: "", email: "", phone: "", genero: "", raca: "", quilombola: "", pcd: "", tiposPcd: [] as string[], cursos: [] as string[], responses: {} as any });
  const [isCpfValid, setIsCpfValid] = useState(false);
  
  const saveData = async () => {
    try {
      await fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(formData) });
      setStep(99);
    } catch (e) { alert("Erro ao enviar. Tente novamente."); }
  };

  const renderLikert = (id: string, question: string) => (
    <div className="mb-6 p-6 bg-white border border-[#005AA5]/20 rounded-2xl shadow-sm">
      <p className="font-bold mb-4">{question}</p>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {[1,2,3,4,5,6].map(n => (
          <button key={n} onClick={() => setFormData(p => ({...p, responses: {...p.responses, [id]: n}}))} className={`p-3 border rounded-xl ${formData.responses[id] === n ? 'bg-[#005AA5] text-white' : 'border-[#005AA5] text-[#005AA5]'}`}>{n}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-0">
      <header className="bg-white border-b py-4 px-6 sticky top-0 z-50"><div className="max-w-5xl mx-auto text-center font-bold text-[#005AA5]">Mapeamento SEBRAE</div></header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        {step === 0 && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in">
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000" className="w-full h-72 object-cover" />
            <div className="p-10 text-center"><h2 className="text-3xl font-black mb-4">Sua história inspira.</h2><p className="mb-8">Participe da pesquisa.</p><button onClick={() => setStep(1)} className="bg-[#005AA5] text-white py-4 px-12 rounded-full font-bold">Quero deixar minha marca</button></div>
          </div>
        )}
        {step === 1 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border animate-in slide-in-from-right">
            <h2 className="text-2xl font-bold mb-6 text-[#005AA5]">Identificação</h2>
            {!isCpfValid ? (
              <><input value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})} placeholder="000.000.000-00" className="w-full p-4 border-2 rounded-xl" /><button onClick={() => setIsCpfValid(true)} className="w-full mt-4 bg-[#005AA5] text-white p-4 rounded-xl font-bold">Validar</button></>
            ) : (
              <div className="space-y-4">
                <input onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Nome Completo" className="w-full p-4 border rounded-xl" />
                <div className="grid grid-cols-2 gap-4"><input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email" className="w-full p-4 border rounded-xl" /><input value={formData.phone} onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} placeholder="(31) 99999-9999" className="w-full p-4 border rounded-xl" /></div>
                <button onClick={() => setStep(2)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Continuar</button>
              </div>
            )}
          </div>
        )}
        {step >= 2 && step <= 6 && (
          <div className="animate-in slide-in-from-right">
            {COMMON_BLOCKS[step - 2].questions.map((q, i) => renderLikert(`${COMMON_BLOCKS[step - 2].id}_${i}`, q))}
            <button onClick={() => setStep(step + 1)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Próximo Bloco</button>
          </div>
        )}
        {step === 7 && (
          <div className="animate-in slide-in-from-right">
            {COURSES.find(c => c.id === formData.cursos[0])?.qs.map((q, i) => renderLikert(`spec_${i}`, q))}
            <button onClick={saveData} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Enviar</button>
          </div>
        )}
        {step === 99 && <div className="text-center animate-in zoom-in"><CheckCircle2 size={64} className="mx-auto text-[#005AA5] mb-4"/><h2 className="text-2xl font-bold">Obrigado pela sua contribuição!</h2></div>}
      </main>
    </div>
  );
}
