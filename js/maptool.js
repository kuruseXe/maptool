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
        doc,
        miDoc,
        mDoc,
        m1Doc;

    function init() {
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
        myMap.setView([35.36, 138.73], 5);

        setDocuments();
        setEvent();
    }

    function addOverLay() {
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

    function geojson_style(prop) {
        var s = {};
        for(name in prop) {
            if(name.match(/^_/) && !name.match(/_markerType/)){
                if( prop['_markerType']=='Circle' && name =='_radius'){continue;}
                s[name.substr(1)]=prop[name];
            }
        }
        return s;
    }

    function popup_properties(prop) {
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
    function getGeoLayer(jsonFile) {
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

    function getPcLayer() {
        var pcJsonPath = './data/pcPoint.json';

        pcLay = getGeoLayer(pcJsonPath);
        pcLay.addTo(myMap);
    }

    function delPcLayer() {
        if (pcLay !== null) {
            pcLay.remove();
            pcLay = null;
        }
    }

    function changeDisp(obj) {
        var dispState = obj.style.display;

        if (dispState === 'none') {
            obj.style.display = 'block';
        } else {
            obj.style.display = 'none';
        }
    }   

    function changeMenu() {
        changeDisp(mDoc);
        var dispState = mDoc.style.display;
        if (dispState === 'none') {
            miDoc.style.backgroundColor = 'white';
        } else {
            miDoc.style.backgroundColor = 'lightsteelblue';
        }
    }

    function changePcPoint() {
        if (pcLay === null) {
            getPcLayer();
            m1Doc.style.backgroundColor = 'lightsteelblue';
        } else {
            delPcLayer();
            m1Doc.style.backgroundColor = 'white';
        }
    }

    function setDocuments() {
        doc = document;
        miDoc = document.getElementById('menu_icon'),
        mDoc = document.getElementById('menu');
        m1Doc = document.getElementById('m1');
    }

    function setEvent() {
        miDoc.addEventListener("click", changeMenu);
        m1Doc.addEventListener("click", changePcPoint);
    }

    window.addEventListener("load", init);
})();

