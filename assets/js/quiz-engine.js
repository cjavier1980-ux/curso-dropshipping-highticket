import { Storage } from './storage.js';

export const QuizEngine = {
  renderQuiz(containerEl, quizData, lessonKey, onScoreUpdate) {
    if (!containerEl || !Array.isArray(quizData) || quizData.length === 0) return;

    const saved = Storage.getQuizResult(lessonKey);
    const answersState = {};
    let answeredCount = 0;
    let correctCount = 0;

    const buildUI = () => {
      containerEl.innerHTML = `
        <div class="quiz-box" role="region" aria-label="Mini Quiz de la lección">
          <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:0.75rem; margin-bottom:1rem;">
            <div>
              <span class="level-badge level-avanzado" style="margin-bottom:0.35rem;">🧠 AUTOEVALUACIÓN INTERACTIVA</span>
              <h3 style="margin:0;">Mini Quiz de Comprobación (${quizData.length} preguntas)</h3>
            </div>
            <div id="quiz-score-badge-${lessonKey}" class="mono-num" style="font-size:0.85rem; font-weight:700; padding:0.4rem 0.75rem; border-radius:8px; background:var(--bg-secondary); border:1px solid var(--border-subtle);">
              ${saved ? `🏆 Mejor puntaje: ${saved.bestScore}/${saved.total} (${saved.attempts} intento${saved.attempts === 1 ? '' : 's'})` : 'Sin intentos previos'}
            </div>
          </div>
          <div id="quiz-questions-wrap-${lessonKey}"></div>
          <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:0.75rem; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border-subtle);">
            <div id="quiz-summary-${lessonKey}" style="font-weight:700; font-size:0.95rem;">
              Selecciona una respuesta en cada pregunta para ver la explicación inmediata.
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="quiz-reset-btn-${lessonKey}">
              🔄 Repetir Quiz
            </button>
          </div>
        </div>
      `;

      const questionsWrap = containerEl.querySelector(`#quiz-questions-wrap-${lessonKey}`);
      const summaryEl = containerEl.querySelector(`#quiz-summary-${lessonKey}`);
      const badgeEl = containerEl.querySelector(`#quiz-score-badge-${lessonKey}`);
      const resetBtn = containerEl.querySelector(`#quiz-reset-btn-${lessonKey}`);

      quizData.forEach((q, qIdx) => {
        const qCard = document.createElement('div');
        qCard.className = 'quiz-question-card';
        qCard.innerHTML = `
          <div style="font-weight:700; font-size:0.98rem; color:var(--text-primary);">${q.pregunta}</div>
          <div class="quiz-options" role="radiogroup" aria-label="Opciones para pregunta ${qIdx + 1}"></div>
          <div class="quiz-feedback" id="q-feed-${lessonKey}-${qIdx}" aria-live="polite"></div>
        `;

        const optionsWrap = qCard.querySelector('.quiz-options');
        const feedbackEl = qCard.querySelector(`#q-feed-${lessonKey}-${qIdx}`);

        q.opciones.forEach((optText, optIdx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'quiz-option-btn';
          const letter = String.fromCharCode(65 + optIdx);
          btn.innerHTML = `<strong class="mono-num">${letter}.</strong> <span>${optText}</span>`;

          btn.addEventListener('click', () => {
            if (answersState[qIdx] !== undefined) return;
            answersState[qIdx] = optIdx;
            answeredCount += 1;
            const isCorrect = optIdx === q.correcta;
            if (isCorrect) correctCount += 1;

            // Marcar botones
            const allBtns = optionsWrap.querySelectorAll('.quiz-option-btn');
            allBtns.forEach((b, bIdx) => {
              b.disabled = true;
              if (bIdx === q.correcta) {
                b.classList.add('correct');
              } else if (bIdx === optIdx && !isCorrect) {
                b.classList.add('incorrect');
              }
            });

            // Mostrar retroalimentación inmediata
            feedbackEl.className = `quiz-feedback visible ${isCorrect ? 'ok' : 'fail'}`;
            feedbackEl.innerHTML = `
              <strong>${isCorrect ? '✅ ¡Respuesta Correcta!' : '❌ Respuesta Incorrecta.'}</strong>
              <div style="margin-top:0.25rem;">${q.explicacion}</div>
            `;

            summaryEl.innerHTML = `Progreso del Quiz: <span class="mono-num">${answeredCount}/${quizData.length}</span> respondidas · Aciertos actuales: <span class="mono-num">${correctCount}/${quizData.length}</span>`;

            if (answeredCount === quizData.length) {
              Storage.saveQuizResult(lessonKey, correctCount, quizData.length);
              const updatedSaved = Storage.getQuizResult(lessonKey);
              const pct = Math.round((correctCount / quizData.length) * 100);
              summaryEl.innerHTML = `🎉 <strong>Quiz completado: ${correctCount}/${quizData.length} (${pct}%)</strong>. ${pct === 100 ? '¡Dominio total de la lección!' : 'Puedes revisar las explicaciones o repetir el quiz.'}`;
              badgeEl.innerHTML = `🏆 Mejor puntaje: ${updatedSaved.bestScore}/${updatedSaved.total} (${updatedSaved.attempts} intento${updatedSaved.attempts === 1 ? '' : 's'})`;
              if (typeof onScoreUpdate === 'function') onScoreUpdate(updatedSaved);
            }
          });

          optionsWrap.appendChild(btn);
        });

        questionsWrap.appendChild(qCard);
      });

      resetBtn.addEventListener('click', () => {
        Object.keys(answersState).forEach((k) => delete answersState[k]);
        answeredCount = 0;
        correctCount = 0;
        buildUI();
      });
    };

    buildUI();
  }
};
