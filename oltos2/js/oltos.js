var sliderApp = angular.module('sliderApp', ["d3"])
    .controller('AlbumCtrl', ["$http", function($http) {
	var self = this;

	self.media = [];
	self.hist = {};
	
	// Load the album
	$http.get('album.json').then(function(response) {
	    console.log('got album.json');
	    self.title = response.data.title;
	    self.hist = {};

	    // Build a date histogram
	    var maxDate = response.data.media[0].date;
	    self.media = response.data.media.map(function(medium) {
		var date = medium.date = new Date(medium.date);
		var y = date.getFullYear();

		if (date > maxDate)
		    maxDate = date;
		if (self.hist[y] === undefined)
		    self.hist[y] = [0,0,0,0,0,0,0,0,0,0,0,0];
		self.hist[y][date.getMonth()]++;
				
		return medium;
	    });

	    console.log(maxDate);
	    console.log(self.hist);
	    
	}, function(errResponse) {
	    console.error("could not fetch the album");
	});
    }])
    .directive("histogram", ["d3Promise", function(d3Promise) {
	return {
	    restruct: "AE",
	    scope: {
		hist: "=",
	    },
	    link: function($scope, $element, $attrs) {

		$scope.hist = [0,0,0,0,0,0,0,0,0,0,0,0];
		
		d3Promise.then(function(d3) {
		    //console.log(d3);
		    var months = "jfmamjjasond";
		    var monthSelWidth = 20;
		    var height = 60;

		    var hscale = d3.scale.linear()
			.range([0, height-monthSelWidth])
			.domain([0, d3.max($scope.hist)]);

		    var selectMonth = function(d,i) {
			console.log("Selecting month "+i);
		    };
		    
		    var svg = d3.select($element[0])
		      .append("svg")
			.classed("month-selector", true)
			.attr("width", 12*monthSelWidth)
			.attr("height", height);
		    var gall = svg.selectAll("g")
		        .data($scope.hist);
		    var gmonth = gall.enter().append("g")
			.classed("month-tick", true)
			.attr("transform", function (d,i) {
			    return "translate("+(i*monthSelWidth)+",0)"
			});
		    gmonth.append("rect")
			.classed("month-slice", true)
			.attr("width", ""+monthSelWidth+"px")
			.attr("height", ""+height)
			.attr("pointer-events", "all")
			.on("click", selectMonth);
		    var g = gmonth.append("g")
			.attr("transform", "translate(0,"+(height - monthSelWidth)+")");
		    g.append("rect")
			.classed("month-box", true)
			.attr("width", ""+monthSelWidth+"px")
			.attr("height", ""+height+"px")
			.on("click", selectMonth);
		    // Month textual label
		    g.append("text")
			.classed("month-label", true)
			.text(function(d,i) { return months[i]; })
			.attr("dx", ""+(monthSelWidth/2)+"px")
			.attr("dy", "2ex")
			.attr("text-anchor", "middle")
			.on("click", selectMonth);
		    // Month histogram rectangle
		    var grs = gmonth.append("g")
			.attr("transform", function(d) {
			    return "translate(0,"+(height-monthSelWidth-hscale(d))+")";
			});
		    var rects = grs.append("rect")
			.classed("month-hist-box", true)
			.attr("width", ""+monthSelWidth+"px")
			.attr("height", function(d) { return ""+hscale(d)+"px"; })
			.on("click", selectMonth);

		    $scope.$watch("hist", function() {
			hscale.domain([0, d3.max($scope.hist)]);
			
			gall.data($scope.hist);
			grs.data($scope.hist);

			var transitionDelay = 250;	// [ms]
			
			grs.transition().duration(transitionDelay)
			    .attr("transform", function(d) {
				return "translate(0,"+(height-monthSelWidth-hscale(d))+")";
			    });
			rects.data($scope.hist);
			rects.transition().duration(transitionDelay)
			    .attr("height", function(d) { return ""+hscale(d)+"px"; });
		    }); 
		});
	    }
	}
    }])
    .directive("monthSelector", [function() {
	return {
	    restrict: "AE",
	    templateUrl: "templates/month-selector.html",
	    scope: {
		hist: "=",
	    },
	    link: function($scope, $element, $attrs) {
		$scope.yearIndex = 0;
		$scope.monthIndex = 0;
		
		$scope.years = Object.keys($scope.hist).sort();

		$scope.$watch("hist", function() {
		    $scope.years = Object.keys($scope.hist).sort();
		    $scope.yearIndex = Math.min(Math.max($scope.yearIndex,0),
						$scope.years.length-1);
		    $scope.monthHist = $scope.hist[$scope.years[$scope.yearIndex]];
		    console.log("Setting month histogram to:");
		    console.log($scope.monthHist);
		});

		$scope.prevYear = function() {
		    $scope.yearIndex = Math.max($scope.yearIndex - 1, 0);
		    $scope.monthHist = $scope.hist[$scope.years[$scope.yearIndex]];
		}
		$scope.nextYear = function() {
		    $scope.yearIndex = Math.min($scope.yearIndex + 1,
						$scope.years.length - 1);
		    $scope.monthHist = $scope.hist[$scope.years[$scope.yearIndex]];
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
