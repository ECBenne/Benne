# Erzeugt dist/artifact.html (ohne <html>/<head>-Rahmen) aus dist/index.html
import re
s=open('dist/index.html').read()
css=re.search(r'<style>(.*?)</style>',s,re.S).group(1)
body=re.search(r'<body[^>]*>(.*)</body>',s,re.S).group(1)
out='<title>Arena Manager</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">\n<style>'+css+'</style>\n'+body
out=out.replace('<script>','<script>document.body.dataset.mode="title";',1)
open('dist/artifact.html','w').write(out)
