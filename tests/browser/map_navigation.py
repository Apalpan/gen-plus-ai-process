"""Joining an activity to BDC must survive both immediate navigation and reload."""
import os
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from playwright.sync_api import expect, sync_playwright

target = os.environ.get("AI_PROCESS_QA_URL", "http://127.0.0.1:8793").rstrip("/")
with sync_playwright() as runner:
    browser = runner.chromium.launch(channel="chrome")
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.set_default_timeout(15000)
    page.goto(target)
    page.get_by_role("button", name=re.compile("^Abrir demo")).click()
    nav = page.locator(".st-rail nav")
    nav.get_by_role("button", name="Mapa de proceso").click()
    lane_labels = page.get_by_role("list", name="Carriles del mapa").get_by_role("listitem")
    expect(lane_labels).to_have_count(5)
    page.get_by_role("button", name=re.compile("^Actividad Fabricar lote")).click()
    page.get_by_role("button", name="Añadir métrica propia").click()
    page.get_by_role("textbox", name="Nombre de métrica propia").fill("Preparación por lote")
    page.get_by_role("textbox", name="Unidad de métrica propia").fill("min/lote")
    nav.get_by_role("button", name="Framework BDC").click()
    metric = page.locator(".react-flow__node").filter(has_text="Preparación por lote").first
    expect(metric).to_be_visible(timeout=20000)
    metric.click()
    page.get_by_role("textbox", name="Nombre de métrica propia").fill("Tiempo de preparación por lote")
    page.get_by_role("button", name="Guardar", exact=True).click()
    page.reload()
    expect(nav.get_by_role("button", name="Framework BDC")).to_be_visible(timeout=20000)
    nav.get_by_role("button", name="Framework BDC").click()
    expect(page.locator(".react-flow__node").filter(has_text="Tiempo de preparación por lote").first).to_be_visible(timeout=20000)
    board_id = parse_qs(urlparse(page.url).query)["board"][0]
    entities = page.request.get(target + "/api/boards/" + board_id).json()["board"]["entities"]
    assert any(
        metric.get("definition", {}).get("name") == "Tiempo de preparación por lote"
        for step in entities if step["kind"] == "step" for metric in step["data"].get("metrics", [])
    )
    nav.get_by_role("button", name="Dashboard", exact=True).click()
    page.locator(".mg-head").get_by_role("button", name="Nuevo proceso").click()
    dialog = page.get_by_role("dialog")
    dialog.get_by_label("Punto de partida").select_option(label="Consultas técnicas en obra")
    dialog.get_by_role("button", name="Crear copia del caso").click()
    expect(page.locator(".react-flow__node")).to_have_count(22)
    labels = page.locator(".ed-lane-labels span")
    expect(labels).to_have_count(5)
    canvas = page.locator(".ed-canvas").bounding_box()
    assert canvas
    for label in labels.all():
        box = label.bounding_box()
        assert box and canvas["x"] <= box["x"] < canvas["x"] + 15 and label.inner_text().strip()
    page.locator(".react-flow__node").filter(has_text="Coordinador OT/BIM").first.click()
    expect(page.get_by_role("combobox", name="Responsable", exact=True)).to_have_value("Coordinador OT/BIM")
    captures = os.environ.get("AI_PROCESS_QA_DIR")
    if captures:
        Path(captures).mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(Path(captures) / "caso-rfi-carriles.png"))
    print("Métrica confirmada al navegar y recargar, cinco carriles rotulados y responsable histórico verificados.")
    browser.close()
