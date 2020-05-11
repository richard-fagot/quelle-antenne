/* 
    This project use the following resources :
    - IGN Geoservices : https://geoservices.ign.fr/documentation/geoservices/index.html
    - Leaflet
    - Chartist
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
var installationPoint = {lat: 0, lon: 0};

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

    getNearestRelays(installationPoint, 10).then(
        nearestRelays => nearestRelays.forEach(relay => setPotentialCandidate(relay, installationPoint))
    );
};


/**
 * 
 * @param {lat, lon} center 
 * @param {float} radius (unit : km)
 */
async function getNearestRelays(center, radius) {
    //:TODO - Récupérer les infos en BDD
    var boundingRelays = await getBoundingRelays();
    //:

    // All retrieved relays are contained in a bounding box. But we want thoses in a circle.
    // So here we eliminate all relays far than the circle radius.
    var res = [];
    boundingRelays.relays.forEach(relay => {
        if(distance(center.lat, center.lon, relay.lat, relay.lon, "K") <= radius) {
            res.push(relay);
        }
    });

    return res;
};

async function getBoundingRelays() {
    var url = new URL('http://192.168.43.209:8000/assets/relay.json');
    
    var relays = await fetch(url, {
        headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
          },
    }); 
    return relays.json();
}
/**
 * Determine wether the relay is "à vue" from the installation point.
 * 
 * @param {*} relay 
 * @param {lat, lon} antennaPos 
 */
async function setPotentialCandidate(relay, antennaPos) {
    var elevationLine = await getElevationLine(relay, antennaPos);
    var elevationPointsCount = elevationLine.elevations.length;
    var zRelay = elevationLine.elevations[0].z;
    var zAntennaPos = elevationLine.elevations[elevationPointsCount - 1].z;

    var relayDistance = distance(relay.lat, relay.lon, antennaPos.lat, antennaPos.lon, "K")*1000;
    
    var m = (zAntennaPos - zRelay)/(relayDistance);
    var p = zRelay;

    var elevationLineSerie = [];
    var lineSerie = [];
    var distances = [];



    for(var x = 0 ; x < elevationPointsCount ; x++) {
        var lat = elevationLine.elevations[x].lat;
        var lon = elevationLine.elevations[x].lon;
        var elevation = elevationLine.elevations[x].z;

        elevationPointDistanceToRelay = Math.trunc(distance(lat, lon, relay.lat, relay.lon, "K")*1000);
        var yWave = m*elevationPointDistanceToRelay + p;
        
        elevationLineSerie.push({x: elevationPointDistanceToRelay, y: elevation});
        lineSerie.push({x: elevationPointDistanceToRelay, y: yWave});

        if(elevation > yWave) {
            relay.candidate = false;
        }
    }

    displayRelay(relay, elevationLineSerie, lineSerie);
  
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
*/



function displayRelay(relay, profileSerie, lineSerie) {
    var m;
    if(relay.candidate) {
        m = L.marker([relay.lat, relay.lon], {icon: goodRelay});
    } else {
        m = L.marker([relay.lat, relay.lon], {icon: badRelay});
    }
    
    m.bindPopup('<div class="ct-chart ct-perfect-fourth" id="chart'+relay.id+'"></div>', {minWidth: 350});
    
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
