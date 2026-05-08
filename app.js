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
// CENTER OF MAP
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
// ============================================
// OPENSTREETMAP TILE LAYER
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
// USER LOCATION
// ============================================
//

let userMarker = null;

let accuracyCircle = null;

let userLatLng = null;

//
// ============================================
// ROUTING
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
    // IGNORE IF OUTSIDE CAMPUS
    //

    if (!campusBounds.contains(userLatLng)) {

        console.log(
            "User outside campus boundary"
        );

        return;
    }

    //
    // FIRST TIME
    //

    if (!userMarker) {

        //
        // BLUE LOCATION DOT
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
        // ACCURACY CIRCLE
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

    } else {

        //
        // UPDATE POSITION
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
// CLICK TO CREATE DESTINATION
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
        // CHECK BOUNDARY
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
        // CREATE WALKING ROUTE
        //

        routingControl =
            L.Routing.control({

                waypoints: [

                    userLatLng,

                    destination
                ],

                router:
                    L.Routing.osrmv1({

                    serviceUrl:
                        'https://router.project-osrm.org/route/v1'
                }),

                lineOptions: {

                    styles: [
                        {
                            color: '#007bff',

                            weight: 6
                        }
                    ]
                },

                routeWhileDragging: false,

                addWaypoints: false,

                draggableWaypoints: false,

                fitSelectedRoutes: true,

                show: true

            }).addTo(map);
    }
);

//
// ============================================
// FORCE MAP TO STAY IN BOUNDS
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