# il me semble que c'était juste pour me faire un exemple de json généré à partir d'un extract pour les tests.
# on doit pouvoir supprimer ce fichier.
import csv
import json

data = {"supports": []};

currentSupId = 0
currentHaut = 0
currentSupport = None
currentAntenne = None
with open('D:/temp/support_antenne_hauteur.csv', newline='') as csvfile:
    spamreader = csv.reader(csvfile, delimiter=';', quotechar='|')
    i = 0
    for row in spamreader:
        # Pass header columns
        if(i == 0):
            i = i + 1
            continue
        
        supID = int(row[0])
        lat = float(row[1].replace(",", "."))
        lon = float(row[2].replace(",", "."))
        aerID = int(row[3])
        haut = float(row[4].replace(",", "."))
         
        
        if(supID != currentSupId):
            if(currentSupport != None):
                data["supports"].append(currentSupport)
            currentSupport = {"supId" : supID, "lat": lat, "lon": lon, "antennes": []}
            currentSupId = supID

        if(haut != currentHaut):
            if(currentAntenne != None):
                currentSupport["antennes"].append(currentAntenne)
            currentAntenne = {"haut": haut, "aer_ids": [], "isVisible": 1}
            currentHaut = haut
        
        currentAntenne["aer_ids"].append(aerID)

        


with open("supports.json", "w") as write_file:
    json.dump(data, write_file, indent=4)