# Custo de Vida (React SPA)

Aplicação web e PWA para conversão do preço de produtos, desejos de consumo e despesas em horas e dias de trabalho da sua vida, baseada na metodologia *"Your Money or Your Life"*.

## Funcionalidades Principais

- **Calculadora de Custo de Vida**:
  - Conversão em tempo real de preços em horas e dias de trabalho.
  - Análise em relação ao Salário Líquido e à Renda Livre Real (após custos fixos essenciais).
  - Simulação de Custo de Oportunidade (rendimento no Tesouro Selic / CDI em 3, 5 e 10 anos).
  - Impacto de hábitos recorrentes (diário, semanal e mensal acumulado em 1 e 5 anos).
  - Cálculo de parcelamentos com apuração de juros ocultos e custo por parcela.
  - Protocolo anti-impulso com timers de reflexão (24h, 48h, 7d, 15d, 30d).

- **Comparador de Opções & Decisão**:
  - Organização de listas de alternativas por categorias.
  - Cálculo de durabilidade estimada e custo real por mês de uso.
  - Algoritmo de ranking e destaque de melhor custo-benefício.
  - Prós e contras customizáveis.

- **Metas & Reserva de Vida**:
  - Acompanhamento de Reserva de Emergência e Metas de Compra.
  - Cálculo do tempo de trabalho restante e previsão de meses para conclusão.
  - Botão de aporte rápido.

- **Histórico & Painel de Impacto**:
  - Filtros por compras realizadas, decisões de reflexão e desistências conscientes.
  - Painel de Tempo de Vida Salvo (horas e dias de vida preservados ao evitar compras impulsivas).
  - Exportação de relatórios em CSV e backup/restauração em JSON.

- **Configurações & Perfil Financeiro**:
  - Parametrização de Salário Líquido e Bruto, regime de trabalho (CLT, PJ, Autônomo) e horas semanais.
  - Gerenciamento de despesas fixas essenciais.

## Tecnologias

- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4
- Lucide React
- LocalStorage com suporte offline
