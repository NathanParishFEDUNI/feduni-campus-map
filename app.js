//
// ============================================
// FEDERATION UNIVERSITY MOUNT HELEN BOUNDARY
// ============================================
//

const southWest = L.latLng(
    -37.63012,
    143.88818
);

const northEast = L.latLng(
    -37.62208,
    143.89760
);

const campusBounds = L.latLngBounds(
    southWest,
    northEast
);

//
// ============================================
// MAP CENTER
// ============================================
//

const centerLat =
    (-37.63012 + -37.62208) / 2;

const centerLng =
    (143.88818 + 143.89760) / 2;

//
// ============================================
// CREATE MAP
// ============================================
//

const map = L.map('map', {

    center: [
        centerLat,
        centerLng
    ],

    zoom: 17,

    minZoom: 16,

    maxZoom: 21,

    maxBounds: campusBounds,

    maxBoundsViscosity: 1.0
});

//
// REMOVE LEAFLET BRANDING
//

map.attributionControl.setPrefix(false);

//
// ============================================
// OPENSTREETMAP TILES
// ============================================
//

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution:
            '&copy; OpenStreetMap contributors'
    }
).addTo(map);

//
// ============================================
// VISUAL BOUNDARY BOX
// ============================================
//

L.rectangle(campusBounds, {

    color: "#007bff",

    weight: 2,

    fill: false

}).addTo(map);

//
// ============================================
// USER LOCATION VARIABLES
// ============================================
//

let userMarker = null;

let accuracyCircle = null;

let userLatLng = null;

//
// ============================================
// ROUTING VARIABLES
// ============================================
//

let routingControl = null;

let destinationMarker = null;

//
// ============================================
// UPDATE USER LOCATION
// ============================================
//

function updateUserLocation(
    latitude,
    longitude,
    accuracy
) {

    userLatLng = L.latLng(
        latitude,
        longitude
    );

    //
    // IGNORE OUTSIDE CAMPUS
    //

    if (!campusBounds.contains(userLatLng)) {

        console.log(
            "User outside campus boundary"
        );

        return;
    }

    //
    // FIRST GPS FIX
    //

    if (!userMarker) {

        //
        // BLUE DOT
        //

        userMarker = L.circleMarker(
            userLatLng,
            {
                radius: 10,

                fillColor: "#007bff",

                color: "#ffffff",

                weight: 3,

                opacity: 1,

                fillOpacity: 1
            }
        ).addTo(map);

        //
        // GPS ACCURACY CIRCLE
        //

        accuracyCircle = L.circle(
            userLatLng,
            {
                radius: accuracy,

                color: "#007bff",

                fillColor: "#007bff",

                fillOpacity: 0.15
            }
        ).addTo(map);

        //
        // CENTER MAP ON USER
        //

        map.setView(
            userLatLng,
            18
        );

    } else {

        //
        // UPDATE USER POSITION
        //

        userMarker.setLatLng(
            userLatLng
        );

        accuracyCircle.setLatLng(
            userLatLng
        );

        accuracyCircle.setRadius(
            accuracy
        );
    }
}

//
// ============================================
// LIVE GPS TRACKING
// ============================================
//

if (navigator.geolocation) {

    navigator.geolocation.watchPosition(

        function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            const accuracy =
                position.coords.accuracy;

            updateUserLocation(
                latitude,
                longitude,
                accuracy
            );
        },

        function(error) {

            console.error(error);

            alert(
                "Location access denied or unavailable."
            );
        },

        {
            enableHighAccuracy: true,

            maximumAge: 1000,

            timeout: 10000
        }
    );

} else {

    alert(
        "Geolocation not supported."
    );
}

//
// ============================================
// CLICK MAP TO CREATE ROUTE
// ============================================
//

map.on(
    'click',
    function(event) {

        //
        // WAIT FOR GPS
        //

        if (!userLatLng) {

            alert(
                "Waiting for GPS location..."
            );

            return;
        }

        //
        // DESTINATION
        //

        const destination =
            event.latlng;

        //
        // CHECK CAMPUS BOUNDARY
        //

        if (
            !campusBounds.contains(
                destination
            )
        ) {

            alert(
                "Destination outside campus boundary."
            );

            return;
        }

        //
        // REMOVE OLD DESTINATION
        //

        if (destinationMarker) {

            map.removeLayer(
                destinationMarker
            );
        }

        //
        // CREATE DESTINATION MARKER
        //

        destinationMarker =
            L.marker(destination)
            .addTo(map)
            .bindPopup(
                "Destination"
            )
            .openPopup();

        //
        // REMOVE OLD ROUTE
        //

        if (routingControl) {

            map.removeControl(
                routingControl
            );
        }

        //
        // CREATE FOOTPATH ROUTE
        //

        routingControl =
            L.Routing.control({

                waypoints: [

                    userLatLng,

                    destination
                ],

                //
                // FOOT ROUTING ENGINE
                //

                router:
                    L.Routing.osrmv1({

                    serviceUrl:
                        'https://routing.openstreetmap.de/routed-foot/route/v1',

                    profile: 'driving'
                }),

                //
                // ROUTE STYLE
                //

                lineOptions: {

                    styles: [
                        {
                            color: '#007bff',

                            weight: 6,

                            opacity: 0.9
                        }
                    ]
                },

                //
                // ROUTING OPTIONS
                //

                routeWhileDragging: false,

                addWaypoints: false,

                draggableWaypoints: false,

                fitSelectedRoutes: true,

                showAlternatives: false,

                collapsible: true,

                show: true,

                createMarker: function() {
                    return null;
                }

            }).addTo(map);
    }
);

//
// ============================================
// KEEP MAP INSIDE BOUNDS
// ============================================
//

map.on(
    'drag',
    function() {

        map.panInsideBounds(
            campusBounds,
            {
                animate: false
            }
        );
    }
);
