const inputs = {
  price: document.getElementById("price"),
  volume: document.getElementById("volume"),
  variable: document.getElementById("variable"),
  fixed: document.getElementById("fixed"),
  receivable: document.getElementById("receivable"),
  payable: document.getElementById("payable"),
  default: document.getElementById("default"),
  capacity: document.getElementById("capacity"),
};

const outputs = {
  revenue: document.getElementById("revenue"),
  contribution: document.getElementById("contribution"),
  contributionRate: document.getElementById("contribution-rate"),
  profit: document.getElementById("profit"),
  breakeven: document.getElementById("breakeven"),
  alerts: document.getElementById("alerts"),
  cashSummary: document.getElementById("cash-summary"),
  assumptions: document.getElementById("projection-assumptions"),
  cashTable: document.getElementById("cash-table"),
  canvas: document.getElementById("cash-chart"),
  inputNote: document.getElementById("input-note"),
};

const scenarioButtons = {
  conservative: document.getElementById("scenario-conservative"),
  base: document.getElementById("scenario-base"),
  aggressive: document.getElementById("scenario-aggressive"),
  reset: document.getElementById("reset"),
};

const defaultValues = {
  price: 120,
  volume: 800,
  variable: 55,
  fixed: 28000,
  receivable: 45,
  payable: 30,
  default: 2.5,
  capacity: 1000,
};

const scenarios = {
  conservative: {
    price: 105,
    volume: 600,
    variable: 60,
    fixed: 30000,
    receivable: 60,
    payable: 20,
    default: 4,
    capacity: 900,
  },
  base: {
    price: 120,
    volume: 800,
    variable: 55,
    fixed: 28000,
    receivable: 45,
    payable: 30,
    default: 2.5,
    capacity: 1000,
  },
  aggressive: {
    price: 135,
    volume: 1100,
    variable: 52,
    fixed: 32000,
    receivable: 30,
    payable: 45,
    default: 1.8,
    capacity: 1200,
  },
};

const months = Array.from({ length: 12 }, (_, index) => `Mês ${index + 1}`);

const inputLabels = {
  price: "Preço médio",
  volume: "Volume de vendas mensal",
  variable: "Custo variável unitário",
  fixed: "Custos fixos mensais",
  receivable: "Prazo de recebimento",
  payable: "Prazo de pagamento",
  default: "Inadimplência",
  capacity: "Capacidade máxima mensal",
};

const formatCurrency = (value) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return safeValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const formatPercent = (value) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(1)}%`;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Sanitiza entradas numéricas e sinaliza visualmente campos inválidos/negativos.
 */
const getSanitizedInputs = () => {
  const values = {};
  const invalidFields = [];

  Object.keys(inputs).forEach((key) => {
    const input = inputs[key];
    const raw = input.value.trim();

    // Campo vazio: trata como zero sem marcar inválido.
    if (raw === "") {
      input.classList.remove("invalid");
      values[key] = 0;
      return;
    }

    const parsed = Number.parseFloat(raw);
    const min = Number.parseFloat(input.min);
    const max = Number.parseFloat(input.max);
    const isBelowMin = Number.isFinite(min) ? parsed < min : false;
    const isAboveMax = Number.isFinite(max) ? parsed > max : false;

    if (!Number.isFinite(parsed) || isBelowMin || isAboveMax) {
      invalidFields.push(inputLabels[key]);
      input.classList.add("invalid");
      values[key] = 0;
      return;
    }

    input.classList.remove("invalid");
    values[key] = parsed;
  });

  return { values, invalidFields };
};

const buildCashProjection = ({
  revenue,
  variableCost,
  fixedCost,
  receivableDays,
  payableDays,
  defaultRate,
}) => {
  const receivableLag = clamp(Math.round(receivableDays / 30), 0, 6);
  const payableLag = clamp(Math.round(payableDays / 30), 0, 6);
  const cashIn = [];
  const cashOut = [];
  const netCash = [];
  const cumulative = [];

  for (let i = 0; i < 12; i += 1) {
    const scheduledIn = i - receivableLag >= 0 ? revenue : 0;
    const received = scheduledIn * (1 - defaultRate);
    const scheduledOut = i - payableLag >= 0 ? variableCost + fixedCost : 0;

    cashIn.push(received);
    cashOut.push(scheduledOut);
    netCash.push(received - scheduledOut);
    cumulative.push((cumulative[i - 1] || 0) + netCash[i]);
  }

  return { cashIn, cashOut, netCash, cumulative, receivableLag, payableLag };
};

const drawChart = (data) => {
  const ctx = outputs.canvas.getContext("2d");
  const width = outputs.canvas.width;
  const height = outputs.canvas.height;
  ctx.clearRect(0, 0, width, height);

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const minValue = Math.min(...data, 0);
  const maxValue = Math.max(...data, 0);
  const range = maxValue - minValue || 1;

  ctx.strokeStyle = "#d1d5db";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.stroke();

  ctx.strokeStyle = "#1f6feb";
  ctx.lineWidth = 2;
  ctx.beginPath();

  data.forEach((value, index) => {
    const x = padding + (chartWidth / (data.length - 1)) * index;
    const y = padding + ((maxValue - value) / range) * chartHeight;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  ctx.fillStyle = "#1f6feb";
  data.forEach((value, index) => {
    const x = padding + (chartWidth / (data.length - 1)) * index;
    const y = padding + ((maxValue - value) / range) * chartHeight;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
};

const updateTable = ({ cashIn, cashOut, netCash, cumulative }) => {
  outputs.cashTable.innerHTML = "";
  months.forEach((month, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${month}</td>
      <td>${formatCurrency(cashIn[index])}</td>
      <td>${formatCurrency(cashOut[index])}</td>
      <td>${formatCurrency(netCash[index])}</td>
      <td>${formatCurrency(cumulative[index])}</td>
    `;
    outputs.cashTable.appendChild(row);
  });
};

const renderAlerts = (alerts) => {
  outputs.alerts.innerHTML = "";
  alerts.forEach(({ text, type }) => {
    const item = document.createElement("li");
    item.textContent = text;
    item.classList.add(type);
    outputs.alerts.appendChild(item);
  });
};

const calculate = () => {
  const { values, invalidFields } = getSanitizedInputs();
  const price = values.price;
  const volume = values.volume;
  const variable = values.variable;
  const fixed = values.fixed;
  const receivable = values.receivable;
  const payable = values.payable;
  const defaultRate = values.default / 100;
  const capacity = values.capacity;

  outputs.inputNote.textContent = invalidFields.length
    ? `Atenção: alguns campos foram tratados como zero (${invalidFields.join(", ")}).`
    : "";

  const effectiveVolume = Math.max(volume, 0);
  const revenue = price * effectiveVolume;
  const variableCost = variable * effectiveVolume;
  const unitMargin = price - variable;
  const contribution = revenue - variableCost;
  const contributionRate = revenue > 0 ? (contribution / revenue) * 100 : 0;
  const profit = contribution - fixed;

  // Ponto de equilíbrio só é válido quando a margem unitária é positiva.
  const hasValidBreakeven = unitMargin > 0;
  const breakeven = hasValidBreakeven ? fixed / unitMargin : null;

  outputs.revenue.textContent = formatCurrency(revenue);
  outputs.contribution.textContent = formatCurrency(contribution);
  outputs.contributionRate.textContent = formatPercent(contributionRate);
  outputs.profit.textContent = formatCurrency(profit);
  outputs.breakeven.textContent = hasValidBreakeven
    ? `${Math.ceil(breakeven)} un.`
    : "Não aplicável";

  const cashProjection = buildCashProjection({
    revenue,
    variableCost,
    fixedCost: fixed,
    receivableDays: receivable,
    payableDays: payable,
    defaultRate,
  });

  drawChart(cashProjection.cumulative);
  updateTable(cashProjection);

  const maxCumulative = Math.max(...cashProjection.cumulative);
  const minCumulative = Math.min(...cashProjection.cumulative);
  const worstMonthIndex = cashProjection.cumulative.findIndex(
    (value) => value === minCumulative
  );

  outputs.cashSummary.textContent =
    `Saldo máximo: ${formatCurrency(maxCumulative)} | ` +
    `Saldo mínimo: ${formatCurrency(minCumulative)} (${months[worstMonthIndex]})`;

  outputs.assumptions.textContent =
    `Premissa: prazo convertido em meses (recebimento ${cashProjection.receivableLag} ` +
    `mês(es), pagamento ${cashProjection.payableLag} mês(es)).`;

  const alerts = [];

  if (capacity <= 0) {
    alerts.push({
      text: "Informe a capacidade máxima para avaliar gargalo operacional.",
      type: "info",
    });
  } else if (volume > capacity) {
    alerts.push({
      text: `Gargalo: o volume supera a capacidade em ${Math.round(
        volume - capacity
      )} unidades.`,
      type: "warning",
    });
  } else {
    alerts.push({
      text: "Capacidade compatível com o volume planejado.",
      type: "success",
    });
  }

  if (!hasValidBreakeven) {
    alerts.push({
      text: "Ponto de equilíbrio indisponível: a margem unitária está nula ou negativa.",
      type: "warning",
    });
  }

  if (profit < 0) {
    alerts.push({
      text: "Lucro operacional negativo: reavalie preço, custos ou volume.",
      type: "warning",
    });
  } else {
    alerts.push({
      text: "Lucro operacional positivo para o cenário atual.",
      type: "success",
    });
  }

  if (minCumulative < 0) {
    alerts.push({
      text: "Caixa projetado fica negativo em alguns meses. Planeje reforço ou ajuste prazos.",
      type: "warning",
    });
  } else {
    alerts.push({
      text: "Caixa projetado saudável durante todo o período.",
      type: "success",
    });
  }

  if (contributionRate < 20) {
    alerts.push({
      text: "Margem de contribuição baixa: risco maior para oscilações de custo.",
      type: "warning",
    });
  }

  renderAlerts(alerts);
};

const applyScenario = (scenario) => {
  Object.keys(defaultValues).forEach((key) => {
    inputs[key].value = scenario[key];
  });
  calculate();
};

const resetValues = () => {
  Object.keys(defaultValues).forEach((key) => {
    inputs[key].value = "";
    inputs[key].classList.remove("invalid");
  });
  calculate();
};

Object.values(inputs).forEach((input) => {
  input.addEventListener("input", calculate);
});

scenarioButtons.conservative.addEventListener("click", () =>
  applyScenario(scenarios.conservative)
);
scenarioButtons.base.addEventListener("click", () =>
  applyScenario(scenarios.base)
);
scenarioButtons.aggressive.addEventListener("click", () =>
  applyScenario(scenarios.aggressive)
);
scenarioButtons.reset.addEventListener("click", resetValues);

applyScenario(defaultValues);
