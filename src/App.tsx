import React, { useState } from "react";
import { Clock, AlertCircle, TrendingUp, Users, Smile, Cpu, Star, CheckCircle2 } from "lucide-react";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8yWGHJmONTFshN8rqJIhthd_VFvTpRTeV7jPk931Vab6r_lDstn0Pexf2Ea_m3Lwl/exec"; 

const maskPhone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);

const COURSES = [
  { id: "financas", title: "Gestão Financeira", icon: TrendingUp, qs: ["Após o curso, passei a organizar melhor as finanças do meu negócio.", "O curso contribuiu para melhorar meu controle de custos, despesas e receitas.", "O conhecimento adquirido ajudou a separar melhor os gastos pessoais e recursos do negócio.", "Após o curso, passei a utilizar informações financeiras para tomar decisões com mais segurança.", "O curso contribuiu para compreender melhor o fluxo de caixa, precificação e planejamento financeiro.", "O curso me ajudou a identificar riscos financeiros que podem comprometer a continuidade do negócio.", "Após o curso, passei a avaliar melhor oportunidades de investimento, expansão ou melhoria do negócio.", "O curso contribuiu para tornar minha gestão financeira mais organizada e sustentável."] },
  { id: "pessoas", title: "Gestão de Pessoas", icon: Users, qs: ["O curso contribuiu para melhorar a forma como organizo e conduzo as pessoas no negócio.", "Após o curso, passei a valorizar mais a comunicação, o treinamento e o acompanhamento da equipe.", "O conhecimento adquirido ajudou a melhorar o relacionamento e a coordenação do trabalho.", "O curso ajudou a definir melhor funções, responsabilidades e rotinas.", "Após o curso, passei a acompanhar melhor metas, entregas ou resultados.", "O curso contribuiu para reduzir falhas de comunicação, retrabalho ou desalinhamento.", "O curso ajudou a compreender cuidados importantes na contratação.", "O curso contribuiu para melhorar o ambiente de trabalho e a produtividade."] },
  { id: "atendimento", title: "Atendimento ao Cliente", icon: Smile, qs: ["Após o curso, passei a entender melhor como atender e tratar bem os clientes.", "O curso me ajudou a evitar erros no atendimento aos clientes.", "Após o curso, consigo realizar ajustes no atendimento para atender melhor às expectativas.", "Coloquei em prática os conteúdos aprendidos no atendimento.", "O curso contribuiu para melhorar o relacionamento com os clientes.", "O curso contribuiu para fortalecer a fidelização.", "Passei a observar melhor o perfil e as necessidades individuais de cada cliente.", "Busco atender os clientes levando em conta o perfil de cada um.", "O curso me ajudou a identificar formas de agregar valor ao atendimento.", "Busco armazenar e organizar informações dos clientes para melhorar o relacionamento.", "Utilizo informações prévias para fortalecer conexões e vínculos.", "Busco ouvir, solucionar e responder às reclamações da melhor maneira possível.", "Busco utilizar alternativas digitais para atrair antigos e novos clientes.", "Busco atender com qualidade e agilidade os clientes nas mídias digitais.", "Utilizo ferramentas digitais ou IA para personalizar contatos."] },
  { id: "ia", title: "IA na Prática", icon: Cpu, qs: ["Após o curso, passei a entender melhor o que é Inteligência Artificial.", "O curso me ajudou a diferenciar informações corretas de mitos sobre IA.", "Hoje consigo identificar situações em que a IA pode ser útil para um negócio.", "Após o curso, sinto-me mais preparado(a) para utilizar ferramentas de IA.", "Consigo elaborar comandos ou perguntas mais claras para ferramentas de IA.", "Tenho mais confiança para testar ferramentas de IA quando necessário.", "Passei a usar ou considerar o uso de IA para apoiar tarefas do dia a dia.", "O curso me ajudou a identificar processos que podem ser melhorados com o uso de IA.", "O curso mostrou formas de usar IA para aumentar produtividade e reduzir tempo.", "O curso estimulou novas formas de atender clientes ou organizar atividades.", "O curso me ajudou a compreender cuidados necessários ao usar ferramentas de IA.", "Passei a ter mais atenção com dados pessoais e informações sensíveis ao usar IA."] },
  { id: "emocional", title: "Inteligência Emocional", icon: Star, qs: ["O curso contribuiu para aumentar minha confiança para enfrentar desafios.", "Após o curso, passei a compreender melhor como minhas emoções influenciam minhas decisões.", "O curso me ajudou a lidar melhor com pressões, conflitos ou situações desafiadoras.", "O curso contribuiu para melhorar minha comunicação com clientes e equipe.", "Após o curso, passei a agir com mais equilíbrio e clareza em situações difíceis.", "O curso fortaleceu minha capacidade de liderança, autocontrole ou relacionamento interpessoal.", "O conhecimento adquirido ajudou a melhorar o ambiente de trabalho.", "O curso contribuiu para que eu me sentisse mais preparado(a) para conduzir meu negócio com segurança."] }
];

const COMMON_BLOCKS = [
  { id: "B1", title: "Contexto", questions: ["O curso estava relacionado às minhas necessidades no momento em que o realizei.", "Tenho um negócio, projeto ou interesse onde o conteúdo do curso pode ser aplicado.", "Tenho autonomia ou influência para aplicar os conhecimentos no meu negócio.", "Consegui acompanhar o curso de forma adequada."] },
  { id: "B2", title: "Aplicabilidade", questions: ["O curso apresentou conteúdos úteis para minha realidade.", "Consegui identificar formas de aplicar o que aprendi no meu negócio.", "As orientações do curso foram claras o suficiente para apoiar sua aplicação prática.", "O curso me ajudou a refletir sobre as melhorias que posso realizar."] },
  { id: "B3", title: "Efetividade", questions: ["O curso contribuiu para melhorar minha forma de gerir ou atuar profissionalmente.", "A aplicação dos conteúdos pode gerar melhorias concretas no desempenho.", "O curso contribuiu para que eu tomasse decisões de forma mais estruturada.", "O curso fortaleceu minha capacidade de lidar com problemas ou oportunidades."] },
  { id: "B4", title: "Valor", questions: ["O apoio do SEBRAE foi relevante para meu desenvolvimento.", "As soluções do SEBRAE contribuem para fortalecer pequenos negócios.", "Eu recomendaria este curso para outras pessoas interessadas em empreender."] },
  { id: "B5", title: "Barreiras", questions: ["A falta de tempo dificultou a aplicação dos conhecimentos.", "A falta de recursos dificultou a aplicação dos conhecimentos.", "Ainda preciso de apoio adicional para aplicar melhor os conhecimentos.", "Ainda não tive oportunidade concreta de aplicar os conhecimentos."] }
];

export default function App() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ cpf: "", fullName: "", email: "", phone: "", genero: "", raca: "", quilombola: "", pcd: "", tiposPcd: [] as string[], cursos: [] as string[], responses: {} as any });
  const [isCpfValid, setIsCpfValid] = useState(false);

  const isFormValid = () => formData.fullName && formData.email && formData.phone && formData.genero && formData.raca && formData.quilombola && formData.pcd;

  const saveData = async () => {
    await fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(formData) });
    setStep(99);
  };

  const renderLikert = (id: string, q: string) => (
    <div key={id} className="mb-6 p-6 bg-white border border-[#005AA5]/20 rounded-2xl shadow-sm">
      <p className="font-bold mb-4">{q}</p>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {[1,2,3,4,5,6].map(n => (
          <button key={n} onClick={() => setFormData(p => ({...p, responses: {...p.responses, [id]: n}}))} className={`p-3 border rounded-xl ${formData.responses[id] === n ? 'bg-[#005AA5] text-white' : 'border-[#005AA5] text-[#005AA5]'}`}>{n}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-0">
      <header className="bg-white border-b py-4 px-6 sticky top-0 z-50"><div className="max-w-5xl mx-auto grid grid-cols-[120px_1fr_120px] items-center"><img src="https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg" alt="Sebrae" className="h-8"/><h1 className="text-[#005AA5] font-bold text-xs uppercase text-center truncate">Mapeamento de Cadeias Produtivas e Efetividade</h1><div/></div></header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        {step === 0 && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in"><img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000" className="w-full h-72 object-cover"/><div className="p-10 text-center"><h2 className="text-3xl font-black mb-4">Sua história inspira.</h2><p className="mb-8">Participe da pesquisa.</p><div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full mb-6"><Clock size={16}/> Menos de 5 minutos.</div><button onClick={() => setStep(1)} className="bg-[#005AA5] text-white py-4 px-12 rounded-full font-bold">Quero deixar minha marca</button></div></div>
        )}
        {step === 1 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border animate-in slide-in-from-right space-y-4">
            <h2 className="text-2xl font-bold text-[#005AA5]">Identificação: informe seu CPF</h2>
            {!isCpfValid ? (
              <><input value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})} placeholder="000.000.000-00" className="w-full p-4 border-2 rounded-xl" /><button onClick={() => setIsCpfValid(true)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Validar</button></>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <input onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Nome Completo" className="w-full p-4 border rounded-xl" />
                <div className="grid grid-cols-2 gap-4"><input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email" className="w-full p-4 border rounded-xl" /><input value={formData.phone} onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} placeholder="(31) 99999-9999" className="w-full p-4 border rounded-xl" /></div>
                {/* [Blocos de Perfil: Identidade, Raça, etc] */}
                <button onClick={() => setStep(2)} disabled={!isFormValid()} className={`w-full p-4 rounded-xl font-bold ${isFormValid() ? 'bg-[#005AA5] text-white' : 'bg-gray-300'}`}>Continuar</button>
              </div>
            )}
          </div>
        )}
        {step >= 2 && step <= 6 && (
          <div className="animate-in slide-in-from-right">
            <h2 className="text-2xl font-bold mb-6 text-[#005AA5]">{COMMON_BLOCKS[step - 2].title}</h2>
            {COMMON_BLOCKS[step - 2].qs.map((q, i) => renderLikert(`${COMMON_BLOCKS[step - 2].id}_${i}`, q))}
            <button onClick={() => setStep(step + 1)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Próximo</button>
          </div>
        )}
        {step === 7 && (
          <div className="animate-in slide-in-from-right">
            {formData.cursos.length > 0 && COURSES.find(c => c.id === formData.cursos[0])?.qs.map((q, i) => renderLikert(`spec_${i}`, q))}
            <button onClick={saveData} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Enviar</button>
          </div>
        )}
        {step === 99 && <div className="text-center animate-in zoom-in"><CheckCircle2 size={64} className="mx-auto text-[#005AA5] mb-4"/><h2 className="text-2xl font-bold">Obrigado!</h2></div>}
      </main>
    </div>
  );
}
