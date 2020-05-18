/* 
    This project use the following resources :
    - IGN Geoservices : https://geoservices.ign.fr/documentation/geoservices/index.html
    - Leaflet
    - Chartist
    - Données Open Data sur les antennes : https://www.data.gouv.fr/en/datasets/donnees-sur-les-installations-radioelectriques-de-plus-de-5-watts-1/
    - Data model : https://dbdiagram.io/d/5ebd187839d18f5553ff3127
    - DB Browser for SQLite : https://sqlitebrowser.org/
    - Miniweb HTTP server for test : https://sourceforge.net/projects/miniweb/
*/

// IGN Geoservices elevation line service url
var elevationLineServiceURL = 'https://wxs.ign.fr/choisirgeoportail/alti/rest/elevationLine.json';

// Set on the approximated France center with zoom that display it entirely
var map = L.map('map').setView([47.234, 2.670], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


map.on('click', onMapClick);

//
// Global variables
//
var installationPoint = {lat: 0, lon: 0, haut: 6};

// Saved in variable to be able to remove it when user click other location on the map.
var marker = L.marker();
var searchArea = L.circle([0,0],{
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.2,
    radius: 10000
});
var relayMarkers = new Array();

// Relay icon definitions
var LeafIcon = L.Icon.extend({
    options: {
        shadowUrl: '/assets/img/marker-shadow.png',
    }
});
var goodRelay = new LeafIcon({iconUrl: '/assets/img/good-relay.png'});
var badRelay =  new LeafIcon({iconUrl: '/assets/img/bad-relay.png'});


/**
 * Main function
 * 
 * @param {*} e Click event
 */
function onMapClick(e) {
    marker.remove();
    marker.setLatLng(e.latlng).addTo(map);
   
    installationPoint.lat = e.latlng.lat;
    installationPoint.lon = e.latlng.lng;

    searchArea.remove();
    searchArea.setLatLng(e.latlng).addTo(map);

    relayMarkers.forEach(relayMarker => relayMarker.remove());
    relayMarkers.length = 0; // empty the array. @see https://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript

    getInPerimetertSupports(installationPoint, 10).then(
        supports => supports.forEach(support => setPotentialCandidate(support, installationPoint))
    );
};


/**
 * 
 * @param {lat, lon} center 
 * @param {float} radius (unit : km)
 */
async function getInPerimetertSupports(center, radius) {
    const upperLeftLat = 0;
    const upperLeftLon = 0;
    const bottomRightLat = 0;
    const bottomRightLon = 0;

    // Retrieve supports in the bounding box arround the installation position
    var boundedSupports = await getBoundedSupports(upperLeftLat, upperLeftLon, bottomRightLat, bottomRightLon);
    

    // All retrieved supports are contained in a bounding box. But we want
    // thoses in a circle defining the perimeter around the installation point.
    // So here we eliminate all supports further than the circle radius.
    var inPermiterSupports = [];
    boundedSupports.supports.forEach(support => {
        if(distance(center.lat, center.lon, support.lat, support.lon, "K") <= radius) {
            inPermiterSupports.push(support);
        }
    });

    return inPermiterSupports;
};

/**
 * Get all supports in the given bounding box.
 * 
 * @param {*} upperLeftLat 
 * @param {*} upperLeftLon 
 * @param {*} bottomRightLat 
 * @param {*} bottomRightLon 
 */

async function getBoundedSupports(upperLeftLat, upperLeftLon, bottomRightLat, bottomRightLon) {
    var url = new URL('http://192.168.1.105:8000/backend/supports.json');
    
    var boundedSupports = await fetch(url, {
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
          },
    }); 
    return boundedSupports.json();
};


/**
 * Determine wether the relay is "à vue" from the installation point.
 * 
 * @param {*} relay 
 * @param {lat, lon} antennaPos 
 */
async function setPotentialCandidate(support, antennaPos) {
    var elevationLine = await getElevationLine(support, antennaPos);
    //var antennas = await getAntennas(support);

    // Set for each antenna if it is "à vue" or not
    //antennas.antennas.forEach(antenna => isVisible(antenna, elevationLine));
    
/*
    var elevationPointsCount = elevationLine.elevations.length;
    var zRelay = elevationLine.elevations[0].z + support.haut;
    var zAntennaPos = elevationLine.elevations[elevationPointsCount - 1].z + antennaPos.haut;

    var relayDistance = distance(support.lat, support.lon, antennaPos.lat, antennaPos.lon, "K")*1000;
    
    var m = (zAntennaPos - zRelay)/(relayDistance);
    var p = zRelay;

    var elevationLineSerie = [];
    var lineSerie = [];
    var distances = [];



    for(var x = 0 ; x < elevationPointsCount ; x++) {
        var lat = elevationLine.elevations[x].lat;
        var lon = elevationLine.elevations[x].lon;
        var elevation = elevationLine.elevations[x].z;

        elevationPointDistanceToRelay = Math.trunc(distance(lat, lon, support.lat, support.lon, "K")*1000);
        var yWave = m*elevationPointDistanceToRelay + p;
        
        elevationLineSerie.push({x: elevationPointDistanceToRelay, y: elevation});
        lineSerie.push({x: elevationPointDistanceToRelay, y: yWave});

        if(elevation > yWave) {
            support.candidate = false;
        }
    }
*/
var elevationLineSerie = [];
var lineSerie = [];
    displayRelay(support, elevationLineSerie, lineSerie);
  
};

// select substr(coordonnees, 1, pos-1) as lat, substr(coordonnees, pos+1) as lon
//from (select coordonnees, instr(coordonnees, ', ') as pos from Antennes group by coordonnees)

//insert into antenne (lat, lon) select substr(coordonnees, 1, pos-1) as lat, substr(coordonnees, pos+1) as lon
//from (select coordonnees, instr(coordonnees, ', ') as pos from Antennes_raw group by coordonnees)
/*
Latitude : 1°=+-111 km

Longitude, ça dépend de la latitude :
à nice 1°=+-82 km
à Lille 1°=+-71 km

Tu peux prendre 76 km de moyenne pour la france, ce sera plus simple


Convertir les coordonnées degrés/minutes/secondes en degré
select case 
   when dirLat=="S" 
      then -1*(dLat+mLat/60.0+sLat/3600.0) 
      else (dLat+mLat/60.0+sLat/3600.0) 
   end as lat,
   case
   when dirLon=="W" 
      then -1*(dLon+mLon/60.0+sLon/3600.0) 
      else (dLon+mLon/60.0+sLon/3600.0) 
   end as lon
   from (select COR_NB_DG_LAT as dLat, COR_NB_MN_LAT as mLat, COR_NB_SC_LAT as sLat, COR_CD_NS_LAT as dirLat,
                COR_NB_DG_LON as dLon, COR_NB_MN_LON as mLon, COR_NB_SC_LON as sLon, COR_CD_EW_LON as dirLon
         from SUP_SUPPORT )

Mettre à jour les supports avec les latitudes et longitudes en degrés
update SUP_SUPPORT set lat = case 
   when SUP_SUPPORT.COR_CD_NS_LAT=="S" 
      then -1*(SUP_SUPPORT.COR_NB_DG_LAT+SUP_SUPPORT.COR_NB_MN_LAT/60.0+SUP_SUPPORT.COR_NB_SC_LAT/3600.0) 
      else (SUP_SUPPORT.COR_NB_DG_LAT+SUP_SUPPORT.COR_NB_MN_LAT/60.0+SUP_SUPPORT.COR_NB_SC_LAT/3600.0) 
   end
   
update SUP_SUPPORT set lon = case 
   when SUP_SUPPORT.COR_CD_EW_LON=="W" 
      then -1*(SUP_SUPPORT.COR_NB_DG_LON+SUP_SUPPORT.COR_NB_MN_LON/60.0+SUP_SUPPORT.COR_NB_SC_LON/3600.0) 
      else (SUP_SUPPORT.COR_NB_DG_LON+SUP_SUPPORT.COR_NB_MN_LON/60.0+SUP_SUPPORT.COR_NB_SC_LON/3600.0) 
   end
   
*/



function displayRelay(relay, profileSerie, lineSerie) {
    var m;
    if(relay.candidate) {
        m = L.marker([relay.lat, relay.lon], {icon: goodRelay});
    } else {
        m = L.marker([relay.lat, relay.lon], {icon: badRelay});
    }
    
    m.bindPopup('<div class="ct-chart ct-perfect-fourth" id="chart'+relay.id+'"></div><div>'+relay.lat+', '+relay.lon+'</div>', {minWidth: 350});
    
    relayMarkers.push(m);
    m.addTo(map);

    var tickMax = profileSerie[profileSerie.length-1].x;
    
    m.on('popupopen', function (){
        var data = {
            //labels: ['Relay', 'Antenna'],
            series: [{
                name: 'altimetricProfile',
                data: profileSerie
            }, {
                name: 'waveDirection',
                data: lineSerie
            }]};

          var options = {
            width: 300,
            height: 200,
            showPoint: false,
            lineSmooth: true,
            chartPadding: {right: 50},
            axisX: {
                showGrid: false,
                //type: Chartist.AutoScaleAxis
                type: Chartist.FixedScaleAxis,
                ticks: [0, Math.trunc(tickMax/3), Math.trunc(tickMax*2/3), tickMax],
                stretch: true
                //showLabel: false
            },
            axisY: {
                showGrid: false,
            },
            series:{
                'altimetricProfile': {showArea: true}
            }
          };
          // Create a new line chart object where as first parameter we pass in a selector
          // that is resolving to our chart container element. The Second parameter
          // is the actual data object.
          new Chartist.Line('#chart'+relay.id, data, options);
    });
    

}




// Prendre 1 point de mesure tous les 10m
// Au-delà de 2000m prendre toujours 200 points
/**
 * 
 * @param {*} relay 
 * @param {*} antennaPos 
 */
async function getElevationLine(relay, antennaPos) {
    
    var url = new URL(elevationLineServiceURL);

    var lats = relay.lat + '|' + antennaPos.lat;
    var longs = relay.lon + '|' + antennaPos.lon;

    var d = distance(relay.lat, relay.lon, antennaPos.lat, antennaPos.lon, "K");
    var sampling = 200;
    if (d < 2) {samplig = d * 1000 / 10};

    var params = {lat: lats, lon: longs, zonly: true, sampling: sampling};

    url.search = new URLSearchParams(params).toString();

    var res = await fetch(url); 
    
    return res.json();
}
