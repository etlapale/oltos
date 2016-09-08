var sliderApp = angular.module('sliderApp', ["d3"])
    .controller('AlbumCtrl', ["$http", function($http) {
	var self = this;

	self.media = [];
	self.hist = {};
	self.displayedMedia = [];

	// Load the album
	$http.get('album.json').then(function(response) {
	    console.log('got album.json');
	    self.title = response.data.title;
	    self.hist = {};

	    // Build a date histogram
	    var maxDate = new Date(response.data.media[0].date);
	    self.media = response.data.media
	        // Convert the dates to Data and build the historgrams
		.map(function(medium) {
		    var date = medium.date = new Date(medium.date);
		    var y = date.getFullYear();
		    
		    if (date > maxDate)
			maxDate = date;
		    if (self.hist[y] === undefined)
			self.hist[y] = new Array(12).fill(0);
		    self.hist[y][date.getMonth()]++;
		    
		    return medium;
		})
	        // Sort by date to facilitate presentation and searching
		.sort(function(a,b) {
		    return a.date - b.date;
		});

	    console.log(maxDate);
	    console.log(self.hist);
	    
	    self.monthSelected(maxDate.getFullYear(), maxDate.getMonth());

	}, function(errResponse) {
	    console.error("could not fetch the album");
	});

	// A new month got selected, update the displayed media
	self.monthSelected = function(year, month) {
	    console.log("new selection: " + year + "-"+(month+1));

	    // TODO Use the fact that the media are sorted	    
	    self.displayedMedia = self.media.filter(function(medium) {
		var date = medium.date;
		return date.getFullYear() == year
		    && date.getMonth() == month;
	    });

	    console.log("displaying "+self.displayedMedia.length+"/"+self.media.length+" media");
	}
    }])
    .directive("histogram", ["d3Promise", function(d3Promise) {
	return {
	    restruct: "AE",
	    scope: {
		hist: "=",
		onClick: "&"
	    },
	    link: function($scope, $element, $attrs) {

		d3Promise.then(function(d3) {
		    var months = "jfmamjjasond";
		    var monthSelWidth = 20;
		    var height = 60;

		    console.log("==== hist in histogram is", $scope.hist);
		    var yearsDisplayed = Object.keys($scope.hist).length;

		    // Flatten the per-year histogram
		    function flatHist(hist) {
			var ans = [];
			for (var year in hist)
			    ans = ans.concat(hist[year]);
			return ans;
		    }
		    var flat = flatHist($scope.hist);
		    console.log("    flat hist:", flat);

		    // Histogram scale
		    var hscale = d3.scaleLinear()
			.range([0, height-monthSelWidth])
			.domain([0, d3.max(flat)]);

		    var selectMonth = function(d,i) {
			$scope.$apply(function() {
			    console.log($scope.hist);
			    var years = Object.keys($scope.hist);
			    $scope.onClick({year: years[Math.floor(i/12)],
					    month: i%12});
			});
		    };

		    var svg = d3.select($element[0])
		      .append("svg")
			.classed("month-selector", true)
			.attr("width", 12*yearsDisplayed*monthSelWidth)
			.attr("height", height);
		    var gall = svg.selectAll("g")
		        .data(flat);
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
			.text(function(d,i) { return months[i%12]; })
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

		    // Year separators
		    var year_labels = gmonth.append("g")
			.filter(function(d,i){ return i%12 == 0; })
			.attr("width", "5em")
			.append("text")
			.text(function(d,i){ return Object.keys($scope.hist)[i] ;})
			.attr("dx", ".5em")
			.attr("dy", "1.8ex")
			.attr("class", "year-label");
			//.on("click", function(d,i){ 

		    $scope.$watch("hist", function() {
			flat = flatHist($scope.hist);
			console.log("    flat hist:", flat);
			
			hscale.domain([0, d3.max(flat)]);

			gall.data(flat);
			grs.data(flat);

			var transitionDelay = 250;	// [ms]

			year_labels.attr("opacity", 0.0);
			year_labels.transition().duration(3*transitionDelay)
			    .attr("opacity", 1.0);
			year_labels.text(function(d,i){
			    return Object.keys($scope.hist)[i];
			});

			grs.transition().duration(transitionDelay)
			    .attr("transform", function(d) {
				return "translate(0,"+(height-monthSelWidth-hscale(d))+")";
			    });
			rects.data(flat);
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
		yearsDisplayed: "=",
		onChange: "&"
	    },
	    link: function($scope, $element, $attrs) {

		$scope.yearIndex = 0;

		function showYears(years) {
		    var newHist = {};
		    years.map(function(year) {
			newHist[year] = $scope.hist[year];
			console.log("  extending", newHist,
				    "at", year, "with", $scope.hist[year]);
		    });
		    $scope.shownHist = newHist;
		    console.log("  shown hist: ", $scope.shownHist);
		}
		
		// New histogram set
		$scope.$watch("hist", function() {
		    // Go to the last year
		    console.log("$scope.hist in monthSelector is", $scope.hist);
		    console.log("years displayed:", $scope.yearsDisplayed);

		    // Select a portion of years to be shown
		    var years = Object.keys($scope.hist);
		    console.log("album extends over", years);
		    console.log("  selecting", $scope.yearsDisplayed, "years");
		    
		    $scope.yearIndex = Math.max(0, years.length - $scope.yearsDisplayed);
		    console.log("  scope.yearIndex set to", $scope.yearIndex, "from", years.length - $scope.yearsDisplayed, years.length, $scope.yearsDisplayed);
		    
		    if (years.length > $scope.yearsDisplayed)
			years = years.slice(years.length - $scope.yearsDisplayed);
		    console.log("  showing years", years);

		    
		    //$scope.hist = $scope.hist[$scope.years[$scope.yearIndex]];
		    showYears(years);
		});

		$scope.prevYear = function() {
		    //$scope.yearIndex = Math.max($scope.yearIndex - 1, 0);
		    //$scope.hist = $scope.hist[$scope.years[$scope.yearIndex]];
		    //$scope.shownHist = $scope.hist;
		    console.log("prevYear!");

		    if ($scope.yearIndex > 0) {
			$scope.yearIndex--;
			var years = Object.keys($scope.hist);
			years = years.slice($scope.yearIndex, $scope.yearIndex + $scope.yearsDisplayed);
			showYears(years);
		    }
		}
		$scope.nextYear = function() {
		    /*$scope.yearIndex = Math.min($scope.yearIndex + 1,
						$scope.years.length - 1);*/
		    //$scope.hist = $scope.hist[$scope.years[$scope.yearIndex]];
		    //$scope.shownHist = $scope.hist;

		    var years = Object.keys($scope.hist);
		    if ($scope.yearIndex + $scope.yearsDisplayed < years.length) {
			console.log("Performing nextYear()!");
			$scope.yearIndex++;
			years = years.slice($scope.yearIndex, $scope.yearIndex + $scope.yearsDisplayed);
			showYears(years);
		    }
		}
		$scope.monthSelected = function(y,m) {
		    console.log("monthSelected(", y, ",", m, ")");
		    $scope.onChange({year: y, month: m});
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

		//setCurrentIndex(0);
		$scope.currentIndex = 0;

		$scope.$watch("media", function() {
		    console.log("displayed media changed!");
		    // Switch to the first medium
		    $scope.currentIndex = 0;
		});
	    }
	};
    }]);
