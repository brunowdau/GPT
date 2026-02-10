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
- Alerta de gargalo, margem e risco de caixa em linguagem simples.
- Resumo de caixa com mês de pior saldo e premissa de conversão de prazos em meses.
- Sem dependências externas, APIs ou banco de dados.

## Estrutura do projeto

- `index.html`: layout principal.
- `styles.css`: estilos visuais.
- `script.js`: cálculos e interações.

## Observações técnicas

- Entradas inválidas (incluindo fora de faixa) são destacadas visualmente e tratadas como zero.
- Divisões por zero são evitadas em todos os cálculos.
- O ponto de equilíbrio é mostrado como "Não aplicável" quando a margem unitária é zero ou negativa.

## Como testar localmente

- Opção simples: dê duplo clique em `index.html`.
- Opção com servidor local:

```bash
python -m http.server 8000
```

Depois abra `http://127.0.0.1:8000/index.html`.
