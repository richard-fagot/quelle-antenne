const LeafIcon = L.Icon.extend({
    options: {
        shadowUrl: '/assets/img/marker-shadow.png',
        iconAnchor:   [12, 41],
    }
});

class SupportMarker {
    // Relay icon definitions

    // Marker for realays that are not visibles due to the elevations between this
    // relay and the antenna installation location, it is not "à vue".
    static NOT_VISIBLE =  new LeafIcon({iconUrl: '/assets/img/bad-relay.png'});

    // All support markers combinations showing which operator is on the support
    // pointed by the marker.
    //
    // O : stands for ORANGE
    // B : stands for BOUYGUES TELECOM
    // F : stands for FREE
    // S : stands for SFR
    static O    = new LeafIcon({iconUrl: '/assets/img/marker-o.png',   });
    static B    = new LeafIcon({iconUrl: '/assets/img/marker-b.png',   });
    static BO   = new LeafIcon({iconUrl: '/assets/img/marker-bo.png',  });
    static F    = new LeafIcon({iconUrl: '/assets/img/marker-f.png',   });
    static FO   = new LeafIcon({iconUrl: '/assets/img/marker-fo.png',  });
    static BF   = new LeafIcon({iconUrl: '/assets/img/marker-fb.png',  });
    static BFO  = new LeafIcon({iconUrl: '/assets/img/marker-fbo.png', });
    static S    = new LeafIcon({iconUrl: '/assets/img/marker-s.png',   });
    static OS   = new LeafIcon({iconUrl: '/assets/img/marker-so.png',  });
    static BS   = new LeafIcon({iconUrl: '/assets/img/marker-sb.png',  });
    static BOS  = new LeafIcon({iconUrl: '/assets/img/marker-sbo.png', });
    static FS   = new LeafIcon({iconUrl: '/assets/img/marker-sf.png',  });
    static FOS  = new LeafIcon({iconUrl: '/assets/img/marker-sfo.png', });
    static BFS  = new LeafIcon({iconUrl: '/assets/img/marker-sfb.png', });
    static BFOS = new LeafIcon({iconUrl: '/assets/img/marker-sfbo.png',});

    static getIcon(sortedOperatorList) {
        let opMarkerString = "";
        for( let op of sortedOperatorList) {
            if("BOUYGUES TELECOM".localeCompare(op) == 0) {
                opMarkerString += 'B';
            } else if("FREE MOBILE".localeCompare(op) == 0) {
                opMarkerString += 'F';
            } else if("ORANGE".localeCompare(op) == 0) {
                opMarkerString += 'O';
            } else if("SFR".localeCompare(op) == 0) {
                opMarkerString += 'S';
            } 
        }

        return eval('SupportMarker.'+opMarkerString);
    };
};

export {SupportMarker};

