/* JAVASCRIPT = COMPORTAMENTO.
   Flusso: carica data.json -> crea i grafici -> disegna -> riaggiorna quando cambia il filtro. */

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat("it-IT");
const COLORI = { primario: "#1f5c7a", secondario: "#e0a526", testo: "#5f717a", linea: "#d3dbd9" };

let dati = null;       // qui finisce il contenuto di data.json
const grafici = {};    // le istanze ECharts, create una volta sola

// ------------------------------------------------------------------ AVVIO
async function avvia() {
  try {
    const risposta = await fetch("data.json");
    if (!risposta.ok) throw new Error(`data.json non trovato (HTTP ${risposta.status})`);
    dati = await risposta.json();
  } catch (errore) {
    mostraErrore(errore);
    return;
  }

  document.getElementById("periodo").textContent = `Dal ${dati.periodo.da} al ${dati.periodo.a}`;
  document.getElementById("piede").textContent = `Dati aggiornati al ${dati.generato_il}`;

  riempiFiltro();
  creaGrafici();
  aggiorna("Tutte");
}

function mostraErrore(errore) {
  const box = document.getElementById("errore");
  box.hidden = false;
  box.textContent =
    `Impossibile caricare i dati: ${errore.message}. ` +
    "Hai eseguito build_data.py? Stai aprendo la pagina da un server (python -m http.server) e non con doppio clic?";
}

// ------------------------------------------------------------------ FILTRO
function riempiFiltro() {
  const select = document.getElementById("filtro-regione");
  select.innerHTML = dati.regioni.map((r) => `<option value="${r}">${r}</option>`).join("");
  select.addEventListener("change", () => aggiorna(select.value)); // reagisce alla scelta
}

// ------------------------------------------------------------------ AGGIORNAMENTO
function aggiorna(regione) {
  const vista = dati.viste[regione];
  aggiornaKpi(vista.kpi);

  grafici.mensile.setOption(opzioniMensile(vista.mensile));
  grafici.categorie.setOption(opzioniCategorie(vista.categorie));
  grafici.top.setOption(opzioniTop(vista.top_prodotti));
}

function aggiornaKpi(kpi) {
  document.getElementById("kpi-fatturato").textContent = euro.format(kpi.fatturato);
  document.getElementById("kpi-ordini").textContent = numero.format(kpi.ordini);
  document.getElementById("kpi-scontrino").textContent = euro.format(kpi.scontrino_medio);

  const el = document.getElementById("kpi-variazione");
  const v = kpi.variazione_ultimo_mese;
  if (v === null) {
    el.textContent = "–";
    el.className = "";
  } else {
    el.textContent = `${v > 0 ? "+" : ""}${String(v).replace(".", ",")}%`;
    el.className = v >= 0 ? "positivo" : "negativo";
  }
}

// ------------------------------------------------------------------ GRAFICI ECHARTS
// Un grafico ECharts = un oggetto "option". Si crea l'istanza una volta, poi si cambia solo l'option.
function creaGrafici() {
  grafici.mensile = echarts.init(document.getElementById("grafico-mensile"));
  grafici.categorie = echarts.init(document.getElementById("grafico-categorie"));
  grafici.top = echarts.init(document.getElementById("grafico-top"));

  // Quando la finestra cambia dimensione, i grafici si ridisegnano
  window.addEventListener("resize", () => Object.values(grafici).forEach((g) => g.resize()));
}

const assi = {
  axisLine: { lineStyle: { color: COLORI.linea } },
  axisLabel: { color: COLORI.testo },
  splitLine: { lineStyle: { color: COLORI.linea } },
};
const tooltipEuro = (v) => euro.format(v);

function opzioniMensile({ etichette, valori }) {
  return {
    color: [COLORI.primario],
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    tooltip: { trigger: "axis", valueFormatter: tooltipEuro },
    xAxis: { type: "category", data: etichette, ...assi },
    yAxis: { type: "value", ...assi, axisLabel: { color: COLORI.testo, formatter: (v) => numero.format(v) } },
    series: [{ type: "line", data: valori, smooth: true, symbolSize: 7, areaStyle: { opacity: 0.08 } }],
  };
}

function opzioniCategorie({ etichette, valori }) {
  return {
    color: [COLORI.secondario],
    grid: { left: 60, right: 20, top: 20, bottom: 30 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: tooltipEuro },
    xAxis: { type: "category", data: etichette, ...assi },
    yAxis: { type: "value", ...assi, axisLabel: { color: COLORI.testo, formatter: (v) => numero.format(v) } },
    series: [{ type: "bar", data: valori, barMaxWidth: 48 }],
  };
}

function opzioniTop({ etichette, valori }) {
  return {
    color: [COLORI.primario],
    grid: { left: 120, right: 30, top: 20, bottom: 30 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: tooltipEuro },
    xAxis: { type: "value", ...assi, axisLabel: { color: COLORI.testo, formatter: (v) => numero.format(v) } },
    yAxis: { type: "category", data: etichette, ...assi },
    series: [{ type: "bar", data: valori, barMaxWidth: 28 }],
  };
}

avvia();
