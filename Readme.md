https://dbdiagram.io/d/5ebd187839d18f5553ff3127

Aide à l'installation d'une antenne 4G chez soi.

Ce projet propose une carte permettant d'identifier les antennes relai 4G "à vue" de là où on souhaite son antenne 4G pour améliorer sa réception.

# Prérequis
- [SQLite tools](https://www.sqlite.org/download.html) ;

# Démarrer la partie Web
Utiliser [Miniweb HTTP server](https://sourceforge.net/projects/miniweb/) 

```bash
.\miniweb.exe -r [Chemin_vers_racine_projet]
```

# Démarrer la partie back

# Rafraîchir la base de données
Chaque mois, les [données sur les installations radioélectriques de plus de 5 watts](https://www.data.gouv.fr/en/datasets/donnees-sur-les-installations-radioelectriques-de-plus-de-5-watts-1/) sont actualisées ainsi que celle de [l'observatoire des données 2G, 3G et 4G de l'ANFR](https://data.anfr.fr/explore/dataset/observatoire_2g_3g_4g/export/) sur un rythme peut-être différent.

Pour que l'application soit à jour il faut exécuter le script *Python* qui va se charger de télécharger les données et d'actualiser la base de données.


Positionner la variable d'environnement `SQLITE_HOME` pointant vers l'exécutable *SQLite* dépendant de votre système d'exploitation.

Pour windows avec *cmd* : `set SQLITE_HOME=chemin_vers_sqlite.exe`

Pour windows avec *PowerShell* : `$env:SQLITE_HOME = "chemin_vers_sqlite.exe"`

Pour linux : `export SQLITE_HOME=chemin_vers_sqlite`

Aller dans le repertoire `backend` du projet, puis lancer `python refreshDB.py`.

# Ressources
 * https://geo.data.gouv.fr/ (et notamment https://openmaptiles.geo.data.gouv.fr trouvé dans le service https://www.antcarto.fr/nb_bandes.html) (non utilisé);
 * https://www.antcarto.fr/nb_bandes.html (non utilisé) ;
 * https://www.antcarto.fr/antennespanne.html (non utilisé) ;
 * Les opérateurs fournissent les données sur les antennes en panne (non utilisé) ;
 * https://framagit.org/Sp3r4z/100km (inspiration et le site : http://sp3r4z.fr/100km/) ;