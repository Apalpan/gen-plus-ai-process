"""Comprueba un indicador con unidad física y meta máxima en una demo aislada."""
import os

from playwright.sync_api import expect, sync_playwright

url = os.environ.get("AI_PROCESS_QA_URL", "http://127.0.0.1:5178").rstrip("/")
with sync_playwright() as pw:
    browser = pw.chromium.launch(channel="chrome")
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.set_default_timeout(15000)
    page.goto(url)
    page.get_by_role("button", name="Abrir demo", exact=False).click()
    nav = page.locator(".st-rail nav")
    nav.get_by_role("button", name="Framework VDC", exact=True).click()
    catalog = page.locator("details").filter(has=page.locator("input[name=actionThreshold]"))
    catalog.locator("summary").click()
    catalog.get_by_label("Ficha de medición").select_option("")
    form = catalog.locator("form")
    form.locator("[name=objectiveId]").select_option("prodo-via")
    fields = {
        "label": "Duración del paquete", "formula": "Fin menos inicio", "target": "8",
        "unit": "h", "owner": "Coordinación", "frequency": "Semanal",
        "source": "DATO_DEMO", "actionThreshold": "Revisar espera",
    }
    for name, value in fields.items():
        form.locator(f"[name={name}]").fill(value)
    form.locator("[name=comparison]").select_option("lte")
    form.get_by_role("button", name="Guardar métrica").click()
    expect(page.get_by_role("status")).to_contain_text("guardada")
    nav.get_by_role("button", name="Producción", exact=True).click()
    form = page.locator("form").filter(has=page.locator("[name=metricId]"))
    form.locator("[name=metricId]").select_option(label=fields["label"])
    for name, value in {"period": "2026-W47", "directValue": "6.25", "source": "DATO_DEMO · cronometraje"}.items():
        form.locator(f"[name={name}]").fill(value)
    form.get_by_role("button", name="Guardar cambio").click()
    expect(page.get_by_role("status")).to_contain_text("Corte registrado")
    page.reload()
    nav.get_by_role("button", name="Gerencial", exact=True).click()
    metric = page.get_by_role("button").filter(has=page.get_by_text(fields["label"], exact=True))
    expect(metric).to_contain_text("6.3 h")
    expect(metric).to_contain_text("en meta")
    browser.close()
    print("Corte decimal en horas, meta máxima y persistencia comprobados.")
