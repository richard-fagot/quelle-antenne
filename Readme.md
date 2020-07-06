https://dbdiagram.io/d/5ebd187839d18f5553ff3127

Aide à l'installation d'une antenne 4G chez soi.

Ce projet propose une carte permettant d'identifier les antennes relai 4G "à vue" de là où on souhaite son antenne 4G pour améliorer sa réception.

# Mode développement (sous W10)
- [SQLite tools](https://www.sqlite.org/download.html) ;

## Démarrer la partie Web
Utiliser [Miniweb HTTP server](https://sourceforge.net/projects/miniweb/) 

```bash
.\miniweb.exe -p 80 -r [Chemin_vers_racine_projet]
```

## Démarrer la partie back
Aller dans le répertoire `backend` puis :
- monter le `virtualenv` ;
- déclarer la variable d'environnement pour indiquer à *Flask* le fichier serveur ;
- lancer *Flask* en l'ouvrant sur les IP non locales (comme ça il sera accessible depuis la même IP que celle utilisée par *miniweb*, @see [stackoverflow](https://stackoverflow.com/questions/7023052/configure-flask-dev-server-to-be-visible-across-the-network)).

```powershell
.\ENV\Scripts\activate
$env: FLASK_APP = "main.py"
flask run --host=0.0.0.0
```

# Rafraîchir la base de données
Chaque mois, les [données sur les installations radioélectriques de plus de 5 watts](https://www.data.gouv.fr/en/datasets/donnees-sur-les-installations-radioelectriques-de-plus-de-5-watts-1/) sont actualisées ainsi que celle de [l'observatoire des données 2G, 3G et 4G de l'ANFR](https://data.anfr.fr/explore/dataset/observatoire_2g_3g_4g/export/) sur un rythme peut-être différent.

Pour que l'application soit à jour il faut exécuter le script *Python* qui va se charger de télécharger les données et d'actualiser la base de données.


Positionner la variable d'environnement `SQLITE_HOME` pointant vers l'exécutable *SQLite* dépendant de votre système d'exploitation.

Pour windows avec *cmd* : `set SQLITE_HOME=chemin_vers_sqlite.exe`

Pour windows avec *PowerShell* : `$env:SQLITE_HOME = "chemin_vers_sqlite.exe"`

Pour linux : `export SQLITE_HOME=chemin_vers_sqlite`

Aller dans le repertoire `backend` du projet, puis lancer `python3 refreshDB.py`.

# Mise en production
Comment mettre en production le projet sur un serveur Ubuntu.

## Prérequis
 - Cloner le projet ;
 - Installer sqlite3 : `sudo apt install sqlite3` ;
 - Installer nginx : `sudo apt install nginx` ;
 - Installer uwsgi : `sudo apt install uwsgi`.

## Initialiser le projet
Création de la base de données :

```bash
sqlite3 DatabaseName.db
.read ./script/create-quelle-antenne.sql
```

Téléchargement des dépendances du serveur *Flask* :

```bash
python3 -m venv ENV
pip install -r requirements.txt
```
## Configurer la partie web
Éditer le fichier `/etc/nginx/sites-available/default` et modifier la directive `root` pour qu'elle pointe vers la racine du projet.

## Configurer la partie backend
Créer le fichier `sudo vi /etc/uwsgi/apps-available/quelle-antenne.ini` avec le contenu suivant :

```bash
[uwsgi]
module = main
callable = app
plugins = python38
socket = /tmp/quelle-antenne.sock
wsgi-file = /home/<APP-USER>/projects/quelle-antenne/backend/main.py
virtualenv = /home/<APP-USER>/projects/quelle-antenne/backend/ENV
chdir = /home/<APP-USER>/projects/quelle-antenne/backend
```

`<APP-USER>` est l'utilisateur créé pour gérer le projet.

Puis l'activer :

```bash
cd /etc/uwsgi/apps-enabled/
sudo ln -s ../apps-available/quelle-antenne.ini .`
```

Créer le fichier `sudo vi /etc/nginx/sites-available/quelle-antenne` avec le contenu suivant :
 ```bash
 server {
    listen  5000;
    server_name _;
    access_log /var/log/nginx/quelle-antenne_access.log;
    error_log /var/log/nginx/quelle-antenne_error.log;

    location / {
        uwsgi_pass  unix:/tmp/quelle-antenne.sock;
        include     uwsgi_params;
    }

}
 ```

 Puis l'activer :

```bash
cd /etc/nginx/sites-enabled/
sudo ln -s ../sites-available/quelle-antenne .`
```

Pour terminer on relance les deux serveurs :

```sh
sudo service nginx restart
sudo service uwsgi  restart
```

Maintenant on peut aller dans notre navigateur préféré et saisir l'adresse du site. Tadaaaaaaaaa !



# Ressources
 * https://geo.data.gouv.fr/ (et notamment https://openmaptiles.geo.data.gouv.fr trouvé dans le service https://www.antcarto.fr/nb_bandes.html) (non utilisé);
 * https://www.antcarto.fr/nb_bandes.html (non utilisé) ;
 * https://www.antcarto.fr/antennespanne.html (non utilisé) ;
 * Les opérateurs fournissent les données sur les antennes en panne (non utilisé) ;
 * https://framagit.org/Sp3r4z/100km (inspiration et le site : http://sp3r4z.fr/100km/) ;