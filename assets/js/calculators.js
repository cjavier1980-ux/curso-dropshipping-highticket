import { Storage } from './storage.js';

let unitChartInstance = null;
let breakEvenChartInstance = null;

export const Calculators = {
  render(containerEl) {
    const state = Storage.getCalcState();
    const profile = Storage.getProfile();

    containerEl.innerHTML = `
      <div style="margin-bottom:1.5rem;">
        <span class="level-badge level-intermedio" style="margin-bottom:0.4rem;">🧮 LABORATORIO FINANCIERO INTERACTIVO</span>
        <h1>Calculadoras de Economía Unitaria, Punto de Equilibrio y ROAS</h1>
        <p style="color:var(--text-secondary); margin-top:0.35rem;">
          Usa los <strong>controles deslizantes (sliders)</strong> o escribe cifras exactas en los <strong>campos numéricos editables sincronizados</strong> de al lado. Tus números se guardan automáticamente en el navegador.
        </p>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.85rem;">
          <button type="button" class="btn btn-secondary btn-sm" id="calc-preset-mid">⚡ Ejemplo Base (US$450)</button>
          <button type="button" class="btn btn-secondary btn-sm" id="calc-preset-high">🔥 Ejemplo Ticket Alto (US$680)</button>
          <button type="button" class="btn btn-secondary btn-sm" id="calc-preset-bnpl">💳 Ejemplo con Cuotas BNPL (5.9%)</button>
          <button type="button" class="btn btn-secondary btn-sm" id="calc-reset-btn">🔄 Restaurar Valores Base</button>
          <a href="curso/plantillas/m03-modelo-maestro-economia-unitaria.csv" download class="btn btn-primary btn-sm">📥 Descargar Hoja de Cálculo (.CSV)</a>
        </div>
      </div>

      <div class="calc-grid">
        <!-- PANEL IZQUIERDO: CONTROLES SLIDER + INPUT NUMÉRICO SINCRONIZADO -->
        <div class="calc-panel" aria-label="Variables de entrada de la calculadora">
          <h2 style="font-size:1.15rem; margin-bottom:1rem;">1. Variables del Pedido y del Negocio</h2>

          <!-- Precio de Venta -->
          <div class="slider-control-group">
            <div class="slider-label-row">
              <label for="num-precio">💵 Precio de Venta al Cliente (MAP / Retail)</label>
              <span class="mono-num" style="color:var(--accent-primary);">Rango ideal: US$150–US$800</span>
            </div>
            <div class="slider-sync-row">
              <input type="range" id="rng-precio" min="80" max="1500" step="5" value="${state.precio}" aria-label="Slider Precio de Venta" />
              <div class="num-sync-input-wrap">
                <span class="num-sync-prefix">$</span>
                <input type="number" id="num-precio" class="num-sync-input has-prefix" min="10" max="5000" step="1" value="${state.precio}" aria-label="Número Precio de Venta" />
              </div>
            </div>
          </div>

          <!-- Costo del Producto COGS -->
          <div class="slider-control-group">
            <div class="slider-label-row">
              <label for="num-cogs">🏭 Costo Mayorista del Proveedor (COGS)</label>
              <span id="lbl-cogs-pct" class="mono-num" style="color:var(--text-muted);">57.8% del precio</span>
            </div>
            <div class="slider-sync-row">
              <input type="range" id="rng-cogs" min="40" max="1100" step="5" value="${state.cogs}" aria-label="Slider Costo del Producto" />
              <div class="num-sync-input-wrap">
                <span class="num-sync-prefix">$</span>
                <input type="number" id="num-cogs" class="num-sync-input has-prefix" min="1" max="4000" step="1" value="${state.cogs}" aria-label="Número Costo del Producto" />
              </div>
            </div>
          </div>

          <!-- Costo de Envío Doméstico -->
          <div class="slider-control-group">
            <div class="slider-label-row">
              <label for="num-envio">🚚 Costo de Envío Doméstico (UPS/FedEx/DIM)</label>
              <span id="lbl-envio-pct" class="mono-num" style="color:var(--text-muted);">7.8% del precio</span>
            </div>
            <div class="slider-sync-row">
              <input type="range" id="rng-envio" min="0" max="250" step="1" value="${state.envio}" aria-label="Slider Costo de Envío" />
              <div class="num-sync-input-wrap">
                <span class="num-sync-prefix">$</span>
                <input type="number" id="num-envio" class="num-sync-input has-prefix" min="0" max="1000" step="1" value="${state.envio}" aria-label="Número Costo de Envío" />
              </div>
            </div>
          </div>

          <!-- Comisión de Pasarela de Pago -->
          <div class="slider-control-group">
            <div class="slider-label-row">
              <label for="num-pasarela">💳 Comisión Pasarela (% + US$0.30 fijo)</label>
              <span class="mono-num" style="color:var(--text-muted);">Estándar: 2.9% | BNPL: 5.9%</span>
            </div>
            <div class="slider-sync-row">
              <input type="range" id="rng-pasarela" min="1.5" max="8.0" step="0.1" value="${state.pasarelaPct}" aria-label="Slider Comisión Pasarela" />
              <div class="num-sync-input-wrap">
                <input type="number" id="num-pasarela" class="num-sync-input has-suffix" min="0" max="20" step="0.1" value="${state.pasarelaPct}" aria-label="Número Comisión Pasarela" />
                <span class="num-sync-suffix">%</span>
              </div>
            </div>
          </div>

          <!-- Costo por Adquisición (CPA Publicidad) -->
          <div class="slider-control-group">
            <div class="slider-label-row">
              <label for="num-cpa">📢 Costo por Adquisición en Publicidad (CPA)</label>
              <span id="lbl-roas-actual" class="mono-num" style="color:var(--accent-primary);">ROAS: 7.50x</span>
            </div>
            <div class="slider-sync-row">
              <input type="range" id="rng-cpa" min="0" max="250" step="1" value="${state.cpa}" aria-label="Slider CPA Publicidad" />
              <div class="num-sync-input-wrap">
                <span class="num-sync-prefix">$</span>
                <input type="number" id="num-cpa" class="num-sync-input has-prefix" min="0" max="1000" step="1" value="${state.cpa}" aria-label="Número CPA Publicidad" />
              </div>
            </div>
          </div>

          <!-- Provisión de Devoluciones y Contracargos -->
          <div class="slider-control-group">
            <div class="slider-label-row">
              <label for="num-devoluciones">🛡️ Provisión Devoluciones + Contracargos (%)</label>
              <span class="mono-num" style="color:var(--text-muted);">Recomendado: 3.0% a 4.0%</span>
            </div>
            <div class="slider-sync-row">
              <input type="range" id="rng-devoluciones" min="0" max="15" step="0.5" value="${state.devolucionesPct}" aria-label="Slider Provisión Devoluciones" />
              <div class="num-sync-input-wrap">
                <input type="number" id="num-devoluciones" class="num-sync-input has-suffix" min="0" max="50" step="0.5" value="${state.devolucionesPct}" aria-label="Número Provisión Devoluciones" />
                <span class="num-sync-suffix">%</span>
              </div>
            </div>
          </div>

          <!-- Costos Fijos Mensuales (para Punto de Equilibrio) -->
          <div class="slider-control-group">
            <div class="slider-label-row">
              <label for="num-fijos">🏢 Costos Fijos Mensuales (Shopify US$39 + Dominio/VoIP)</label>
              <span class="mono-num" style="color:var(--text-muted);">Para Punto de Equilibrio</span>
            </div>
            <div class="slider-sync-row">
              <input type="range" id="rng-fijos" min="29" max="500" step="5" value="${state.costosFijosMes}" aria-label="Slider Costos Fijos Mensuales" />
              <div class="num-sync-input-wrap">
                <span class="num-sync-prefix">$</span>
                <input type="number" id="num-fijos" class="num-sync-input has-prefix" min="0" max="5000" step="5" value="${state.costosFijosMes}" aria-label="Número Costos Fijos Mensuales" />
              </div>
            </div>
          </div>
        </div>

        <!-- PANEL DERECHO: RESULTADOS EN TIEMPO REAL Y GRÁFICOS -->
        <div style="display:flex; flex-direction:column; gap:1.25rem;">
          <div class="calc-panel" aria-live="polite">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; margin-bottom:0.9rem;">
              <h2 style="font-size:1.15rem; margin:0;">2. Diagnóstico de Economía Unitaria</h2>
              <span id="calc-verdict-badge" class="level-badge level-basico">✅ APROBADO (>= US$40)</span>
            </div>

            <div class="kpi-results-grid">
              <div class="kpi-result-box highlight-pass" id="box-ganancia-neta">
                <div class="kpi-result-label">Ganancia Neta / Pedido</div>
                <div class="kpi-result-val" id="res-ganancia-neta">+$68.15</div>
                <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:0.2rem;" id="res-margen-neto-pct">Margen neto: 15.1%</div>
              </div>

              <div class="kpi-result-box">
                <div class="kpi-result-label">CPA Máximo (Break-Even)</div>
                <div class="kpi-result-val" id="res-cpa-max">$128.15</div>
                <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:0.2rem;" id="res-cpa-target">CPA p/ ganar US$40: $88.15</div>
              </div>

              <div class="kpi-result-box">
                <div class="kpi-result-label">ROAS de Equilibrio</div>
                <div class="kpi-result-val" id="res-roas-be">3.51x</div>
                <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:0.2rem;" id="res-roas-actual">ROAS actual: 7.50x</div>
              </div>

              <div class="kpi-result-box">
                <div class="kpi-result-label">Punto Equilibrio y Meta</div>
                <div class="kpi-result-val" id="res-pedidos-meta">37 pedidos/mes</div>
                <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:0.2rem;" id="res-pedidos-be">Equilibrio fijo: 1 pedido/mes</div>
              </div>
            </div>

            <!-- Gráfico 1: Desglose de Costos y Ganancia Neta por Pedido -->
            <div class="visual-resource-box" style="margin:0.5rem 0 0;">
              <div class="visual-resource-header">
                <span>📊 DESGLOSE VISUAL Y GANANCIA NETA POR PEDIDO (US$)</span>
              </div>
              <div class="chart-wrapper" style="min-height:245px;">
                <canvas id="calc-unit-chart" role="img" aria-label="Gráfico de ganancia neta por pedido"></canvas>
              </div>
            </div>
          </div>

          <!-- Gráfico 2: Curva de Punto de Equilibrio Mensual -->
          <div class="calc-panel">
            <h3 style="font-size:1.05rem; margin-bottom:0.4rem;">3. Proyección Mensual y Punto de Equilibrio (Meta: US$${profile.metaMensual}/mes)</h3>
            <p style="font-size:0.84rem; color:var(--text-secondary); margin-bottom:0.75rem;" id="res-narrative-summary"></p>
            <div class="chart-wrapper" style="min-height:220px;">
              <canvas id="calc-breakeven-chart" role="img" aria-label="Gráfico de punto de equilibrio mensual"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    // Vincular pares de Slider + Input Numérico Sincronizados
    const bindSyncPair = (rngId, numId, stateKey) => {
      const rng = containerEl.querySelector(`#${rngId}`);
      const num = containerEl.querySelector(`#${numId}`);

      rng.addEventListener('input', () => {
        num.value = rng.value;
        state[stateKey] = parseFloat(rng.value) || 0;
        recalculate();
      });

      num.addEventListener('input', () => {
        const val = parseFloat(num.value);
        if (!isNaN(val)) {
          rng.value = val;
          state[stateKey] = val;
          recalculate();
        }
      });
    };

    bindSyncPair('rng-precio', 'num-precio', 'precio');
    bindSyncPair('rng-cogs', 'num-cogs', 'cogs');
    bindSyncPair('rng-envio', 'num-envio', 'envio');
    bindSyncPair('rng-pasarela', 'num-pasarela', 'pasarelaPct');
    bindSyncPair('rng-cpa', 'num-cpa', 'cpa');
    bindSyncPair('rng-devoluciones', 'num-devoluciones', 'devolucionesPct');
    bindSyncPair('rng-fijos', 'num-fijos', 'costosFijosMes');

    const applyPreset = (preset) => {
      Object.assign(state, preset);
      containerEl.querySelector('#rng-precio').value = state.precio;
      containerEl.querySelector('#num-precio').value = state.precio;
      containerEl.querySelector('#rng-cogs').value = state.cogs;
      containerEl.querySelector('#num-cogs').value = state.cogs;
      containerEl.querySelector('#rng-envio').value = state.envio;
      containerEl.querySelector('#num-envio').value = state.envio;
      containerEl.querySelector('#rng-pasarela').value = state.pasarelaPct;
      containerEl.querySelector('#num-pasarela').value = state.pasarelaPct;
      containerEl.querySelector('#rng-cpa').value = state.cpa;
      containerEl.querySelector('#num-cpa').value = state.cpa;
      containerEl.querySelector('#rng-devoluciones').value = state.devolucionesPct;
      containerEl.querySelector('#num-devoluciones').value = state.devolucionesPct;
      containerEl.querySelector('#rng-fijos').value = state.costosFijosMes;
      containerEl.querySelector('#num-fijos').value = state.costosFijosMes;
      recalculate();
    };

    containerEl.querySelector('#calc-preset-mid').addEventListener('click', () => {
      applyPreset({ precio: 450, cogs: 260, envio: 35, pasarelaPct: 2.9, cpa: 60, devolucionesPct: 3.0, costosFijosMes: 65 });
    });
    containerEl.querySelector('#calc-preset-high').addEventListener('click', () => {
      applyPreset({ precio: 680, cogs: 395, envio: 55, pasarelaPct: 2.9, cpa: 75, devolucionesPct: 3.0, costosFijosMes: 65 });
    });
    containerEl.querySelector('#calc-preset-bnpl').addEventListener('click', () => {
      applyPreset({ precio: 520, cogs: 295, envio: 40, pasarelaPct: 5.9, cpa: 65, devolucionesPct: 3.0, costosFijosMes: 65 });
    });
    containerEl.querySelector('#calc-reset-btn').addEventListener('click', () => {
      const defaults = Storage.resetCalcState();
      applyPreset(defaults);
    });

    const recalculate = () => {
      Storage.saveCalcState(state);

      const precio = Math.max(1, state.precio);
      const cogs = state.cogs;
      const envio = state.envio;
      const pasarelaFee = (precio * (state.pasarelaPct / 100)) + 0.30;
      const devolucionesFee = precio * (state.devolucionesPct / 100);
      const cpa = state.cpa;
      const fijos = state.costosFijosMes;

      const costosSinAds = cogs + envio + pasarelaFee + devolucionesFee;
      const margenAntesDeAds = precio - costosSinAds; // Break-Even CPA
      const gananciaNeta = margenAntesDeAds - cpa;
      const margenNetoPct = (gananciaNeta / precio) * 100;

      const roasEquilibrio = margenAntesDeAds > 0 ? (precio / margenAntesDeAds) : 99.9;
      const roasActual = cpa > 0 ? (precio / cpa) : 0;
      const cpaPara40 = margenAntesDeAds - 40;

      const pedidosBreakEven = gananciaNeta > 0 ? Math.ceil(fijos / gananciaNeta) : 0;
      const pedidosParaMeta = gananciaNeta > 0 ? Math.ceil((profile.metaMensual + fijos) / gananciaNeta) : 0;

      // Actualizar etiquetas secundarias
      containerEl.querySelector('#lbl-cogs-pct').textContent = `${((cogs / precio) * 100).toFixed(1)}% del precio`;
      containerEl.querySelector('#lbl-envio-pct').textContent = `${((envio / precio) * 100).toFixed(1)}% del precio`;
      containerEl.querySelector('#lbl-roas-actual').textContent = cpa > 0 ? `ROAS: ${roasActual.toFixed(2)}x` : 'Sin gasto Ads';

      // Actualizar cajas de resultados
      const netEl = containerEl.querySelector('#res-ganancia-neta');
      const boxNet = containerEl.querySelector('#box-ganancia-neta');
      const verdictBadge = containerEl.querySelector('#calc-verdict-badge');

      netEl.textContent = `${gananciaNeta >= 0 ? '+' : '-'}$${Math.abs(gananciaNeta).toFixed(2)}`;
      containerEl.querySelector('#res-margen-neto-pct').textContent = `Margen neto: ${margenNetoPct.toFixed(1)}%`;

      if (gananciaNeta >= profile.gananciaMinima) {
        boxNet.className = 'kpi-result-box highlight-pass';
        verdictBadge.className = 'level-badge level-basico';
        verdictBadge.textContent = `✅ APROBADO (>= US$${profile.gananciaMinima} netos)`;
      } else if (gananciaNeta > 0) {
        boxNet.className = 'kpi-result-box highlight-fail';
        verdictBadge.className = 'level-badge level-intermedio';
        verdictBadge.textContent = `⚠️ MARGEN BAJO (< US$${profile.gananciaMinima} netos)`;
      } else {
        boxNet.className = 'kpi-result-box highlight-fail';
        verdictBadge.className = 'level-badge level-avanzado';
        verdictBadge.textContent = '❌ PÉRDIDA DE DINERO (NO-GO)';
      }

      containerEl.querySelector('#res-cpa-max').textContent = `$${margenAntesDeAds.toFixed(2)}`;
      containerEl.querySelector('#res-cpa-target').textContent = `CPA máx p/ ganar $${profile.gananciaMinima}: $${Math.max(0, cpaPara40).toFixed(2)}`;
      containerEl.querySelector('#res-roas-be').textContent = margenAntesDeAds > 0 ? `${roasEquilibrio.toFixed(2)}x` : 'Inviable';
      containerEl.querySelector('#res-roas-actual').textContent = cpa > 0 ? `ROAS actual: ${roasActual.toFixed(2)}x` : 'ROAS orgánico';

      if (gananciaNeta > 0) {
        containerEl.querySelector('#res-pedidos-meta').textContent = `${pedidosParaMeta} pedidos/mes`;
        containerEl.querySelector('#res-pedidos-be').textContent = `Equilibrio costos fijos: ${pedidosBreakEven} pedido${pedidosBreakEven === 1 ? '' : 's'}/mes`;
        containerEl.querySelector('#res-narrative-summary').innerHTML = `
          Con una ganancia neta libre de <strong>US$${gananciaNeta.toFixed(2)} por pedido</strong>, cubres tus costos fijos mensuales (US$${fijos}) con apenas <strong>${pedidosBreakEven} pedido${pedidosBreakEven === 1 ? '' : 's'}</strong> y alcanzas tu meta de <strong>US$${profile.metaMensual} netos/mes</strong> con <strong>${pedidosParaMeta} pedidos al mes</strong> (~${(pedidosParaMeta / 30).toFixed(1)} pedidos por día).
        `;
      } else {
        containerEl.querySelector('#res-pedidos-meta').textContent = 'Inviable';
        containerEl.querySelector('#res-pedidos-be').textContent = 'Margen negativo';
        containerEl.querySelector('#res-narrative-summary').innerHTML = `
          ⚠️ <strong>Atención:</strong> Con estos costos estás perdiendo <strong>US$${Math.abs(gananciaNeta).toFixed(2)} por cada venta</strong>. Reduce el costo de proveedor/envío, sube el precio o reduce el CPA antes de anunciar este producto.
        `;
      }

      updateCharts(precio, cogs, envio, pasarelaFee, devolucionesFee, cpa, gananciaNeta, fijos, profile.metaMensual);
    };

    const updateCharts = (precio, cogs, envio, pasarelaFee, devolucionesFee, cpa, gananciaNeta, fijos, metaMensual) => {
      if (!window.Chart) return;
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const textColor = isDark ? '#CBD5E1' : '#334155';
      const gridColor = isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.08)';

      const unitCanvas = containerEl.querySelector('#calc-unit-chart');
      if (unitCanvas) {
        if (unitChartInstance) unitChartInstance.destroy();
        unitChartInstance = new window.Chart(unitCanvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: ['Precio Venta', 'Costo COGS', 'Envío', 'Pasarela', 'Devoluciones', 'Publicidad CPA', 'GANANCIA NETA'],
            datasets: [{
              label: 'US$ por Pedido',
              data: [
                Number(precio.toFixed(2)),
                Number(cogs.toFixed(2)),
                Number(envio.toFixed(2)),
                Number(pasarelaFee.toFixed(2)),
                Number(devolucionesFee.toFixed(2)),
                Number(cpa.toFixed(2)),
                Number(gananciaNeta.toFixed(2))
              ],
              backgroundColor: [
                '#2563EB',
                '#64748B',
                '#0891B2',
                '#D97706',
                '#F59E0B',
                '#7C3AED',
                gananciaNeta >= 40 ? '#059669' : '#DC2626'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: { ticks: { color: textColor, font: { size: 11 } }, grid: { color: gridColor } },
              y: { ticks: { color: textColor }, grid: { color: gridColor } }
            }
          }
        });
      }

      const beCanvas = containerEl.querySelector('#calc-breakeven-chart');
      if (beCanvas) {
        if (breakEvenChartInstance) breakEvenChartInstance.destroy();
        const orderSteps = [0, 5, 10, 20, 30, 40, 50];
        const netProfitSeries = orderSteps.map((n) => Number(((n * gananciaNeta) - fijos).toFixed(2)));
        const targetLine = orderSteps.map(() => metaMensual);

        breakEvenChartInstance = new window.Chart(beCanvas.getContext('2d'), {
          type: 'line',
          data: {
            labels: orderSteps.map((n) => `${n} ped.`),
            datasets: [
              {
                label: 'Ganancia Neta Acumulada en el Mes (US$)',
                data: netProfitSeries,
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.15)',
                fill: true,
                tension: 0.25
              },
              {
                label: `Meta Mensual (US$${metaMensual})`,
                data: targetLine,
                borderColor: '#2563EB',
                borderDash: [6, 4],
                pointRadius: 0,
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: textColor } }
            },
            scales: {
              x: { ticks: { color: textColor }, grid: { color: gridColor } },
              y: { ticks: { color: textColor }, grid: { color: gridColor } }
            }
          }
        });
      }
    };

    recalculate();
  }
};
