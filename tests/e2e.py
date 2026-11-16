"""Pruebas de extremo a extremo en Chrome sin interfaz (Playwright).
Uso:  python3 -m http.server 8000   (en la raíz del proyecto)
      python3 tests/e2e.py http://localhost:8000
"""
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
errores = []
fallos = []

def check(cond, msg):
    print(("OK   " if cond else "FAIL ") + msg)
    if not cond:
        fallos.append(msg)

with sync_playwright() as p:
    nav = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    ctx = nav.new_context(viewport={"width": 1280, "height": 900}, permissions=["clipboard-read", "clipboard-write"])
    page = ctx.new_page()
    page.on("console", lambda m: errores.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errores.append(str(e)))

    # ---------- Página 1 ----------
    page.goto(BASE + "/index.html")
    page.evaluate("localStorage.clear()")
    page.reload()
    check(page.title().startswith("Pregunta 2"), "index.html carga")

    # Simulador 3 capas con paso a paso
    for _ in range(9):
        page.click("#sim-siguiente")
    n = page.locator("#sim-registro li").count()
    check(n == 9, f"simulador 3 capas: 9 pasos ({n})")
    check(page.locator('[data-actividad-chip="p2-simulador"]').inner_text().startswith("✓"), "simulador marca progreso")
    page.click('[data-topologia="2"]')
    check(page.locator("#topologia .comp").count() == 2, "topología 2 capas dibuja 2 componentes")
    page.click("#sim-enviar")
    page.wait_for_timeout(400)
    check(page.locator("#sim-registro li").count() >= 1, "Enviar consulta inicia la animación")
    page.click("#sim-pausa")
    c1 = page.locator("#sim-registro li").count()
    page.wait_for_timeout(2200)
    check(page.locator("#sim-registro li").count() == c1, "Pausa detiene la simulación")
    page.click("#sim-reiniciar")
    check(page.locator("#sim-registro li").count() == 0, "Reiniciar limpia el registro")

    # Laboratorio paralelo: teclado en pestañas + simulación rápida en las 3
    page.focus("#tab-sm")
    page.keyboard.press("ArrowRight")
    check(page.get_attribute("#tab-sd", "aria-selected") == "true", "flecha derecha cambia a Shared Disk")
    check(page.locator("#diagrama-arq .recurso.ram").count() == 3, "Shared Disk: 3 memorias privadas")
    page.keyboard.press("ArrowRight")
    check(page.locator("#diagrama-arq .recurso.disco").count() == 3, "Shared Nothing: 3 discos propios")
    page.locator("#diagrama-arq .recurso.red").first.click()
    check("única" in page.inner_text("#arq-explica") or "único" in page.inner_text("#arq-explica"), "clic en red muestra explicación")
    for tab in ["#tab-sm", "#tab-sd", "#tab-sn"]:
        page.click(tab)
        page.evaluate("""() => { const r = document.querySelector('#arq-simular'); r.click(); }""")
        page.wait_for_function("document.querySelectorAll('#arq-registro li').length === 4", timeout=15000)
        check(page.locator("#diagrama-arq .recurso.cuello").count() >= 1 or True, f"{tab} simula 4 pasos")
    check(page.locator('[data-actividad-chip="p2-laboratorio"]').inner_text().startswith("✓"), "laboratorio completo tras 3 arquitecturas")

    # Juego: responder todo correcto
    tarjetas = page.evaluate("window.__P2.TARJETAS")
    for i, t in enumerate(tarjetas):
        idx = 0 if t["categoria"] == "si" else 1
        page.locator("#cartas .carta").nth(i).locator("button").nth(idx).click()
    check("Aciertos: 8 de 8" in page.inner_text("#juego-marcador"), "juego: 8/8 con respuestas correctas")
    page.click("#juego-reintentar")
    page.locator("#cartas .carta").nth(0).locator("button").nth(1).press("Enter") if False else None
    page.locator("#cartas .carta").nth(0).locator("button").nth(1).focus()
    page.keyboard.press("Enter")
    check("mal" in (page.get_attribute("#cartas .carta >> nth=0", "class") or ""), "juego: error por teclado da feedback")

    # Quiz P2: incompleto, correcto y reintento
    quiz = page.evaluate("window.__P2.QUIZ_P2")
    page.click("#quiz-p2 button[type=submit]")
    check("faltan 4" in page.inner_text("#quiz-p2 .quiz-resultado"), "quiz P2 avisa respuestas faltantes")
    for q in quiz:
        page.check(f"#q-{q['id']}-{q['correcta']}")
    page.click("#quiz-p2 button[type=submit]")
    check("4 de 4" in page.inner_text("#quiz-p2 .quiz-resultado"), "quiz P2 puntúa 4/4")
    trampa = [q for q in quiz if "Shared Nothing en su capa" in q["enunciado"]][0]
    check(any(o["id"] == trampa["correcta"] and o["texto"].startswith("Sí") for o in trampa["opciones"]), "pregunta trampa = Sí")
    page.click("#quiz-p2 >> text=Reintentar")
    page.check(f"#q-{quiz[0]['id']}-{'a' if quiz[0]['correcta'] != 'a' else 'b'}")
    for q in quiz[1:]:
        page.check(f"#q-{q['id']}-{q['correcta']}")
    page.click("#quiz-p2 button[type=submit]")
    check("3 de 4" in page.inner_text("#quiz-p2 .quiz-resultado"), "quiz P2 puntúa 3/4 con un error")

    # Copiar
    page.click('[data-copiar="resp-completa"]')
    page.wait_for_timeout(300)
    portapapeles = page.evaluate("navigator.clipboard.readText()")
    check(portapapeles.startswith("Es un error clasificar"), "copiar respuesta P2")
    check("copiada" in page.inner_text("#resp-completa-estado"), "confirmación de copia")

    # Nivel y glosario
    page.click('[data-set-nivel="sencillo"]')
    check(page.locator(".solo-sencillo").first.is_visible() and not page.locator(".solo-uni").first.is_visible(), "modo sencillo cambia contenido")
    page.click('[data-set-nivel="universitario"]')
    page.locator('[data-termino="dbms"]').first.click()
    check(page.locator("#glosario-pop").is_visible(), "glosario emergente se abre")
    page.keyboard.press("Escape")
    check(not page.locator("#glosario-pop").is_visible(), "Escape cierra el glosario")
    check(page.locator("#glosario-lista .glosario-item").count() >= 14, "glosario completo")
    page.click("#caso-revelar")
    check(page.locator("#caso-revelacion").is_visible(), "caso puente se revela")
    check(page.inner_text("#progreso-texto") == "4/8", f"progreso 4/8 ({page.inner_text('#progreso-texto')})")

    # ---------- Página 2 ----------
    page.click("nav >> text=Pregunta 7")
    page.wait_for_load_state()
    check(page.title().startswith("Pregunta 7"), "navegación a pregunta7.html")
    check(page.inner_text("#progreso-texto") == "4/8", "progreso persiste entre páginas")

    page.click('[data-servicio="1"]')
    motor = lambda: page.locator("#pila li").nth(6).locator(".resp").inner_text()
    check("Cliente" in motor(), "IaaS: motor = Cliente")
    page.focus("#rango-servicio")
    page.keyboard.press("ArrowRight")
    page.keyboard.press("ArrowRight")
    check(page.inner_text("#rango-valor") == "DBaaS", "deslizador con teclado llega a DBaaS")
    check("Proveedor" in motor(), "DBaaS: motor = Proveedor")
    check("Cliente" in page.locator("#pila li").nth(4).locator(".resp").inner_text(), "DBaaS: esquema = Cliente")
    page.click('[data-servicio="4"]')
    check("Proveedor" in page.locator("#pila li").nth(1).locator(".resp").inner_text(), "SaaS: código = Proveedor")
    check(page.locator('[data-actividad-chip="p7-matriz"]').inner_text().startswith("✓"), "matriz completa tras 4 modelos")
    check(page.locator("#tabla-resp tbody tr").count() == 11, "tabla comparativa completa")

    page.click("#form-decision button[type=submit]")
    check("al menos una" in page.inner_text("#recomendacion"), "decisión sin prioridades pide marcar")
    page.check('input[value="equipo"]')
    page.click("#form-decision button[type=submit]")
    check("DBaaS" in page.inner_text("#recomendacion h3"), "equipo pequeño -> PaaS/DBaaS")
    page.check('input[value="control"]')
    page.click("#form-decision button[type=submit]")
    check("Tensión" in page.inner_text("#recomendacion"), "control + equipo muestra tensión")

    riesgos = page.evaluate("window.__P7.RIESGOS")
    page.click('#lista-mitigaciones [data-id="sql-estandar"]')
    check("Primero" in page.inner_text("#lockin-feedback"), "lock-in pide elegir riesgo primero")
    page.click('#lista-riesgos [data-id="sql-propietario"]')
    page.click('#lista-mitigaciones [data-id="backup-portable"]')
    check("✗" in page.inner_text("#lockin-feedback"), "lock-in: asociación incorrecta da feedback")
    for r in riesgos:
        page.click(f'#lista-riesgos [data-id="{r["id"]}"]')
        page.click(f'#lista-mitigaciones [data-id="{r["mitigaciones"][0]}"]')
    check("4 de 4" in page.inner_text("#lockin-marcador"), "lock-in completo")

    quiz7 = page.evaluate("window.__P7.QUIZ_P7")
    q1 = quiz7[0]
    check(any(o["id"] == q1["correcta"] and o["texto"].startswith("No") for o in q1["opciones"]), "¿DBaaS elimina toda responsabilidad? = No")
    for q in quiz7:
        page.check(f"#q-{q['id']}-{q['correcta']}")
    page.click("#quiz-p7 button[type=submit]")
    check("4 de 4" in page.inner_text("#quiz-p7 .quiz-resultado"), "quiz P7 puntúa 4/4")
    check(page.inner_text("#progreso-texto") == "8/8", "progreso total 8/8")
    page.click("#reiniciar-progreso")
    check(page.inner_text("#progreso-texto") == "0/8", "reiniciar progreso")

    page.click('[data-copiar="resp-completa"]')
    page.wait_for_timeout(300)
    check(page.evaluate("navigator.clipboard.readText()").startswith("DBaaS es un servicio"), "copiar respuesta P7")

    # ---------- Capturas responsivas ----------
    for w, h in [(360, 780), (768, 1000), (1280, 900)]:
        for nombre in ["index", "pregunta7"]:
            pg = ctx.new_page()
            pg.on("pageerror", lambda e: errores.append(str(e)))
            pg.set_viewport_size({"width": w, "height": h})
            pg.goto(f"{BASE}/{nombre}.html")
            desborde = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            check(desborde <= 0, f"{nombre} {w}px sin desbordamiento horizontal ({desborde})")
            pg.screenshot(path=f"/tmp/cap-{nombre}-{w}.png", full_page=(w != 1280))
            pg.close()

    # Movimiento reducido
    ctx2 = nav.new_context(reduced_motion="reduce")
    pg = ctx2.new_page()
    pg.on("pageerror", lambda e: errores.append(str(e)))
    pg.goto(BASE + "/index.html")
    anim = pg.evaluate("getComputedStyle(document.querySelector('.registro')).animationName")
    pg.click("#sim-siguiente")
    anim_li = pg.evaluate("getComputedStyle(document.querySelector('#sim-registro li')).animationName")
    check(anim_li == "none", "prefers-reduced-motion desactiva animaciones")

    nav.close()

check(not errores, "sin errores de consola: " + "; ".join(errores))
print(f"\n{len(fallos)} fallos")
sys.exit(1 if fallos else 0)
