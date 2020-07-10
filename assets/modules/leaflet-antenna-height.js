L.Control.AntennaHeight = L.Control.extend({
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'mapControl');
        var label = L.DomUtil.create('label', '', container);
        label.for = 'hauteur';
        label.innerHTML = '<center><b>Hauteur d\'installation de l\'antenne<br/> en mètre.</b></center>';
        var height = L.DomUtil.create('input', '', container);
        height.type = 'number';
        height.id = 'hauteur';
        height.value = 10;
       

      
        L.DomEvent.on(height, 'mousedown mouseup click touchstart dblclick', L.DomEvent.stopPropagation);
        //div.innerHTML = '<input id="rayon" type="range" min="500" max="30000" step="500" />'
       // L.DomEvent.on(document.getElementById('rayon'), 'change', function(e) {
        //    console.log('toto')
        //});
        return container;
    },

    onRemove: function(map) {
        L.DomEvent.off(height, 'mousedown mouseup click touchstart dblclick', L.DomEvent.stopPropagation);
        //L.DomEvent.off(document.getElementById('rayon'), 'change', function(e) {
          //  console.log('toto')
        //});
    },

    getHeight: function() {
        return parseInt(document.querySelector("#hauteur").value);
    }
});

L.control.antennaHeight = function(opts) {
    return new L.Control.AntennaHeight(opts);
};

const leafletAntennaHeight = L.control.antennaHeight;

export {leafletAntennaHeight};