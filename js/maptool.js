/**
 * 作成日：2019/01/18
 * 作成者：kuruse
 * 
 */
var MAPTOOL = MAPTOOL || {};

MAPTOOL.module = (function() {
    "use strict";
    var myMap,
        paleMap,
        reliefMap,
        slopeMap,
        tileUrl = 'https://cyberjapandata.gsi.go.jp',
        mapLays,
        mapOvers,
        overLays,
        color = ["blue", "red", "orange", "green"],
        rideLays = [],
        customLays = [],
        pcLay = null,
        bsize,
        imgList = {
            menu    : {
                on  : './images/menu_on.png',
                off : './images/menu_off.png'
            },
            pc      : {
                on  : './images/pc_on.png',
                off : './images/pc_off.png'
            },
            gps     : {
                on  : './images/gps_on.png',
                off : './images/gps_off.png'
            }
        },
        // documents
        doc,
        miDoc,
        miimgDoc,
        mcDoc,
        mcDocLen,
        m1Doc,
        m1imgDoc,
        m2Doc,
        m2imgDoc,
        // functions
        init,
        addOverLay,
        geojson_style,
        popup_properties,
        getGeoLayer,
        getPcLayer,
        delPcLayer,
        changeDisp,
        changeMenu,
        changePcPoint,
        resizeBottom,
        setDocuments,
        setEvent;

    init = function() {
        myMap = L.map('map');
        paleMap = L.tileLayer(tileUrl +
            '/xyz/pale/{z}/{x}/{y}.png', {
            attribution: 
                "<a href='http://maps.gsi.go.jp/development/" +
                "ichiran.html' target='_blank'>地理院タイル</a>"
        });
        reliefMap = L.tileLayer(tileUrl +
            '/xyz/relief/{z}/{x}/{y}.png', {
            opacity:'0.5'
        });
        slopeMap = L.tileLayer(tileUrl +
            '/xyz/slopemap/{z}/{x}/{y}.png', {
            opacity:'0.4'
        });
        mapLays = {
            "淡色地図" : paleMap
        }
        mapOvers = {
  	        "色別標高図" : reliefMap,
	        "傾斜量図" : slopeMap
        }

        L.control.layers(
                mapLays,
                mapOvers,
                {collapsed: false}
            ).addTo(myMap);

        addOverLay();
        L.control.layers(null,
                overLays,
                {collapsed: false}
            ).addTo(myMap);
        paleMap.addTo(myMap);
        setDocuments();
        setEvent();

        resizeBottom();
    }

    addOverLay = function() {
        customLays[0] = L.geoJson(null, {
	        style: function(feature) {
	            return { color: color[0] };
            }
        });
        customLays[1] = L.geoJson(null, {
	        style: function(feature) {
	            return { color: color[1] };
            }
        });
        customLays[2] = L.geoJson(null, {
	        style: function(feature) {
	            return { color: color[2] };
            }
        });
        rideLays[0] = omnivore.gpx(
                './data/sr600_kii_1.gpx',
                null,
                customLays[0]
            ).on(
                'ready',
                function() {
	                myMap.fitBounds(rideLays[0].getBounds());
            }).addTo(myMap);
        rideLays[1] = omnivore.gpx(
                './data/sr600_kii_2.gpx',
                null,
                customLays[1]
            ).on(
                'ready',
                function() {
	                myMap.fitBounds(rideLays[1].getBounds());
            }).addTo(myMap);
        rideLays[2] = omnivore.gpx(
                './data/sr600_kii_3.gpx',
                null,
                customLays[2]
            ).on(
                'ready',
                function() {
	                myMap.fitBounds(rideLays[2].getBounds());
            }).addTo(myMap);
        
        overLays = {
            'SR600_紀伊山地の世界遺産(1)':rideLays[0],
            'SR600_紀伊山地の世界遺産(2)':rideLays[1],
            'SR600_紀伊山地の世界遺産(3)':rideLays[2]
        }
    }

    geojson_style = function(prop) {
        var s = {};
        for(name in prop) {
            if(name.match(/^_/) && !name.match(/_markerType/)){
                if( prop['_markerType']=='Circle' && name =='_radius'){continue;}
                s[name.substr(1)]=prop[name];
            }
        }
        return s;
    }

    popup_properties = function(prop) {
        var s = '';
        for(name in prop) {
            if(!name.match(/^_/)){
                s += name + "：" + prop[name] + "<br>";
            }
        }
        return s;
    }

    // スタイルつき GeoJSON読み込み
    // 「./sample1.geojson」の部分を適宜変更してください。
    // (国土地理院サンプルを微改修)
    getGeoLayer = function(jsonFile) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', jsonFile, false);
        xhr.send(null);
        var sampledata = JSON.parse(xhr.responseText);
        
        var sampleLayer = L.geoJson(sampledata, {
            pointToLayer: function (feature, latlng) {
                var s = geojson_style(feature.properties);
                if(feature.properties['_markerType']=='Icon'){
                    var myIcon = L.icon(s);
                    return L.marker(latlng, {icon: myIcon});
                }
                if(feature.properties['_markerType']=='DivIcon'){
                    var myIcon = L.divIcon(s);
                    return L.marker(latlng, {icon: myIcon});
                }
                if(feature.properties['_markerType']=='Circle'){
                    return L.circle(latlng,feature.properties['_radius'],s);
                }
                if(feature.properties['_markerType']=='CircleMarker'){
                    return L.circleMarker(latlng,s);
                }
            },
            style: function (feature) {
                if(!feature.properties['_markerType']){
                    var s = geojson_style(feature.properties);
                    return s;
                }
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(popup_properties(feature.properties));
            }
        });
        return sampleLayer;
    }

    getPcLayer = function() {
        var pcJsonPath = './data/pcPoint.json';

        pcLay = getGeoLayer(pcJsonPath);
        pcLay.addTo(myMap);
    }

    delPcLayer = function() {
        if (pcLay !== null) {
            pcLay.remove();
            pcLay = null;
        }
    }

    changeDisp = function(obj) {
        var dispState = obj.style.display;

        if (dispState === 'none') {
            obj.style.display = 'inline';
        } else {
            obj.style.display = 'none';
        }
    }   

    changeMenu = function() {
        changeDisp(m1Doc);
        changeDisp(m2Doc);
        var dispState = m1Doc.style.display;
        if (dispState === 'none') {
            miDoc.style.borderColor = '#3aabd2';
            miimgDoc.src = imgList.menu.off;
        } else {
            miDoc.style.borderColor = '#df5656';
            miimgDoc.src = imgList.menu.on;
        }
    }

    changePcPoint = function() {
        if (pcLay === null) {
            getPcLayer();
            m1Doc.style.borderColor = '#df5656';
            m1imgDoc.src = imgList.pc.on;
        } else {
            delPcLayer();
            m1Doc.style.borderColor = '#3aabd2';
            m1imgDoc.src = imgList.pc.off;
        }
    }

    resizeBottom = function() {
        var dispWidth = window.innerWidth,
            dispHeight = window.innerHeight;

        if (dispWidth <= dispHeight) {
            bsize = dispWidth / 10;
        } else {
            bsize = dispHeight / 10;
        }

        for (var i=0; i<mcDocLen; i++) {
            mcDoc[i].style.width = bsize + 'px';
            mcDoc[i].style.height = bsize + 'px';
        }

        m1Doc.style.bottom = (bsize * 2 + 10 * 2 + 10) + 'px';
        m2Doc.style.bottom = (bsize * 1 + 10 * 1 + 10) + 'px';
    }

    setDocuments = function() {
        doc = document;
        miDoc = document.getElementById('menu_icon');
        miimgDoc = document.getElementById('menu_img');
        mcDoc = document.getElementsByClassName('melem_size');
        mcDocLen = mcDoc.length;
        m1Doc = document.getElementById('m1');
        m1imgDoc = document.getElementById('m1_img');
        m2Doc = document.getElementById('m2');
        m2imgDoc = document.getElementById('m2_img');
    }

    setEvent = function() {
        miDoc.addEventListener("click", changeMenu);
        m1Doc.addEventListener("click", changePcPoint);
    }

    window.addEventListener("load", init);
})();

