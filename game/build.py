import base64,glob,json,os
d={}
for kind,p in (('f','front'),('b','back')):
    for f in sorted(glob.glob(f'sprites/{p}/*.png')):
        n=os.path.basename(f)[:-4]
        d[f'{kind}{n}']='data:image/png;base64,'+base64.b64encode(open(f,'rb').read()).decode()
t=open('src/taschenfarm.tpl.html',encoding='utf8').read()
assert '/*SPRITES*/{}' in t
open('taschenfarm.html','w',encoding='utf8').write(t.replace('/*SPRITES*/{}',json.dumps(d)))
print(len(d),'sprites')
