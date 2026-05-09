//
// ============================================
// CAMPUS BOUNDS
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
// MAP INIT
// ============================================
//

const map = L.map('map', {

    center: [
        (southWest.lat + northEast.lat) / 2,
        (southWest.lng + northEast.lng) / 2
    ],

    zoom: 17,

    minZoom: 16,
    maxZoom: 18,

    maxBounds: campusBounds,
    maxBoundsViscosity: 1.0
});

map.attributionControl.setPrefix(false);

//
// ============================================
// OSM BASE LAYER
// ============================================
//

L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);

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
// ROUTING STATE
// ============================================
//

let routingControl = null;
let destinationMarker = null;

//
// ============================================
// LIVE GPS
// ============================================
//

function updateUserLocation(lat, lng, accuracy) {

    userLatLng = L.latLng(lat, lng);

    if (!campusBounds.contains(userLatLng)) return;

    if (!userMarker) {

        userMarker = L.circleMarker(userLatLng, {
            radius: 10,
            fillColor: "#007bff",
            color: "#fff",
            weight: 3,
            fillOpacity: 1
        }).addTo(map);

        accuracyCircle = L.circle(userLatLng, {
            radius: accuracy,
            color: "#007bff",
            fillOpacity: 0.15
        }).addTo(map);

        map.setView(userLatLng, 18);

    } else {

        userMarker.setLatLng(userLatLng);
        accuracyCircle.setLatLng(userLatLng);
        accuracyCircle.setRadius(accuracy);
    }
}

if (navigator.geolocation) {

    navigator.geolocation.watchPosition(

        (pos) => {

            updateUserLocation(
                pos.coords.latitude,
                pos.coords.longitude,
                pos.coords.accuracy
            );
        },

        (err) => console.log(err),

        {
            enableHighAccuracy: true,
            maximumAge: 1000
        }
    );
}

//
// ============================================
// LOAD BUILDINGS (OSM GEOJSON)
// ============================================
//

fetch('data/buildings.geojson')

.then(res => res.json())

.then(data => {

    const buildingsLayer = L.geoJSON(data, {

        style: () => ({
            color: '#007bff',
            weight: 2,
            fillColor: '#007bff',
            fillOpacity: 0.2
        }),

        onEachFeature: function(feature, layer) {

            const name =
                feature?.properties?.name || "Building";

            const pageUrl =
                "pages/default.html";

            //
            // CLICK EVENT (IMPORTANT FIX)
            //
            layer.on('click', function(e) {

                const lat = e.latlng.lat;
                const lng = e.latlng.lng;

                layer.bindPopup(
                    `
                    <div style="text-align:center; min-width:180px;">

                        <h3>${name}</h3>

                        <button
                            onclick="window.location.href='${pageUrl}'"
                            style="
                                width:100%;
                                margin-bottom:10px;
                                padding:10px;
                                border:none;
                                border-radius:8px;
                                background:#007bff;
                                color:white;
                            "
                        >
                            Open Building
                        </button>

                        <button
                            onclick="routeToBuilding(${lat}, ${lng}, '${name}')"
                            style="
                                width:100%;
                                padding:10px;
                                border:none;
                                border-radius:8px;
                                background:#28a745;
                                color:white;
                            "
                        >
                            Directions
                        </button>

                    </div>
                    `
                );

                layer.openPopup(e.latlng);
            });
        }

    }).addTo(map);
});

//
// ============================================
// ROUTING FUNCTION (FIXED)
// ============================================
//

function routeToBuilding(lat, lng, name) {

    if (!userLatLng) {
        alert("Waiting for GPS location...");
        return;
    }

    const destination = L.latLng(lat, lng);

    if (destinationMarker) {
        map.removeLayer(destinationMarker);
    }

    destinationMarker = L.marker(destination)
        .addTo(map)
        .bindPopup(name)
        .openPopup();

    if (routingControl) {
        map.removeControl(routingControl);
    }

    routingControl = L.Routing.control({

        waypoints: [
            userLatLng,
            destination
        ],

        router: L.Routing.osrmv1({

            serviceUrl:
                'https://routing.openstreetmap.de/routed-foot/route/v1',

            profile: 'driving'
        }),

        lineOptions: {
            styles: [{
                color: '#007bff',
                weight: 6,
                opacity: 0.9
            }]
        },

        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        show: false,

        createMarker: () => null

    }).addTo(map);

    map.closePopup();
}

//
// ============================================
// BOUNDARY LOCK
// ============================================
//

map.on('drag', function() {

    map.panInsideBounds(campusBounds, {
        animate: false
    });
});
