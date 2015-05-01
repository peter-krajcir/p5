$(function() {
	var customMap = new CustomMap();
});

/* main class where all the logic is*/
var CustomMap = function() {
	"use strict"
	var map,
		// used when the page is first time loaded
		initValues = {
			lat: 48.1430258,
			lng: 17.1244572,
			zoom: 11
		},
		poi,
		// using 1 infoWindow and just changing the location when click event occurs
		infoWindow = new google.maps.InfoWindow();

	// create the map and set the initial values for lat,long and zoom and tell KO to parse the html
	function initialize() {
		var myLatlng = new google.maps.LatLng(initValues.lat,initValues.lng);
		var mapOptions = {
			zoom: initValues.zoom,
			center: myLatlng
		}
		map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		ko.applyBindings(new PointsOfInterestViewModel());
	}

	// function is called when one presses reset button in the list, it sets the map to the initial values
	function resetMap() {
		map.setCenter(new google.maps.LatLng(initValues.lat,initValues.lng));
		map.setZoom(initValues.zoom);
	}

	// function is called when one clicks on specific Point Of Interest, it centers the map and zoom in a little bit
	function locateMapToPoi(poi) {
		map.setCenter(new google.maps.LatLng(poi.lat,poi.lng));
		map.setZoom(14);
	}

	// object with the informatoin about POI
	// I had to include extra information for Wikipedia because some of the places don't match with the wikipedia naming
	function PointOfInterest(name, lat, lng, wiki) {
		var self = this;
		self.name = name;
		self.lat = lat;
		self.lng = lng;
		self.wiki = wiki;
		self.visible = ko.observable(true);
		self.marker = new google.maps.Marker({
			position: new google.maps.LatLng(lat,lng),
			map: map,
			title: name
		});

		// when one clicks on the marker, it loads the data from wikipedia api and displays an extract with the link to the full article
		// if it fails, it shows the error message in the marker
		google.maps.event.addListener(self.marker, 'click', function() {
			$.ajax({
				url: 'http://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&exchars=800&titles='+self.wiki,
				dataType : 'jsonp',
				headers: {'Api-User-Agent':'CustomMapLoader/1.0'}
			})
			.done(function(data){
				var text = '<div><h3>'+self.name+'</h3>';
				var pages = data.query.pages;
				for (var key in pages) {
					if(pages.hasOwnProperty(key)) {
						if(pages[key].extract !== undefined) {
							text += '<p>'+pages[key].extract+'</p>';
						}
					}
				}
				text += '<p>Read more: <a href="https://en.wikipedia.org/w/index.php?title='+self.wiki+'" target="_blank">Wikipedia article</a></p></div>';
				infoWindow.setContent(text);
				infoWindow.open(map,self.marker);
			})
			.fail(function(data){
				console.log('Data loading failed.',data);
				infoWindow.setContent('Data loading failed.');
				infoWindow.open(map,self.marker);
			});
		});

	}

	// main KO View Model
	function PointsOfInterestViewModel() {
		var self = this;

		// Point Of Interest where one clicked in the list, empty on the init
		self.selectedPoi = ko.observable();

		// Text entered in the input box for filtering the Point Of Interest
		self.filterText = ko.observable();

		// The list of available Points Of Interest
		self.availablePois = [
			{ name: 'Castle Devin', lat: 48.173852, lng: 16.978212, wiki: 'Devín_Castle' },
			{ name: 'Statue Slavin', lat: 48.153878, lng: 17.099839, wiki: 'Slavín' },
			{ name: 'Bratislava Castle', lat: 48.142095, lng: 17.100857, wiki: 'Bratislava Castle' },
			{ name: 'Bratislava ZOO', lat: 48.163446, lng: 17.071133, wiki: 'Bratislava_Zoo' }
		];

		// helper array for KO function - observableArray
		var mappedPois = $.map(self.availablePois, function(obj){ return new PointOfInterest(obj.name, obj.lat, obj.lng, obj.wiki)});
		self.pois = ko.observableArray(mappedPois);

		// the function returns number of visible POIs
		self.totalPois = ko.computed(function() {
			var total = 0;
			for(var i=0;i<self.pois().length;i++) {
				if(self.pois()[i].visible()) {
					total++;
				}
			}
			return total;
		});

		// called from GUI when one clicks on the specific POI in the list
		self.selectPoi = function(poi) {
			self.selectedPoi(poi);
			locateMapToPoi(poi);
		}

		// called from GUI when one clicks on the filter button
		// it hides/shows the items in the list and same for the markers in the google maps
		self.filterList = function() {
			resetMap();
			var searchText = self.filterText().toUpperCase();
			for(var i=0;i<self.pois().length;i++) {
				var currentText = self.pois()[i].name.toUpperCase();
				if(currentText.search(searchText) !== -1) {
					self.pois()[i].visible(true);
					self.pois()[i].marker.setMap(map);
				} else {
					self.pois()[i].visible(false);
					self.pois()[i].marker.setMap(null);
				}
			}
		}

		// called from GUI when one clicks on the reset button
		// it restores all the items in the list, shows all the markers in the map and centers the map
		self.resetList = function() {
			resetMap();
			self.filterText('');
			for(var i=0;i<self.pois().length;i++) {
				self.pois()[i].visible(true);
				self.pois()[i].marker.setMap(map);
			}
		}
	}

	google.maps.event.addDomListener(window, 'load', initialize);
};