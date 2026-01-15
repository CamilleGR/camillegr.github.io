---
title: MAAS
weight: 1
---

# MAAS : Mock As A Service

![Banniere](../img/maas.png)

MaaS est un serveur HTTP simple et léger écrit en Python, compatible avec Python 2.7 et Python 3. Il permet de servir des fichiers statiques et de gérer des en-têtes HTTP personnalisés.

L'objectif de cet outil est de faciliter et accélérer les POC impliquant un serveur HTTP. Celui-ci peut également aider à isoler un système.

## Utilisation 

```
python maas.py -h
      _______     ___ ___       ____       ____       _____
    _|_______|   |   |   |     /    |     /    |     / ___/
  / _|-------|   | _   _ |    |  o  |    |  o  |    (   \_
 | | | | | | |   |  \_/  |    |     |    |     |     \__  |
 | |_| | | | |   |   |   |    |  _  |    |  _  |     /  \ |
  \__| | | | |   |   |   |    |  |  |    |  |  |     \    |
     |_______|   |___|___|    |__|__|    |__|__|      \___|

usage: maas.py [-h] [-v] [-p PORT] [-d DELAY] [-rf RESPONSEFILE]
               [-rh RESPONSEHEADERS] [-rc RESPONSECODE]

optional arguments:
  -h, --help            show this help message and exit
  -v, --verbose         increase output verbosity
  -p PORT, --port PORT  port to serve
  -d DELAY, --delay DELAY
                        delay to apply (in ms)
  -rf RESPONSEFILE, --responseFile RESPONSEFILE
                        File containing the body response
  -rh RESPONSEHEADERS, --responseHeaders RESPONSEHEADERS
                        Response headers (separated by ;)
  -rc RESPONSECODE, --responseCode RESPONSECODE
                        Response code

```

## Fonctionnalités
- Lecture de fichiers : Fonction intégrée pour lire le contenu des fichiers.
- Parsing des en-têtes HTTP : Fonctionnalité pour analyser les en-têtes HTTP.
- Cross-platform : Fonctionne sur Windows, macOS et Linux.
- Cross-version : Compatible avec Python 2.7 et Python 3.