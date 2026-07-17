import React, { useState, useEffect } from "react";
import { Clock, AlertCircle, TrendingUp, Users, Smile, Cpu, Star, PlusCircle, CheckCircle2 } from "lucide-react";

const GOOGLE_SCRIPT_URL = "[https://script.google.com/macros/s/AKfycbw8yWGHJmONTFshN8rqJIhthd_VFvTpRTeV7jPk931Vab6r_lDstn0Pexf2Ea_m3Lwl/exec](https://script.google.com/macros/s/AKfycbw8yWGHJmONTFshN8rqJIhthd_VFvTpRTeV7jPk931Vab6r_lDstn0Pexf2Ea_m3Lwl/exec)"; 

const maskPhone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14);

const COURSES = [
  { id: "financas", title: "Gestão Financeira", icon: TrendingUp, questions: ["Após o curso, passei a organizar melhor as finanças do meu negócio, projeto ou atuação profissional.", "O curso contribuiu para melhorar meu controle de custos, despesas e receitas.", "O conhecimento adquirido ajudou a separar melhor os gastos pessoais e recursos do negócio.", "Após o curso, passei a utilizar informações financeiras para tomar decisões com mais segurança.", "O curso contribuiu para compreender melhor o fluxo de caixa, precificação e planejamento financeiro.", "O curso me ajudou a identificar riscos financeiros que podem comprometer a continuidade do negócio.", "Após o curso, passei a avaliar melhor oportunidades de investimento, expansão ou melhoria do negócio.", "O curso contribuiu para tornar minha gestão financeira mais organizada e sustentável."] },
  { id: "pessoas", title: "Gestão de Pessoas", icon: Users, questions: ["O curso contribuiu para melhorar a forma como organizo e conduzo as pessoas no negócio, projeto ou atuação profissional.", "Após o curso, passei a valorizar mais a comunicação, o treinamento e o acompanhamento da equipe.", "O conhecimento adquirido ajudou a melhorar o relacionamento e a coordenação do trabalho.", "O curso ajudou a definir melhor funções, responsabilidades e rotinas.", "Após o curso, passei a acompanhar melhor metas, entregas ou resultados.", "O curso contribuiu para reduzir falhas de comunicação, retrabalho ou desalinhamento entre pessoas.", "O curso ajudou a compreender cuidados importantes na contratação e na relação entre contratado e contratante.", "O curso contribuiu para melhorar o ambiente de trabalho e a produtividade da equipe."] },
  { id: "atendimento", title: "Atendimento ao Cliente", icon: Smile, questions: ["Após o curso, passei a entender melhor como atender e tratar bem os clientes.", "O curso me ajudou a evitar erros no atendimento aos clientes.", "Após o curso, consigo realizar ajustes no atendimento para atender melhor às expectativas dos clientes.", "Coloquei em prática os conteúdos aprendidos no curso no atendimento aos clientes.", "O curso contribuiu para melhorar o relacionamento com os clientes.", "O curso contribuiu para fortalecer a fidelização dos clientes.", "A partir do curso, passei a observar melhor o perfil e as necessidades individuais de cada cliente.", "Após o curso, procuro atender os clientes levando em conta o perfil de cada um.", "O curso me ajudou a identificar formas de agregar valor ao atendimento ao cliente.", "Busco armazenar e organizar informações dos clientes para melhorar o relacionamento com eles.", "Utilizo informações prévias dos clientes para fortalecer conexões e vínculos com eles.", "Busco ouvir, solucionar e responder às reclamações dos clientes da melhor maneira possível.", "Busco utilizar alternativas digitais para atrair antigos e novos clientes.", "Busco atender com qualidade e agilidade os clientes nas mídias digitais.", "Utilizo ou considero utilizar ferramentas digitais ou de inteligência artificial para personalizar e agilizar os contatos com clientes."] },
  { id: "ia", title: "IA na Prática para Pequenos Negócios", icon: Cpu, questions: ["Após o curso, passei a entender melhor o que é Inteligência Artificial e como ela pode ser usada.", "O curso me ajudou a diferenciar informações corretas de mitos sobre Inteligência Artificial.", "Hoje consigo identificar situações em que a IA pode ser útil para um pequeno negócio, projeto ou atuação profissional.", "Após o curso, sinto-me mais preparado(a) para utilizar ferramentas de Inteligência Artificial.", "Consigo elaborar comandos ou perguntas mais claras para ferramentas de IA.", "Tenho mais confiança para testar ferramentas de IA quando necessário.", "Passei a usar ou considerar o uso de IA para apoiar tarefas do dia a dia.", "O curso me ajudou a identificar processos ou atividades que podem ser melhorados com o uso de IA.", "O curso mostrou formas de usar IA para aumentar produtividade, reduzir tempo em tarefas repetitivas ou melhorar processos.", "O curso estimulou novas formas de atender clientes, divulgar produtos, criar conteúdos ou organizar atividades.", "O curso me ajudou a compreender cuidados necessários ao usar ferramentas de IA.", "Após o curso, passei a ter mais atenção com dados pessoais, informações de clientes e documentos sigilosos ao utilizar IA."] },
  { id: "emocional", title: "Inteligência Emocional", icon: Star, questions: ["O curso contribuiu para aumentar minha confiança para enfrentar desafios no negócio, projeto ou atuação profissional.", "Após o curso, passei a compreender melhor como minhas emoções influenciam minhas decisões.", "O curso me ajudou a lidar melhor com pressões, conflitos ou situações desafiadoras.", "O curso contribuiu para melhorar minha comunicação com clientes, equipe, parceiros ou outras pessoas do meu ambiente profissional.", "Após o curso, passei a agir com mais equilíbrio e clareza em situações difíceis.", "O curso fortaleceu minha capacidade de liderança, autocontrole ou relacionamento interpessoal.", "O conhecimento adquirido ajudou a melhorar o ambiente de trabalho ou a qualidade das relações profissionais.", "O curso contribuiu para que eu me sentisse mais preparado(a) para conduzir meu negócio, projeto ou atuação profissional com mais segurança."] }
];

const COMMON_BLOCKS = [
  { id: "B1", title: "Contexto, Exposição e Possibilidade de Aplicação", questions: ["O curso estava relacionado às minhas necessidades no momento em que o realizei.", "Tenho um negócio, projeto, atividade profissional ou interesse empreendedor em que o conteúdo do curso pode ser aplicado.", "Tenho autonomia ou influência para aplicar os conhecimentos do curso no meu negócio, projeto ou atuação profissional.", "Consegui acompanhar o curso de forma adequada para compreender seus principais conteúdos."] },
  { id: "B2", title: "Aplicabilidade do Conhecimento", questions: ["O curso apresentou conteúdos úteis para minha realidade.", "Consegui identificar formas de aplicar o que aprendi no meu negócio, projeto ou atuação profissional.", "As orientações do curso foram claras o suficiente para apoiar sua aplicação prática.", "O curso me ajudou a refletir sobre as melhorias que posso realizar na minha forma de trabalhar, gerir ou empreender."] },
  { id: "B3", title: "Efetividade Percebida e Proxies de Desempenho", questions: ["O curso contribuiu para melhorar minha forma de gerir, atuar profissionalmente ou desenvolver um projeto empreendedor.", "A aplicação dos conteúdos do curso pode gerar melhorias concretas no desempenho do meu negócio, projeto ou atuação profissional.", "O curso contribuiu para que eu tomasse decisões de forma mais estruturada e baseada em informações.", "O curso fortaleceu minha capacidade de lidar com problemas, mudanças ou oportunidades relacionadas ao meu negócio, projeto ou atuação profissional."] },
  { id: "B4", title: "Valor Institucional e Recomendação", questions: ["O apoio do SEBRAE foi relevante para meu desenvolvimento.", "As soluções do SEBRAE contribuem para fortalecer pequenos negócios, empreendedores e potenciais empreendedores.", "Eu recomendaria este curso para outras pessoas interessadas em empreender, melhorar sua atuação profissional ou fortalecer um negócio."] },
  { id: "B5", title: "Barreiras e Condições de Aplicação", questions: ["A falta de tempo dificultou a aplicação dos conhecimentos do curso.", "A falta de recursos financeiros, tecnológicos ou de equipe dificultou a aplicação dos conhecimentos do curso.", "Ainda preciso de apoio adicional para aplicar melhor os conhecimentos do curso.", "Ainda não tive oportunidade concreta de aplicar os conhecimentos do curso."] }
];

const LIKERT = ["Discordo totalmente", "Discordo parcialmente", "Nem concordo, nem discordo", "Concordo parcialmente", "Concordo totalmente", "Não se aplica à minha realidade"];

export default function App() {
  const [step, setStep] = useState(() => {
    const savedStep = localStorage.getItem('sebrae_step');
    return savedStep ? parseInt(savedStep, 10) : 0;
  });

  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('sebrae_data');
    return savedData ? JSON.parse(savedData) : { 
      cpf: "", fullName: "", email: "", phone: "", 
      genero: "", raca: "", quilombola: "", pcd: "", tiposPcd: [] as string[], 
      cursos: [] as string[], responses: {} as Record<string, number> 
    };
  });

  const [cpfError, setCpfError] = useState("");
  const [isCpfValid, setIsCpfValid] = useState(() => {
    const savedStep = localStorage.getItem('sebrae_step');
    return savedStep && parseInt(savedStep, 10) > 1 ? true : false;
  });

  useEffect(() => {
    if (step !== 99) {
      localStorage.setItem('sebrae_step', step.toString());
      localStorage.setItem('sebrae_data', JSON.stringify(formData));
    }
  }, [step, formData]);

  const specificCourses = formData.cursos.filter(c => c !== 'outros');

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

  const canAdvanceStep = () => {
    if (step === 1) return formData.fullName && formData.email && formData.phone && formData.genero && formData.raca && formData.quilombola && formData.pcd && (formData.pcd === 'Não' || formData.tiposPcd.length > 0);
    if (step === 2) return formData.cursos.length > 0;
    if (step >= 3 && step <= 7) {
      const blockIndex = step - 3;
      return COMMON_BLOCKS[blockIndex].questions.every((_, i) => formData.responses[`${COMMON_BLOCKS[blockIndex].id}_${i}`]);
    }
    if (step >= 8 && step < 8 + specificCourses.length) {
      const courseIndex = step - 8;
      const courseId = specificCourses[courseIndex];
      const course = COURSES.find(c => c.id === courseId);
      return course?.questions.every((_, i) => formData.responses[`SPECIFIC_${courseId}_${i}`]);
    }
    return true;
  };

  const saveData = async () => {
    try {
      await fetch(GOOGLE_SCRIPT_URL, { 
        method: "POST", 
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, timestamp: new Date().toISOString() }) 
      });
      localStorage.removeItem('sebrae_step');
      localStorage.removeItem('sebrae_data');
      setStep(99);
    } catch (e) { 
      alert("Erro ao enviar. Verifique sua conexão e tente novamente."); 
    }
  };

  const handleNextStep = () => {
    if (step === 7 + specificCourses.length || (step === 7 && specificCourses.length === 0)) {
      saveData();
    } else {
      setStep(step + 1);
    }
  };

  const renderLikert = (id: string, q: string) => (
    <div key={id} className="mb-8 p-6 bg-white border border-[#005AA5]/20 rounded-2xl shadow-sm">
      <p className="font-bold mb-4 text-gray-800">{q}</p>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {LIKERT.map((opt, i) => {
          const val = i + 1;
          return (
            <button 
              key={val} 
              onClick={() => setFormData(p => ({...p, responses: {...p.responses, [id]: val}}))} 
              className={`p-3 text-xs border rounded-xl transition-all ${formData.responses[id] === val ? 'bg-[#005AA5] text-white' : 'border-[#005AA5] text-[#005AA5] hover:bg-blue-50'}`}
            >
              {val}. {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-0">
      <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto grid grid-cols-[120px_1fr_120px] items-center">
          <img src="[https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg](https://sebrae.com.br/content/dam/portal-sebrae/na/pt/imagens/logo/logo-sebrae.svg)" alt="Sebrae" className="h-8" />
          <h1 className="text-[#005AA5] font-bold text-xs uppercase text-center truncate px-4">
            Mapeamento de Cadeias Produtivas, Vocações Regionais e Efetividade das Soluções do Sebrae
          </h1>
          <div /> 
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 relative">
        
        {step > 0 && step < 99 && (
          <div className="absolute top-0 right-4 text-[10px] text-gray-400 flex items-center gap-1">
            <Clock size="{10}"/> Rascunho salvo automaticamente
          </div>
        )}

        {step === 0 && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in duration-500">
            <img src="[https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000](https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=2000)" alt="Empreendedores focados" className="w-full h-72 object-cover object-center" />
            <div className="p-10 text-center">
              <h2 className="text-3xl font-black text-gray-800 mb-4">Sua história inspira o futuro.</h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                Participe da nossa pesquisa e ajude a fortalecer as soluções do Sebrae para quem empreende. Sua voz é o motor da nossa inovação.
              </p>
              <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600 font-medium mb-6">
                <Clock size="{16}"/> É rapidinho: leva menos de 5 minutos.
              </div>
              <button onClick={() => setStep(1)} className="block w-full md:w-auto mx-auto bg-[#005AA5] text-white py-4 px-12 rounded-full font-bold text-lg hover:bg-blue-800 transition-all shadow-lg">
                {formData.cpf ? "Continuar de onde parei" : "Quero deixar minha marca"}
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border animate-in slide-in-from-right duration-500 space-y-6">
            {!isCpfValid ? (
              <>
                <h2 className="text-2xl font-bold text-[#005AA5]">Identificação: informe seu CPF</h2>
                <input 
                  value={formData.cpf} 
                  onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})} 
                  placeholder="000.000.000-00" 
                  className="w-full p-4 border-2 rounded-xl" 
                />
                {cpfError && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle size="{16}"/> {cpfError}</p>}
                <button onClick={handleCpfSubmit} className="w-full bg-[#005AA5] text-white p-4 rounded-xl font-bold">Validar CPF</button>
              </>
            ) : (
              <div className="animate-fade-in space-y-6">
                <h2 className="text-2xl font-bold text-[#005AA5]">Sobre Você</h2>
                <div>
                  <label className="block font-bold mb-1 text-sm">Nome Completo</label>
                  <input value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Como prefere ser tratada(o)?" className="w-full p-4 border rounded-xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1 text-sm">E-mail</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="exemplo@dominio.com" className="w-full p-4 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-sm">Telefone / WhatsApp</label>
                    <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: maskPhone(e.target.value)})} placeholder="(31) 99999-9999" className="w-full p-4 border rounded-xl" />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-bold mb-4 text-lg">Identidade de Gênero</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { l: "Mulher Cis", d: "Registrada mulher ao nascer." }, { l: "Homem Cis", d: "Registrado homem ao nascer." },
                      { l: "Mulher Trans", d: "Identifica-se mulher, registrada outro." }, { l: "Homem Trans", d: "Identifica-se homem, registrado outro." },
                      { l: "Não binário", d: "Não se identifica exclusivamente." }, { l: "Prefiro não informar", d: "" }
                    ].map(g => (
                      <button key={g.l} onClick={() => setFormData({...formData, genero: g.l})} className={`p-4 border rounded-xl text-left transition-all ${formData.genero === g.l ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>
                        <div className="font-bold text-sm">{g.l}</div>
                        <div className="text-xs opacity-80">{g.d}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-bold mb-3">Qual sua cor ou raça?</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                      {["Auditiva", "Física", "Intelectual", "Psicossocial", "Visual", "Autismo (TEA)", "Prefiro não informar"].map(t => (
                        <button key={t} onClick={() => setFormData(p => ({...p, tiposPcd: p.tiposPcd.includes(t) ? p.tiposPcd.filter(i => i !== t) : [...p.tiposPcd, t]}))} className={`p-3 border rounded-xl ${formData.tiposPcd.includes(t) ? 'bg-[#005AA5] text-white' : 'border-[#005AA5]'}`}>{t}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  <button onClick={() => setStep(2)} disabled={!canAdvanceStep()} className={`w-full p-4 rounded-xl font-bold transition-all ${canAdvanceStep() ? 'bg-[#005AA5] text-white shadow-lg hover:bg-blue-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                    Continuar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-8 rounded-3xl shadow-lg border animate-in slide-in-from-right duration-500">
            <h2 className="text-2xl font-bold text-[#005AA5] mb-6">Quais cursos você realizou no Sebrae?</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {COURSES.map(c => (
                <button key={c.id} onClick={() => setFormData({...formData, cursos: formData.cursos.includes(c.id) ? formData.cursos.filter(i => i !== c.id) : [...formData.cursos, c.id]})} className={`p-6 border-2 rounded-2xl flex flex-col items-center text-center transition-all ${formData.cursos.includes(c.id) ? 'bg-[#005AA5] text-white' : 'border-[#005AA5] text-[#005AA5] hover:bg-blue-50'}`}>
                  <c.icon className="mb-3" size={32} />
                  <span className="font-bold text-sm">{c.title}</span>
                </button>
              ))}
              <button onClick={() => setFormData({...formData, cursos: formData.cursos.includes('outros') ? formData.cursos.filter(i => i !== 'outros') : [...formData.cursos, 'outros']})} className={`p-6 border-2 rounded-2xl flex flex-col items-center justify-center transition-all ${formData.cursos.includes('outros') ? 'bg-[#005AA5] text-white' : 'border-[#005AA5] text-[#005AA5] hover:bg-blue-50'}`}>
                <PlusCircle className="mb-3" size="{32}"/>
                <span className="font-bold text-sm">Outros</span>
              </button>
            </div>
            <button onClick={() => setStep(3)} disabled={!canAdvanceStep()} className={`w-full p-4 rounded-xl font-bold transition-all ${canAdvanceStep() ? 'bg-[#005AA5] text-white shadow-lg hover:bg-blue-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
              Continuar
            </button>
          </div>
        )}

        {step >= 3 && step <= 7 && (
          <div className="animate-in slide-in-from-right duration-500">
            <h2 className="text-2xl font-bold mb-6 text-[#005AA5] bg-white p-4 rounded-2xl shadow-sm border">{COMMON_BLOCKS[step - 3].title}</h2>
            {COMMON_BLOCKS[step - 3].questions.map((q, i) => renderLikert(`${COMMON_BLOCKS[step - 3].id}_${i}`, q))}
            
            <button onClick={handleNextStep} disabled={!canAdvanceStep()} className={`w-full p-4 rounded-xl font-bold transition-all ${canAdvanceStep() ? 'bg-[#005AA5] text-white shadow-lg hover:bg-blue-800' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
              {(step === 7 && specificCourses.length === 0) ? "Enviar" : "Continuar"}
            </button>
          </div>
        )}

        {step >= 8 && step < 8 + specificCourses.length && (
          <div className="animate-in slide-in-from-right duration-500">
            <h2 className="text-2xl font-bold mb-6 text-[#005AA5] bg-white p-4 rounded-2xl shadow-sm border">
              Sobre o curso: {COURSES.find(c => c.id === specificCourses[step - 8])?.title}
            </h2>
            
            {COURSES.find(c => c.id === specificCourses[step - 8])?.questions.map((q, i) => renderLikert(`SPECIFIC_${specificCourses[step - 8]}_${i}`, q))}
            
            <button onClick={handleNextStep} disabled={!canAdvanceStep()} className={`w-full p-4 rounded-xl font-bold transition-all ${canAdvanceStep() ? (step === 7 + specificCourses.length ? 'bg-green-600 hover:bg-green-700' : 'bg-[#005AA5] hover:bg-blue-800') : 'bg-gray-300 text-gray-500 cursor-not-allowed'} text-white shadow-lg`}>
              {step === 7 + specificCourses.length ? "Enviar" : "Continuar"}
            </button>
          </div>
        )}

        {step === 99 && (
          <div className="bg-white p-12 rounded-3xl shadow-2xl border border-gray-100 text-center animate-in zoom-in duration-500">
            <CheckCircle2 className="mx-auto text-green-500 mb-6" size="{80}"/>
            <h2 className="text-3xl font-black text-gray-800 mb-4">Obrigado pela sua contribuição!</h2>
            <p className="text-gray-600 text-lg">
              Suas respostas foram registradas com sucesso. Sua voz é essencial para continuarmos fortalecendo o empreendedorismo no Brasil.
            </p>
          </div>
        )}
        
      </main>
    </div>
  );
}
