import os
import tempfile
from pathlib import Path
import json
from playwright.sync_api import sync_playwright, expect
out=Path(os.environ.get('AI_PROCESS_QA_DIR',tempfile.mkdtemp(prefix='ai-process-qa-')))
out.mkdir(parents=True,exist_ok=True)
base=os.environ.get('AI_PROCESS_QA_URL','http://127.0.0.1:5178').rstrip('/')
with sync_playwright() as pw:
    b=pw.chromium.launch(channel='chrome')
    p=b.new_page(viewport={'width':1440,'height':900})
    p.set_default_timeout(8000)
    errors=[]
    p.on('pageerror',lambda error:errors.append(str(error)))
    p.goto(base)
    p.get_by_role('button',name='Abrir demo').click()
    def nav(name):
        p.locator('.st-rail nav').get_by_role('button',name=name,exact=True).click()
    expect(p.get_by_role('heading',name='Dashboard',exact=True)).to_be_visible()
    nav('Producción')
    form=p.locator('form').filter(has=p.locator('[name=denominator]'))
    form.locator('[name=metricId]').select_option('metric-ppc')
    for k,v in {'period':'2026-W49','numerator':'19','denominator':'20','source':'DATO_DEMO · Plan congelado W49'}.items():
        form.locator('[name='+k+']').fill(v)
    form.get_by_role('button',name='Guardar cambio').click()
    expect(p.get_by_role('status')).to_contain_text('Corte registrado')
    for tab in ['Operativo','Gerencial']:
        nav(tab)
        kpi=p.locator('button').filter(has=p.get_by_text('PPC',exact=True)).first
        expect(kpi).to_contain_text('95 %')
        p.screenshot(path=str(out/(tab.lower()+'-corte.png')))
    kpi.click()
    expect(p.get_by_role('heading',name='Framework BDC',exact=True)).to_be_visible()
    fc=p.locator('.rg-flow [data-id="fc-qa"]')
    fc.click()
    expect(p.locator('.rg-detail')).to_contain_text('Diseñar paquete')
    p.locator('.rg-detail').get_by_role('button',name='Actividad · Diseñar paquete').click()
    expect(p.locator('.st-canvas-work')).to_be_visible()
    nav('Framework BDC')
    p.locator('.rg-flow [data-id="fc-qa"]').click()
    p.screenshot(path=str(out/'interrelaciones.png'))
    p.locator('.rg-detail').get_by_role('button',name='ICE · Liberar el despiece de anclajes').click()
    expect(p.get_by_role('heading',name='Revisar restricción')).to_be_visible()
    nav('Sesiones ICE')
    p.get_by_role('button',name='Pre-ICE').click()
    p.get_by_role('button',name='Traer temas abiertos').click()
    p.get_by_label('Fecha de la sesión').fill('2026-12-05T17:00')
    p.get_by_role('button',name='Guardar agenda').click()
    expect(p.get_by_role('status')).to_contain_text('Agenda guardada')
    p.get_by_role('button',name='En sesión').click()
    expect(p.get_by_role('heading',name='Registrar tema')).to_be_visible()
    p.get_by_role('textbox',name='Tema o decisión').fill('DATO_DEMO · izaje desde acceso sur')
    p.get_by_role('textbox',name='Decisor con autoridad').fill('Líder de montaje')
    p.get_by_role('textbox',name='Motivo',exact=True).fill('Interfaz de estructura liberada')
    p.get_by_role('combobox',name='Resultado de la discusión').select_option('decidido')
    p.get_by_role('button',name='Registrar para revisión').click()
    expect(p.get_by_role('heading',name='Revisar decisión')).to_be_visible()
    assert not errors,errors
    (out/'prueba-vdc.json').write_text(json.dumps({'corte':'19/20','gerencial':'95 %','operativo':'95 %','drilldown':['PPC','interrelaciones','actividad','ICE'],'agenda_y_sesion':True,'errores_js':errors},ensure_ascii=False,indent=2),encoding='utf8')
    b.close()
