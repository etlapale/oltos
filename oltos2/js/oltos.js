var sliderApp = angular.module('sliderApp', ["d3"])
    .controller('AlbumCtrl', ["$http", function($http) {
	var self = this;

	self.media = [];
	
	// Load the album
	$http.get('album.json').then(function(response) {
	    self.title = response.data.title;	
	    self.media = response.data.media.map(function(medium) {
		medium.date = new Date(medium.date);
		return medium;
	    });
	}, function(errResponse) {
	    console.error("could not fetch the album");
	});
	
	self.months = {2011: {2: 2,
			      10: 1},
		       2013: {9: 2}};
	
	self.year = 2013;
	self.month = 9;
	
    }])
    .directive("histogram", ["d3Promise", function(d3Promise) {
	return {
	    restruct: "AE",
	    link: function($scope, $element, $attrs) {
		d3Promise.then(function(d3) {
		    console.log(d3);
		    d3.select($element[0])
			.append("svg");
		});
	    }
	}
    }])
    .directive("monthSelector", [function() {
	return {
	    restrict: "AE",
	    templateUrl: "templates/month-selector.html",
	    scope: {
		months: "=",
	    },
	    link: function($scope, $element, $attrs) {
		$scope.years = Object.keys($scope.months);

		$scope.yearIndex = 0;
		$scope.monthIndex = 0;

		$scope.prevYear = function() {
		    $scope.yearIndex = Math.max($scope.yearIndex - 1, 0);
		}
		$scope.nextYear = function() {
		    $scope.yearIndex = Math.min($scope.yearIndex + 1,
						$scope.years.length - 1);
		}
	    }
	}
    }])
    .directive("slider", [function() {
	return {
	    restrict: "AE",
	    templateUrl: "templates/slider.html",
	    scope: {
		media: "="
	    },
	    link: function($scope, $element, $attrs) {
		
		var setCurrentIndex = function(idx) {
		    $scope.currentIndex = Math.max(0, Math.min(idx, $scope.media.length - 1));
		};
		
		$scope.next = function() {
		    setCurrentIndex($scope.currentIndex + 1);
		};
		$scope.prev = function() {
		    setCurrentIndex($scope.currentIndex - 1);
		};
		
		setCurrentIndex(0);
	    }
	};
    }]);
