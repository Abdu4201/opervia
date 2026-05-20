const storageKey = "operVia.history.v1";

const byId = (id) => document.getElementById(id);

const fields = {
  manufacturer: byId("manufacturer"),
  model: byId("model"),
  licensePlate: byId("licensePlate"),
  fuelType: byId("fuelType"),
  vehicleConsumption: byId("vehicleConsumption"),
  grossMass: byId("grossMass"),
  axleCount: byId("axleCount"),
  emissionClass: byId("emissionClass"),
  co2Class: byId("co2Class"),
  tollRate: byId("tollRate"),
  customer: byId("customer"),
  startAddress: byId("startAddress"),
  destinationAddress: byId("destinationAddress"),
  totalKm: byId("totalKm"),
  tollKm: byId("tollKm"),
  dieselPrice: byId("dieselPrice"),
  driverWage: byId("driverWage"),
  wearPerKm: byId("wearPerKm"),
  otherCosts: byId("otherCosts"),
  profitMargin: byId("profitMargin"),
};

const outputs = {
  salePrice: byId("salePrice"),
  fuelCost: byId("fuelCost"),
  tollCost: byId("tollCost"),
  wearCost: byId("wearCost"),
  totalCost: byId("totalCost"),
  profitAmount: byId("profitAmount"),
  marginResult: byId("marginResult"),
  routeStatus: byId("routeStatus"),
  kpiTours: byId("kpiTours"),
  kpiOffers: byId("kpiOffers"),
  kpiRevenue: byId("kpiRevenue"),
  kpiProfit: byId("kpiProfit"),
  analyticsRevenue: byId("analyticsRevenue"),
  analyticsCosts: byId("analyticsCosts"),
  analyticsProfit: byId("analyticsProfit"),
};

const buttons = {
  reset: byId("resetButton"),
  saveTour: byId("saveTourButton"),
  offer: byId("offerButton"),
  syncToll: byId("syncTollButton"),
  clearHistory: byId("clearHistoryButton"),
};

const navItems = [...document.querySelectorAll(".nav-item")];
const pages = [...document.querySelectorAll(".app-page")];
const historyBody = byId("historyBody");
const offersBody = byId("offersBody");
const initialValues = new Map();

let latestCalculation = null;

const currency = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const numberFormatter = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 1,
});

const tollRateMatrix = {
  "Euro 6": {
    1: { 3: 30.3, 4: 32.4, 5: 34.8 },
    2: { 3: 29.7, 4: 31.8, 5: 34.0 },
    3: { 3: 29.0, 4: 31.0, 5: 33.2 },
    4: { 3: 24.2, 4: 25.8, 5: 26.9 },
  },
  "Euro 5 / EEV": { 1: { 3: 34.4, 4: 36.5, 5: 38.9 } },
  "Euro 4": { 1: { 3: 36.9, 4: 39.0, 5: 41.4 } },
  "Euro 3": { 1: { 3: 43.3, 4: 45.4, 5: 47.8 } },
  "Euro 2": { 1: { 3: 46.6, 4: 48.7, 5: 51.1 } },
  "Euro 1 / 0": { 1: { 3: 47.1, 4: 49.2, 5: 51.6 } },
};

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function fieldValue(field, fallback = "") {
  return field?.value ?? fallback;
}

function asNumber(field) {
  const rawValue = String(fieldValue(field, "0")).replace(",", ".");
  return Number.parseFloat(rawValue) || 0;
}

function getAxleGroup(axleCount) {
  if (axleCount <= 3) return 3;
  if (axleCount === 4) return 4;
  return 5;
}

function getSafeId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createOfferNumber() {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  return `AN-${stamp}-${String(Date.now()).slice(-5)}`;
}

function calculateRouteManually(tour) {
  return {
    status: "Manuelle Kilometerwerte aktiv",
    totalKm: tour.totalKm,
    tollKm: tour.tollKm,
    startAddress: tour.startAddress,
    destinationAddress: tour.destinationAddress,
  };
}

function readVehicle() {
  return {
    manufacturer: fieldValue(fields.manufacturer).trim(),
    model: fieldValue(fields.model).trim(),
    licensePlate: fieldValue(fields.licensePlate).trim(),
    fuelType: fieldValue(fields.fuelType, "Diesel"),
    consumption: asNumber(fields.vehicleConsumption),
    grossMass: asNumber(fields.grossMass),
    axleCount: asNumber(fields.axleCount),
    emissionClass: fieldValue(fields.emissionClass, "Euro 6"),
    co2Class: fieldValue(fields.co2Class, "1"),
    tollRate: asNumber(fields.tollRate),
  };
}

function readTour() {
  return {
    customer: fieldValue(fields.customer).trim(),
    startAddress: fieldValue(fields.startAddress).trim(),
    destinationAddress: fieldValue(fields.destinationAddress).trim(),
    totalKm: asNumber(fields.totalKm),
    tollKm: asNumber(fields.tollKm),
    dieselPrice: asNumber(fields.dieselPrice),
    driverWage: asNumber(fields.driverWage),
    wearPerKm: asNumber(fields.wearPerKm),
    otherCosts: asNumber(fields.otherCosts),
    profitMargin: asNumber(fields.profitMargin),
  };
}

function calculate(vehicle, tour) {
  const fuelCost = (tour.totalKm / 100) * vehicle.consumption * tour.dieselPrice;
  const tollCost = tour.tollKm * (vehicle.tollRate / 100);
  const wearCost = tour.totalKm * tour.wearPerKm;
  const totalCost = fuelCost + tollCost + wearCost + tour.driverWage + tour.otherCosts;
  const profitAmount = totalCost * (tour.profitMargin / 100);
  const salePrice = totalCost + profitAmount;
  const realizedMargin = salePrice > 0 ? (profitAmount / salePrice) * 100 : 0;

  return {
    fuelCost,
    tollCost,
    wearCost,
    totalCost,
    profitAmount,
    salePrice,
    realizedMargin,
  };
}

function renderCalculation(calculation) {
  setText(outputs.fuelCost, currency.format(calculation.fuelCost));
  setText(outputs.tollCost, currency.format(calculation.tollCost));
  setText(outputs.wearCost, currency.format(calculation.wearCost));
  setText(outputs.totalCost, currency.format(calculation.totalCost));
  setText(outputs.salePrice, currency.format(calculation.salePrice));
  setText(outputs.profitAmount, currency.format(calculation.profitAmount));
  setText(outputs.marginResult, `${numberFormatter.format(calculation.realizedMargin)} %`);
}

function updateCalculation() {
  const vehicle = readVehicle();
  const tour = readTour();
  const route = calculateRouteManually(tour);
  const calculation = calculate(vehicle, tour);

  latestCalculation = {
    id: getSafeId(),
    date: new Date().toISOString(),
    offerNumber: createOfferNumber(),
    vehicle,
    tour,
    route,
    calculation,
  };

  renderCalculation(calculation);
  setText(
    outputs.routeStatus,
    `${route.status}: ${numberFormatter.format(route.totalKm)} Gesamt-km, ${numberFormatter.format(route.tollKm)} mautpflichtige km.`,
  );
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) ?? [];
  } catch {
    return [];
  }
}

function setHistory(history) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(history));
  } catch {
    // Local storage can be unavailable in strict browser contexts.
  }
}

function renderKpis(history) {
  const revenue = history.reduce((sum, entry) => sum + entry.calculation.salePrice, 0);
  const costs = history.reduce((sum, entry) => sum + entry.calculation.totalCost, 0);
  const profit = history.reduce((sum, entry) => sum + entry.calculation.profitAmount, 0);

  setText(outputs.kpiTours, history.length.toLocaleString("de-DE"));
  setText(outputs.kpiOffers, history.length.toLocaleString("de-DE"));
  setText(outputs.kpiRevenue, currency.format(revenue));
  setText(outputs.kpiProfit, currency.format(profit));
  setText(outputs.analyticsRevenue, currency.format(revenue));
  setText(outputs.analyticsCosts, currency.format(costs));
  setText(outputs.analyticsProfit, currency.format(profit));
}

function renderHistory() {
  const history = getHistory();
  renderKpis(history);
  renderOffers(history);

  if (!historyBody) return;

  if (history.length === 0) {
    historyBody.innerHTML = '<tr><td colspan="7">Noch keine Kalkulation gespeichert.</td></tr>';
    return;
  }

  historyBody.innerHTML = history
    .map((entry) => {
      const date = new Date(entry.date).toLocaleDateString("de-DE");
      const route = `${escapeHtml(entry.tour.startAddress)} &rarr; ${escapeHtml(entry.tour.destinationAddress)}`;
      const vehicle = `${escapeHtml(entry.vehicle.manufacturer)} ${escapeHtml(entry.vehicle.model)} (${escapeHtml(entry.vehicle.licensePlate)})`;

      return `
        <tr>
          <td>${date}</td>
          <td>${escapeHtml(entry.tour.customer)}</td>
          <td>${route}</td>
          <td>${vehicle}</td>
          <td>${currency.format(entry.calculation.totalCost)}</td>
          <td>${currency.format(entry.calculation.salePrice)}</td>
          <td>${currency.format(entry.calculation.profitAmount)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderOffers(history) {
  if (!offersBody) return;

  if (history.length === 0) {
    offersBody.innerHTML = '<tr><td colspan="6">Noch keine Angebote gespeichert.</td></tr>';
    return;
  }

  offersBody.innerHTML = history
    .map((entry) => {
      const date = new Date(entry.date).toLocaleDateString("de-DE");
      const route = `${escapeHtml(entry.tour.startAddress)} &rarr; ${escapeHtml(entry.tour.destinationAddress)}`;

      return `
        <tr>
          <td>${date}</td>
          <td>${escapeHtml(entry.offerNumber)}</td>
          <td>${escapeHtml(entry.tour.customer)}</td>
          <td>${route}</td>
          <td>${currency.format(entry.calculation.salePrice)}</td>
          <td>${currency.format(entry.calculation.profitAmount)}</td>
        </tr>
      `;
    })
    .join("");
}

function saveTour() {
  updateCalculation();

  if (!latestCalculation) return;

  const history = getHistory();
  history.unshift(latestCalculation);
  setHistory(history.slice(0, 50));
  renderHistory();
}

function clearHistory() {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Ignore unavailable storage.
  }
  renderHistory();
}

function syncTollRate() {
  const vehicle = readVehicle();
  const axleGroup = getAxleGroup(vehicle.axleCount);
  const classRates = tollRateMatrix[vehicle.emissionClass] ?? tollRateMatrix["Euro 6"];
  const matrixRate = classRates?.[vehicle.co2Class]?.[axleGroup] ?? classRates?.[1]?.[axleGroup];

  if (matrixRate && fields.tollRate) {
    fields.tollRate.value = matrixRate.toFixed(1);
  }

  updateCalculation();
}

function showPage(pageName) {
  pages.forEach((page) => {
    const isActive = page.dataset.page === pageName;
    page.hidden = !isActive;
    page.classList.toggle("active", isActive);
  });

  navItems.forEach((item) => {
    const isActive = item.dataset.page === pageName;
    item.classList.toggle("active", isActive);

    if (isActive) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });
}

function createOffer() {
  updateCalculation();

  if (!latestCalculation) return;

  const { vehicle, tour, calculation, offerNumber } = latestCalculation;
  const today = new Date().toLocaleDateString("de-DE");
  const logo = `<div style="width:58px;height:58px;border-radius:10px;background:#111827;color:#6ea8ff;border:1px solid #8fa3bd;display:grid;place-items:center;font-weight:900;font-size:22px;">oV</div>`;
  const offerWindow = window.open("", "_blank", "width=920,height=1100");

  if (!offerWindow) return;

  offerWindow.document.write(`
    <!doctype html>
    <html lang="de">
      <head>
        <meta charset="UTF-8" />
        <title>operVia Angebot ${offerNumber}</title>
        <style>
          body { margin: 0; padding: 48px; color: #111318; font-family: Arial, sans-serif; background: #fff; }
          header { display: flex; justify-content: space-between; gap: 32px; align-items: flex-start; border-bottom: 3px solid #1f3f75; padding-bottom: 28px; }
          h1 { margin: 28px 0 8px; font-size: 38px; }
          h2 { margin: 28px 0 12px; font-size: 18px; }
          p { margin: 4px 0; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { padding: 12px 0; border-bottom: 1px solid #d7dce2; text-align: left; }
          th:last-child, td:last-child { text-align: right; }
          .meta { text-align: right; color: #596271; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 28px; }
          .brand { color: #1f3f75; font-size: 16px; font-weight: 700; margin-top: 12px; }
          .price { margin-top: 30px; padding: 22px; background: #111827; color: #fff; display: flex; justify-content: space-between; align-items: end; }
          .price strong { color: #6ea8ff; font-size: 34px; }
          .muted { color: #596271; }
          footer { margin-top: 34px; padding-top: 16px; border-top: 1px solid #d7dce2; color: #596271; font-size: 13px; }
          @media print { body { padding: 34px; } button { display: none; } }
        </style>
      </head>
      <body>
        <header>
          <div>${logo}<p class="brand">operVia</p><h1>Transportangebot</h1><p class="muted">Transport smarter kalkulieren.</p></div>
          <div class="meta">
            <p><strong>Angebotsnummer</strong><br>${offerNumber}</p>
            <p><strong>Datum</strong><br>${today}</p>
          </div>
        </header>

        <section class="grid">
          <div>
            <h2>Kundendaten</h2>
            <p>${escapeHtml(tour.customer)}</p>
          </div>
          <div>
            <h2>Fahrzeug</h2>
            <p>${escapeHtml(vehicle.manufacturer)} ${escapeHtml(vehicle.model)}</p>
            <p>${escapeHtml(vehicle.licensePlate)} &middot; ${escapeHtml(vehicle.fuelType)} &middot; ${vehicle.axleCount} Achsen</p>
          </div>
        </section>

        <section>
          <h2>Strecke</h2>
          <p>${escapeHtml(tour.startAddress)} &rarr; ${escapeHtml(tour.destinationAddress)}</p>
          <p>${numberFormatter.format(tour.totalKm)} Gesamt-km &middot; ${numberFormatter.format(tour.tollKm)} mautpflichtige km</p>
        </section>

        <table>
          <thead><tr><th>Position</th><th>Betrag netto</th></tr></thead>
          <tbody>
            <tr><td>Dieselkosten</td><td>${currency.format(calculation.fuelCost)}</td></tr>
            <tr><td>Mautkosten</td><td>${currency.format(calculation.tollCost)}</td></tr>
            <tr><td>Verschlei&szlig;kosten</td><td>${currency.format(calculation.wearCost)}</td></tr>
            <tr><td>Fahrerlohn und sonstige Kosten</td><td>${currency.format(tour.driverWage + tour.otherCosts)}</td></tr>
            <tr><td>Gewinnaufschlag</td><td>${currency.format(calculation.profitAmount)}</td></tr>
          </tbody>
        </table>

        <div class="price">
          <span>Preis netto</span>
          <strong>${currency.format(calculation.salePrice)}</strong>
        </div>

        <footer>Absender/Software-Hinweis: erstellt mit operVia.</footer>
        <script>window.addEventListener("load", () => window.print());</script>
      </body>
    </html>
  `);

  offerWindow.document.close();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetInputs() {
  Object.values(fields).forEach((field) => {
    if (field && initialValues.has(field.id)) {
      field.value = initialValues.get(field.id);
    }
  });

  updateCalculation();
}

function bindEvents() {
  Object.values(fields).forEach((field) => {
    if (!field) return;

    initialValues.set(field.id, field.value);
    field.addEventListener("input", updateCalculation);
    field.addEventListener("change", updateCalculation);
  });

  navItems.forEach((item) => {
    item.addEventListener("click", () => showPage(item.dataset.page));
  });

  buttons.reset?.addEventListener("click", resetInputs);
  buttons.saveTour?.addEventListener("click", saveTour);
  buttons.offer?.addEventListener("click", createOffer);
  buttons.syncToll?.addEventListener("click", syncTollRate);
  buttons.clearHistory?.addEventListener("click", clearHistory);
}

bindEvents();
updateCalculation();
renderHistory();
showPage("dashboard");
