L.Control.Help = L.Control.extend({
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-bar');
        var help = L.DomUtil.create('a', '', container);
        help.id = 'help';
        help.setAttribute('role', 'button');
        help.href = '#';
        help.title = 'Aide';
        help.innerHTML = '?';

        L.DomEvent.on(container, 'mousedown mouseup click touchstart', L.DomEvent.stopPropagation);
        L.DomEvent.on(help, 'click', function (e) {
            var usage = document.getElementById('usage');
            var isVisible =  usage.style.visibility == 'visible'
            if(isVisible) {
                usage.style.visibility = 'hidden';
            } else {
                usage.style.visibility = 'visible';
            }
        });

        return container;
    },

    onRemove: function(map) {
        L.DomEvent.off(container, 'mousedown mouseup click touchstart', L.DomEvent.stopPropagation);
    }
});

L.control.help = function(opts) {
    return new L.Control.Help(opts);
};

const leafletHelp = L.control.help;

export {leafletHelp};