import {ProgressBar} from './modules/progressbar.js';
import {leafletHelp} from './modules/leaflet-help.js';
import {leafletSearchRadius} from './modules/leaflet-searchradius.js';
import {leafletAntennaHeight} from './modules/leaflet-antenna-height.js';
import {SupportMarker} from './modules/support-markers.js';

/* 
    This project uses the following resources :
    - IGN Geoservices : https://geoservices.ign.fr/documentation/geoservices/index.html
    - Leaflet
    - Chartist
    - Données Open Data sur les antennes : https://www.data.gouv.fr/en/datasets/donnees-sur-les-installations-radioelectriques-de-plus-de-5-watts-1/
    - Data model : https://dbdiagram.io/d/5ebd187839d18f5553ff3127
    - DB Browser for SQLite : https://sqlitebrowser.org/
    - Miniweb HTTP server for test : https://sourceforge.net/projects/miniweb/
*/

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
//                            Global variables                               //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
const installationPoint = {lat: 0, lon: 0, haut: 0};
const progressBar = new ProgressBar(0, "#main");
const MAX_SAMPLING = 200;

// IGN Geoservices elevation line service url
const elevationLineServiceURL = 'https://wxs.ign.fr/choisirgeoportail/alti/rest/elevationLine.json';
const BACKEND_ROOT_URL = 'http://' + window.location.host + ':5000';

// Set the center of France defined by IGN in 1993 taking into account the
// earth curvature (without Corse) (https://fr.wikipedia.org/wiki/Centre_de_la_France)
const centerOfFrance = [46.539722, 2.430278];
const map = L.map('map').setView(centerOfFrance, 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

leafletHelp({ position: 'topleft' }).addTo(map);
leafletSearchRadius({ position: 'topright' }).addTo(map);
const antennaHeightControl = leafletAntennaHeight({ position: 'topright' });
antennaHeightControl.addTo(map);

map.on('click', onMapClick);

// Saved in variable to be able to remove it when user clicks other location on the map.
const installationLocationMarker = L.marker();
const searchArea = L.circle([0,0],{
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.2,
    radius: 10000
});

const relayMarkers = new Array();
const azimuts = new Array();

/**
 * Main function
 * 
 * @param {*} e Click event
 */
function onMapClick(e) {
    cleanMap();
    
    installationLocationMarker.setLatLng(e.latlng).addTo(map);
   
    installationPoint.lat = e.latlng.lat;
    installationPoint.lon = e.latlng.lng;
    installationPoint.haut = antennaHeightControl.getHeight();

    // Radius corresponds to the max antenna range. This range depends on a lot
    // of criteria (frequency, obstacle, antenna type, propagation…). The 
    // literature indicates a max range from 30 to 70 km 
    // (@see https://en.wikipedia.org/wiki/Cell_site#Range 
    // or https://selectra.info/telecom/guides/technologies/antenne-4g). 
    // It's very imprecise so the limit is set to 30 km (@see leaflet-searchradius.js) to not
    // overload the IGN server but allows to give a good help in most cases.
    const radius = parseFloat(document.querySelector("#rayon").value);
    searchArea.setRadius(radius);
    searchArea.setLatLng(e.latlng).addTo(map);

    progressBar.initProgress();
    const msg = document.querySelector("#msg");
    msg.innerHTML = "";
    
    getInPerimetertSupports(installationPoint, radius/1000).then( 
        // Call all setAntennasVisibility() in parallel
        //supports => Promise.all(supports.map(support => setAntennasVisibility(support, installationPoint)))
        // call setAntennasVisibility in sequencial. Use this to limit issue
        // from the geoservice which cannot respond to too much call at a time
        supports => {
            progressBar.setMax(supports.length);
            (async function() {
                for (let support of supports) {
                    await setAntennasVisibility(support, installationPoint);

                    progressBar.incProgressBar();
                    displayRelay(support);
                }
                // When all candidates are processed, ensure to remove the
                // progress bar.
                progressBar.displayProgress(false);
            })()
        }
    );
};

/**
 * Remove all elements from the map (markers, lines…)
 */
function cleanMap() {
    installationLocationMarker.remove();
    searchArea.remove();

    relayMarkers.forEach(relayMarker => relayMarker.remove());
    relayMarkers.length = 0; // empty the array. @see https://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript

    azimuts.forEach(azimut => azimut.remove());
    azimuts.length = 0;
};

/**
 * Returns a array containing all supports inside the given circle search area.
 * @param {lat, lon} center center of the search area.
 * @param {float} radius (unit : km)
 */
async function getInPerimetertSupports(center, radius) {
    // Retrieve supports in the bounding box arround the installation position
    let boundedSupports = await getBoundedSupports(center, radius);
    

    // All retrieved supports are contained in a bounding box. But we want
    // thoses in a circle defining the perimeter around the installation point.
    // So here we eliminate all supports further than the circle radius.
    let inPermiterSupports = [];
    boundedSupports.supports.forEach(support => {
        if(distance(center.lat, center.lon, support.lat, support.lon, "K") <= radius) {
            inPermiterSupports.push(support);
        }
    });

    /*******************************************************/
    /*******************************************************/
    /* Need to find better way to not overload IGN services*/
    /*******************************************************/
    /*******************************************************/
    if(inPermiterSupports.length > 60) {
        /*
        const msg = document.querySelector("#msg");
        msg.innerHTML = "<h2>Plus de 60 ("+inPermiterSupports.length+") relais détectés. Diminuez le rayon de recherche.</h2>";
        */
        alert("Plus de 60 ("+inPermiterSupports.length+") relais détectés. Diminuez le rayon de recherche.");
        inPermiterSupports.length = 0;
    }
    

    return inPermiterSupports;
};

/**
 * Get all supports inside the bounding box surrounding the given circle search
 * area.
 * 
 * I wanted to do most of the work in the front side, so this function return
 * supports in a bounding box and not in the circle search area which is done
 * in getInPerimetertSupports().
 * 
 * @param {*} center 
 * @param {*} radius 
 */
async function getBoundedSupports(center, radius) {
    let url = new URL(BACKEND_ROOT_URL + '/supports/'+center.lat+'/'+center.lon+'/'+radius.toPrecision(3));
    let boundedSupports = await fetch(url); 
    return boundedSupports.json();
};

/**
 * Determine wether antennas in the support are "à vue" from the installation
 * point.
 * 
 * @param {*} relay 
 * @param {lat, lon} installationLocationPos 
 */
async function setAntennasVisibility(support, installationLocationPos) {
    let elevationLine = await getElevationLine(support, installationLocationPos);
    
    // Set for each antenna if it is "à vue" or not
    let antennas = support.antennes;
    // By default we consider the support to be not visible. 
    // If one of the antennas is visible the isVisible function will set the
    // support visible.
    support.isVisible = 0;
    antennas.forEach(antenna => isVisible(support, antenna, installationLocationPos, elevationLine));
};

/**
 * Set the visibility of the given antenna.
 * 
 * @param {*} support 
 * @param {*} antenna 
 * @param {*} installationLocationPos 
 * @param {*} elevationLine 
 */
function isVisible(support, antenna, installationLocationPos, elevationLine) {
    const elevationPointsCount = elevationLine.elevations.length;
    const antennaElevation = elevationLine.elevations[0].z + antenna.haut;
    const installationElevation = elevationLine.elevations[elevationPointsCount - 1].z + installationLocationPos.haut;

    const supportDistance = distance(support.lat, support.lon, installationLocationPos.lat, installationLocationPos.lon, "K")*1000;
    
    // Compute the wave path from the antenna on the support to the antenna at
    // the installation location.
    let m = (installationElevation - antennaElevation)/(supportDistance);
    let p = antennaElevation;

    // Add the elevation line serie (for chart purpose) to the support if it
    // not already exists. 
    if(!support.hasOwnProperty("elevationLineSerie")) {
        support.elevationLineSerie = createElevationLineSerie(elevationLine);
    }
    
    // build the wave path serie of the current antenna and check if it cross
    // elevation line.
    // If it cross the elevation line this means the antenna is not visible from
    // the installation location height.
    const elevationLineSerie = support.elevationLineSerie;
    let lineSerie = [];
    for( let x = 0 ; x < elevationPointsCount ; x++) {
        const elevation = elevationLineSerie[x].y;
        const elevationPointDistanceToRelay = elevationLineSerie[x].x;

        const yWave = m*elevationPointDistanceToRelay + p;
        
        lineSerie.push({x: elevationPointDistanceToRelay, y: yWave});

        // If elevation line and wave path crossed each other then the antenna
        // is masked by the elevation and is not visible from the installation
        // location.
        if(elevation > yWave) {
            antenna.isVisible = 0;
        }
    }

    // The support is visible is at least one of his antennas is visible.
    if(antenna.isVisible) {
        support.isVisible = 1;
    }

    antenna.lineSerie = lineSerie;
};

/**
 * Create the line serie for chartist.
 * 
 * @param {*} elevationLine Elevation line returned by IGN services.
 */
function createElevationLineSerie(elevationLine) {
    const elevationPointsCount = elevationLine.elevations.length;

    // Coordinates of the support are also in the first entry of the elevation
    // line data.
    const supportLat = elevationLine.elevations[0].lat;
    const supportLon = elevationLine.elevations[0].lon;

    let elevationLineSerie = [];
    let lat, lon, elevation;
    for( let x = 0 ; x < elevationPointsCount ; x++) {
        lat = elevationLine.elevations[x].lat;
        lon = elevationLine.elevations[x].lon;
        elevation = elevationLine.elevations[x].z;

        // Get the distance between the support location and the current point
        // in the elevation line. Note that as x increment we are closer to the
        // installation location.
        const elevationPointDistanceToSupport = Math.trunc(distance(lat, lon, supportLat, supportLon, "K")*1000);
        
        elevationLineSerie.push({x: elevationPointDistanceToSupport, y: elevation});
    }

    return elevationLineSerie
};

/**
 * Add the marker of the support on the map.
 * 
 * @param {*} support 
 */
function displayRelay(support) {
    let visibleOperators = new Set();
    let maskedOperators = new Set();
    for( let ant of support.antennes) {
        if(ant.isVisible == 1) {
            for( let aer of ant.aer_ids) {
                for( let op of aer.operators) {
                    visibleOperators.add(op);
                    if(maskedOperators.has(op)) {
                        maskedOperators.delete(op);
                    }
                }
                drawAzimut(support, aer.azimut, visibleOperators);
            }
        } else {
            for( let aer of ant.aer_ids) {
                for( let op of aer.operators) {
                    if(!visibleOperators.has(op)) {
                        maskedOperators.add(op);
                    }
                }
            }
        }
    }
   
    // Create the marker with all visible operator corresponding icon
    // By default we assume the support is not visible
    let m = L.marker([support.lat, support.lon], {icon: SupportMarker.NOT_VISIBLE});
    if(support.isVisible) {
        const sortedOperators = [...visibleOperators].sort();
        m = L.marker([support.lat, support.lon], {icon: SupportMarker.getIcon(sortedOperators)});
    }
    relayMarkers.push(m);

    // Create a table displaying all operators on the support with green for
    // visible operators, grey for not "à vue" operators.
    var availableOperators = '<center><table>';
    for( let op of ["BOUYGUES TELECOM", "FREE MOBILE", "ORANGE", "SFR"]) {
        if(visibleOperators.has(op)) {
            availableOperators += '<tr><td class="operatorName"><b>'+op+'</b></td><td class="visibleOperator"></td></tr>'
        } else if (maskedOperators.has(op)) {
            availableOperators += '<tr><td class="operatorName"><b>'+op+'</b></td><td class="maskedOperator"></td></tr>'
        }
    }
    availableOperators += '</table></center>';

    // Compute the bearing between the installation location and the support to
    // help user bearing its antenna to the good direction.
    var home = turf.point([installationPoint.lon, installationPoint.lat]);
    var ant = turf.point([support.lon, support.lat]);
    var bearing = turf.bearing(home, ant);

    // Build the popup with all this stuff
    m.bindPopup('<div><b>Support : </b>' + support.supId + '</div>'
                +'<div><b>Coordonnées : </b>' + support.lat.toFixed(6) + ', ' + support.lon.toFixed(6) + '</div>'
                + '<div><b>Angle de visée géographique : </b>' + bearing.toFixed(2) + '°</div>'
                + '<div><p><b> Opérateurs "à vue" :</b></p>'
                + availableOperators
                + '<br/></div>'
                +'<div class="ct-chart ct-major-twelfth" id="chart'+support.supId+'"></div>', {minWidth: 350});
                
    // Build the chart only when popup raise, else the chart is not built (DOM exists only on popupopen)
    m.on('popupopen', function (){
        buildChart(support);
    });

    m.addTo(map);
}

function buildChart(support) {
    const tickMax = support.elevationLineSerie[support.elevationLineSerie.length-1].x;

    let highestAntenna = support.antennes[0];
    for(let antenna of support.antennes) {
        if(antenna.haut > highestAntenna.haut) {
            highestAntenna = antenna;
        }
    }

    const data = {
        series: [{
            name: 'altimetricProfile',
            data: support.elevationLineSerie
        }, {
            name: 'waveDirection',
            data: highestAntenna.lineSerie
        }
    ]};

    const options = {
        width: 350,
        height: 140,
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
            showGrid: true,
        },
        series:{
            'altimetricProfile': {showArea: true}
        }
    };
    // Create a new line chart object where as first parameter we pass in a selector
    // that is resolving to our chart container element. The Second parameter
    // is the actual data object.
    new Chartist.Line('#chart'+support.supId, data, options);
}

function drawAzimut(relay, azimut, visibleOperators) {
    // azimut is negative if the antenna is omnidirectional. No drawing expected in that case.
    if(azimut >= 0) {
        //turf bearing interval is -180/180 from north. But data from anfr is 0/360 from north.
        // Here we convert it.
        let bearing = azimut;
        if(azimut > 180) {
            bearing = -360 + azimut;
        }

        let ops = visibleOperators.entries();
        const nbOP = visibleOperators.size;
        const stepDistance = 1.0/nbOP;
        let previousOrigin = [relay.lon, relay.lat];
        for(let i = 0 ; i < nbOP ; i++) {
            const dest = turf.rhumbDestination(previousOrigin, stepDistance, bearing, {units: 'kilometers'});
            const d = turf.getCoord(dest);

            // In turfjs coodinates are [Lon, Lat] but in leaflets they are [Lat, Lon]
            const latlngs = [
                [previousOrigin[1], previousOrigin[0]],
                [d[1], d[0]]
            ];

            let op = ops.next().value[1];
            let color = {color: 'black'};
            if("BOUYGUES TELECOM".localeCompare(op) == 0) {
                color = {color: 'blue'};
            } else if("FREE MOBILE".localeCompare(op) == 0) {
                color = {color: 'white'};
            } else if("ORANGE".localeCompare(op) == 0) {
                color = {color: 'orange'};
            } else if("SFR".localeCompare(op) == 0) {
                color = {color: 'red'};
            } 
            
            const polyline = L.polyline(latlngs, color).addTo(map);
            azimuts.push(polyline);

            previousOrigin = d;
        }
    }
}


/**
 * 
 * @param {*} relay 
 * @param {*} antennaPos 
 */
async function getElevationLine(relay, antennaPos) {
    
    var url = new URL(elevationLineServiceURL);

    var lats = relay.lat + '|' + antennaPos.lat;
    var longs = relay.lon + '|' + antennaPos.lon;

    // Take 1 point each 10m.
    // If support farther than 2000m take 200 points.
    // (yes, that means take 1 point each 10m with a max of 200 points)
    // It's just to not overload IGN servers. Notice that in the worst case of 
    // a radius of 10 km we have 1 point each 50 m which is acurately enough
    // for our purpose.
    var d = distance(relay.lat, relay.lon, antennaPos.lat, antennaPos.lon, "K");
    
    // service specifies sampling min value must be at least 2.
    var sampling = Math.max(2, Math.round(d * 1000 / 10));
    // But it specifies also a max. Moreover, for our case we want this max to be 200.
    sampling = Math.min(sampling, MAX_SAMPLING);

    var params = {lat: lats, lon: longs, zonly: true, sampling: sampling};

    url.search = new URLSearchParams(params).toString();

    var res = await fetch(url); 
    
    return res.json();
}
