var sliderApp = angular.module('sliderApp', []);

sliderApp.controller('AlbumCtrl',
		     ["$http", function($http) {
    var self = this;

    // Load the album
    $http.get('album.json').then(function(response) {
	self.title = response.data.title;
	
	self.media = response.data.media.map(function(medium) {
	    medium.date = new Date(medium.date);
	    return medium;
	});

	// "2011:02:13 17:51:31"
    }, function(errResponse) {
	console.error("could not fetch the album");
    });
    
    self.title = "Untitled Album";
    self.media = [];

    self.years = [2013];
    self.year = 2013;
    self.month = 9;

    var setCurrentIndex = function(idx) {
	self.currentIndex = Math.max(0, Math.min(idx, self.media.length - 1));
    };
    
    self.next = function() {
	setCurrentIndex(self.currentIndex + 1);
    };
    self.prev = function() {
	setCurrentIndex(self.currentIndex - 1);
    };

    setCurrentIndex(0);
}]);
