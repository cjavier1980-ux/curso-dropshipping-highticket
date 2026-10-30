# Portal Web del Curso: Dropshipping High-Ticket Bilingüe (EE. UU.)

Un portal educativo estático, rápido, *mobile-first* y sin cuentas de usuario que guarda tu progreso, resultados de quizzes, checklists, notas personales y escenarios de calculadora directamente en tu navegador (`localStorage`).

---

## 🚀 1. Cómo abrir el portal en tu computadora (1 Clic en Windows)

1. Haz **doble clic** sobre el archivo **`iniciar-portal.bat`** ubicado en esta carpeta.
2. Se abrirá automáticamente tu navegador web en **`http://localhost:8080`**.
3. *(Opcional por terminal)*: También puedes abrir una terminal en esta carpeta y ejecutar:
   ```powershell
   python -m http.server 8080
   ```

---

## ✍️ 2. Cómo agregar una lección nueva sin tocar el código

El portal cuenta con un **Motor de Auto-Descubrimiento Secuencial** (`assets/js/markdown-engine.js`).

Para agregar una lección nueva a cualquier módulo (por ejemplo, agregar la Lección 04 al Módulo 00 o la Lección 02 al Módulo 02):
1. Entra a la carpeta del módulo correspondiente, por ejemplo `/curso/modulo-00/`.
2. Crea el siguiente archivo secuencial en formato Markdown, por ejemplo **`leccion-04.md`**.
3. Coloca al inicio el encabezado de metadatos (**YAML Frontmatter**) y debajo el contenido:

```markdown
---
titulo: "Título de tu nueva lección"
modulo: 0
leccion: 4
nivel: "Básico"
duracion: "25 min"
prerrequisitos: "Lección 03"
resumen: "Resumen corto que aparecerá en la tarjeta de la lección."
entregable: "Nombre del entregable"
plantilla: "m00-carta-operativa-personal.md"
---

## 🎯 Objetivo de la Lección
Tu explicación aquí...

> [!DATO_CLAVE]
> Esto se transforma automáticamente en una tarjeta visual destacada.

- [ ] Tarea interactiva que guarda su estado automáticamente.
```

4. **Recarga el navegador (`F5`):** el portal detectará automáticamente `leccion-04.md`, la sumará al módulo, actualizará el porcentaje de progreso, habilitará el botón "Siguiente lección" y la indexará en el buscador global **sin tocar ni una línea de código**.

---

## 📱 3. Cómo publicarlo GRATIS en internet para estudiar desde tu celular

### Opción A: Netlify Drop (La más rápida — toma 30 segundos, sin programar)
1. Entra gratis a **[app.netlify.com/drop](https://app.netlify.com/drop)**.
2. **Arrastra y suelta** toda esta carpeta (`clever-bohr`) dentro del recuadro de la página.
3. Netlify te dará al instante un enlace seguro `https://tu-sitio.netlify.app` que puedes abrir en el navegador de tu celular (Safari / Chrome) y agregar a tu pantalla de inicio (*"Agregar a pantalla de inicio"*).

### Opción B: GitHub Pages (Gratis y permanente)
1. Crea un repositorio en [GitHub](https://github.com) y sube todos los archivos de esta carpeta.
2. En tu repositorio, ve a **Settings → Pages**.
3. En **Branch**, selecciona `main` (carpeta `/root`) y haz clic en **Save**.
4. En 1 minuto tu portal estará publicado gratis en `https://tu-usuario.github.io/nombre-repo/`.
