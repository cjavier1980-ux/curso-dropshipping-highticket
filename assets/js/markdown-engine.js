import { Storage } from './storage.js';
import { QuizEngine } from './quiz-engine.js';
import { COURSE_FILES_FALLBACK } from './course-fallback.js';

let activeLessonCharts = [];

async function fetchTextWithFallback(path) {
  const isFileProtocol = window.location.protocol === 'file:';
  if (!isFileProtocol) {
    try {
      const res = await fetch(path, { cache: 'no-cache' });
      if (res.ok) {
        const text = await res.text();
        if (!text.trim().toLowerCase().startsWith('<!doctype html') && !text.trim().toLowerCase().startsWith('<html')) {
          return text;
        }
      }
    } catch (e) {
      // Usar respaldo integrado si falla la red
    }
  }
  if (COURSE_FILES_FALLBACK && COURSE_FILES_FALLBACK[path]) {
    return COURSE_FILES_FALLBACK[path];
  }
  return null;
}

export const MarkdownEngine = {
  catalog: [],
  glossary: [],
  isLoaded: false,

  // Parsea YAML Frontmatter sencillo (clave: valor y listas con "  - item")
  parseFrontmatter(rawMarkdown) {
    const clean = rawMarkdown.replace(/\r\n/g, '\n');
    if (!clean.startsWith('---\n')) {
      return { meta: {}, body: clean };
    }
    const endIdx = clean.indexOf('\n---\n', 4);
    if (endIdx === -1) {
      return { meta: {}, body: clean };
    }

    const yamlBlock = clean.slice(4, endIdx);
    const body = clean.slice(endIdx + 5).trim();
    const meta = {};
    let currentListKey = null;

    yamlBlock.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      if (trimmed.startsWith('- ') && currentListKey) {
        const val = trimmed.slice(2).trim().replace(/^["']|["']$/g, '');
        meta[currentListKey].push(val);
        return;
      }

      const colonIdx = trimmed.indexOf(':');
      if (colonIdx !== -1) {
        const key = trimmed.slice(0, colonIdx).trim();
        const rawVal = trimmed.slice(colonIdx + 1).trim();
        if (rawVal === '') {
          currentListKey = key;
          meta[key] = [];
        } else {
          currentListKey = null;
          meta[key] = rawVal.replace(/^["']|["']$/g, '');
        }
      }
    });

    return { meta, body };
  },

  // Auto-descubrimiento de módulos y lecciones con respaldo instantáneo integrado
  async discoverCourseContent() {
    const moduleNumbers = Array.from({ length: 14 }, (_, i) => String(i).padStart(2, '0'));

    const modulePromises = moduleNumbers.map(async (modNum) => {
      const modPath = `curso/modulo-${modNum}/modulo.md`;
      const text = await fetchTextWithFallback(modPath);
      if (!text) return null;

      const { meta } = this.parseFrontmatter(text);
      const lessons = [];

      // Auto-descubrimiento secuencial de lecciones: leccion-01.md, leccion-02.md...
      for (let l = 1; l <= 25; l++) {
        const lecNum = String(l).padStart(2, '0');
        const lecPath = `curso/modulo-${modNum}/leccion-${lecNum}.md`;
        const lText = await fetchTextWithFallback(lecPath);
        if (!lText) break;

        const parsedLec = this.parseFrontmatter(lText);
        lessons.push({
          key: `m${modNum}-l${lecNum}`,
          moduleNum: modNum,
          lessonNum: lecNum,
          path: lecPath,
          meta: {
            titulo: parsedLec.meta.titulo || `Lección ${lecNum}`,
            nivel: parsedLec.meta.nivel || meta.nivel || 'Básico',
            duracion: parsedLec.meta.duracion || '30 min',
            prerrequisitos: parsedLec.meta.prerrequisitos || 'Ninguno',
            resumen: parsedLec.meta.resumen || '',
            entregable: parsedLec.meta.entregable || '',
            plantilla: parsedLec.meta.plantilla || meta.plantilla_modulo || ''
          },
          rawBody: parsedLec.body
        });
      }

      return {
        id: `modulo-${modNum}`,
        numero: modNum,
        titulo: meta.titulo || `Módulo ${modNum}`,
        subtitulo: meta.subtitulo || '',
        fase: meta.fase || 'Curso Principal',
        nivel: meta.nivel || 'Básico',
        duracion: meta.duracion || '4 horas',
        prerrequisitos: meta.prerrequisitos || 'Ninguno',
        color: meta.color || '#2563EB',
        portada: meta.portada || `assets/img/portadas/modulo-${modNum}.svg`,
        proyecto_titulo: meta.proyecto_titulo || '',
        proyecto_desc: meta.proyecto_desc || '',
        plantilla_modulo: meta.plantilla_modulo || '',
        resultados: Array.isArray(meta.resultados) ? meta.resultados : [],
        checkpoint: Array.isArray(meta.checkpoint) ? meta.checkpoint : [],
        lessons
      };
    });

    const resolvedModules = await Promise.all(modulePromises);
    const modules = resolvedModules.filter(Boolean);

    // Cargar glosario bilingüe
    const gText = await fetchTextWithFallback('curso/glosario-bilingue.json');
    if (gText) {
      try {
        this.glossary = JSON.parse(gText);
      } catch (e) {
        console.warn('Error parseando glosario:', e);
      }
    }

    this.catalog = modules;
    this.isLoaded = true;
    return modules;
  },

  // Cargar Cheat Sheet de un módulo
  async fetchCheatSheet(modNum) {
    const path = `curso/modulo-${modNum}/cheat-sheet.md`;
    const raw = await fetchTextWithFallback(path);
    if (!raw) throw new Error('No se encontró el Cheat Sheet');
    return this.parseFrontmatter(raw);
  },

  // Fallback Markdown a HTML por si CDN de Marked no está disponible
  basicMarkdownToHtml(md) {
    if (window.marked && typeof window.marked.parse === 'function') {
      const html = window.marked.parse(md);
      return window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
    }
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>');
  },

  // Renderiza el cuerpo Markdown de una lección con Mermaid, Chart.js, Callouts, Checklists y Quiz
  async renderLessonBody(containerEl, rawBody, lessonKey) {
    activeLessonCharts.forEach((c) => {
      try { c.destroy(); } catch (e) {}
    });
    activeLessonCharts = [];

    const mermaidBlocks = [];
    const chartBlocks = [];
    let quizData = null;

    // 1. Extraer bloques ```mermaid
    let processed = rawBody.replace(/```mermaid\s*\n([\s\S]*?)```/g, (_, code) => {
      const idx = mermaidBlocks.length;
      mermaidBlocks.push(code.trim());
      return `\n<div class="mermaid-placeholder" data-mermaid-idx="${idx}"></div>\n`;
    });

    // 2. Extraer bloques ```chart
    processed = processed.replace(/```chart\s*\n([\s\S]*?)```/g, (_, jsonStr) => {
      const idx = chartBlocks.length;
      chartBlocks.push(jsonStr.trim());
      return `\n<div class="chart-placeholder" data-chart-idx="${idx}"></div>\n`;
    });

    // 3. Extraer bloque ```quiz
    processed = processed.replace(/```quiz\s*\n([\s\S]*?)```/g, (_, jsonStr) => {
      try {
        quizData = JSON.parse(jsonStr.trim());
      } catch (e) {
        console.error('Error parseando JSON de quiz:', e);
      }
      return `\n<div class="quiz-placeholder"></div>\n`;
    });

    // 4. Convertir Markdown a HTML
    containerEl.innerHTML = this.basicMarkdownToHtml(processed);

    // 5. Envolver tablas en contenedor responsive
    containerEl.querySelectorAll('table').forEach((table) => {
      if (!table.parentElement.classList.contains('table-responsive')) {
        const wrap = document.createElement('div');
        wrap.className = 'table-responsive';
        table.parentNode.insertBefore(wrap, table);
        wrap.appendChild(table);
      }
    });

    // 6. Transformar blockquotes con [!TIPO] en Callouts semánticos
    const calloutTypes = {
      '[!ERROR_COMUN]': { cls: 'callout-error', icon: '🚨', label: 'Error Común a Evitar' },
      '[!DATO_CLAVE]': { cls: 'callout-key', icon: '💡', label: 'Dato Clave' },
      '[!ANGLO_VS_HISPANO]': { cls: 'callout-bilingual', icon: '🌎', label: 'Mercado Anglo vs. Hispano (Basado en Datos)' },
      '[!EJEMPLO_NUMEROS]': { cls: 'callout-numbers', icon: '🧮', label: 'Ejemplo Real con Números' }
    };

    containerEl.querySelectorAll('blockquote').forEach((bq) => {
      const html = bq.innerHTML.trim();
      for (const [marker, cfg] of Object.entries(calloutTypes)) {
        if (html.includes(marker)) {
          const callout = document.createElement('div');
          callout.className = `callout ${cfg.cls}`;
          const cleanedHtml = html.replace(marker, '').trim();
          callout.innerHTML = `
            <div class="callout-title">${cfg.icon} <span>${cfg.label}</span></div>
            <div class="callout-body">${cleanedHtml}</div>
          `;
          bq.replaceWith(callout);
          break;
        }
      }
    });

    // 7. Convertir listas de tareas (- [ ] ...) en Checklists interactivos persistentes
    let chkIndex = 0;
    containerEl.querySelectorAll('ul').forEach((ul) => {
      const items = Array.from(ul.querySelectorAll('li'));
      const hasCheckbox = items.some((li) => li.querySelector('input[type="checkbox"]') || /^\s*\[[ xX]\]/.test(li.textContent));
      if (!hasCheckbox) return;

      ul.classList.add('interactive-checklist');
      items.forEach((li) => {
        const itemKey = `${lessonKey}-chk-${chkIndex++}`;
        const existingInput = li.querySelector('input[type="checkbox"]');
        if (existingInput) existingInput.remove();

        const rawText = li.innerHTML.replace(/^\s*\[[ xX]\]\s*/, '');
        const isChecked = Storage.isChecklistChecked(itemKey);

        li.className = `checklist-item ${isChecked ? 'checked' : ''}`;
        li.innerHTML = `
          <input type="checkbox" id="${itemKey}" ${isChecked ? 'checked' : ''} aria-label="Marcar tarea completada" />
          <label for="${itemKey}" style="cursor:pointer; flex:1;">${rawText}</label>
        `;

        const inputEl = li.querySelector('input');
        li.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
            inputEl.checked = !inputEl.checked;
            inputEl.dispatchEvent(new Event('change'));
          }
        });
        inputEl.addEventListener('change', () => {
          Storage.toggleChecklist(itemKey, inputEl.checked);
          li.classList.toggle('checked', inputEl.checked);
        });
      });
    });

    // 8. Renderizar Diagramas Mermaid
    const mermaidNodes = containerEl.querySelectorAll('.mermaid-placeholder');
    for (let i = 0; i < mermaidNodes.length; i++) {
      const node = mermaidNodes[i];
      const idx = Number(node.getAttribute('data-mermaid-idx'));
      const code = mermaidBlocks[idx] || '';
      const box = document.createElement('div');
      box.className = 'visual-resource-box';
      box.innerHTML = `
        <div class="visual-resource-header">
          <span>📐 DIAGRAMA VISUAL INTERACTIVO #${idx + 1}</span>
          <span style="font-size:0.75rem;">Desliza horizontalmente en móvil si es necesario</span>
        </div>
        <div class="mermaid-wrapper">
          <pre class="mermaid" id="mermaid-${lessonKey}-${idx}">${code}</pre>
        </div>
      `;
      node.replaceWith(box);
    }

    if (mermaidNodes.length > 0 && window.mermaid) {
      try {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        window.mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose'
        });
        await window.mermaid.run({
          nodes: containerEl.querySelectorAll('.mermaid')
        });
      } catch (e) {
        console.warn('Aviso al renderizar Mermaid:', e);
      }
    }

    // 9. Renderizar Gráficos con Chart.js
    const chartNodes = containerEl.querySelectorAll('.chart-placeholder');
    chartNodes.forEach((node) => {
      const idx = Number(node.getAttribute('data-chart-idx'));
      const rawJson = chartBlocks[idx];
      try {
        const cfg = JSON.parse(rawJson);
        const box = document.createElement('div');
        box.className = 'visual-resource-box';
        const canvasId = `chart-${lessonKey}-${idx}`;
        box.innerHTML = `
          <div class="visual-resource-header">
            <span>📊 GRÁFICO DE DATOS: ${cfg.title || 'Análisis Visual'}</span>
          </div>
          <div class="chart-wrapper">
            <canvas id="${canvasId}" role="img" aria-label="${cfg.title || 'Gráfico de la lección'}"></canvas>
          </div>
        `;
        node.replaceWith(box);

        if (window.Chart) {
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          const textColor = isDark ? '#CBD5E1' : '#334155';
          const gridColor = isDark ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.08)';
          const ctx = box.querySelector(`#${canvasId}`).getContext('2d');
          const chartInstance = new window.Chart(ctx, {
            type: cfg.type || 'bar',
            data: cfg.data,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  labels: { color: textColor, font: { family: 'Inter, sans-serif', weight: '600' } }
                },
                title: {
                  display: !!cfg.title,
                  text: cfg.title,
                  color: textColor,
                  font: { family: 'Plus Jakarta Sans, sans-serif', size: 14, weight: '700' }
                }
              },
              scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: { ticks: { color: textColor }, grid: { color: gridColor } }
              }
            }
          });
          activeLessonCharts.push(chartInstance);
        }
      } catch (e) {
        console.error('Error creando gráfico de lección:', e);
      }
    });

    // 10. Renderizar Mini Quiz Interactivo
    const quizNode = containerEl.querySelector('.quiz-placeholder');
    if (quizNode && quizData) {
      QuizEngine.renderQuiz(quizNode, quizData, lessonKey);
    }
  }
};
