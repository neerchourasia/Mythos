import re
css=open("style.css").read()
js="\n".join(open(f).read() for f in ["text.js","config.js","engine.js","ui.js"])
js=js.replace("</script>","<\\/script>")
h=open("shell.html").read()
h=h.replace("/*CSS*/",css).replace("/*JS*/",js)
open("../index.html","w").write(h)
print(len(h))
