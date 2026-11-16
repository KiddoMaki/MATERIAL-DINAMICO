# Laboratorio interactivo — Arquitecturas BD vs. SI

Sitio web estático (HTML, CSS y JavaScript sin frameworks) para **entender, experimentar, practicar y defender oralmente** las preguntas 2 y 7 de la hoja «Bases de Datos II — Arquitecturas BD vs. Arquitecturas SI» (16/11/2026).

## Objetivo académico

- **Pregunta 2:** explicar por qué el modelo cliente-servidor (2 o 3 capas) no es una arquitectura interna de almacenamiento y procesamiento de BD, y contrastarlo con las arquitecturas de DBMS paralelos Shared Memory, Shared Disk y Shared Nothing.
- **Pregunta 7:** analizar la frontera técnica entre DBaaS e IaaS, PaaS y SaaS, con ventajas e inconvenientes en términos de vendor lock-in y control del sistema.

## Contenido

| Página | Pregunta | Interacciones |
|---|---|---|
| `index.html` | 2 · Cliente-servidor vs. DBMS paralelos | LAB 01 simulador de solicitudes 2/3 capas · LAB 02 laboratorio Shared Memory / Disk / Nothing · tabla de contraste · LAB 03 juego «¿A qué nivel pertenece?» · LAB 04 reto final (4 preguntas) |
| `pregunta7.html` | 7 · DBaaS vs. IaaS/PaaS/SaaS | LAB 01 matriz de responsabilidades (deslizador y botones) · LAB 02 constructor de decisiones · balance de ventajas/inconvenientes · LAB 03 minijuego de vendor lock-in · LAB 04 quiz (4 preguntas) |

En las dos páginas: tarjeta «Idea clave en 20 segundos», modo «Explicación sencilla / Nivel universitario», glosario emergente, caso **«Sistema comercial de la empresa»** que une ambas preguntas, panel «Respuesta completa para examen» y «Resumen oral de 45 segundos» con botón **Copiar**, progreso local y sección de fuentes.

## Contexto comercial

Todos los ejemplos están orientados al **contexto comercial** de una empresa comercializadora de productos (compras, bodegas, ventas, facturación, talento humano y contabilidad): el simulador consulta stock de productos y estados de facturas, el laboratorio de DBMS paralelo particiona la tabla de facturas, y el constructor de decisiones plantea la contratación del DBMS para facturación e inventarios. Las respuestas de examen y los resúmenes orales cierran con la aplicación al caso comercial, sin perder la definición técnica que evaluate la hoja del curso.

## Tecnologías

HTML5 semántico, CSS propio, JavaScript vanilla. Cero dependencias, sin CDN, sin backend, sin base de datos. Iconos SVG propios.

```text
├── index.html          Página 1 · Pregunta 2
├── pregunta7.html      Página 2 · Pregunta 7
├── css/styles.css
├── js/logic.js         Lógica pura (puntuación, clasificación, recomendación)
├── js/common.js        Progreso, nivel, glosario, copiar, motor de quiz, reproductor de simulaciones
├── js/pregunta2.js
├── js/pregunta7.js
├── assets/favicon.svg
├── tests/logic.test.js Pruebas de lógica (Node)
├── tests/e2e.py        Pruebas en navegador (Playwright, opcional)
└── .nojekyll
```

## Ejecutar localmente

Basta con un servidor estático en la carpeta del proyecto:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000/
```

También se puede abrir `index.html` con doble clic; en ese caso, el botón Copiar usa un método alternativo porque el navegador no considera «seguro» el origen `file://`.

## Cómo jugar

1. **LAB 01 (P2):** elige 2 o 3 capas y un caso, pulsa «Enviar consulta» o avanza con «Paso siguiente». Puedes pausar y reiniciar.
2. **LAB 02 (P2):** cambia de pestaña (también con las flechas ←/→), toca cada CPU, memoria o disco y simula la consulta repartida en las tres arquitecturas.
3. **LAB 03 (P2):** clasifica cada tarjeta con sus botones.
4. **LAB 01 (P7):** recorre IaaS, PaaS, DBaaS y SaaS con el deslizador o los botones.
5. **LAB 02 (P7):** marca prioridades y pide una recomendación justificada.
6. **LAB 03 (P7):** elige un riesgo y luego la mitigación que lo reduce.
7. **Quizzes:** responde las 4 preguntas, comprueba y reintenta.

El progreso (8 actividades) se guarda en `localStorage` de tu navegador; «Reiniciar» lo borra. No se guardan datos personales ni se envía telemetría.

## Accesibilidad

Navegación completa con Tab, Enter, Espacio y flechas; foco visible; regiones `aria-live` para resultados; descripción textual de los diagramas; ningún juego depende de arrastrar; aciertos y errores se indican con texto y símbolos (✓/✗), no solo con color; se respeta `prefers-reduced-motion`; diseño probado a 360, 768 y 1280 px.

## Pruebas

```bash
node --test tests/logic.test.js           # 5 pruebas de lógica
python3 -m http.server 8000 &             # servidor local
python3 tests/e2e.py http://localhost:8000 # requiere: pip install playwright
```

`tests/e2e.py` recorre ambas páginas en Chrome sin interfaz: simuladores, pausa/reinicio, pestañas por teclado, juegos, puntuación de quizzes (incluidas las preguntas trampa), copiar, progreso entre páginas, ausencia de errores de consola, desbordamiento horizontal en móvil y movimiento reducido. La ruta del ejecutable de Chrome está fijada en `/usr/bin/google-chrome`; ajústala si tu sistema la tiene en otro lugar.

**Capturas:** abre cada página, usa la herramienta de captura del sistema o, en Chrome, DevTools → Ctrl+Shift+P → «Capture full size screenshot». Para ver la vista móvil, activa el modo dispositivo (Ctrl+Shift+M) y elige 360 px.

## Limitaciones de las simulaciones

Todas las simulaciones son **educativas** y no se conectan a ningún DBMS, API ni proveedor de nube. El SQL y los mensajes HTTP son ilustrativos y los datos son ficticios. El laboratorio de DBMS paralelo es cualitativo: no muestra tiempos ni métricas porque no se mide nada real. La matriz de responsabilidades y el constructor de decisiones simplifican un patrón general; las responsabilidades exactas dependen del proveedor y del contrato.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (por ejemplo, `arquitecturas-bd-vs-si`).
2. Sube el contenido de esta carpeta a la rama `main`:
   ```bash
   git init
   git add .
   git commit -m "Laboratorio Arquitecturas BD vs. SI"
   git branch -M main
   git remote add origin https://github.com/USUARIO/REPOSITORIO.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` → `/ (root)` → Save**.
4. Tras uno o dos minutos, la página queda disponible en una URL con la forma `https://USUARIO.github.io/REPOSITORIO/`.

Todas las rutas son relativas, así que el sitio funciona dentro de la subcarpeta del repositorio. El archivo `.nojekyll` evita que GitHub procese el sitio con Jekyll.

## Fuentes

La hoja del curso fija las dos preguntas; las definiciones técnicas se basan en estas fuentes, explicadas con redacción propia:

1. AWS Architecture Blog, [Building a three-tier architecture on a budget](https://aws.amazon.com/blogs/architecture/building-a-three-tier-architecture-on-a-budget/).
2. Duke University, CompSci 516, [Lecture 20 — Parallel Database Systems](https://courses.cs.duke.edu/fall18/compsci516/Lectures/Lecture-20-Parallel-DB-notes.pdf).
3. Silberschatz, Korth y Sudarshan, *Database System Concepts*, [diapositivas de arquitecturas de BD paralelas](https://homepages.cwi.nl/~manegold/teaching/DBtech/slides/ch18-4.pdf).
4. Microsoft Learn, [Responsabilidad compartida en la nube](https://learn.microsoft.com/es-es/azure/security/fundamentals/shared-responsibility).
5. AWS Whitepaper, [AWS Serverless Multi-Tier Architectures](https://d1.awsstatic.com/whitepapers/AWS_Serverless_Multi-Tier_Architectures.pdf).

## Créditos

Material didáctico para Bases de Datos II. Código, textos e iconos SVG originales de este proyecto.
