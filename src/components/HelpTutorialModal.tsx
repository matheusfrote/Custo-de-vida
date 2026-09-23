import React, { useState } from 'react';
import { X, Hourglass, Shield, Scale, Target, Sparkles, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HelpTutorialModal: React.FC = () => {
  const { isHelpModalOpen, setIsHelpModalOpen } = useApp();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  if (!isHelpModalOpen) return null;

  const faqs = [
    {
      q: 'Como calcular o valor exato da minha hora de trabalho?',
      a: 'Dividimos seu salário líquido mensal pela carga horária mensal. Você pode escolher entre o cálculo CLT (divisor 200 para 40h/semana ou 220 para 44h/semana) ou o cálculo pelas horas reais médias trabalhadas no mês (~173h para 40h/semana).'
    },
    {
      q: 'O que é a Renda Livre e por que ela importa?',
      a: 'Seu salário bruto não está todo disponível para gastar livremente. Primeiro você precisa pagar moradia, alimentação, contas básicas e saúde (custos fixos essenciais). A Renda Livre é o que sobra. Medir produtos contra a renda livre mostra se uma compra realmente cabe no seu padrão.'
    },
    {
      q: 'Como funciona a Quarentena Anti-Impulso?',
      a: 'Pesquisas comportamentais mostram que a dopamina do desejo cai em 24h a 72h. Quando você ativa a reflexão no app, ele congela a decisão. Mais de 68% das compras em quarentena são descartadas pelo próprio usuário, poupando milhares de reais!'
    },
    {
      q: 'Meus dados bancários e salariais ficam salvos na internet?',
      a: 'Não! O Custo de Vida processa tudo localmente no seu próprio navegador via armazenamento offline. Você também pode exportar e importar seus backups quando quiser.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsHelpModalOpen(false)}
          className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <Hourglass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Como Funciona</h3>
            <p className="text-[11px] text-slate-400">Guia Rápido do Custo de Vida</p>
          </div>
        </div>

        <div className="space-y-3 pt-2 text-xs">
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">
                1
              </span>
              Sua Hora Líquida
            </span>
            <p className="text-slate-300 text-[11px] pl-6 leading-relaxed">
              O app calcula exatamente quanto vale cada hora do seu trabalho a partir do seu salário líquido real e jornada semanal.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">
                2
              </span>
              Conversão de Preço em Vida
            </span>
            <p className="text-slate-300 text-[11px] pl-6 leading-relaxed">
              Ao digitar o preço de um item, você descobre quantas horas e dias da sua vida precisará trabalhar para pagá-lo.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">
                3
              </span>
              Período de Reflexão
            </span>
            <p className="text-slate-300 text-[11px] pl-6 leading-relaxed">
              Evite compras por impulso ativando a reflexão. Ao decidir desistir, o app soma o tempo e dinheiro que você salvou!
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">
                4
              </span>
              Metas com Esforço Livre
            </span>
            <p className="text-slate-300 text-[11px] pl-6 leading-relaxed">
              Para suas metas, descontamos suas contas fixas essenciais para mostrar quanto tempo de esforço 100% livre resta para realizá-las.
            </p>
          </div>

          {/* Perguntas Frequentes (FAQ) */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              Perguntas Frequentes (FAQ)
            </h4>
            <div className="space-y-1.5">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-3 text-left flex items-center justify-between text-xs font-bold text-slate-200 hover:text-white transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="pr-2">{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 text-[11px] text-slate-400 leading-relaxed border-t border-slate-900 pt-2 animate-in fade-in duration-150">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1 text-[11px] text-slate-400">
            <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Privacidade & Isenção Educativa (LGPD)
            </span>
            <p className="leading-relaxed">
              O Custo de Vida é uma ferramenta educativa de consumo consciente. Seus dados financeiros são mantidos em segurança no seu dispositivo. Não realizamos consultoria de investimentos.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsHelpModalOpen(false)}
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-500/20 mt-2"
        >
          Entendi, vamos começar!
        </button>
      </div>
    </div>
  );
};
