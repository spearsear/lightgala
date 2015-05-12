//d3 service provided by angular
angular.module('d3',[])
.factory('d3Service',['$document','$q','$rootScope',function($document,$q,$rootScope){
  var ds = [$q.defer()];
  //var d3srcs = ['http://d3js.org/d3.v3.min.js']
  var d3srcs = ['/js/lib/d3.js']
  var onscriptloadfuncs = [];
  //create the script tags for d3 libraries
  var s = $document[0].getElementsByTagName('head')[0];
  for (var i=0;i<d3srcs.length;i++){
    onscriptloadfuncs[i] = (function(){
      var index = i;
      return function(){
        //signals that the deferred activity has completed with the value d3
        $rootScope.$apply(function(){ds[index].resolve(window.d3);});
      }
    })();
    var scriptTag = $document[0].createElement('script');
    scriptTag.type = 'text/javascript';
    scriptTag.async = true;
    scriptTag.src = d3srcs[i];
    scriptTag.onreadystatechange = function(){
      if (this.readyState == 'complete') onscriptloadfuncs[i]();
    }
    scriptTag.onload = onscriptloadfuncs[i];
    s.appendChild(scriptTag);
  }

  return {
    desc: function() {return "d3service"},
    d3: function() {return $q.all([ds[0].promise]).then(function(d3s){
	//return d3s[0];
	var d3 = d3s[0];
	//d3.ns.prefix = "http://www.w3.org/2000/svg";
	//d3.ns.prefix.xlink = "http://www.w3.org/1999/xlink";
	//extend d3
	d3.selection.prototype.moveToBack = function() {
	    return this.each(function(){
		this.parentNode.insertBefore(this, this.parentNode.firstChild);
	    });
	};

	d3.selection.prototype.moveToFront = function() {
	    //not used
	    return this.each(function(){
		this.parentNode.append(this);
	    });
	};

	d3.selection.prototype.size = function() {
	    var n = 0;
	    this.each(function() { ++n; });
	    return n;
	};

	d3.selection.prototype.maxSegment = function() {
	    var n = 0;
	    this.each(function() {
		var m = parseInt(d3.select(this).attr("segment"));
		if(m>n){
		    n = m;
		}
	    });
	    return n;
	};

	d3.selection.prototype.maxGroup = function() {
	    var n = 0;
	    this.each(function() {
		var m = parseInt(d3.select(this).attr("group"));
		if(m>n){
		    n = m;
		}
	    });
	    return n;
	};

	d3.selection.prototype.cloneTo = function(another_selection, i) {
	    //clone this selection (including children) and append to another selection
            // Assume the selection contains only one object, or just work
            // on the first object. 'i' is an index to add to the id of the
            // newly cloned DOM element.
	    var attr = this.node().attributes;
	    var length = attr.length;
	    var node_name = this.property("nodeName");
	    var cloned = another_selection.append(node_name);
	    if(i){
                cloned.attr("id", this.attr("id") + "-" + i);
	    }
	    for (var j = 0; j < length; j++) { // Iterate on attributes and skip on "id"
		if (attr[j].nodeName == "id") continue;
		cloned.attr(attr[j].name,attr[j].value);
	    }
	    //clone children recursively
	    for(var k = 0; k<this.node().children.length; k++){
		d3.select(this.node().children[k]).cloneTo(cloned,null);
	    }
	    //return this;
	    return cloned;
	};

	return d3;
    })}
  }
}])
