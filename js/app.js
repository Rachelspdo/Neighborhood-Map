var map;
var infoWindow;
var bounds;
var clientID = 'KGVZBQ0ZFUCQED5CLE3GBYYANFPGITOWKLHSTVDB5FQATKW1';
var clientSecret = '2F0PWVJ0SFULI3WL5FLFTICRZ40DIOFX425OYTPPGTKHCQJJ';

var locations = [{
    title: 'Seattle Japanese Garden',
    location: {
        lat: 47.628910,
        lng: -122.295725
    }
}, {
    title: 'Leschi Park',
    location: {
        lat: 47.600777,
        lng: -122.288071
    }
}, {
    title: 'Dahlak Eritrean Cuisine',
    location: {
        lat: 47.587617,
        lng: -122.305814
    }
}, {
    title: 'Bubble Tea Fresh Fruit Juice',
    location: {
        lat: 47.598743,
        lng: -122.317613
    }
}, {
    title: 'La Marzocco Cafe',
    location: {
        lat: 47.622964,
        lng: -122.355141
    }
}, {
    title: 'Museum of History & Industry',
    location: {
        lat: 47.627647,
        lng: -122.336570
    }
}, {
    title: 'Judkins Park and Playfield',
    location: {
        lat: 47.594226,
        lng: -122.303752
    }
}, {
    title: 'Marginal Way Skatepark',
    location: {
        lat: 47.575852,
        lng: -122.339229
    }
}];

var styles = [{
    featureType: 'water',
    stylers: [{
        color: '#66B3FF'
    }]
}, {
    featureType: 'administrative',
    elementType: 'labels.text.stroke',
    stylers: [{
        color: '#FFFFFF'
    }, {
        weight: 6
    }]
}, {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{
        color: '#E85113'
    }]
}, {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{
        color: '#EFE9E4'
    }, {
        lightness: -40
    }]
}, {
    featureType: 'transit.station',
    stylers: [{
        weight: 9
    }, {
        hue: '#E85113'
    }]
}, {
    featureType: 'road.highway',
    elementType: 'labels.icon',
    stylers: [{
        visibility: 'off'
    }]
}, {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{
        lightness: 100
    }]
}, {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{
        lightness: -80
    }]
}, {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{
        visibility: 'on'
    }, {
        color: '#F0E4D3'
    }]
}, {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{
        color: '#FFF2E6'
    }, {
        lightness: -25
    }]
}];

// Initialize a map and set center coordinate
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 47.579619,
            lng: -122.308450
        },
        zoom: 13,
        mapTypeControl: false,
        styles: styles
    });
    infoWindow = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();
    ko.applyBindings(new ViewModel());
}

// Location Model
var locationModel = function(data) {
    var self = this;

    this.title = data.title;
    this.position = data.location;
    this.street = '',
    this.city = '',
    this.phone = '';

    // make all markers appear on map
    this.visible = ko.observable(true);

    // Style the markers a bit. This will be our listing marker icon.
    var defaultIcon = makeMarkerIcon('008ae6');
    // Create a "highlighted location" marker color for when the user
    // mouses over the marker.
    var highlightedIcon = makeMarkerIcon('cceeff');

    //JSON request from foursquare data
    var requestURL = 'https://api.foursquare.com/v2/venues/search?ll=' + this.position.lat + ',' + this.position.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.title;

    $.getJSON(requestURL).done(function(data) {
        var results = data.response.venues[0];
        self.street = results.location.formattedAddress[0];
        self.city = results.location.formattedAddress[1];
        self.phone = results.contact.formattedPhone;
    }).fail(function() {
        alert('Something went wrong with foursquare. Please Try Again.');
    });

    // Create a marker for each location
    this.marker = new google.maps.Marker({
        map: map,
        position: this.position,
        title: this.title,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon
    });

    // Whenever user clicks the marker, it will popup infowindow and also bounce
    this.marker.addListener('click', function() {
        populateInfoWindow(this, self.street, self.city, self.phone, infoWindow);
        markerBounce(this);
    });

    // When user hovers over a marker, its' color will be changed
    this.marker.addListener('mouseover', function() {
        this.setIcon(highlightedIcon);
    });
    // When user doesn't hovers over a marker, its' color will be changed to default
    this.marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
    });

    // show location and its info when selected from list
    this.popUp = function(location) {
        google.maps.event.trigger(self.marker, 'click');
    };

};

// VIEWMODEL
var ViewModel = function() {
    var self = this;
    this.listOfLocation = ko.observableArray([]);
    // searchTerm var to hold user input
    this.searchTerm = ko.observable('');

    //create marker for each locations and put all of the locations in one array
    locations.forEach(function(location) {
        self.listOfLocation.push(new locationModel(location));
    });

    //Filter Search for search bar
    //console.log(this.listOfLocation().length);
    this.searchFilter = ko.computed(function() {
        var searchItem = this.searchTerm().toLowerCase();
        if (!searchItem) {
            for (var i = 0; i < this.listOfLocation().length; i++) { // if there is no searchTerm exists, make all locations visible
                this.listOfLocation()[i].visible(true);
            }
            return this.listOfLocation();
        } else {
            return ko.utils.arrayFilter(this.listOfLocation(), function(location) {
                var lowerCaseTitle = location.title.toLowerCase(); // lowerCase the location title
                var finalResult = (lowerCaseTitle.search(searchItem) !== -1); //if search key presents or matchs with location title, make that location visible on map
                location.visible(finalResult);
                return finalResult;
            });
        }
    }, this);

};

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, street, city, phone, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infowindow.setContent('');
        infowindow.marker = marker;

        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;

        var windowContent = '<div class="infowindow">' + '<div>' + '<h4>' + marker.title + '</h4>' + '</div>' + '<br>' +
            '<p>' + street + '<br>' + city + '<br>' + '<br>' + phone + "</p>" + '</div>';

        // In case the status is OK, which means the pano was found, compute the
        // position of the streetview image, then calculate the heading, then get a
        // panorama from that and set the options
        var getStreetView = function(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infowindow.setContent(windowContent + '<div id="pano"></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 20
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infowindow.setContent(windowContent + '<div style="color: red">No Street View Found</div>');
            }
        };
        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the correct marker.
        infowindow.open(map, marker);
    }
}

// Make marker bounce
function markerBounce(marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function() {
            marker.setAnimation(null);
        }, 2000);
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(25, 32),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 32));
    return markerImage;
}

// IN CASE GOOGLE MAP IS NOT LOADED, NOTIFY USERS WITH NOTIFICATION
function googleMapsError() {
    alert("Google Maps cannot be loaded. Please Try Again!");
}
