L.Control.SearchRadius = L.Control.extend({
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'mapControl');
        var label = L.DomUtil.create('label', '', container);
        label.for = 'rayon';
        label.innerHTML = '<b>Rayon de recherche</b>';
        var slider = L.DomUtil.create('input', '', container);
        slider.type = 'range';
        slider.id = 'rayon';
        slider.min = 500;
        // radius max of the search area. arbitrary number. Probably needs to be improved.
        slider.max = 30000;
        slider.step = 500;

        var bubble = L.DomUtil.create('div', '', container);
        bubble.id = 'bubble';

        L.DomEvent.on(slider, 'mousedown mouseup click touchstart', L.DomEvent.stopPropagation);
        //div.innerHTML = '<input id="rayon" type="range" min="500" max="30000" step="500" />'
       // L.DomEvent.on(document.getElementById('rayon'), 'change', function(e) {
        //    console.log('toto')
        //});
        return container;
    },

    onRemove: function(map) {
        L.DomEvent.off(slider, 'mousedown mouseup click touchstart', L.DomEvent.stopPropagation);
        //L.DomEvent.off(document.getElementById('rayon'), 'change', function(e) {
          //  console.log('toto')
        //});
    }
});

L.control.searchRadius = function(opts) {
    return new L.Control.SearchRadius(opts);
};

const leafletSearchRadius = L.control.searchRadius;

export {leafletSearchRadius};