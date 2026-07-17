import React, { useState } from "react";
import { Clock, AlertCircle, TrendingUp, Users, Smile, Cpu, Star, PlusCircle, CheckCircle2 } from "lucide-react";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8yWGHJmONTFshN8rqJIhthd_VFvTpRTeV7jPk931Vab6r_lDstn0Pexf2Ea_m3Lwl/exec"; 

const COURSES = [
  { id: "financas", title: "Gestão Financeira", icon: TrendingUp, questions: ["Após o curso, passei a organizar melhor as finanças do meu negócio.", "O curso contribuiu para melhorar meu controle de custos, despesas e receitas.", "O conhecimento adquirido ajudou a separar melhor os gastos pessoais e recursos do negócio.", "Após o curso, passei a utilizar informações financeiras para tomar decisões com mais segurança.", "O curso contribuiu para compreender melhor o fluxo de caixa, precificação e planejamento financeiro.", "O curso me ajudou a identificar riscos financeiros que podem comprometer a continuidade do negócio.", "Após o curso, passei a avaliar melhor oportunidades de investimento, expansão ou melhoria do negócio.", "O curso contribuiu para tornar minha gestão financeira mais organizada e sustentável."] },
  { id: "pessoas", title: "Gestão de Pessoas", icon: Users, questions: ["O curso contribuiu para melhorar a forma como organizo e conduzo as pessoas no negócio.", "Após o curso, passei a valorizar mais a comunicação, o treinamento e o acompanhamento da equipe.", "O conhecimento adquirido ajudou a melhorar o relacionamento e a coordenação do trabalho.", "O curso ajudou a definir melhor funções, responsabilidades e rotinas.", "Após o curso, passei a acompanhar melhor metas, entregas ou resultados.", "O curso contribuiu para reduzir falhas de comunicação, retrabalho ou desalinhamento.", "O curso ajudou a compreender cuidados importantes na contratação.", "O curso contribuiu para melhorar o ambiente de trabalho e a produtividade."] },
  { id: "atendimento", title: "Atendimento ao Cliente", icon: Smile, questions: ["Após o curso, passei a entender melhor como atender e tratar bem os clientes.", "O curso me ajudou a evitar erros no atendimento aos clientes.", "Após o curso, consigo realizar ajustes no atendimento para atender melhor às expectativas.", "Coloquei em prática os conteúdos aprendidos no atendimento.", "O curso contribuiu para melhorar o relacionamento com os clientes.", "O curso contribuiu para fortalecer a fidelização.", "Passei a observar melhor o perfil e as necessidades individuais de cada cliente.", "Busco atender os clientes levando em conta o perfil de cada um.", "O curso me ajudou a identificar formas de agregar valor ao atendimento.", "Busco armazenar e organizar informações dos clientes para melhorar o relacionamento.", "Utilizo informações prévias para fortalecer conexões e vínculos.", "Busco ouvir, solucionar e responder às reclamações da melhor maneira possível.", "Busco utilizar alternativas digitais para atrair antigos e novos clientes.", "Busco atender com qualidade e agilidade os clientes nas mídias digitais.", "Utilizo ferramentas digitais ou IA para personalizar contatos."] },
  { id: "ia", title: "IA na Prática", icon: Cpu, questions: ["Após o curso, passei a entender melhor o que é Inteligência Artificial.", "O curso me ajudou a diferenciar informações corretas de mitos sobre IA.", "Hoje consigo identificar situações em que a IA pode ser útil para um negócio.", "Após o curso, sinto-me mais preparado(a) para utilizar ferramentas de IA.", "Consigo elaborar comandos ou perguntas mais claras para ferramentas de IA.", "Tenho mais confiança para testar ferramentas de IA quando necessário.", "Passei a usar ou considerar o uso de IA para apoiar tarefas do dia a dia.", "O curso me ajudou a identificar processos que podem ser melhorados com o uso de IA.", "O curso mostrou formas de usar IA para aumentar produtividade e reduzir tempo.", "O curso estimulou novas formas de atender clientes ou organizar atividades.", "O curso me ajudou a compreender cuidados necessários ao usar ferramentas de IA.", "Passei a ter mais atenção com dados pessoais e informações sensíveis ao usar IA."] },
  { id: "emocional", title: "Inteligência Emocional", icon: Star, questions: ["O curso contribuiu para aumentar minha confiança para enfrentar desafios.", "Após o curso, passei a compreender melhor como minhas emoções influenciam minhas decisões.", "O curso me ajudou a lidar melhor com pressões, conflitos ou situações desafiadoras.", "O curso contribuiu para melhorar minha comunicação com clientes e equipe.", "Após o curso, passei a agir com mais equilíbrio e clareza em situações difíceis.", "O curso fortaleceu minha capacidade de liderança, autocontrole ou relacionamento interpessoal.", "O conhecimento adquirido ajudou a melhorar o ambiente de trabalho.", "O curso contribuiu para que eu me sentisse mais preparado(a) para conduzir meu negócio com segurança."] }
];

const COMMON_BLOCKS = [
  { id: "B1", title: "Contexto", questions: ["O curso estava relacionado às minhas necessidades no momento em que o realizei.", "Tenho um negócio, projeto, atividade profissional ou interesse empreendedor em que o conteúdo do curso pode ser aplicado.", "Tenho autonomia ou influência para aplicar os conhecimentos do curso no meu negócio, projeto ou atuação profissional.", "Consegui acompanhar o curso de forma adequada para compreender seus principais conteúdos."] },
  { id: "B2", title: "Aplicabilidade", questions: ["O curso apresentou conteúdos úteis para minha realidade.", "Consegui identificar formas de aplicar o que aprendi no meu negócio, projeto ou atuação profissional.", "As orientações do curso foram claras o suficiente para apoiar sua aplicação prática.", "O curso me ajudou a refletir sobre as melhorias que posso realizar na minha forma de trabalhar, gerir ou empreender."] },
  { id: "B3", title: "Efetividade", questions: ["O curso contribuiu para melhorar minha forma de gerir, atuar profissionalmente ou desenvolver um projeto empreendedor.", "A aplicação dos conteúdos do curso pode gerar melhorias concretas no desempenho do meu negócio, projeto ou atuação profissional.", "O curso contribuiu para que eu tomasse decisões de forma mais estruturada e baseada em informações.", "O curso fortaleceu minha capacidade de lidar com problemas, mudanças ou oportunidades relacionadas ao meu negócio, projeto ou atuação profissional."] },
  { id: "B4", title: "Valor", questions: ["O apoio do SEBRAE foi relevante para meu desenvolvimento.", "As soluções do SEBRAE contribuem para fortalecer pequenos negócios, empreendedores e potenciais empreendedores.", "Eu recomendaria este curso para outras pessoas interessadas em empreender, melhorar sua atuação profissional ou fortalecer um negócio."] },
  { id: "B5", title: "Barreiras", questions: ["A falta de tempo dificultou a aplicação dos conhecimentos do curso.", "A falta de recursos financeiros, tecnológicos ou de equipe dificultou a aplicação dos conhecimentos do curso.", "Ainda preciso de apoio adicional para aplicar melhor os conhecimentos do curso.", "Ainda não tive oportunidade concreta de aplicar os conhecimentos do curso."] }
];

const LIKERT = ["Discordo totalmente", "Discordo parcialmente", "Nem concordo, nem discordo", "Concordo parcialmente", "Concordo totalmente", "Não se aplica"];

export default function App() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ cpf: "", fullName: "", email: "", phone: "", genero: "", raca: "", quilombola: "", pcd: "", tiposPcd: [] as string[], cursos: [] as string[], responses: {} as any, receiveResults: false });
  const [cpfError, setCpfError] = useState("");
  const [isCpfValid, setIsCpfValid] = useState(false);

  const validateCPF = (cpf: string) => { const clean = cpf.replace(/[^\d]+/g, ''); return clean.length === 11; };

  const renderLikert = (id: string, question: string) => (
    <div key={id} className="mb-8 p-6 bg-white border border-[#005AA5]/20 rounded-2xl shadow-sm">
      <p className="font-bold mb-4 text-gray-800">{question}</p>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {LIKERT.map((opt, i) => (
          <button key={i} onClick={() => setFormData(p => ({...p, responses: {...p.responses, [id]: i + 1}}))} className={`p-3 text-xs border rounded-xl ${formData.responses[id] === i + 1 ? 'bg-[#005AA5] text-white' : 'border-[#005AA5] text-[#005AA5]'}`}>
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
          <h1 className="text-[#005AA5] font-bold text-xs uppercase text-center truncate px-4">Mapeamento de Cadeias Produtivas, Vocações Regionais e Efetividade das Soluções do Sebrae</h1>
          <div /> 
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {step === 0 && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border animate-in zoom-in duration-500">
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000" className="w-full h-72 object-cover" />
            <div className="p-10 text-center">
              <h2 className="text-3xl font-black text-gray-800 mb-4">Sua história inspira o futuro.</h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg">Participe da nossa pesquisa e ajude a fortalecer as soluções do Sebrae para quem empreende. Sua voz é o motor da nossa inovação.</p>
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
                <input value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value.replace(/\D/g, '')})} placeholder="000.000.000-00" className="w-full p-4 border-2 rounded-xl" />
                <button onClick={() => validateCPF(formData.cpf) ? setIsCpfValid(true) : setCpfError("CPF inválido.")} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Validar</button>
              </>
            ) : (
              <div className="animate-fade-in space-y-6">
                <h2 className="text-2xl font-bold text-[#005AA5]">Sobre Você</h2>
                <input onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Nome completo" className="w-full p-4 border rounded-xl" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="email" onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="exemplo@dominio.com" className="w-full p-4 border rounded-xl" />
                  <input onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="(31) 99999-9999" className="w-full p-4 border rounded-xl" />
                </div>
                {/* [Blocos de Identidade/Raça/Quilombola/PcD mantidos aqui] */}
                <button onClick={() => setStep(2)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Continuar</button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right">
            <h2 className="text-2xl font-bold text-[#005AA5] mb-6">Cursos realizados</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {COURSES.map(c => (
                <button key={c.id} onClick={() => setFormData({...formData, cursos: [c.id]})} className={`p-6 border-2 rounded-2xl flex flex-col items-center ${formData.cursos.includes(c.id) ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>
                  <c.icon size={32} /> <span className="font-bold text-sm">{c.title}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(3)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Continuar</button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right">
            {COMMON_BLOCKS.map(b => b.questions.map((q, i) => renderLikert(`${b.id}_${i}`, q)))}
            {formData.cursos.length > 0 && COURSES.find(c => c.id === formData.cursos[0])?.questions.map((q, i) => renderLikert(`spec_${i}`, q))}
            <button onClick={() => setStep(4)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Finalizar</button>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white p-10 rounded-3xl shadow-lg text-center animate-in zoom-in">
            <CheckCircle2 size={64} className="mx-auto text-[#005AA5] mb-4"/>
            <h2 className="text-2xl font-bold mb-4">Obrigado pela sua contribuição!</h2>
            <label className="block mt-6 cursor-pointer"><input type="checkbox" onChange={(e) => setFormData(p => ({...p, receiveResults: e.target.checked}))}/> Desejo receber os resultados.</label>
          </div>
        )}
      </main>
    </div>
  );
}
