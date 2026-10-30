import { Storage } from './storage.js';
import { MarkdownEngine } from './markdown-engine.js';
import { Calculators } from './calculators.js';

const TEMPLATES_CATALOG = [
  { mod: '00', title: 'Carta Operativa Personal y Reglas de Riesgo', file: 'm00-carta-operativa-personal.md', type: 'Markdown / Documento', desc: 'Define tu presupuesto inicial, horario de 12 h/semana, horario de atención telefónica y código ético.' },
  { mod: '01', title: 'Matriz de Validación de Nichos y 15 Productos', file: 'm01-matriz-validacion-nichos-productos.csv', type: 'Hoja de Cálculo CSV (Excel/Sheets)', desc: 'Evalúa los 10 Filtros de Oro, búsquedas EN/ES, Peso Volumétrico (DIM) y ganancia neta preliminar.' },
  { mod: '02', title: 'Directorio y Auditoría de 20 Proveedores en EE. UU.', file: 'm02-directorio-auditoria-proveedores-usa.csv', type: 'Hoja de Cálculo CSV (Excel/Sheets)', desc: 'Controla ubicación de bodega, SLA de despacho, política MAP, RMA y requisitos de apertura.' },
  { mod: '02', title: 'Guiones B2B de Contacto a Proveedores (Inglés y Español)', file: 'm02-guiones-contacto-proveedores-b2b-en-es.md', type: 'Guiones Bilingües (.MD)', desc: 'Correos y guiones telefónicos en inglés y español para conseguir aprobación como Authorized Dealer.' },
  { mod: '03', title: 'Modelo Maestro de Economía Unitaria y Punto de Equilibrio', file: 'm03-modelo-maestro-economia-unitaria.csv', type: 'Hoja de Cálculo CSV (Excel/Sheets)', desc: 'Cálculo exacto de COGS, envío, pasarela, BNPL, devoluciones, CPA máximo y ROAS de equilibrio.' },
  { mod: '04', title: 'Plantillas de Políticas Visibles de Tienda Bilingüe (FTC)', file: 'm04-plantillas-politicas-tienda-bilingue.md', type: 'Plantillas Legales (.MD)', desc: 'Políticas de Envío y Devoluciones en inglés y español alineadas con reglas FTC y Google Merchant Center.' },
  { mod: '06', title: 'Protocolo del Semáforo Antifraude y Llamada de 2 Minutos', file: 'm06-protocolo-semaforo-antifraude.md', type: 'Checklist + Guion (.MD)', desc: 'Clasificación Verde/Amarillo/Rojo y guion de verificación telefónica para prevenir contracargos.' },
  { mod: '09', title: 'Guiones de Venta Consultiva por Teléfono y WhatsApp (EN/ES)', file: 'm09-guiones-venta-consultiva-whatsapp-telefono.md', type: 'Guiones Bilingües (.MD)', desc: 'Apertura, diagnóstico, matriz de respuestas a las 7 objeciones y cierre con Draft Orders.' },
  { mod: '10', title: 'Manual SOP Diario (15 min) y 12 Mensajes Postventa', file: 'm10-manual-sop-pedidos-y-mensajes-postventa.md', type: 'Manual Operativo (.MD)', desc: 'Procedimiento paso a paso de órdenes de compra (PO), seguimiento proactivo y recolección de reseñas.' },
  { mod: '11', title: 'Tablero Semanal de KPIs y Reglas de Pausa/Escala', file: 'm11-tablero-semanal-kpis-y-reglas-escala.csv', type: 'Hoja de Cálculo CSV (Excel/Sheets)', desc: 'Registro dominical de tráfico EN/ES, consultas, ROAS real (MER), ganancia neta y decisiones.' },
  { mod: '12', title: 'Cronograma Ejecutable de Lanzamiento 30, 60 y 90 Días', file: 'm12-plan-ejecucion-30-60-90-dias.csv', type: 'Hoja de Cálculo CSV (Excel/Sheets)', desc: 'Hoja de ruta semana a semana adaptada a 12 horas semanales desde cero hasta operación estable.' }
];

let progressChartInstance = null;
let currentFilterPhase = 'ALL';

const App = {
  async init() {
    this.applySavedPreferences();
    this.bindGlobalHeaderAndNav();

    const mainEl = document.getElementById('app-main');
    mainEl.innerHTML = `
      <div style="padding:3rem 1rem; text-align:center;">
        <div style="font-size:2rem; margin-bottom:0.5rem;">⏳</div>
        <h2>Cargando catálogo de módulos y lecciones...</h2>
        <p style="color:var(--text-secondary);">Auto-descubriendo archivos Markdown en <code>/curso/modulo-XX/</code></p>
      </div>
    `;

    await MarkdownEngine.discoverCourseContent();
    this.renderSidebar();
    this.handleRoute();

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('scroll', () => this.updateReadingProgress(), { passive: true });
  },

  applySavedPreferences() {
    const prefs = Storage.getPrefs();
    document.documentElement.setAttribute('data-theme', prefs.theme || 'light');
    document.documentElement.setAttribute('data-font-size', prefs.fontSize || 'normal');
    document.documentElement.setAttribute('data-font-serif', prefs.serif ? 'true' : 'false');
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = prefs.theme === 'dark' ? '☀️ <span class="hide-xs">Claro</span>' : '🌙 <span class="hide-xs">Oscuro</span>';
    }
  },

  bindGlobalHeaderAndNav() {
    // Alternar Modo Claro / Oscuro
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
      const curr = Storage.getPrefs().theme;
      const next = curr === 'dark' ? 'light' : 'dark';
      Storage.savePrefs({ theme: next });
      this.applySavedPreferences();
      this.handleRoute();
    });

    // Menú lateral en móvil (Drawer)
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('drawer-backdrop');
    const closeDrawer = () => {
      sidebar?.classList.remove('drawer-open');
      backdrop?.classList.remove('active');
    };
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      sidebar?.classList.toggle('drawer-open');
      backdrop?.classList.toggle('active');
    });
    backdrop?.addEventListener('click', closeDrawer);

    // Buscador Global (Modal)
    const searchBackdrop = document.getElementById('search-modal-backdrop');
    const searchInput = document.getElementById('global-search-input');
    const openSearch = () => {
      searchBackdrop?.classList.add('open');
      setTimeout(() => searchInput?.focus(), 60);
      this.performGlobalSearch('');
    };
    const closeSearch = () => searchBackdrop?.classList.remove('open');

    document.getElementById('open-search-btn')?.addEventListener('click', openSearch);
    document.getElementById('close-search-btn')?.addEventListener('click', closeSearch);
    searchBackdrop?.addEventListener('click', (e) => {
      if (e.target === searchBackdrop) closeSearch();
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openSearch();
      } else if (e.key === 'Escape') {
        closeSearch();
        closeDrawer();
      }
    });

    searchInput?.addEventListener('input', (e) => {
      this.performGlobalSearch(e.target.value);
    });
  },

  // Calcula estadísticas globales de avance
  getCourseStats() {
    let totalLessons = 0;
    let completedLessons = 0;
    let inProgressLessons = 0;

    const moduleStats = MarkdownEngine.catalog.map((mod) => {
      const count = mod.lessons.length;
      let done = 0;
      mod.lessons.forEach((lec) => {
        totalLessons += 1;
        const st = Storage.getLessonStatus(lec.key);
        if (st === 'completed') {
          completedLessons += 1;
          done += 1;
        } else if (st === 'in_progress') {
          inProgressLessons += 1;
        }
      });
      const pct = count > 0 ? Math.round((done / count) * 100) : 0;
      return { modNum: mod.numero, titulo: mod.titulo, count, done, pct, color: mod.color };
    });

    const totalPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return { totalLessons, completedLessons, inProgressLessons, totalPct, moduleStats };
  },

  // Renderiza el menú lateral de módulos y lecciones
  renderSidebar() {
    const navList = document.getElementById('sidebar-modules-list');
    if (!navList) return;

    const stats = this.getCourseStats();
    const hash = window.location.hash || '#/inicio';

    navList.innerHTML = MarkdownEngine.catalog.map((mod, idx) => {
      const mStat = stats.moduleStats[idx] || { pct: 0, done: 0, count: 0 };
      const isModActive = hash.includes(`/modulo/${mod.numero}`) || hash.includes(`/leccion/${mod.numero}/`) || hash.includes(`/cheatsheet/${mod.numero}`);

      const lessonsHtml = mod.lessons.map((lec) => {
        const st = Storage.getLessonStatus(lec.key);
        const icon = st === 'completed' ? '✅' : (st === 'in_progress' ? '◐' : '○');
        const isLecActive = hash === `#/leccion/${mod.numero}/${lec.lessonNum}`;
        return `
          <li>
            <a href="#/leccion/${mod.numero}/${lec.lessonNum}" class="sidebar-lesson-link ${isLecActive ? 'active' : ''}">
              <span>${icon}</span>
              <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">L${lec.lessonNum}. ${lec.meta.titulo}</span>
            </a>
          </li>
        `;
      }).join('');

      return `
        <li class="sidebar-module-item">
          <button type="button" class="sidebar-module-btn ${isModActive ? 'active' : ''}" style="border-left-color:${mod.color};" onclick="window.location.hash='#/modulo/${mod.numero}'">
            <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              <strong>M${mod.numero}</strong> · ${mod.titulo.split(':')[0]}
            </span>
            <span class="mono-num" style="font-size:0.75rem; color:var(--text-muted);">${mStat.pct}%</span>
          </button>
          ${isModActive ? `<ul class="sidebar-lesson-sublist">${lessonsHtml}</ul>` : ''}
        </li>
      `;
    }).join('');
  },

  // Enrutador principal SPA
  handleRoute() {
    // Cerrar drawer móvil al navegar
    document.getElementById('app-sidebar')?.classList.remove('drawer-open');
    document.getElementById('drawer-backdrop')?.classList.remove('active');
    document.getElementById('reading-progress-bar').style.width = '0%';

    const hash = window.location.hash || '#/inicio';
    const parts = hash.replace(/^#\//, '').split('/');
    const view = parts[0] || 'inicio';

    // Actualizar estado activo en barra inferior móvil y cabecera escritorio
    document.querySelectorAll('[data-route-nav]').forEach((el) => {
      const target = el.getAttribute('data-route-nav');
      el.classList.toggle('active', view === target || (target === 'inicio' && (view === 'modulo' || view === 'leccion')));
    });

    this.renderSidebar();
    const mainEl = document.getElementById('app-main');

    if (view === 'inicio') {
      this.renderHome(mainEl);
    } else if (view === 'modulo') {
      this.renderModule(mainEl, parts[1] || '00');
    } else if (view === 'leccion') {
      this.renderLesson(mainEl, parts[1] || '00', parts[2] || '01');
    } else if (view === 'cheatsheet') {
      this.renderCheatSheet(mainEl, parts[1] || '00');
    } else if (view === 'calculadoras') {
      Calculators.render(mainEl);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (view === 'glosario') {
      this.renderGlossary(mainEl);
    } else if (view === 'plantillas') {
      this.renderTemplates(mainEl);
    } else if (view === 'progreso') {
      this.renderProgressDashboard(mainEl);
    } else {
      this.renderHome(mainEl);
    }
  },

  // 1. PANTALLA DE INICIO: Mapa Visual de Módulos + "Continuar donde lo dejé"
  renderHome(containerEl) {
    const stats = this.getCourseStats();
    const lastVisited = Storage.getLastVisited();
    const streak = Storage.getStreak();
    const profile = Storage.getProfile();

    const filteredModules = MarkdownEngine.catalog.filter((m) => {
      if (currentFilterPhase === 'ALL') return true;
      return m.nivel.toLowerCase() === currentFilterPhase.toLowerCase();
    });

    const fileProtocolWarning = MarkdownEngine.catalog.length === 0 ? `
      <div class="callout callout-error" style="margin-bottom:1.5rem;">
        <div class="callout-title">⚡ Abre el portal con el comando de 1 clic (<code>iniciar-portal.bat</code>)</div>
        <p style="margin:0;">
          Detectamos que abriste <code>index.html</code> directamente como archivo local (<code>file://</code>). Por seguridad, los navegadores bloquean la lectura dinámica de archivos Markdown externos en ese modo.
          <strong>Haz doble clic en el archivo <code>iniciar-portal.bat</code></strong> en la carpeta del proyecto para abrirlo en <code>http://localhost:8080</code> con todos los módulos y lecciones activos.
        </p>
      </div>
    ` : '';

    containerEl.innerHTML = `
      ${fileProtocolWarning}
      <!-- Franja de indicadores rápidos -->
      <div class="dashboard-strip" role="region" aria-label="Resumen de tu avance">
        <div class="stat-mini-card">
          <span class="stat-mini-label">Racha de Estudio</span>
          <div class="stat-mini-value">🔥 <span class="mono-num">${streak.currentStreak}</span> día${streak.currentStreak === 1 ? '' : 's'}</div>
        </div>
        <div class="stat-mini-card">
          <span class="stat-mini-label">Progreso Total</span>
          <div class="stat-mini-value">📈 <span class="mono-num">${stats.totalPct}%</span></div>
        </div>
        <div class="stat-mini-card">
          <span class="stat-mini-label">Lecciones Completadas</span>
          <div class="stat-mini-value">✅ <span class="mono-num">${stats.completedLessons}/${stats.totalLessons}</span></div>
        </div>
        <div class="stat-mini-card">
          <span class="stat-mini-label">Tu Meta Mensual</span>
          <div class="stat-mini-value" style="color:var(--status-success);">💵 <span class="mono-num">US$${profile.metaMensual}</span></div>
        </div>
      </div>

      <!-- Tarjeta Hero: Continuar donde lo dejé -->
      <div class="hero-continue-card" role="region" aria-label="Continuar estudio">
        <div>
          <div class="hero-meta-pills">
            <span class="hero-pill">▶ CONTINUAR DONDE LO DEJÉ</span>
            <span class="hero-pill">Módulo ${lastVisited.moduleNum} · Lección ${lastVisited.lessonNum}</span>
          </div>
          <h2>${lastVisited.titulo}</h2>
          <p style="margin:0; color:#E2E8F0; font-size:0.92rem;">
            Catálogo corto (3 a 10 productos) · Tickets de US$${profile.precioMin} a US$${profile.precioMax} · Ganancia neta >= US$${profile.gananciaMinima}/pedido.
          </p>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:0.6rem;">
          <a href="#/leccion/${lastVisited.moduleNum}/${lastVisited.lessonNum}" class="btn btn-hero">
            Retomar lección ahora →
          </a>
          <a href="#/calculadoras" class="btn btn-secondary" style="background:rgba(255,255,255,0.12); color:#FFF; border-color:rgba(255,255,255,0.3);">
            🧮 Abrir Calculadora
          </a>
        </div>
      </div>

      <!-- Banner de Perfil Operativo Base (Calibrado y Editable) -->
      <div class="profile-banner">
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:0.5rem;">
          <div>
            <strong style="font-size:0.92rem; color:var(--accent-primary);">🎯 Tu Punto de Partida y Criterios Operativos Activos</strong>
            <span style="font-size:0.8rem; color:var(--text-muted); margin-left:0.5rem;">(Usados en las calculadoras y ejemplos del curso)</span>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="edit-profile-btn">⚙️ Ajustar mis metas</button>
        </div>
        <div class="profile-grid">
          <div class="profile-chip"><strong>Presupuesto Pruebas</strong><span class="mono-num">US$${profile.presupuestoInicial}</span></div>
          <div class="profile-chip"><strong>Tiempo Disponible</strong><span class="mono-num">${profile.horasSemana} h / semana</span></div>
          <div class="profile-chip"><strong>Meta Neta Mensual</strong><span class="mono-num">US$${profile.metaMensual} (${profile.plazoMeses} meses)</span></div>
          <div class="profile-chip"><strong>Precio y Margen</strong><span class="mono-num">US$${profile.precioMin}-${profile.precioMax} (>=US$${profile.gananciaMinima} netos)</span></div>
          <div class="profile-chip"><strong>Tu Superpoder</strong><span>${profile.ventaja}</span></div>
        </div>
        <div id="profile-editor-drawer" style="display:none; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border-subtle);">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:0.75rem;">
            <label style="font-size:0.82rem; font-weight:700;">Presupuesto Inicial (US$)
              <input type="number" id="inp-prof-budget" class="num-sync-input" value="${profile.presupuestoInicial}" style="margin-top:0.25rem;" />
            </label>
            <label style="font-size:0.82rem; font-weight:700;">Horas por Semana
              <input type="number" id="inp-prof-hours" class="num-sync-input" value="${profile.horasSemana}" style="margin-top:0.25rem;" />
            </label>
            <label style="font-size:0.82rem; font-weight:700;">Meta Neta Mensual (US$)
              <input type="number" id="inp-prof-goal" class="num-sync-input" value="${profile.metaMensual}" style="margin-top:0.25rem;" />
            </label>
            <label style="font-size:0.82rem; font-weight:700;">Ganancia Mínima / Orden (US$)
              <input type="number" id="inp-prof-minprofit" class="num-sync-input" value="${profile.gananciaMinima}" style="margin-top:0.25rem;" />
            </label>
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="save-profile-btn" style="margin-top:0.75rem;">💾 Guardar mi perfil</button>
        </div>
      </div>

      <!-- Filtro y Mapa Visual de Todos los Módulos -->
      <div class="modules-filter-bar">
        <div>
          <h2>Mapa Visual de Módulos (00 al 12)</h2>
          <p style="margin:0; font-size:0.85rem; color:var(--text-secondary);">
            Cada módulo incluye lecciones visuales, proyecto práctico semanal, Cheat Sheet imprimible y Checkpoint.
          </p>
        </div>
        <div class="filter-pills" role="group" aria-label="Filtrar módulos por nivel">
          <button type="button" class="filter-pill ${currentFilterPhase === 'ALL' ? 'active' : ''}" data-filter="ALL">Todos (${MarkdownEngine.catalog.length})</button>
          <button type="button" class="filter-pill ${currentFilterPhase === 'Básico' ? 'active' : ''}" data-filter="Básico">🟢 Básico</button>
          <button type="button" class="filter-pill ${currentFilterPhase === 'Intermedio' ? 'active' : ''}" data-filter="Intermedio">🟡 Intermedio</button>
          <button type="button" class="filter-pill ${currentFilterPhase === 'Avanzado' ? 'active' : ''}" data-filter="Avanzado">🟣 Avanzado</button>
        </div>
      </div>

      <div class="modules-grid">
        ${filteredModules.map((mod) => {
          const mStat = stats.moduleStats.find((s) => s.modNum === mod.numero) || { pct: 0, done: 0, count: 0 };
          const lvlClass = mod.nivel.toLowerCase().includes('avanzado')
            ? 'level-avanzado'
            : (mod.nivel.toLowerCase().includes('intermedio') ? 'level-intermedio' : 'level-basico');

          return `
            <article class="module-card" style="--module-color:${mod.color};">
              <div>
                <a href="#/modulo/${mod.numero}" class="module-cover" aria-label="Abrir Módulo ${mod.numero}">
                  <img src="${mod.portada}" alt="Ilustración de portada del Módulo ${mod.numero}: ${mod.titulo}" loading="lazy" />
                </a>
                <div class="module-card-body">
                  <div class="module-meta-row">
                    <span class="module-num-tag">MÓDULO ${mod.numero}</span>
                    <span class="level-badge ${lvlClass}">${mod.nivel}</span>
                  </div>
                  <a href="#/modulo/${mod.numero}" class="module-card-title">${mod.titulo}</a>
                  <p class="module-card-desc">${mod.subtitulo}</p>
                  <div style="font-size:0.78rem; color:var(--text-muted); display:flex; justify-content:space-between;">
                    <span>⏱ ${mod.duracion.split('(')[0].trim()}</span>
                    <span class="mono-num"><strong>${mStat.done}/${mStat.count}</strong> lecciones (${mStat.pct}%)</span>
                  </div>
                  <div class="progress-track" role="progressbar" aria-valuenow="${mStat.pct}" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-fill" style="width:${mStat.pct}%;"></div>
                  </div>
                </div>
              </div>
              <div class="module-card-footer">
                <a href="#/modulo/${mod.numero}" class="btn btn-primary btn-sm" style="background:${mod.color}; flex:1;">
                  ${mStat.pct > 0 && mStat.pct < 100 ? 'Continuar →' : (mStat.pct === 100 ? '✓ Repasar' : 'Estudiar Módulo')}
                </a>
                <a href="#/cheatsheet/${mod.numero}" class="btn btn-secondary btn-sm" title="Hoja de referencia visual de 1 página">
                  📄 Cheat Sheet
                </a>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;

    // Eventos de filtro por nivel
    containerEl.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilterPhase = btn.getAttribute('data-filter');
        this.renderHome(containerEl);
      });
    });

    // Editor de perfil rápido
    const editBtn = containerEl.querySelector('#edit-profile-btn');
    const drawer = containerEl.querySelector('#profile-editor-drawer');
    editBtn?.addEventListener('click', () => {
      drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
    });
    containerEl.querySelector('#save-profile-btn')?.addEventListener('click', () => {
      Storage.saveProfile({
        presupuestoInicial: Number(containerEl.querySelector('#inp-prof-budget').value) || 1500,
        horasSemana: Number(containerEl.querySelector('#inp-prof-hours').value) || 12,
        metaMensual: Number(containerEl.querySelector('#inp-prof-goal').value) || 2500,
        gananciaMinima: Number(containerEl.querySelector('#inp-prof-minprofit').value) || 40
      });
      this.renderHome(containerEl);
    });
  },

  // 2. PANTALLA DE MÓDULO: Objetivos, Prerrequisitos, Lecciones, Proyecto y Checkpoint
  renderModule(containerEl, modNum) {
    const mod = MarkdownEngine.catalog.find((m) => m.numero === modNum) || MarkdownEngine.catalog[0];
    if (!mod) return;

    const stats = this.getCourseStats();
    const mStat = stats.moduleStats.find((s) => s.modNum === mod.numero) || { pct: 0, done: 0, count: 0 };
    const modIdx = MarkdownEngine.catalog.findIndex((m) => m.numero === mod.numero);
    const prevMod = modIdx > 0 ? MarkdownEngine.catalog[modIdx - 1] : null;
    const nextMod = modIdx < MarkdownEngine.catalog.length - 1 ? MarkdownEngine.catalog[modIdx + 1] : null;

    containerEl.innerHTML = `
      <div class="lesson-container" style="--module-color:${mod.color};">
        <div style="margin-bottom:1rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
          <a href="#/inicio" class="btn btn-secondary btn-sm">← Volver al Mapa de Módulos</a>
          <div style="display:flex; gap:0.5rem;">
            <a href="#/cheatsheet/${mod.numero}" class="btn btn-secondary btn-sm">📄 Ver Cheat Sheet Imprimible</a>
            ${mod.plantilla_modulo ? `<a href="curso/plantillas/${mod.plantilla_modulo}" download class="btn btn-secondary btn-sm">📥 Descargar Plantilla</a>` : ''}
          </div>
        </div>

        <div class="lesson-header-card">
          <div style="border-radius:12px; overflow:hidden; margin-bottom:1.1rem; max-height:150px;">
            <img src="${mod.portada}" alt="Portada Módulo ${mod.numero}" style="width:100%; height:140px; object-fit:cover;" />
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; margin-bottom:0.6rem;">
            <span class="module-num-tag">MÓDULO ${mod.numero} · ${mod.fase}</span>
            <span class="level-badge level-basico">${mod.nivel}</span>
            <span style="font-size:0.82rem; color:var(--text-muted);">⏱ ${mod.duracion}</span>
            <span style="font-size:0.82rem; color:var(--text-muted);">🔑 Prerrequisitos: ${mod.prerrequisitos}</span>
          </div>
          <h1>${mod.titulo}</h1>
          <p style="color:var(--text-secondary); margin-bottom:1rem;">${mod.subtitulo}</p>

          <div style="display:flex; justify-content:space-between; font-size:0.84rem; margin-bottom:0.35rem;">
            <strong>Avance del Módulo</strong>
            <span class="mono-num">${mStat.done} de ${mStat.count} lecciones completadas (${mStat.pct}%)</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${mStat.pct}%;"></div>
          </div>
        </div>

        <!-- Resultados de Aprendizaje -->
        <div class="calc-panel" style="margin-bottom:1.5rem;">
          <h3>🎯 Resultados de Aprendizaje de este Módulo</h3>
          <ul style="margin:0.75rem 0 0 1.25rem;">
            ${mod.resultados.map((r) => `<li style="margin-bottom:0.45rem;">${r}</li>`).join('')}
          </ul>
        </div>

        <!-- Lista de Lecciones del Módulo -->
        <div class="calc-panel" style="margin-bottom:1.5rem;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem;">
            <h2 style="font-size:1.25rem; margin:0;">📚 Lecciones del Módulo (${mod.lessons.length})</h2>
            <span style="font-size:0.78rem; color:var(--text-muted);">Auto-descubiertas desde <code>/curso/modulo-${mod.numero}/</code></span>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            ${mod.lessons.map((lec) => {
              const st = Storage.getLessonStatus(lec.key);
              const badgeHtml = st === 'completed'
                ? '<span class="level-badge level-basico">✓ Completada</span>'
                : (st === 'in_progress' ? '<span class="level-badge level-intermedio">◐ En curso</span>' : '<span class="level-badge" style="background:var(--bg-primary); color:var(--text-muted); border:1px solid var(--border-subtle);">○ Pendiente</span>');

              const quizRes = Storage.getQuizResult(lec.key);

              return `
                <div style="background:var(--bg-secondary); border:1px solid var(--border-subtle); border-radius:12px; padding:1rem 1.15rem; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:1rem;">
                  <div style="flex:1; min-width:240px;">
                    <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.3rem;">
                      <strong class="mono-num" style="color:${mod.color};">Lección ${lec.lessonNum}</strong>
                      ${badgeHtml}
                      <span style="font-size:0.78rem; color:var(--text-muted);">⏱ ${lec.meta.duracion}</span>
                      ${quizRes ? `<span class="mono-num" style="font-size:0.76rem; color:var(--status-success);">🧠 Quiz: ${quizRes.bestScore}/${quizRes.total}</span>` : ''}
                    </div>
                    <a href="#/leccion/${mod.numero}/${lec.lessonNum}" style="font-size:1.05rem; font-weight:800; color:var(--text-primary); display:block; margin-bottom:0.25rem;">
                      ${lec.meta.titulo}
                    </a>
                    <p style="margin:0; font-size:0.86rem; color:var(--text-secondary);">${lec.meta.resumen}</p>
                  </div>
                  <a href="#/leccion/${mod.numero}/${lec.lessonNum}" class="btn btn-primary btn-sm" style="background:${mod.color};">
                    ${st === 'completed' ? 'Repasar lección' : 'Abrir lección →'}
                  </a>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Proyecto Práctico de la Semana -->
        <div class="callout callout-numbers" style="margin-bottom:1.5rem;">
          <div class="callout-title">🛠️ Proyecto Práctico de la Semana: ${mod.proyecto_titulo}</div>
          <p style="margin-bottom:0.75rem;">${mod.proyecto_desc}</p>
          ${mod.plantilla_modulo ? `
            <a href="curso/plantillas/${mod.plantilla_modulo}" download class="btn btn-success btn-sm">
              📥 Descargar Plantilla del Proyecto (${mod.plantilla_modulo})
            </a>
          ` : ''}
        </div>

        <!-- 5. CHECKPOINT DE MÓDULO: Guía de autoevaluación sin bloqueo duro -->
        <div class="calc-panel" style="margin-bottom:1.5rem;">
          <span class="level-badge level-intermedio" style="margin-bottom:0.4rem;">🏁 CHECKPOINT DE AUTOEVALUACIÓN</span>
          <h3>Criterios para Avanzar al Siguiente Módulo</h3>
          <p style="font-size:0.86rem; color:var(--text-secondary);">
            Marca cada criterio conforme lo completes. Es una guía de autoevaluación honesta para asegurar que construyes sobre bases firmes (no bloquea tu navegación).
          </p>
          <ul class="interactive-checklist" id="mod-checkpoint-list">
            ${mod.checkpoint.map((crit, idx) => {
              const checked = Storage.isCheckpointChecked(mod.numero, idx);
              const cid = `cp-${mod.numero}-${idx}`;
              return `
                <li class="checklist-item ${checked ? 'checked' : ''}" data-cp-idx="${idx}">
                  <input type="checkbox" id="${cid}" ${checked ? 'checked' : ''} />
                  <label for="${cid}" style="cursor:pointer; flex:1;">${crit}</label>
                </li>
              `;
            }).join('')}
          </ul>
        </div>

        <!-- Navegación entre módulos -->
        <div style="display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
          ${prevMod ? `<a href="#/modulo/${prevMod.numero}" class="btn btn-secondary">← Módulo ${prevMod.numero}: ${prevMod.titulo.split(':')[0]}</a>` : '<div></div>'}
          ${nextMod ? `<a href="#/modulo/${nextMod.numero}" class="btn btn-primary">Avanzar al Módulo ${nextMod.numero}: ${nextMod.titulo.split(':')[0]} →</a>` : ''}
        </div>
      </div>
    `;

    // Eventos de Checkpoint de Módulo
    containerEl.querySelectorAll('#mod-checkpoint-list .checklist-item').forEach((li) => {
      const idx = Number(li.getAttribute('data-cp-idx'));
      const inp = li.querySelector('input');
      li.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
          inp.checked = !inp.checked;
          inp.dispatchEvent(new Event('change'));
        }
      });
      inp.addEventListener('change', () => {
        Storage.toggleCheckpoint(mod.numero, idx, inp.checked);
        li.classList.toggle('checked', inp.checked);
      });
    });

    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  // 3. PANTALLA DE LECCIÓN: Lectura cómoda, recursos visuales, checklist, notas, quiz y navegación
  async renderLesson(containerEl, modNum, lecNum) {
    const mod = MarkdownEngine.catalog.find((m) => m.numero === modNum) || MarkdownEngine.catalog[0];
    if (!mod) return;
    const lecIdx = mod.lessons.findIndex((l) => l.lessonNum === lecNum);
    const lec = lecIdx !== -1 ? mod.lessons[lecIdx] : mod.lessons[0];
    if (!lec) return;

    Storage.setLastVisited(mod.numero, lec.lessonNum, lec.meta.titulo);
    this.renderSidebar();

    const status = Storage.getLessonStatus(lec.key);
    const savedNote = Storage.getLessonNote(lec.key);

    // Determinar lección anterior y siguiente (incluso cruzando de módulo)
    const prevLec = lecIdx > 0 ? mod.lessons[lecIdx - 1] : null;
    const nextLec = lecIdx < mod.lessons.length - 1 ? mod.lessons[lecIdx + 1] : null;
    const modIdx = MarkdownEngine.catalog.findIndex((m) => m.numero === mod.numero);
    const nextMod = modIdx < MarkdownEngine.catalog.length - 1 ? MarkdownEngine.catalog[modIdx + 1] : null;

    containerEl.innerHTML = `
      <div class="lesson-container" style="--module-color:${mod.color};">
        <div class="lesson-header-card">
          <div class="lesson-toolbar">
            <a href="#/modulo/${mod.numero}" class="btn btn-secondary btn-sm">
              ← Módulo ${mod.numero} (Lección ${lecIdx + 1} de ${mod.lessons.length})
            </a>
            <div class="reading-controls" role="group" aria-label="Controles de lectura">
              <button type="button" class="icon-btn" id="font-dec-btn" title="Reducir tamaño de letra">A-</button>
              <button type="button" class="icon-btn" id="font-norm-btn" title="Tamaño de letra estándar">A</button>
              <button type="button" class="icon-btn" id="font-inc-btn" title="Aumentar tamaño de letra">A+</button>
              <button type="button" class="icon-btn" id="font-serif-btn" title="Alternar tipografía Serif / Sans">Serif</button>
            </div>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center; margin-bottom:0.5rem;">
            <span class="level-badge level-basico">${lec.meta.nivel}</span>
            <span style="font-size:0.82rem; color:var(--text-muted);">⏱ ${lec.meta.duracion}</span>
            <span style="font-size:0.82rem; color:var(--text-muted);">🔑 Prerrequisito: ${lec.meta.prerrequisitos}</span>
          </div>

          <h1>${lec.meta.titulo}</h1>
          ${lec.meta.resumen ? `
            <div style="margin-top:0.75rem; padding:0.75rem 1rem; background:var(--bg-secondary); border-radius:8px; font-size:0.92rem; color:var(--text-secondary);">
              <strong>Resumen ejecutivo:</strong> ${lec.meta.resumen}
            </div>
          ` : ''}
        </div>

        <!-- Cuerpo Markdown Renderizado -->
        <article class="lesson-content" id="lesson-markdown-body"></article>

        <!-- Tarjeta de Entregable y Plantilla Descargable -->
        ${lec.meta.entregable ? `
          <div class="callout callout-numbers" style="margin-top:1.5rem;">
            <div class="callout-title">🎯 Entregable Concreto de esta Lección</div>
            <p style="margin-bottom:0.75rem;"><strong>${lec.meta.entregable}</strong></p>
            <div style="display:flex; flex-wrap:wrap; gap:0.6rem;">
              ${lec.meta.plantilla ? `
                <a href="curso/plantillas/${lec.meta.plantilla}" download class="btn btn-primary btn-sm">
                  📥 Descargar Plantilla (${lec.meta.plantilla})
                </a>
              ` : ''}
              <a href="#/calculadoras" class="btn btn-secondary btn-sm">🧮 Ir a las Calculadoras Interactivas</a>
            </div>
          </div>
        ` : ''}

        <!-- Bloc de Notas Personales de la Lección (Guardado en localStorage) -->
        <div class="lesson-notes-box">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <h3 style="margin:0; font-size:1.05rem;">📝 Mis Notas Personales de esta Lección</h3>
            <span id="note-save-indicator" style="font-size:0.78rem; color:var(--status-success); font-weight:600;">✓ Guardado en este navegador</span>
          </div>
          <textarea id="lesson-note-textarea" class="notes-textarea" placeholder="Escribe aquí tus ideas de nichos, dudas para proveedores o cálculos de esta lección... Se guardan automáticamente mientras escribes.">${savedNote}</textarea>
        </div>

        <!-- Botón Marcar como Completada -->
        <div style="margin:1.75rem 0; padding:1.25rem; background:var(--bg-surface); border:2px solid var(--border-subtle); border-radius:16px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:1rem;">
          <div>
            <strong style="font-size:1.02rem; display:block;">¿Terminaste de estudiar y aplicar esta lección?</strong>
            <span style="font-size:0.85rem; color:var(--text-secondary);">Al marcarla como completada se actualiza tu progreso del módulo y tu racha de estudio.</span>
          </div>
          <button type="button" id="toggle-complete-btn" class="btn ${status === 'completed' ? 'btn-success' : 'btn-primary'}" style="min-width:240px;">
            ${status === 'completed' ? '✅ Lección Completada (Clic para desmarcar)' : '✓ Marcar Lección como Completada'}
          </button>
        </div>

        <!-- Navegación Anterior / Siguiente -->
        <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-top:1.5rem;">
          ${prevLec
            ? `<a href="#/leccion/${mod.numero}/${prevLec.lessonNum}" class="btn btn-secondary">← Anterior: L${prevLec.lessonNum}</a>`
            : `<a href="#/modulo/${mod.numero}" class="btn btn-secondary">← Volver al Módulo ${mod.numero}</a>`}

          ${nextLec
            ? `<a href="#/leccion/${mod.numero}/${nextLec.lessonNum}" class="btn btn-primary">Siguiente: L${nextLec.lessonNum}. ${nextLec.meta.titulo.slice(0, 28)}... →</a>`
            : (nextMod
                ? `<a href="#/modulo/${nextMod.numero}" class="btn btn-primary">Ir al Siguiente Módulo (M${nextMod.numero}) →</a>`
                : `<a href="#/progreso" class="btn btn-success">🏆 Ver Panel de Progreso Final →</a>`)}
        </div>
      </div>
    `;

    const bodyEl = containerEl.querySelector('#lesson-markdown-body');
    await MarkdownEngine.renderLessonBody(bodyEl, lec.rawBody, lec.key);

    // Controles de tamaño de fuente y Serif
    containerEl.querySelector('#font-dec-btn')?.addEventListener('click', () => {
      Storage.savePrefs({ fontSize: 'small' });
      this.applySavedPreferences();
    });
    containerEl.querySelector('#font-norm-btn')?.addEventListener('click', () => {
      Storage.savePrefs({ fontSize: 'normal' });
      this.applySavedPreferences();
    });
    containerEl.querySelector('#font-inc-btn')?.addEventListener('click', () => {
      Storage.savePrefs({ fontSize: 'large' });
      this.applySavedPreferences();
    });
    containerEl.querySelector('#font-serif-btn')?.addEventListener('click', () => {
      const curr = Storage.getPrefs().serif;
      Storage.savePrefs({ serif: !curr });
      this.applySavedPreferences();
    });

    // Guardado automático de notas
    const noteArea = containerEl.querySelector('#lesson-note-textarea');
    const noteStatus = containerEl.querySelector('#note-save-indicator');
    noteArea?.addEventListener('input', () => {
      Storage.saveLessonNote(lec.key, noteArea.value);
      noteStatus.textContent = '💾 Guardado automáticamente';
    });

    // Botón Marcar como completada
    const completeBtn = containerEl.querySelector('#toggle-complete-btn');
    completeBtn?.addEventListener('click', () => {
      const currentSt = Storage.getLessonStatus(lec.key);
      const nextSt = currentSt === 'completed' ? 'in_progress' : 'completed';
      Storage.setLessonStatus(lec.key, nextSt);
      completeBtn.className = `btn ${nextSt === 'completed' ? 'btn-success' : 'btn-primary'}`;
      completeBtn.innerHTML = nextSt === 'completed'
        ? '✅ Lección Completada (Clic para desmarcar)'
        : '✓ Marcar Lección como Completada';
      this.renderSidebar();
    });

    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  // 10. PANTALLA DE CHEAT SHEET DE 1 PÁGINA IMPRIMIBLE / PDF
  async renderCheatSheet(containerEl, modNum) {
    const mod = MarkdownEngine.catalog.find((m) => m.numero === modNum) || MarkdownEngine.catalog[0];
    containerEl.innerHTML = `<div class="lesson-container"><p>Cargando Cheat Sheet del Módulo ${modNum}...</p></div>`;

    try {
      const parsed = await MarkdownEngine.fetchCheatSheet(modNum);
      containerEl.innerHTML = `
        <div class="lesson-container" style="--module-color:${mod?.color || '#2563EB'};">
          <div class="no-print" style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:0.75rem; margin-bottom:1.25rem;">
            <a href="#/modulo/${modNum}" class="btn btn-secondary btn-sm">← Volver al Módulo ${modNum}</a>
            <div style="display:flex; gap:0.5rem;">
              <button type="button" class="btn btn-primary btn-sm" id="print-cs-btn">🖨️ Imprimir / Guardar en PDF (1 Página)</button>
            </div>
          </div>

          <article class="lesson-content cheatsheet-print-card" id="cheatsheet-body"></article>
        </div>
      `;

      const bodyEl = containerEl.querySelector('#cheatsheet-body');
      await MarkdownEngine.renderLessonBody(bodyEl, parsed.body, `cs-${modNum}`);
      containerEl.querySelector('#print-cs-btn')?.addEventListener('click', () => window.print());
    } catch (e) {
      containerEl.innerHTML = `<div class="callout callout-error">No se pudo cargar el Cheat Sheet del Módulo ${modNum}.</div>`;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  // 7. PANTALLA DE GLOSARIO BILINGÜE ESPAÑOL / INGLÉS CON BÚSQUEDA
  renderGlossary(containerEl) {
    const terms = MarkdownEngine.glossary || [];
    const categories = ['Todas', ...new Set(terms.map((t) => t.categoria))];
    let activeCat = 'Todas';
    let query = '';

    const drawList = () => {
      const listEl = containerEl.querySelector('#glossary-list');
      const filtered = terms.filter((t) => {
        const matchesCat = activeCat === 'Todas' || t.categoria === activeCat;
        const q = query.toLowerCase();
        const matchesQ = !q ||
          t.termino_es.toLowerCase().includes(q) ||
          t.termino_en.toLowerCase().includes(q) ||
          t.definicion.toLowerCase().includes(q) ||
          t.ejemplo.toLowerCase().includes(q);
        return matchesCat && matchesQ;
      });

      listEl.innerHTML = filtered.length === 0
        ? `<div class="calc-panel">No se encontraron términos para "${query}".</div>`
        : filtered.map((t) => `
          <div class="calc-panel" style="border-left:4px solid var(--accent-primary);">
            <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:0.5rem; margin-bottom:0.4rem;">
              <div>
                <h3 style="margin:0; font-size:1.1rem; display:inline;">${t.termino_es}</h3>
                <span class="mono-num" style="color:var(--accent-primary); font-weight:700; margin-left:0.5rem;">(${t.termino_en})</span>
              </div>
              <span class="level-badge level-avanzado">${t.categoria}</span>
            </div>
            <p style="margin-bottom:0.5rem; color:var(--text-primary);">${t.definicion}</p>
            <div style="font-size:0.85rem; color:var(--text-secondary); background:var(--bg-secondary); padding:0.55rem 0.8rem; border-radius:8px;">
              <strong>💡 Ejemplo práctico:</strong> ${t.ejemplo}
            </div>
          </div>
        `).join('');
    };

    containerEl.innerHTML = `
      <div style="margin-bottom:1.5rem;">
        <span class="level-badge level-basico" style="margin-bottom:0.4rem;">📖 DICCIONARIO DE OPERACIONES EN EE. UU.</span>
        <h1>Glosario Bilingüe de Dropshipping High-Ticket (Español / Inglés)</h1>
        <p style="color:var(--text-secondary);">
          Domina la terminología exacta que usan los proveedores mayoristas, pasarelas de pago, transportistas y plataformas publicitarias en Estados Unidos.
        </p>

        <div style="display:flex; flex-wrap:wrap; gap:0.75rem; margin-top:1rem;">
          <input type="search" id="glossary-search-inp" class="num-sync-input" style="text-align:left; flex:1; min-width:240px; padding:0.65rem 1rem;" placeholder="🔍 Buscar término en español o inglés (ej. MAP, COGS, RMA, BNPL, Dimensional Weight)..." />
        </div>

        <div class="filter-pills" id="glossary-cat-pills" style="margin-top:0.85rem;">
          ${categories.map((c) => `<button type="button" class="filter-pill ${c === activeCat ? 'active' : ''}" data-gcat="${c}">${c}</button>`).join('')}
        </div>
      </div>

      <div id="glossary-list" style="display:flex; flex-direction:column; gap:0.9rem;"></div>
    `;

    containerEl.querySelector('#glossary-search-inp')?.addEventListener('input', (e) => {
      query = e.target.value;
      drawList();
    });

    containerEl.querySelectorAll('[data-gcat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCat = btn.getAttribute('data-gcat');
        containerEl.querySelectorAll('[data-gcat]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        drawList();
      });
    });

    drawList();
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  // 8. BIBLIOTECA DE PLANTILLAS DESCARGABLES ORGANIZADAS POR MÓDULO
  renderTemplates(containerEl) {
    containerEl.innerHTML = `
      <div style="margin-bottom:1.5rem;">
        <span class="level-badge level-basico" style="margin-bottom:0.4rem;">📥 HERRAMIENTAS LISTAS PARA USAR</span>
        <h1>Biblioteca de Plantillas, Hojas de Cálculo y Guiones Bilingües</h1>
        <p style="color:var(--text-secondary);">
          Todos los archivos están organizados por módulo. Los archivos <code>.CSV</code> se abren directamente en <strong>Microsoft Excel o Google Sheets</strong> con todas sus columnas y fórmulas base.
        </p>
      </div>

      <div class="modules-grid">
        ${TEMPLATES_CATALOG.map((tpl) => `
          <div class="calc-panel" style="display:flex; flex-direction:column; justify-content:space-between; gap:1rem;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <span class="level-badge level-avanzado">MÓDULO ${tpl.mod}</span>
                <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted);">${tpl.type}</span>
              </div>
              <h3 style="font-size:1.05rem; margin-bottom:0.4rem;">${tpl.title}</h3>
              <p style="font-size:0.86rem; color:var(--text-secondary); margin:0;">${tpl.desc}</p>
            </div>
            <div style="display:flex; gap:0.5rem;">
              <a href="curso/plantillas/${tpl.file}" download class="btn btn-primary btn-sm" style="flex:1;">
                📥 Descargar (${tpl.file.split('.').pop().toUpperCase()})
              </a>
              <a href="#/modulo/${tpl.mod}" class="btn btn-secondary btn-sm">Ir a M${tpl.mod}</a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  // 11. PANEL DE PROGRESO GENERAL CON GRÁFICO Y RACHA DE ESTUDIO
  renderProgressDashboard(containerEl) {
    const stats = this.getCourseStats();
    const streak = Storage.getStreak();
    const quizzes = Storage.getQuizzes();
    const notes = Storage.getNotes();
    const quizKeys = Object.keys(quizzes);
    const notesCount = Object.values(notes).filter((v) => v && v.trim().length > 0).length;

    containerEl.innerHTML = `
      <div style="margin-bottom:1.5rem;">
        <span class="level-badge level-basico" style="margin-bottom:0.4rem;">📊 ANALÍTICA DE TU APRENDIZAJE</span>
        <h1>Panel de Progreso General y Racha de Estudio</h1>
        <p style="color:var(--text-secondary);">
          Todo tu avance se conserva automáticamente en tu navegador (<code>localStorage</code>). También puedes descargar una copia de respaldo para llevar tu progreso del celular a tu computadora.
        </p>
      </div>

      <div class="dashboard-strip">
        <div class="stat-mini-card">
          <span class="stat-mini-label">Racha Actual</span>
          <div class="stat-mini-value">🔥 <span class="mono-num">${streak.currentStreak}</span> día${streak.currentStreak === 1 ? '' : 's'}</div>
          <span style="font-size:0.75rem; color:var(--text-muted);">Mejor racha: ${streak.bestStreak || 1} días</span>
        </div>
        <div class="stat-mini-card">
          <span class="stat-mini-label">Avance Global</span>
          <div class="stat-mini-value">📈 <span class="mono-num">${stats.totalPct}%</span></div>
          <span style="font-size:0.75rem; color:var(--text-muted);">${stats.completedLessons} de ${stats.totalLessons} lecciones</span>
        </div>
        <div class="stat-mini-card">
          <span class="stat-mini-label">Quizzes Realizados</span>
          <div class="stat-mini-value">🧠 <span class="mono-num">${quizKeys.length}</span></div>
          <span style="font-size:0.75rem; color:var(--text-muted);">Autoevaluaciones superadas</span>
        </div>
        <div class="stat-mini-card">
          <span class="stat-mini-label">Notas Guardadas</span>
          <div class="stat-mini-value">📝 <span class="mono-num">${notesCount}</span></div>
          <span style="font-size:0.75rem; color:var(--text-muted);">Apuntes en lecciones</span>
        </div>
      </div>

      <!-- Gráfico de Avance por Módulo -->
      <div class="calc-panel" style="margin-bottom:1.5rem;">
        <h3>📊 Porcentaje de Avance por Módulo (M00 a M12)</h3>
        <div class="chart-wrapper" style="min-height:290px; margin-top:0.75rem;">
          <canvas id="overall-progress-chart" role="img" aria-label="Gráfico de progreso por módulo"></canvas>
        </div>
      </div>

      <!-- Respaldo y Portabilidad de Datos -->
      <div class="calc-panel">
        <h3>💾 Respaldo y Portabilidad de tu Progreso (Celular ↔ Computadora)</h3>
        <p style="font-size:0.88rem; color:var(--text-secondary);">
          Descarga tu progreso en un archivo <code>.json</code> o impórtalo en otro dispositivo sin necesidad de crear cuentas de usuario.
        </p>
        <div style="display:flex; flex-wrap:wrap; gap:0.65rem; margin-top:0.85rem;">
          <button type="button" class="btn btn-primary btn-sm" id="export-progress-btn">⬇️ Exportar mi Progreso (.JSON)</button>
          <label class="btn btn-secondary btn-sm" style="cursor:pointer;">
            ⬆️ Importar Progreso (.JSON)
            <input type="file" id="import-progress-inp" accept=".json" style="display:none;" />
          </label>
          <button type="button" class="btn btn-secondary btn-sm" id="reset-progress-btn" style="color:var(--status-danger);">🗑️ Reiniciar Progreso</button>
        </div>
      </div>
    `;

    if (window.Chart) {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const textColor = isDark ? '#CBD5E1' : '#334155';
      const gridColor = isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.08)';
      const ctx = containerEl.querySelector('#overall-progress-chart').getContext('2d');
      if (progressChartInstance) progressChartInstance.destroy();
      progressChartInstance = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: stats.moduleStats.map((m) => `M${m.modNum}`),
          datasets: [{
            label: '% Completado del Módulo',
            data: stats.moduleStats.map((m) => m.pct),
            backgroundColor: stats.moduleStats.map((m) => m.color)
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { min: 0, max: 100, ticks: { color: textColor }, grid: { color: gridColor } },
            x: { ticks: { color: textColor }, grid: { color: gridColor } }
          },
          plugins: {
            legend: { labels: { color: textColor } }
          }
        }
      });
    }

    containerEl.querySelector('#export-progress-btn')?.addEventListener('click', () => {
      const jsonStr = Storage.exportAll();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `progreso-curso-highticket-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    containerEl.querySelector('#import-progress-inp')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          Storage.importAll(reader.result);
          this.renderSidebar();
          this.renderProgressDashboard(containerEl);
        } catch (err) {
          alert('Archivo JSON no válido.');
        }
      };
      reader.readAsText(file);
    });

    containerEl.querySelector('#reset-progress-btn')?.addEventListener('click', () => {
      if (confirm('¿Seguro que deseas reiniciar a cero tus lecciones completadas, quizzes y notas?')) {
        Storage.resetAllProgress();
        this.renderSidebar();
        this.renderProgressDashboard(containerEl);
      }
    });

    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  // 9. BÚSQUEDA GLOBAL POR LECCIONES Y GLOSARIO
  performGlobalSearch(rawQuery) {
    const resultsContainer = document.getElementById('global-search-results');
    if (!resultsContainer) return;

    const q = (rawQuery || '').trim().toLowerCase();
    const hits = [];

    // Buscar en lecciones
    MarkdownEngine.catalog.forEach((mod) => {
      mod.lessons.forEach((lec) => {
        if (!q ||
            lec.meta.titulo.toLowerCase().includes(q) ||
            lec.meta.resumen.toLowerCase().includes(q) ||
            lec.rawBody.toLowerCase().includes(q)) {
          hits.push({
            type: `📚 Lección · Módulo ${mod.numero}`,
            title: `L${lec.lessonNum}. ${lec.meta.titulo}`,
            desc: lec.meta.resumen,
            href: `#/leccion/${mod.numero}/${lec.lessonNum}`
          });
        }
      });
    });

    // Buscar en glosario bilingüe
    if (q) {
      MarkdownEngine.glossary.forEach((g) => {
        if (g.termino_es.toLowerCase().includes(q) ||
            g.termino_en.toLowerCase().includes(q) ||
            g.definicion.toLowerCase().includes(q)) {
          hits.push({
            type: `📖 Glosario Bilingüe (${g.categoria})`,
            title: `${g.termino_es} (${g.termino_en})`,
            desc: g.definicion,
            href: '#/glosario'
          });
        }
      });
    }

    const topHits = hits.slice(0, 18);
    if (topHits.length === 0) {
      resultsContainer.innerHTML = `<div style="padding:1rem; color:var(--text-muted);">No se encontraron coincidencias para "${rawQuery}".</div>`;
      return;
    }

    resultsContainer.innerHTML = topHits.map((h) => `
      <a href="${h.href}" class="search-result-item" onclick="document.getElementById('search-modal-backdrop').classList.remove('open')">
        <div style="font-size:0.74rem; font-weight:800; color:var(--accent-primary); text-transform:uppercase;">${h.type}</div>
        <div style="font-weight:700; font-size:0.95rem; margin:0.15rem 0;">${h.title}</div>
        <div style="font-size:0.82rem; color:var(--text-secondary);">${h.desc}</div>
      </a>
    `).join('');
  },

  updateReadingProgress() {
    const bar = document.getElementById('reading-progress-bar');
    if (!bar) return;
    if (!window.location.hash.startsWith('#/leccion/')) {
      bar.style.width = '0%';
      return;
    }
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 100;
    bar.style.width = `${pct}%`;
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());
