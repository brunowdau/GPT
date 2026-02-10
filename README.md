# Simulador Lean de Lucro e Caixa

Aplicação web local para simular decisões de gestão e acompanhar o impacto imediato em lucro, caixa e risco. Tudo funciona 100% offline, basta abrir o `index.html` no navegador.

## Como usar

1. Abra o arquivo `index.html` diretamente no seu navegador.
2. Preencha os campos de entrada (preço, volume, custos, prazos etc.).
3. Observe os resultados em tempo real nos cards, no gráfico de caixa e na tabela mês a mês.
4. Utilize os botões de cenário para preencher rapidamente valores conservador, base ou agressivo.
5. Clique em **Resetar** para limpar os campos.

## Funcionalidades

- KPI de receita, margem de contribuição, lucro operacional e ponto de equilíbrio.
- Projeção de caixa para 12 meses com gráfico em canvas.
- Alertas de gargalo, margem e caixa em linguagem simples.
- Sem dependências externas, APIs ou banco de dados.

## Estrutura do projeto

- `index.html`: layout principal.
- `styles.css`: estilos visuais.
- `script.js`: cálculos e interações.

## Observações técnicas

- Entradas inválidas são tratadas como zero.
- Divisões por zero são evitadas em todos os cálculos.
