import csv
import json

data = {"supports": []};

"""
{"supports": [
    {   "sup_id": 123456,
        "lat": 12.5564,
        "lon": 132.35,
        "antennes": [
            {"haut": 25.7, "aer_id": []},
            {"haut": 25.7, "aer_id": []}
        ]
    }    
]}
"""

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
        
        (supID, lat, lon, aerID, haut) = row
        
        if(supID != currentSupId):
            if(currentSupport != None):
                data["supports"].append(currentSupport)
            currentSupport = {"supId" : supID, "lat": lat, "lon": lon, "antennes": []}
            currentSupId = supID

        if(haut != currentHaut):
            if(currentAntenne != None):
                currentSupport["antennes"].append(currentAntenne)
            currentAntenne = {"haut": haut, "aer_ids": [aerID]}
            currentHaut = haut
        
        currentAntenne["aer_ids"].append(aerID)

        


with open("supports.json", "w") as write_file:
    json.dump(data, write_file, indent=4)