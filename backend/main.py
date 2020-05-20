import sqlite3
from flask import Flask
from flask_cors import CORS, cross_origin

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

@app.route('/')
@cross_origin()
def hello_world():
    return antennasToJson(fetchAntennas(0,0,0,0))

@app.route('/supports/<float:upperLeftLat>/<float:upperLeftLon>/<float:bottomRightLat>/<float:bottomRigthLon>', methods=['GET'])
@cross_origin()
def getSupport(upperLeftLat, upperLeftLon, bottomRightLat, bottomRigthLon):
    return antennasToJson(fetchAntennas(upperLeftLat, upperLeftLon, bottomRightLat, bottomRigthLon))
    



def fetchAntennas(upperLeftLat, upperLeftLon, bottomRightLat, bottomRigthLon):
    conn = sqlite3.connect('antennes.sqlite3')
    c = conn.cursor()

    c.execute('select distinct sup.sup_id, lat, lon, ant.AER_ID, AER_NB_ALT_BAS '
    'from SUP_SUPPORT sup '
    'inner join SUP_STATION sta '
    'on sta.sta_nm_anfr = sup.sta_nm_anfr '
    'inner join SUP_EXPLOITANT ex '
    'on ex.ADM_ID = sta.ADM_ID '
    'inner join SUP_ANTENNE ant '
    'on ant.sta_nm_anfr = sup.sta_nm_anfr '
    'inner join SUP_EMETTEUR em '
    'on em.sta_nm_anfr = sup.sta_nm_anfr '
    'where sup.lat < ? and sup.lat > ? and sup.lon > ? and sup.lon < ? '
    'and ex.ADM_ID in (6, 137, 23, 240)  '
    'and em.emr_lb_systeme like "LTE%" '
    'order by sup.sup_id, AER_NB_ALT_BAS, ant.AER_ID;', (upperLeftLat, bottomRightLat, upperLeftLon, bottomRigthLon,))


    rows = c.fetchall()
    conn.close()

    return rows

def antennasToJson(rows):
    data = {"supports": []}

    currentSupId = 0
    currentHaut = 0
    currentSupport = None
    currentAntenne = None

    i = 0
    for row in rows:

        if(i == 0):
            i = i + 1
            continue

        supID = int(row[0])
        lat = float(row[1])
        lon = float(row[2])
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
            currentAntenne = {"haut": haut, "aer_ids": [aerID], "isVisible": 1}
            currentHaut = haut

        currentAntenne["aer_ids"].append(aerID)

    return data


