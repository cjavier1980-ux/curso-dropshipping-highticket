// Gestión de estado persistente en localStorage (Sin backend)

const STORAGE_KEYS = {
  LESSONS: 'ht_progress_lessons_v1',
  LAST_VISITED: 'ht_last_visited_v1',
  CHECKLISTS: 'ht_checklists_v1',
  CHECKPOINTS: 'ht_checkpoints_v1',
  QUIZZES: 'ht_quizzes_v1',
  NOTES: 'ht_notes_v1',
  STREAK: 'ht_streak_v1',
  CALC: 'ht_calc_scenarios_v1',
  PREFS: 'ht_preferences_v1',
  PROFILE: 'ht_student_profile_v1'
};

const DEFAULT_PROFILE = {
  presupuestoInicial: 1500,
  capitalTrabajo: 2000,
  horasSemana: 12,
  metaMensual: 2500,
  plazoMeses: 6,
  precioMin: 150,
  precioMax: 800,
  gananciaMinima: 40,
  mercado: 'EE. UU. (48 estados) · Anglo + Hispano',
  ventaja: 'Ventas por teléfono y atención al cliente'
};

const DEFAULT_CALC = {
  precio: 450,
  cogs: 260,
  envio: 35,
  pasarelaPct: 2.9,
  pasarelaFijo: 0.30,
  cpa: 60,
  devolucionesPct: 3.0,
  contracargosPct: 0.5,
  costosFijosMes: 65,
  presupuestoPrueba: 750,
  cpcPromedio: 1.40,
  convWebPct: 1.4,
  convConsultivaPct: 2.6
};

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('No se pudo guardar en localStorage:', e);
  }
}

export const Storage = {
  // Perfil del estudiante
  getProfile() {
    return { ...DEFAULT_PROFILE, ...safeGet(STORAGE_KEYS.PROFILE, {}) };
  },
  saveProfile(profile) {
    safeSet(STORAGE_KEYS.PROFILE, { ...this.getProfile(), ...profile });
  },

  // Preferencias visuales (tema claro/oscuro, fuente, tamaño)
  getPrefs() {
    return safeGet(STORAGE_KEYS.PREFS, {
      theme: 'light',
      fontSize: 'normal',
      serif: false
    });
  },
  savePrefs(prefs) {
    const updated = { ...this.getPrefs(), ...prefs };
    safeSet(STORAGE_KEYS.PREFS, updated);
    return updated;
  },

  // Estado de lecciones: 'pending' | 'in_progress' | 'completed'
  getLessonsState() {
    return safeGet(STORAGE_KEYS.LESSONS, {});
  },
  getLessonStatus(lessonKey) {
    const all = this.getLessonsState();
    return all[lessonKey]?.status || 'pending';
  },
  setLessonStatus(lessonKey, status) {
    const all = this.getLessonsState();
    all[lessonKey] = {
      ...(all[lessonKey] || {}),
      status,
      updatedAt: new Date().toISOString()
    };
    safeSet(STORAGE_KEYS.LESSONS, all);
    this.recordStudyActivity();
  },

  // Última lección visitada ("Continuar donde lo dejé")
  getLastVisited() {
    return safeGet(STORAGE_KEYS.LAST_VISITED, {
      moduleNum: '00',
      lessonNum: '01',
      titulo: 'Qué es (y qué no es) el High-Ticket Dropshipping en EE. UU.',
      timestamp: null
    });
  },
  setLastVisited(moduleNum, lessonNum, titulo) {
    safeSet(STORAGE_KEYS.LAST_VISITED, {
      moduleNum,
      lessonNum,
      titulo,
      timestamp: new Date().toISOString()
    });
    const key = `m${moduleNum}-l${lessonNum}`;
    if (this.getLessonStatus(key) === 'pending') {
      this.setLessonStatus(key, 'in_progress');
    } else {
      this.recordStudyActivity();
    }
  },

  // Checklists interactivos por lección
  getChecklists() {
    return safeGet(STORAGE_KEYS.CHECKLISTS, {});
  },
  isChecklistChecked(itemKey) {
    return !!this.getChecklists()[itemKey];
  },
  toggleChecklist(itemKey, checked) {
    const all = this.getChecklists();
    all[itemKey] = checked;
    safeSet(STORAGE_KEYS.CHECKLISTS, all);
    this.recordStudyActivity();
  },

  // Checkpoints de autoevaluación por módulo
  getCheckpoints() {
    return safeGet(STORAGE_KEYS.CHECKPOINTS, {});
  },
  isCheckpointChecked(modNum, idx) {
    const all = this.getCheckpoints();
    return !!(all[modNum] && all[modNum][idx]);
  },
  toggleCheckpoint(modNum, idx, checked) {
    const all = this.getCheckpoints();
    if (!all[modNum]) all[modNum] = {};
    all[modNum][idx] = checked;
    safeSet(STORAGE_KEYS.CHECKPOINTS, all);
    this.recordStudyActivity();
  },

  // Resultados de Quizzes
  getQuizzes() {
    return safeGet(STORAGE_KEYS.QUIZZES, {});
  },
  getQuizResult(lessonKey) {
    return this.getQuizzes()[lessonKey] || null;
  },
  saveQuizResult(lessonKey, score, total) {
    const all = this.getQuizzes();
    const prev = all[lessonKey] || { bestScore: 0, attempts: 0 };
    all[lessonKey] = {
      lastScore: score,
      bestScore: Math.max(prev.bestScore, score),
      total,
      attempts: prev.attempts + 1,
      updatedAt: new Date().toISOString()
    };
    safeSet(STORAGE_KEYS.QUIZZES, all);
    this.recordStudyActivity();
  },

  // Notas personales por lección
  getNotes() {
    return safeGet(STORAGE_KEYS.NOTES, {});
  },
  getLessonNote(lessonKey) {
    return this.getNotes()[lessonKey] || '';
  },
  saveLessonNote(lessonKey, text) {
    const all = this.getNotes();
    all[lessonKey] = text;
    safeSet(STORAGE_KEYS.NOTES, all);
  },

  // Escenarios guardados de la calculadora
  getCalcState() {
    return { ...DEFAULT_CALC, ...safeGet(STORAGE_KEYS.CALC, {}) };
  },
  saveCalcState(state) {
    safeSet(STORAGE_KEYS.CALC, { ...this.getCalcState(), ...state });
  },
  resetCalcState() {
    safeSet(STORAGE_KEYS.CALC, DEFAULT_CALC);
    return { ...DEFAULT_CALC };
  },

  // Racha de estudio (días consecutivos)
  getStreak() {
    const data = safeGet(STORAGE_KEYS.STREAK, {
      currentStreak: 1,
      bestStreak: 1,
      lastDate: null,
      history: []
    });
    return data;
  },
  recordStudyActivity() {
    const today = new Date().toISOString().slice(0, 10);
    const data = this.getStreak();
    if (data.lastDate === today) return data;

    if (data.lastDate) {
      const last = new Date(data.lastDate + 'T00:00:00');
      const curr = new Date(today + 'T00:00:00');
      const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        data.currentStreak += 1;
      } else if (diffDays > 1) {
        data.currentStreak = 1;
      }
    } else {
      data.currentStreak = 1;
    }

    data.bestStreak = Math.max(data.bestStreak || 1, data.currentStreak);
    data.lastDate = today;
    if (!data.history.includes(today)) {
      data.history.push(today);
    }
    safeSet(STORAGE_KEYS.STREAK, data);
    return data;
  },

  // Exportar / Importar todo el progreso en JSON
  exportAll() {
    const payload = {};
    Object.entries(STORAGE_KEYS).forEach(([k, storageKey]) => {
      payload[storageKey] = safeGet(storageKey, null);
    });
    payload.exportedAt = new Date().toISOString();
    return JSON.stringify(payload, null, 2);
  },
  importAll(jsonString) {
    const parsed = JSON.parse(jsonString);
    Object.values(STORAGE_KEYS).forEach((storageKey) => {
      if (parsed[storageKey] !== undefined && parsed[storageKey] !== null) {
        safeSet(storageKey, parsed[storageKey]);
      }
    });
  },
  resetAllProgress() {
    Object.values(STORAGE_KEYS).forEach((k) => {
      if (k !== STORAGE_KEYS.PREFS) localStorage.removeItem(k);
    });
  }
};
