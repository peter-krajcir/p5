$(function() {
	var customMap = new CustomMap();
});

var CustomMap = function() {
	"use strict"
	var map,
		initValues = {
			lat: 48.1430258,
			lng: 17.1244572,
			zoom: 11
		},
		poi,
		infoWindow = new google.maps.InfoWindow(),
		infoWindowWikiStart = '',
		infoWindowWikiEnd = '';

	function initialize() {
		var myLatlng = new google.maps.LatLng(initValues.lat,initValues.lng);
		var mapOptions = {
			zoom: initValues.zoom,
			center: myLatlng
		}
		map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		ko.applyBindings(new PointsOfInterestViewModel());
	}

	function resetMap() {
		map.setCenter(new google.maps.LatLng(initValues.lat,initValues.lng));
		map.setZoom(initValues.zoom);
	}

	function locateMapToPoi(poi) {
		map.setCenter(new google.maps.LatLng(poi.lat,poi.lng));
		map.setZoom(14);
	}

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

		var loadingInformation = 'Please wait, data are loading..';

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

	function PointsOfInterestViewModel() {
		var self = this;

		self.selectedPoi = ko.observable();

		self.filterText = ko.observable();

		self.availablePois = [
			{ name: 'Castle Devin', lat: 48.173852, lng: 16.978212, wiki: 'Devín_Castle' },
			{ name: 'Statue Slavin', lat: 48.153878, lng: 17.099839, wiki: 'Slavín' },
			{ name: 'Bratislava Castle', lat: 48.142095, lng: 17.100857, wiki: 'Bratislava Castle' },
			{ name: 'Bratislava ZOO', lat: 48.163446, lng: 17.071133, wiki: 'Bratislava_Zoo' }
		];

		var mappedPois = $.map(self.availablePois, function(obj){ return new PointOfInterest(obj.name, obj.lat, obj.lng, obj.wiki)});
		self.pois = ko.observableArray(mappedPois);

		self.totalPois = ko.computed(function() {
			var total = 0;
			for(var i=0;i<self.pois().length;i++) {
				if(self.pois()[i].visible()) {
					total++;
				}
			}
			return total;
		});

		self.selectPoi = function(poi) {
			self.selectedPoi(poi);
			locateMapToPoi(poi);
		}

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