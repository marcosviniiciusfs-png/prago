import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right.mjs';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left.mjs';
import Check from 'lucide-react/dist/esm/icons/check.mjs';
import Building2 from 'lucide-react/dist/esm/icons/building-2.mjs';
import Car from 'lucide-react/dist/esm/icons/car.mjs';
import BriefcaseBusiness from 'lucide-react/dist/esm/icons/briefcase-business.mjs';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up.mjs';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check.mjs';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.mjs';
import Menu from 'lucide-react/dist/esm/icons/menu.mjs';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles.mjs';
const Instagram = Sparkles;
const X = () => <span className="close-symbol">×</span>;
import './styles.css';

const IG = 'https://www.instagram.com/pragoempreendimentostlms/';
const HERO_ASSET = `${import.meta.env.BASE_URL}assets/prago-patrimonio-hero.png`;
const LOGO_ASSET = `${import.meta.env.BASE_URL}assets/prago-logo-oficial-hd.png`;
const WHATSAPP_NUMBER = '5567992177491';
const whatsappUrl = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
const getCookie = (name) => document.cookie.split('; ').find(x=>x.startsWith(`${name}=`))?.slice(name.length+1);
const goals = [
  { id:'imovel', label:'Comprar um imóvel', sub:'Casa, apartamento ou terreno', icon:Building2 },
  { id:'veiculo', label:'Comprar um veículo', sub:'Carro, moto ou utilitário', icon:Car },
  { id:'empresa', label:'Expandir meu negócio', sub:'Capital para crescer com estratégia', icon:BriefcaseBusiness },
  { id:'patrimonio', label:'Construir patrimônio', sub:'Planejamento de médio e longo prazo', icon:TrendingUp },
];
const creditOptions = [
  {label:'Até R$ 100 mil',sub:'Para um objetivo mais próximo',value:100000},
  {label:'R$ 100 mil a R$ 250 mil',sub:'Uma faixa intermediária',value:250000},
  {label:'R$ 250 mil a R$ 500 mil',sub:'Para um projeto maior',value:500000},
  {label:'Acima de R$ 500 mil',sub:'Para planos mais robustos',value:750000},
];
const entryOptions = [
  {label:'Até R$ 5 mil',sub:'Tenho pouco separado agora',value:5000,badge:'Até 5k'},
  {label:'R$ 5 mil a R$ 15 mil',sub:'Tenho uma reserva inicial',value:15000,badge:'5–15k'},
  {label:'R$ 15 mil a R$ 40 mil',sub:'Tenho uma entrada maior',value:40000,badge:'15–40k'},
  {label:'Acima de R$ 40 mil',sub:'Consigo separar um valor maior',value:80000,badge:'40k+'},
];
const installmentOptions = [
  {label:'Até R$ 1 mil',sub:'Uma parcela mais leve',value:1000,badge:'Até 1k'},
  {label:'R$ 1 mil a R$ 3 mil',sub:'Uma faixa intermediária',value:3000,badge:'1–3k'},
  {label:'R$ 3 mil a R$ 6 mil',sub:'Posso investir mais por mês',value:6000,badge:'3–6k'},
  {label:'Acima de R$ 6 mil',sub:'Quero acelerar meu plano',value:10000,badge:'6k+'},
];
const timingOptions = ['O quanto antes','De 3 a 6 meses','De 6 a 12 meses','Mais de 1 ano'];
const money = (v) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(v);
const onlyDigits = (v) => v.replace(/\D/g,'');
const phoneMask = (v) => { const n=onlyDigits(v).slice(0,11); if(n.length<=2)return n; if(n.length<=7)return `(${n.slice(0,2)}) ${n.slice(2)}`; return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}` };

function Logo(){return <a className="logo" href="#top" aria-label="Prago Empreendimentos, início"><img src={LOGO_ASSET} alt="Prago Empreendimentos"/></a>}
function App(){
  const [menu,setMenu]=useState(false); const [step,setStep]=useState(0); const [sent,setSent]=useState(false); const [whatsappLink,setWhatsappLink]=useState('');
  const [data,setData]=useState({goal:'',amount:0,entry:0,installment:0,timeline:'',city:'',name:'',phone:''});
  useEffect(()=>{const els=document.querySelectorAll('[data-reveal]');const o=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('visible')),{threshold:.15});els.forEach(e=>o.observe(e));return()=>o.disconnect()},[]);
  const valid=useMemo(()=> step===0?!!data.goal:step===1?data.amount>0:step===2?data.entry>0:step===3?data.installment>0:step===4?!!data.timeline:data.name.trim().length>2&&onlyDigits(data.phone).length>=10&&data.city.trim().length>2,[step,data]);
  const next=()=>{if(!valid)return; if(step<5)setStep(s=>s+1);else submit()};
  const submit=async()=>{ const eventId=`lead_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; const payload={...data,amount_formatted:money(data.amount),source:'simulador_prago',event_id:eventId,source_url:location.href,received_at:new Date().toISOString()};
    const goalLabel=goals.find(x=>x.id===data.goal)?.label??data.goal;
    const amountLabel=creditOptions.find(x=>x.value===data.amount)?.label??money(data.amount);
    const entryLabel=entryOptions.find(x=>x.value===data.entry)?.label??money(data.entry);
    const installmentLabel=installmentOptions.find(x=>x.value===data.installment)?.label??money(data.installment);
    const whatsappMessage=[
      'Olá! Concluí a simulação no site da Prago Empreendimentos.',
      '',
      `Nome completo: ${data.name.trim()}`,
      `WhatsApp: ${phoneMask(data.phone)}`,
      `Cidade: ${data.city.trim()}`,
      `Objetivo: ${goalLabel}`,
      `Valor desejado: ${amountLabel}`,
      `Entrada disponível: ${entryLabel}`,
      `Parcela mensal: ${installmentLabel}`,
      `Prazo: ${data.timeline}`,
    ].join('\n');
    const link=whatsappUrl(whatsappMessage);
    sessionStorage.setItem('prago_lead',JSON.stringify(payload));
    window.fbq?.('track','Lead',{}, {eventID:eventId});
    const api=import.meta.env.VITE_LEAD_API_URL;
    const capiRequest=api?fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({event_name:'Lead',event_id:eventId,event_source_url:location.href,user_data:{ph:onlyDigits(data.phone),fn:data.name.split(' ')[0],ct:data.city,fbp:getCookie('_fbp'),fbc:getCookie('_fbc')},custom_data:{content_name:'Simulador Prago',lead_type:data.goal}})}):null;
    setWhatsappLink(link); setSent(true); const whatsappWindow=window.open(link,'_blank'); if(whatsappWindow)whatsappWindow.opener=null;else location.href=link; window.scrollTo({top:document.querySelector('#simulador').offsetTop-80,behavior:'smooth'});
    if(capiRequest){try{const r=await capiRequest;if(!r.ok)throw Error()}catch{console.warn('O rastreamento do lead não pôde ser concluído.')}}
  };
  return <>
    <header><Logo/><button className="menu-btn" onClick={()=>setMenu(!menu)} aria-label="Abrir menu">{menu?<X/>:<Menu/>}</button><nav className={menu?'open':''}><a href="#solucoes" onClick={()=>setMenu(false)}>Soluções</a><a href="#processo" onClick={()=>setMenu(false)}>Como funciona</a><a href="#sobre" onClick={()=>setMenu(false)}>Sobre</a><a className="nav-cta" href="#simulador">Simular agora <ArrowRight size={16}/></a></nav></header>
    <main id="top">
      <section className="hero"><div className="hero-glow"/><div className="hero-copy" data-reveal><span className="eyebrow"><Sparkles size={14}/> Negócios financeiros com estratégia</span><h1>Seu próximo patrimônio começa com uma <em>decisão bem planejada.</em></h1><p>Encontre um caminho inteligente para adquirir, expandir e construir patrimônio — com uma análise pensada para o seu momento.</p><div className="hero-actions"><a className="primary" href={whatsappUrl('Olá! Vim pelo site da Prago e gostaria de falar com a equipe.')} target="_blank" rel="noreferrer">Fale conosco <ArrowRight size={18}/></a><a className="text-link" href={whatsappUrl('Olá! Vim pelo site da Prago e gostaria de entender como funciona.')} target="_blank" rel="noreferrer">Entender como funciona</a></div><div className="trust"><ShieldCheck/><span><b>Análise personalizada</b><small>Seus objetivos no centro da estratégia</small></span></div></div>
        <div className="hero-visual asset-showcase" data-reveal><div className="asset-halo"/><img className="asset-composition" src={HERO_ASSET} alt="Imóvel, caminhão, maquinário, motocicleta e carro"/><div className="floating-card"><span>Soluções para</span><b>cada conquista</b><Check/></div></div>
      </section>

      <section className="sim-section" id="simulador"><div className="sim-intro"><span className="eyebrow dark">SIMULAÇÃO PERSONALIZADA</span><h2>Vamos transformar intenção<br/>em um plano possível.</h2><p>Leva menos de 2 minutos. Sem compromisso.</p></div>
        <div className="sim-card">
          {!sent ? <><div className="progress-head"><span>ETAPA {step+1} DE 6</span><b>{['Seu objetivo','Valor desejado','Entrada disponível','Parcela mensal','Prazo','Seus dados'][step]}</b></div><div className="progress"><i style={{width:`${((step+1)/6)*100}%`}}/></div>
          <div className="step" key={step}>
            {step===0&&<><h3>Qual é o seu principal objetivo?</h3><p>Selecione a opção que mais combina com você.</p><div className="goal-grid">{goals.map(g=><button className={data.goal===g.id?'choice selected':'choice'} onClick={()=>setData({...data,goal:g.id})} key={g.id}><g.icon/><span><b>{g.label}</b><small>{g.sub}</small></span><i>{data.goal===g.id&&<Check size={15}/>}</i></button>)}</div></>}
            {step===1&&<><div className="step-icon">$</div><h3>Qual valor você está buscando?</h3><p>Pode ser aproximado. Escolha a faixa mais próxima.</p><div className="choice-stack">{creditOptions.map(x=><button className={data.amount===x.value?'range-choice selected':'range-choice'} onClick={()=>setData({...data,amount:x.value})} key={x.value}><span className="range-icon">$</span><span><b>{x.label}</b><small>{x.sub}</small></span><i>{data.amount===x.value&&<Check size={15}/>}</i></button>)}</div></>}
            {step===2&&<><div className="step-icon">P</div><h3>Quanto consegue separar de entrada?</h3><p>Escolha uma faixa que faça sentido hoje.</p><div className="choice-stack">{entryOptions.map(x=><button className={data.entry===x.value?'range-choice selected':'range-choice'} onClick={()=>setData({...data,entry:x.value})} key={x.value}><span className="range-icon">↗</span><span><b>{x.label}</b><small>{x.sub}</small></span><strong className="badge">{x.badge}</strong></button>)}</div></>}
            {step===3&&<><div className="step-icon">$</div><h3>Qual parcela mensal fica ideal?</h3><p>Marque a faixa que cabe melhor no seu planejamento.</p><div className="choice-stack">{installmentOptions.map(x=><button className={data.installment===x.value?'range-choice selected':'range-choice'} onClick={()=>setData({...data,installment:x.value})} key={x.value}><span className="range-icon">$</span><span><b>{x.label}</b><small>{x.sub}</small></span><strong className="badge">{x.badge}</strong></button>)}</div></>}
            {step===4&&<><div className="step-icon">◷</div><h3>Quando pretende realizar?</h3><p>Escolha o prazo mais próximo do seu momento.</p><div className="choice-stack">{timingOptions.map((x,i)=><button className={data.timeline===x?'range-choice selected':'range-choice'} onClick={()=>setData({...data,timeline:x})} key={x}><span className="time-chip">{['Agora','3–6m','6–12m','12m+'][i]}</span><span><b>{x}</b><small>{['Quero começar logo','Quero me organizar primeiro','Estou planejando com calma','Ainda estou avaliando'][i]}</small></span><i>{data.timeline===x&&<Check size={15}/>}</i></button>)}</div></>}
            {step===5&&<><div className="step-icon">✓</div><h3>Para quem preparamos esta análise?</h3><p>Preencha seus dados para receber um atendimento direcionado.</p><label className="field-label">Nome completo</label><input className="input" autoFocus placeholder="Como podemos te chamar?" value={data.name} onChange={e=>setData({...data,name:e.target.value})}/><div className="contact-row"><label><span>WhatsApp</span><input className="input" inputMode="tel" placeholder="(67) 99999-9999" value={data.phone} onChange={e=>setData({...data,phone:phoneMask(e.target.value)})}/></label><label><span>Cidade</span><input className="input" placeholder="Onde você mora?" value={data.city} onChange={e=>setData({...data,city:e.target.value})}/></label></div></>}
          </div><div className="sim-actions">{step>0?<button className="back" onClick={()=>setStep(s=>s-1)}><ArrowLeft/> Voltar</button>:<span/>}<button className="next" disabled={!valid} onClick={next}>{step===5?'Receber minha análise':'Continuar'} <ArrowRight/></button></div></>:
          <div className="success"><div className="success-icon"><Check/></div><span className="eyebrow dark">SIMULAÇÃO CONCLUÍDA</span><h3>Obrigado, {data.name.split(' ')[0]}.</h3><p>Suas respostas foram registradas e sua simulação foi aberta no WhatsApp para você falar com a equipe Prago.</p><a className="primary" href={whatsappLink} target="_blank" rel="noreferrer">Continuar no WhatsApp <ArrowRight/></a><button onClick={()=>{setSent(false);setStep(0);setWhatsappLink('')}}>Fazer nova simulação</button></div>}
        </div>
      </section>

      <section className="contemplados" id="contemplados" data-reveal><div className="contemplados-head"><div><span className="eyebrow">CONQUISTAS PRAGO</span><h2>Clientes contemplados.<br/><em>Planos que saíram do papel.</em></h2></div><p>Cada conquista representa uma decisão planejada e um novo capítulo. Acompanhe alguns dos objetivos que ajudamos a transformar em realidade.</p></div><div className="contemplados-grid">{[[Building2,'Imóvel','Um novo endereço para chamar de seu.'],[Car,'Veículo','Mobilidade para novos caminhos.'],[BriefcaseBusiness,'Expansão','Recursos para o negócio avançar.']].map(([Icon,title,copy],i)=><article key={title}><div className="contemplado-media"><span>0{i+1}</span><Icon/><i>PRAGO EMPREENDIMENTOS</i></div><div className="contemplado-copy"><small>CLIENTE CONTEMPLADO</small><h3>{title}</h3><p>{copy}</p></div></article>)}</div><a className="contemplados-cta" href={IG} target="_blank" rel="noreferrer">Ver mais conquistas no Instagram <ArrowRight/></a></section>

      <section className="solutions" id="solucoes" data-reveal><div className="section-head"><span className="eyebrow dark">SOLUÇÕES PARA CADA MOMENTO</span><h2>Crédito como ferramenta.<br/><em>Patrimônio como destino.</em></h2></div><div className="solution-grid">{goals.map((g,i)=><article key={g.id}><span>0{i+1}</span><g.icon/><h3>{g.label}</h3><p>{['Planeje sua aquisição com uma estrutura compatível com a sua realidade.','Escolha uma rota financeira que preserve seu planejamento.','Estruture recursos para novos projetos e oportunidades.','Crie uma estratégia consistente para ampliar seus ativos.'][i]}</p><a href="#simulador">Simular agora <ArrowRight/></a></article>)}</div></section>
      <section className="process" id="processo"><div className="process-copy" data-reveal><span className="eyebrow">UM PROCESSO CLARO</span><h2>Sem atalhos.<br/>Com estratégia.</h2><p>Cada objetivo pede uma leitura diferente. Por isso, a Prago começa entendendo você antes de falar em soluções.</p><a className="primary light" href="#simulador">Começar agora <ArrowRight/></a></div><div className="steps" data-reveal>{[['01','Você simula','Compartilhe objetivo, valor e momento.'],['02','Nós analisamos','A equipe entende o cenário e as possibilidades.'],['03','Você decide','Receba orientação para escolher com mais clareza.']].map(x=><div key={x[0]}><b>{x[0]}</b><span><strong>{x[1]}</strong><p>{x[2]}</p></span></div>)}</div></section>
      <section className="about" id="sobre" data-reveal><div className="about-line"/><div><span className="eyebrow dark">PRAGO EMPREENDIMENTOS</span><h2>Estratégia para quem pensa além da próxima compra.</h2></div><p>Crédito, negócios financeiros e patrimônio conectados por uma visão: ajudar cada cliente a tomar decisões mais conscientes para adquirir, expandir e alavancar seu patrimônio.</p></section>
      <section className="final-cta"><span>SEU PRÓXIMO PASSO</span><h2>Vamos transformar intenção<br/>em <em>estratégia?</em></h2><a className="primary light" href="#simulador">Fazer minha simulação <ArrowRight/></a></section>
    </main>
    <a className="sticky-cta" href={whatsappUrl('Olá! Vim pelo site da Prago e gostaria de falar com a equipe.')} target="_blank" rel="noreferrer"><Sparkles/><span>Fale conosco</span><ArrowRight/></a><footer><Logo/><p>Crédito · Negócios Financeiros · Patrimônio</p><a href={IG} target="_blank" rel="noreferrer"><Instagram/> @pragoempreendimentostlms</a><small>© {new Date().getFullYear()} Prago Empreendimentos. Todos os direitos reservados.</small></footer>
  </>
}
createRoot(document.getElementById('root')).render(<App/>);
