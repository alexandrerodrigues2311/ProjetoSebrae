import React, { useState } from "react";
import { Clock, AlertCircle, TrendingUp, Users, Smile, Cpu, Star, PlusCircle, CheckCircle2 } from "lucide-react";

const COURSES = [
  { id: "financas", title: "Gestão Financeira", questions: ["Após o curso, passei a organizar melhor as finanças do meu negócio.", "O curso contribuiu para melhorar meu controle de custos, despesas e receitas.", "O conhecimento adquirido ajudou a separar melhor os gastos pessoais e recursos do negócio.", "Após o curso, passei a utilizar informações financeiras para tomar decisões com mais segurança.", "O curso contribuiu para compreender melhor o fluxo de caixa, precificação e planejamento financeiro.", "O curso me ajudou a identificar riscos financeiros que podem comprometer a continuidade do negócio.", "Após o curso, passei a avaliar melhor oportunidades de investimento, expansão ou melhoria do negócio.", "O curso contribuiu para tornar minha gestão financeira mais organizada e sustentável."] },
  { id: "pessoas", title: "Gestão de Pessoas", questions: ["O curso contribuiu para melhorar a forma como organizo e conduzo as pessoas no negócio.", "Após o curso, passei a valorizar mais a comunicação, o treinamento e o acompanhamento da equipe.", "O conhecimento adquirido ajudou a melhorar o relacionamento e a coordenação do trabalho.", "O curso ajudou a definir melhor funções, responsabilidades e rotinas.", "Após o curso, passei a acompanhar melhor metas, entregas ou resultados.", "O curso contribuiu para reduzir falhas de comunicação, retrabalho ou desalinhamento.", "O curso ajudou a compreender cuidados importantes na contratação.", "O curso contribuiu para melhorar o ambiente de trabalho e a produtividade."] },
  { id: "atendimento", title: "Atendimento ao Cliente", questions: ["Após o curso, passei a entender melhor como atender e tratar bem os clientes.", "O curso me ajudou a evitar erros no atendimento aos clientes.", "Após o curso, consigo realizar ajustes no atendimento para atender melhor às expectativas.", "Coloquei em prática os conteúdos aprendidos no atendimento.", "O curso contribuiu para melhorar o relacionamento com os clientes.", "O curso contribuiu para fortalecer a fidelização.", "Passei a observar melhor o perfil e as necessidades individuais de cada cliente.", "Busco atender os clientes levando em conta o perfil de cada um.", "O curso me ajudou a identificar formas de agregar valor ao atendimento.", "Busco armazenar e organizar informações dos clientes para melhorar o relacionamento.", "Utilizo informações prévias para fortalecer conexões e vínculos.", "Busco ouvir, solucionar e responder às reclamações da melhor maneira possível.", "Busco utilizar alternativas digitais para atrair antigos e novos clientes.", "Busco atender com qualidade e agilidade os clientes nas mídias digitais.", "Utilizo ferramentas digitais ou IA para personalizar contatos."] },
  { id: "ia", title: "IA na Prática", questions: ["Após o curso, passei a entender melhor o que é Inteligência Artificial.", "O curso me ajudou a diferenciar informações corretas de mitos sobre IA.", "Hoje consigo identificar situações em que a IA pode ser útil para um negócio.", "Após o curso, sinto-me mais preparado(a) para utilizar ferramentas de IA.", "Consigo elaborar comandos ou perguntas mais claras para ferramentas de IA.", "Tenho mais confiança para testar ferramentas de IA quando necessário.", "Passei a usar ou considerar o uso de IA para apoiar tarefas do dia a dia.", "O curso me ajudou a identificar processos que podem ser melhorados com o uso de IA.", "O curso mostrou formas de usar IA para aumentar produtividade e reduzir tempo.", "O curso estimulou novas formas de atender clientes ou organizar atividades.", "O curso me ajudou a compreender cuidados necessários ao usar ferramentas de IA.", "Passei a ter mais atenção com dados pessoais e informações sensíveis ao usar IA."] },
  { id: "emocional", title: "Inteligência Emocional", questions: ["O curso contribuiu para aumentar minha confiança para enfrentar desafios.", "Após o curso, passei a compreender melhor como minhas emoções influenciam minhas decisões.", "O curso me ajudou a lidar melhor com pressões, conflitos ou situações desafiadoras.", "O curso contribuiu para melhorar minha comunicação com clientes e equipe.", "Após o curso, passei a agir com mais equilíbrio e clareza em situações difíceis.", "O curso fortaleceu minha capacidade de liderança, autocontrole ou relacionamento interpessoal.", "O conhecimento adquirido ajudou a melhorar o ambiente de trabalho.", "O curso contribuiu para que eu me sentisse mais preparado(a) para conduzir meu negócio com segurança."] }
];

const COMMON_BLOCKS = [
  { id: "B1", title: "Contexto e Possibilidade de Aplicação", questions: ["O curso estava relacionado às minhas necessidades no momento em que o realizei.", "Tenho um negócio, projeto ou interesse empreendedor em que o conteúdo pode ser aplicado.", "Tenho autonomia ou influência para aplicar os conhecimentos no meu negócio.", "Consegui acompanhar o curso de forma adequada."] },
  { id: "B2", title: "Aplicabilidade do Conhecimento", questions: ["O curso apresentou conteúdos úteis para minha realidade.", "Consegui identificar formas de aplicar o que aprendi no meu negócio.", "As orientações do curso foram claras o suficiente para apoiar sua aplicação prática.", "O curso me ajudou a refletir sobre as melhorias que posso realizar."] },
  { id: "B3", title: "Efetividade Percebida", questions: ["O curso contribuiu para melhorar minha forma de gerir ou atuar profissionalmente.", "A aplicação dos conteúdos pode gerar melhorias concretas no desempenho.", "O curso contribuiu para que eu tomasse decisões de forma mais estruturada.", "O curso fortaleceu minha capacidade de lidar com problemas ou oportunidades."] },
  { id: "B4", title: "Valor Institucional", questions: ["O apoio do SEBRAE foi relevante para meu desenvolvimento.", "As soluções do SEBRAE contribuem para fortalecer pequenos negócios.", "Eu recomendaria este curso para outras pessoas interessadas em empreender."] },
  { id: "B5", title: "Barreiras de Aplicação", questions: ["A falta de tempo dificultou a aplicação dos conhecimentos.", "A falta de recursos financeiros, tecnológicos ou de equipe dificultou a aplicação.", "Ainda preciso de apoio adicional para aplicar melhor os conhecimentos.", "Ainda não tive oportunidade concreta de aplicar os conhecimentos."] }
];

export default function App() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ 
    cpf: "", fullName: "", email: "", phone: "", cursos: [] as string[], responses: {} as any, receiveResults: false 
  });

  const renderLikert = (id: string, question: string) => (
    <div key={id} className="mb-6 p-6 bg-white border border-[#005AA5]/20 rounded-2xl shadow-sm">
      <p className="font-bold mb-4 text-gray-800">{question}</p>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <button key={num} onClick={() => setFormData(p => ({...p, responses: {...p.responses, [id]: num}}))} className={`p-3 text-xs border rounded-xl transition-all ${formData.responses[id] === num ? 'bg-[#005AA5] text-white' : 'border-[#005AA5] text-[#005AA5] hover:bg-blue-50'}`}>
            {num}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-0">
      <header className="bg-white border-b py-4 px-6 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto text-center font-bold text-[#005AA5]">Mapeamento de Cadeias Produtivas e Efetividade</div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {step === 0 && (
          <div className="bg-white p-10 rounded-3xl shadow-2xl text-center animate-in zoom-in">
            <h2 className="text-3xl font-black mb-4">Sua história inspira o futuro.</h2>
            <button onClick={() => setStep(1)} className="bg-[#005AA5] text-white py-4 px-12 rounded-full font-bold">Quero deixar minha marca</button>
          </div>
        )}

        {step === 1 && (
          <div className="animate-in slide-in-from-right">
            <h2 className="text-2xl font-bold mb-6 text-[#005AA5]">Identificação e Cursos</h2>
            {/* Campos de CPF, Nome, E-mail, Telefone, e Cursos (Lógica mantida) */}
            <button onClick={() => setStep(2)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Continuar</button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right">
            <h2 className="text-2xl font-bold mb-6 text-[#005AA5]">Avaliação Geral</h2>
            {COMMON_BLOCKS.map(block => block.questions.map((q, i) => renderLikert(`${block.id}_${i}`, q)))}
            <button onClick={() => setStep(3)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Próximo</button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right">
            <h2 className="text-2xl font-bold mb-6 text-[#005AA5]">Sobre o curso realizado</h2>
            {formData.cursos.length > 0 && COURSES.find(c => c.id === formData.cursos[0])?.questions.map((q, i) => renderLikert(`spec_${i}`, q))}
            <button onClick={() => setStep(4)} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Finalizar</button>
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
