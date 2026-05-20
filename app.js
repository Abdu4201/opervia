import { calculateRouteManually } from "./routeService.js";

const form = document.querySelector("#calculatorForm");
const historyBody = document.querySelector("#historyBody");
const storageKey = "operVia.history.v1";

const fields = {
  manufacturer: document.querySelector("#manufacturer"),
  model: document.querySelector("#model"),
  licensePlate: document.querySelector("#licensePlate"),
  fuelType: document.querySelector("#fuelType"),
  vehicleConsumption: document.querySelector("#vehicleConsumption"),
  grossMass: document.querySelector("#grossMass"),
  axleCount: document.querySelector("#axleCount"),
  emissionClass: document.querySelector("#emissionClass"),
  co2Class: document.querySelector("#co2Class"),
  tollRate: document.querySelector("#tollRate"),
  customer: document.querySelector("#customer"),
  startAddress: document.querySelector("#startAddress"),
  destinationAddress: document.querySelector("#destinationAddress"),
  totalKm: document.querySelector("#totalKm"),
  tollKm: document.querySelector("#tollKm"),
  dieselPrice: document.querySelector("#dieselPrice"),
  driverWage: document.querySelector("#driverWage"),
  wearPerKm: document.querySelector("#wearPerKm"),
  otherCosts: document.querySelector("#otherCosts"),
  profitMargin: document.querySelector("#profitMargin"),
};

const outputs = {
  salePrice: document.querySelector("#salePrice"),
  fuelCost: document.querySelector("#fuelCost"),
  tollCost: document.querySelector("#tollCost"),
  wearCost: document.querySelector("#wearCost"),
  totalCost: document.querySelector("#totalCost"),
  profitAmount: document.querySelector("#profitAmount"),
  marginResult: document.querySelector("#marginResult"),
  routeStatus: document.querySelector("#routeStatus"),
};

const buttons = {
  reset: document.querySelector("#resetButton"),
  saveTour: document.querySelector("#saveTourButton"),
  offer: document.querySelector("#offerButton"),
  syncToll: document.querySelector("#syncTollButton"),
  clearHistory: document.querySelector("#clearHistoryButton"),
};

const currency = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const numberFormatter = new Intl.NumberFormat("de-DE", {
  maximumFractionDigits: 1,
});

const tollRateMatrix = {
  "Euro 6": { 1: { 3: 30.3, 4: 32.4, 5: 34.8 }, 2: { 3: 29.7, 4: 31.8, 5: 34.0 }, 3: { 3: 29.0, 4: 31.0, 5: 33.2 }, 4: { 3: 24.2, 4: 25.8, 5: 26.9 } },
  "Euro 5 / EEV": { 1: { 3: 34.4, 4: 36.5, 5: 38.9 }, 2: { 3: 34.4, 4: 36.5, 5: 38.9 }, 3: { 3: 34.4, 4: 36.5, 5: 38.9 }, 4: { 3: 34.4, 4: 36.5, 5: 38.9 } },
  "Euro 4": { 1: { 3: 36.9, 4: 39.0, 5: 41.4 }, 2: { 3: 36.9, 4: 39.0, 5: 41.4 }, 3: { 3: 36.9, 4: 39.0, 5: 41.4 }, 4: { 3: 36.9, 4: 39.0, 5: 41.4 } },
  "Euro 3": { 1: { 3: 43.3, 4: 45.4, 5: 47.8 }, 2: { 3: 43.3, 4: 45.4, 5: 47.8 }, 3: { 3: 43.3, 4: 45.4, 5: 47.8 }, 4: { 3: 43.3, 4: 45.4, 5: 47.8 } },
  "Euro 2": { 1: { 3: 46.6, 4: 48.7, 5: 51.1 }, 2: { 3: 46.6, 4: 48.7, 5: 51.1 }, 3: { 3: 46.6, 4: 48.7, 5: 51.1 }, 4: { 3: 46.6, 4: 48.7, 5: 51.1 } },
  "Euro 1 / 0": { 1: { 3: 47.1, 4: 49.2, 5: 51.6 }, 2: { 3: 47.1, 4: 49.2, 5: 51.6 }, 3: { 3: 47.1, 4: 49.2, 5: 51.6 }, 4: { 3: 47.1, 4: 49.2, 5: 51.6 } },
};

let latestCalculation = null;
const initialValues = new Map();

function asNumber(field) {
  return Number.parseFloat(field.value.replace?.(",", ".") ?? field.value) || 0;
}

function getAxleGroup(axleCount) {
  if (axleCount <= 3) return 3;
  if (axleCount === 4) return 4;
  return 5;
}

function readVehicle() {
  return {
    manufacturer: fields.manufacturer.value.trim(),
    model: fields.model.value.trim(),
    licensePlate: fields.licensePlate.value.trim(),
    fuelType: fields.fuelType.value,
    consumption: asNumber(fields.vehicleConsumption),
    grossMass: asNumber(fields.grossMass),
    axleCount: asNumber(fields.axleCount),
    emissionClass: fields.emissionClass.value,
    co2Class: fields.co2Class.value,
    tollRate: asNumber(fields.tollRate),
  };
}

function readTour() {
  return {
    customer: fields.customer.value.trim(),
    startAddress: fields.startAddress.value.trim(),
    destinationAddress: fields.destinationAddress.value.trim(),
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
    salePrice,
    profitAmount,
    realizedMargin,
  };
}

function renderOutputs(calculation) {
  outputs.salePrice.textContent = currency.format(calculation.salePrice);
  outputs.fuelCost.textContent = currency.format(calculation.fuelCost);
  outputs.tollCost.textContent = currency.format(calculation.tollCost);
  outputs.wearCost.textContent = currency.format(calculation.wearCost);
  outputs.totalCost.textContent = currency.format(calculation.totalCost);
  outputs.profitAmount.textContent = currency.format(calculation.profitAmount);
  outputs.marginResult.textContent = `${numberFormatter.format(calculation.realizedMargin)} %`;
}

async function updateCalculation() {
  const vehicle = readVehicle();
  const tour = readTour();
  const route = await calculateRouteManually(tour);
  const calculation = calculate(vehicle, tour);

  latestCalculation = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    offerNumber: createOfferNumber(),
    vehicle,
    tour,
    route,
    calculation,
  };

  renderOutputs(calculation);
  outputs.routeStatus.textContent = `${route.status}: ${numberFormatter.format(route.totalKm)} Gesamt-km, ${numberFormatter.format(route.tollKm)} mautpflichtige km.`;
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

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) ?? [];
  } catch {
    return [];
  }
}

function setHistory(history) {
  localStorage.setItem(storageKey, JSON.stringify(history));
}

function saveTour() {
  if (!latestCalculation) return;
  const history = getHistory();
  history.unshift(latestCalculation);
  setHistory(history.slice(0, 50));
  renderHistory();
}

function renderHistory() {
  const history = getHistory();

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

function clearHistory() {
  localStorage.removeItem(storageKey);
  renderHistory();
}

function syncTollRate() {
  const vehicle = readVehicle();
  const axleGroup = getAxleGroup(vehicle.axleCount);
  const matrixRate = tollRateMatrix[vehicle.emissionClass]?.[vehicle.co2Class]?.[axleGroup];

  if (matrixRate) {
    fields.tollRate.value = matrixRate.toFixed(1);
    updateCalculation();
  }
}

function createOffer() {
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
          <thead>
            <tr><th>Position</th><th>Betrag netto</th></tr>
          </thead>
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

Object.values(fields).forEach((field) => {
  initialValues.set(field.id, field.value);
  field.addEventListener("input", updateCalculation);
  field.addEventListener("change", updateCalculation);
});

buttons.reset.addEventListener("click", () => {
  Object.values(fields).forEach((field) => {
    field.value = initialValues.get(field.id);
  });
  syncTollRate();
  updateCalculation();
});
buttons.saveTour.addEventListener("click", saveTour);
buttons.offer.addEventListener("click", createOffer);
buttons.syncToll.addEventListener("click", syncTollRate);
buttons.clearHistory.addEventListener("click", clearHistory);

syncTollRate();
renderHistory();
