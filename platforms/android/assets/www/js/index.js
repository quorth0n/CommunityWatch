"use strict";
//  GLOBALS
var map;
var id;
function getKeyByValue( value , arr) {
    for( var prop in arr ) {
        if( arr.hasOwnProperty( prop ) ) {
             if( arr[ prop ] === value )
                 return prop;
        }
    }
}

//  FIREBASE
var config = {
    apiKey: "AIzaSyCylLXMYR4RFGw1BUnD85nVsWWNEptV0vA",
    authDomain: "hshacks-c52a2.firebaseapp.com",
    databaseURL: "https://hshacks-c52a2.firebaseio.com",
    storageBucket: "hshacks-c52a2.appspot.com",
    messagingSenderId: "251017624352"
};
firebase.initializeApp(config);
var db = firebase.database();
var sr = firebase.storage().ref();

//  FUNCTIONS
var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    onDeviceReady: function() {
        L.mapbox.accessToken = 'pk.eyJ1Ijoid2hpcmlzaCIsImEiOiJjaXVrcDJpemMwMDB0MnRtMWU4ZXpsaGVwIn0.KKh6diU1GaNmcQPaYDCyfQ';
        map = L.mapbox.map('map', 'mapbox.streets', {
            dragging: true,
            touchZoom: true,
            tap: true,
        });

        app.loadMarkers();

        navigator.geolocation.getCurrentPosition(function (p) {
            map.setView([p.coords.latitude, p.coords.longitude], 13);
        }, function (e) {
            map.setView([37.548608, -122.059116], 13);
        }, {timeout: 750});

    },
    loadMarkers: function() {
        db.ref('alerts').on('value', function (snap) {
            var s = snap.val();
            for (var i = 0; i < Object.keys(s).length; i++) {
                var props = s[Object.keys(s)[i]];
                var msg = "";
                for (var ii = 0; ii < Object.keys(props).length; ii++) {
                    switch (Object.keys(props)[ii]) {
                        case 'ts':
                            msg = msg + "Created: " + new Date(props[Object.keys(props)[ii]]).toDateString() + "<br>";
                            break;
                        case 'name':
                            msg = msg + "Creator: " + props[Object.keys(props)[ii]] + "<br>";
                            break;
                    }
                }
                msg = msg + "<a href='javascript:void(0);' class='img-open' id='img-" + getKeyByValue(props, s) + "'>View Image</a>";
                var symbol;
                switch (props.type) {
                    case 'vandalism':
                        symbol = 'https://image.flaticon.com/icons/png/128/136/136801.png';
                        break;
                    case 'pothole':
                        symbol = 'https://cdn0.iconfinder.com/data/icons/miscellaneous-25/64/traffic-cone-128.png';
                        break;
                    case 'street light out':
                        symbol = 'https://cdn4.iconfinder.com/data/icons/electronics-bold-line-2/48/70-128.png';
                        break;
                    case 'damaged sign':
                        symbol = 'https://cdn0.iconfinder.com/data/icons/street-signs/48/Ryan-04-128.png';
                        break;
                    default:
                        symbol = 'https://cdn1.iconfinder.com/data/icons/material-core/20/check-circle-outline-blank-128.png';
                }
                var myLayer = L.mapbox.featureLayer().addTo(map);
                var geojson = [{
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [props.location[1], props.location[0]]
                    },
                    properties: {
                        'title': props.type,
                        'description': msg,
                        'marker-color': '#d33c3c',
                        'marker-size': 'large',
                        icon: {
                            iconUrl: symbol,
                            iconSize: [128, 128], // size of the icon
                            iconAnchor: [64, 64], // point of the icon which will correspond to marker's location
                            popupAnchor: [0, -25], // point from which the popup should open relative to the iconAnchor
                            className: 'dot',
                        }
                    }
                }];
                myLayer.on('layeradd', function(e) {
                  var marker = e.layer,
                    feature = marker.feature;
                  marker.setIcon(L.icon(feature.properties.icon));
                });
                myLayer.setGeoJSON(geojson);
                //var l = L.mapbox.featureLayer().setGeoJSON(geojson).addTo(map).on('popupopen', app.open);
            }
        });
    },
    pic: function () {
        var options =   {   quality: 50,
            destinationType: Camera.DestinationType.DATA_URL,
            sourceType: 1,      // 0:Photo Library, 1=Camera, 2=Saved Album
            encodingType: 1,     // 0=JPG 1=PNG
            allowEdit: false
        };
        navigator.camera.getPicture(
            function(imgData) {
                $('#mymodal-body').prepend('<h3>Working...</h3>');
                $('#finish_report').prop('disabled', true);
                var ctx = document.getElementById("c").getContext("2d");
                var image = new Image();
                image.onload = function() {
                    ctx.drawImage(image, 0, 0, 1224, 1632);
                };
                image.src = "data:image/png;base64,"+imgData;
                id = Math.floor(Math.random()*900000)+100000;
                sr.child(id + '.png').putString("data:image/png;base64,"+imgData, 'data_url').then(function (snap) {
                    console.log('uploaded');
                    app.report();
                });
            },
            function(err) {
                alert('Error taking picture', 'Error');
            },
        options);
    },
    open: function () {
        $('a').click(function () {
            var this_id = ($(this).prop('id')).split('-')[1];
            sr.child(this_id + '.png').getDownloadURL().then(function (url) {
                $('#img-open').prop('src', url);
                $('#imgModal').modal('show');
            }).catch(function(error) {
              console.log(error);
            });
        });
    },
    report: function() {
        var type_out;
        if ($('.rep_type').val() == 'o') {
            type_out = $('.other_txt').val();
        } else {
            type_out = $(".rep_type option:selected").text();
        }
        navigator.geolocation.getCurrentPosition(function (p) {
            var c = geolib.findNearest({latitude: p.coords.latitude, longitude: p.coords.longitude}, points, 0);
            map.setView([c.latitude, c.longitude], 15);
            db.ref('alerts').child().set({
                name: $('#rep_name').val(),
                type: type_out,
                ts: new Date().getTime(),
                location: [c.latitude, c.longitude]
            });
            $('#myModal').modal('hide');
            swal('Reported', '', 'success');
        }, function (e) {
            console.log('Error while retrieving location:');
            console.log(e);
            map.setView([37.548608, -122.059116], 15);
            db.ref('alerts').child(id).set({
                name: $('#rep_name').val(),
                type: type_out,
                ts: new Date().getTime(),
                location: [37.548608, -122.059116]
            });
            swal('Reported', '', 'success');
        }, {timeout: 750});
    }
};
app.initialize();

//  EVENTS
$('#finish_report').click(app.pic);
$('.rep_type').change(function () {
    if ($(this).val() == 'o') {
        $('.other').prop('style', '');
    } else {
        $('.other').prop('style', 'display:none;');
    }
});
