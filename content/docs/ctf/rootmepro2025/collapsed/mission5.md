---
title: Mission 5 - Mobile
weight: 1
---
# Mission 5 : Exploitation Mobile

## Introduction

{{% columns ratio="1:2" %}}

- ![Application déchiffrée](../img/encrypted-app.png)

- On nous fournit un APK, qui provient d'une saisie lors d'une arrestation d'un membre du groupe NullVastation. Certains des messages sont chiffrés et un d'entre eux doit contenir notre drapeau. 
{{% /columns %}}

## Retro-ingénierie 

Pour commencer, on va décompiler l'APK fournit. On s'aperçoit que la clé de chiffrement est composé de la marque et du modèle de la tablette. 

La tablette saisie est, comme indiqué dans l'énnoncé, une tablette google. 

## Brute Force 

```python

import base64,sys
import hashlib, urllib
import requests
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

# === Configuration ===
STATIC_SALT = "s3cr3t_s@lt"
STATIC_IV = base64.b64decode("LJo+0sanl6E3cvCHCRwyIg==")
AESMODE = AES.MODE_CBC
CSV_MODEL_COLUMN=3
CSV_BRAND_COLUMN=0
CSV_SEPARATOR=","
DIC="android-devices-catalog.csv"


def load_devices(file): 
    loaded_devices = {}
    with open(file, encoding="utf-8") as f: 
        for l in f.readlines() : 
            if l.split(CSV_SEPARATOR)[CSV_BRAND_COLUMN].strip() not in loaded_devices.keys() : 
                loaded_devices[l.split(CSV_SEPARATOR)[CSV_BRAND_COLUMN].strip()] = []
            loaded_devices[l.split(CSV_SEPARATOR)[CSV_BRAND_COLUMN].strip()].append(l.split(CSV_SEPARATOR)[CSV_MODEL_COLUMN].strip())
    return loaded_devices

# === Fonctions ===

def hash_device_id(model, brand):
    """Génère l'identifiant du device (base64(SHA256(model:brand)))"""
    raw = f"{model}:{brand}".encode("utf-8")
    digest = hashlib.sha256(raw).digest()
    return base64.b64encode(digest).decode()


def derive_key(device_id, salt):
    """Dérive une clé AES 256 bits depuis l'ID + salt (SHA256)"""
    raw = f"{device_id}:{salt}".encode("utf-8")
    return hashlib.sha256(raw).digest()


def decrypt_message(cipher_b64, key):
    cipher_bytes = base64.b64decode(cipher_b64)
    cipher = AES.new(key, AESMODE, STATIC_IV)
    plaintext = unpad(cipher.decrypt(cipher_bytes), AES.block_size)
    return plaintext.decode("utf-8")


def test_device(model, brand, messages, ignore=[]):
    device_id = hash_device_id(model, brand)
    key = derive_key(device_id, STATIC_SALT)
    #print(f"\n🧪 Test: MODEL={model}, BRAND={brand}, KEY={hash_device_id(model,brand)}")
    
    found = 0
    for i,msg in enumerate(messages):
        try : 
            decrypted = decrypt_message(msg, key)
            print(decrypted)
            if decrypted and i not in ignore :
                #print(f"[✅] Déchiffré : {decrypted}")
                found += 1

            if found != 0 :
                print(f"🎉 {found} message(s) déchiffré(s) avec succès.")

        except Exception as e:
            None
            #print(f"⚠️ Erreur : {e}")
    return found


# === Main ===
if __name__ == "__main__":
    total_hits = 0
    total_test = 0

   
    messages=[
        "5fLWsL8nbBPnBJWjuCqqOj7Ek6GeYQndIIcnbeNdnHrgCtn1LhbCkcabYDLKjuQe3DlWJdB7NyQY3QjwgYYbs8H2ZEzgL3oALAafWi3E3Iir36Svgn7yI6Jr6rfxmriy",#Pixel C:google --> Temoins
        "M2geCVKOzPlyug9p9DvthxPip0oe9BPiT2sDfFhWy7iC3+JQI4SfO7+SLAlFSUmu8LoGj1hrUWil/uNXvc+5mKBMrRNFQT8ijBK14P0Z8qA=",
        "//5PBsYWhHlgqhVgG1omUyevzmlErLZVsTCLO78Rbb9qBMPnsKCS5/RZ4GEdWRBPiZ4BtO5h7j2PuIutfqf7ag==",
        "2uNMSnJZa5JExhYgNA+V3RAiafhuLkj8Jnr4U+lSZOrrpMWjyA13w0Do3IIPcVBgK070rmweRKX/GkCAxat4i3JfWk1UvWNSmEZbHQlFznR7VFW6FKK84iJKhiDOp8Tk",
        "Swz/ycaTlv3JM9iKJHaY+f1SRyKvfQ5miG6I0/tUb8bvbOO+wyU5hi+bGsmcJD3141FrmrDcBQhtWpYimospymABi3bzvPPi01rPI8pNBq8=",
        "NAe44oieygG7xzLQT3j0vN+0NoPNUu0TAaid9Az3IlpcKwR0lSKaPT8F4y1zpbArWFIGpgzsPZtPAwL50qocTRMG/g5u+/wcc1nxmhBjCbg=",
        "dfeKlZP/gIntHySBYine2YUlNiX3LjlMOLu7y9tgprFyJIIcQpfghlQXut6cJUG2wtzGBVQUm7ITdpLNeVaZjamQHhPWEtNIJE/xtFg66Klui1qCKYKSrmZ4wm1CG/ZPy4csqbM28Ur8dts7XoV5FA==",
        "YtCWZ+aCufaqpQQbOIATWkkfjMGCS7HnxlOT/5cPcm+uk3dNZMHgd3RouUmx318X89CbiSwFyho3/8QYeJyJjTNUD8OJw4MPqbCUBr53bD+zL7GU8wCkhVFIimNvKOVb",
        "HSGe6zbjRpnuAsfGjeAcVMYwrUyKd3Klz3mopTnmbr3zum9y6NcJa/itMSP97yHMLPQmwHwhtHPowcK6Gl8LCoHvDgo56ACLuqB3VeE2kbg=",
        "osYcTbYc3k6gTKhStBnw1xrYTzGnHScw/pvz6HnAUvukUJujdtf+2C7sCowiVGTC0kGyxWVOo8EmQEGlbyBHaugz5lDB30VlpNDG9MHWIuT+RBwN63QzsW3wJt2BJlKf"]

    devices=load_devices(DIC)


    #%2B83VAJU5MwlVSZEQ978mQ6xVuIptn46haMb4In97qY0%3D
   # print(hash_device_id("Pixel C","google"))
   # print(test_device("Pixel C", "google", messages, ignore=[0,1,2]))
    #print(test_device("google", "Pixel C", messages, ignore=[0,1,2]))
    #print(test_device("google", "Pixel C", messages, ignore=[0,1,2]))


    for brand in devices.keys():
        for model in devices[brand]:
           # print(f"[*] Test {brand} - {model}")
            hits = test_device(model.upper(), brand.upper(), messages, ignore=[])
            total_hits += hits
            hits = test_device(model.lower(), brand.lower(), messages, ignore=[])
            total_hits += hits
            hits = test_device(model, brand, messages, ignore=[])
            total_hits += hits
            total_test += 3


    print(f"\n🔎 Bruteforce terminé. {total_hits} messages déchiffrés sur {total_test} testés.")



```

Après exécutions avec plusieurs dictionnaire, on trouve la clé qui est composée de Google et Yellowstone. 


# Bonus 

{{% columns ratio="1:2" %}}

En modifiant les champs BUILD et MODEL dans notre VM Android : 

![Application déchiffrée](../img/decryted-app.png)
{{% /columns %}}
