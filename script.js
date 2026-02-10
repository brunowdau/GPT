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
  cashTable: document.getElementById("cash-table"),
  canvas: document.getElementById("cash-chart"),
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

const getValue = (input) => {
  const parsed = parseFloat(input.value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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

  return { cashIn, cashOut, netCash, cumulative };
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
  const price = getValue(inputs.price);
  const volume = getValue(inputs.volume);
  const variable = getValue(inputs.variable);
  const fixed = getValue(inputs.fixed);
  const receivable = getValue(inputs.receivable);
  const payable = getValue(inputs.payable);
  const defaultRate = getValue(inputs.default) / 100;
  const capacity = getValue(inputs.capacity);

  const effectiveVolume = Math.max(volume, 0);
  const revenue = price * effectiveVolume;
  const variableCost = variable * effectiveVolume;
  const contribution = revenue - variableCost;
  const contributionRate = revenue > 0 ? (contribution / revenue) * 100 : 0;
  const profit = contribution - fixed;
  const breakeven = contribution > 0 ? fixed / (price - variable || 1) : 0;

  outputs.revenue.textContent = formatCurrency(revenue);
  outputs.contribution.textContent = formatCurrency(contribution);
  outputs.contributionRate.textContent = formatPercent(contributionRate);
  outputs.profit.textContent = formatCurrency(profit);
  outputs.breakeven.textContent = `${Math.ceil(breakeven)} un.`;

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

  outputs.cashSummary.textContent =
    `Saldo máximo: ${formatCurrency(maxCumulative)} | ` +
    `Saldo mínimo: ${formatCurrency(minCumulative)}`;

  const alerts = [];

  if (volume > capacity && capacity > 0) {
    alerts.push({
      text: `Gargalo: o volume supera a capacidade em ${Math.round(volume - capacity)} unidades.`,
      type: "warning",
    });
  } else {
    alerts.push({
      text: "Capacidade compatível com o volume planejado.",
      type: "success",
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
