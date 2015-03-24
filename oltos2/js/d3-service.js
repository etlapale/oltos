angular.module("d3", [])
    .factory("d3Promise", ["$document", "$q", "$rootScope",
	function($document, $q, $rootScope) {
	    var deferred = $q.defer();
	    function onScriptLoad() {
		$rootScope.$apply(function() { deferred.resolve(window.d3); });
	    }

	    var tag = $document[0].createElement("script");
	    tag.type = "text/javascript";
	    tag.async = true;
	    tag.src = "js/d3.v3.min.js";
	    tag.onreadystatechange = function() {
		if (this.readyState == "complete") onScriptLoad();
	    };
	    tag.onload = onScriptLoad;

	    var s = $document[0].getElementsByTagName("body")[0];
	    s.appendChild(tag);
	    
	    return deferred.promise;
	}]);
