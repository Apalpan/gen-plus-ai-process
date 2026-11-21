import os
import tempfile
import asyncio,json,secrets,time
from pathlib import Path
from playwright.async_api import async_playwright,expect
BASE=os.environ.get('AI_PROCESS_QA_URL','http://127.0.0.1:5178').rstrip('/')
out=Path(os.environ.get('AI_PROCESS_QA_DIR',tempfile.mkdtemp(prefix='ai-process-qa-')))
out.mkdir(parents=True,exist_ok=True)

async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(channel='chrome')
  cs=await asyncio.gather(*[b.new_context(viewport={'width':1440,'height':900}) for _ in range(5)])
  token=secrets.token_hex(5)
  async def post(c,path,data):
   r=await c.request.post(BASE+'/api/'+path,data=data,headers={'Origin':BASE})
   assert r.ok,(r.status,await r.text())
   return await r.json()
  async def reg(i):
   return (await post(cs[i],'auth/register',{'email':f'{token}-{i}@example.test','password':secrets.token_urlsafe(20),'displayName':f'Editor {i+1}'}))['user']
  users=await asyncio.gather(*[reg(i) for i in range(5)])
  ws=(await post(cs[0],'workspaces',{'name':'QA cinco editores'}))['workspace']['id']
  await asyncio.gather(*[post(cs[0],'workspaces/'+ws+'/members',{'userId':u['id'],'role':'editor'}) for u in users[1:]])
  es=[{'id':'lane','kind':'lane','data':{'name':'Taller'}}]+[{'id':'s'+str(i),'kind':'step','data':{'title':f'Paso inicial {i}','laneId':'lane','type':'activity','x':i*210,'y':0}} for i in range(5)]
  brd=(await post(cs[0],'boards',{'workspaceId':ws,'title':'Taller de mapeo','entities':es}))['board']['id']
  pages=await asyncio.gather(*[c.new_page() for c in cs])
  async def prepare(i):
   page=pages[i]
   await page.goto(BASE+'/?board='+brd)
   await page.locator('.st-rail nav').get_by_role('button',name='Mapa de proceso').click()
   await page.get_by_role('button',name='Tabla',exact=True).click()
   await page.get_by_role('row').filter(has_text=f'Paso inicial {i}').click()
   await expect(page.get_by_role('textbox',name='Título',exact=True)).to_be_visible()
  await asyncio.gather(*[prepare(i) for i in range(5)])
  started=time.monotonic()
  await asyncio.gather(*[pg.get_by_role('textbox',name='Título',exact=True).fill(f'Paso revisado {i}') for i,pg in enumerate(pages)])
  async def converge(pg):
   for i in range(5):
    await expect(pg.get_by_role('row').filter(has_text=f'Paso revisado {i}')).to_have_count(1,timeout=15000)
  await asyncio.gather(*[converge(pg) for pg in pages])
  elapsed=round(time.monotonic()-started,2)
  resp=await cs[0].request.get(BASE+'/api/boards/'+brd)
  data=(await resp.json())['board']; actual={e['data']['title'] for e in data['entities'] if e['kind']=='step'}
  assert actual=={f'Paso revisado {i}' for i in range(5)} and data['boardRev']==5,(actual,data['boardRev'])
  await pages[0].screenshot(path=str(out/'cinco-editores.png'))
  result={'contextos_independientes':5,'ediciones_ui_simultaneas':5,'sesiones_con_el_mismo_resultado':5,'revision_tablero':data['boardRev'],'convergencia_segundos':elapsed}
  (out/'cinco-editores.json').write_text(json.dumps(result,indent=2),encoding='utf8')
  print(result)
  await b.close()
asyncio.run(main())
