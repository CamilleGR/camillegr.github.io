---
title: Mission 6 - OSINT
weight: 1
---
# Mission 6 : OSINT

Avec toutes les informations récoltées, il nous est maintenant demandé de trouver le nom d'un membre de NullVastation.

## Liste des informations 

Listons les informations que nous avons récolté durant les 5 derniers défis : 

```markdown

# MISSION 01 : RANSOMWARE 
http://163.172.67.184/

- cyberforge.quantum
- neoxis.helix
- QuantumCore Defense Systems

# MISSION 02 : SOC 
- 163.172.67.201

# MISSION 03 : Forensic : 
    QUANTUMCORE
    - Utilisateur : johndoe
    - Mot de passe : MC2BSNRbgk
    vastation 192.168.1.10
    attaque entre le 25/03 14:02 et 14:12

# MISSION 04 : PENTEST 

163.172.67.183

VAULT : 
    - SSH Operator/LGSA5l1%YHngd&GbjxR4Or
    ssh operator@163.172.67.201 -p22

```

Si l'on se connecte à la machine de la mission 4 avec le compte Operator, on peut retrouver du code source signé *voidSyn42*.

## Sherlock : VoidSyn42

Avec le pseudo, nous allons utiliser Sherlock qui nous donne la liste de site suivante : 

```
https://hub.docker.com/u/voidsyn42/
https://www.duolingo.com/profile/voidsyn42
https://freelance.habr.com/freelancers/voidsyn42
https://gitlab.gnome.org/voidsyn42
https://www.github.com/voidsyn42
https://www.librarything.com/profile/voidsyn42
https://www.mydramalist.com/profile/voidsyn42
https://nationstates.net/nation=voidsyn42
https://nationstates.net/region=voidsyn42
https://x.com/voidsyn42
https://music.yandex/users/voidsyn42/playlists
https://www.youtube.com/@voidsyn42
https://www.hunting.ru/forum/members/?username=voidsyn42
Total Websites Username Detected On : 13
```

## Resultat

Le premier lien, c'est à dire docker hub nous donne le résultat : 

![alt text](../img/osint.png)