angular.module("lightgalaApp")
    .filter("formatNumberWithComma",function(){
	return function(x){
	    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}
    })
    .controller('mainCtrl',['$rootScope','$scope','$location','$routeParams','$alert','decorsListService','utilService','uiGmapGoogleMapApi',function($rootScope,$scope,$location,$routeParams,$alert,decorsListService,utilService,uiGmapGoogleMapApi){
	if($routeParams.id){
	    $scope.decor_id_viewed = $routeParams.id
	}	

	//kludge to change searched subscribers for now
	$scope.menus = {
	    groups_login:[
		{group_name: "",
		 group_items: [
		     //decor_featured always no_user_limit regardless of login user
		     {item_name:"Decor Stars",icon:"glyphicon glyphicon-star",
		      features:[
			  {feature_name:"Daves Landscape",criteria:"Dave Rykbost",criteria_type:'has_keyword',no_user_limit:true,decors:[]},
			  {feature_name:"Mike's Landscape Lighting",criteria:"Mike Brown",criteria_type:'has_keyword',no_user_limit:true,decors:[]},
			  {feature_name:"Premium Lighting",criteria:"Emma Wang",criteria_type:'has_keyword',no_user_limit:true,decors:[]},
		      ],
		      //status:"selected"
		     },
		     {item_name:"Most Popular",icon:"glyphicon glyphicon-heart",
		      features:[
			  {feature_name:"My Favorites",
			   criteria:function(){return ".gt('thumbs.up',100)"},
			   criteria_type:'mongoose_query',
			   decors:[]},
		      ],
		     },
		     {item_name:"Decors Nearby",icon:"glyphicon glyphicon-gift",
		      features:[
			  {feature_name:"Within 50 miles",
			   criteria:function(){
			       //return ".where('decor.address.coords').near({center: {type:'Point', coordinates: [" + $scope.decors[0].decor.address.geo.lng + "," + $scope.decors[0].decor.address.geo.lat + "]}, maxDistance: 50})"; 
			       //earth radius 3959 miles, maxdistance in radians. convert mile distance to radians: x_miles/3959
			       return $scope.decors.length>0?".where('decor.address.coords').near({center: [" + $scope.decors[0].decor.address.coords[0] + "," + $scope.decors[0].decor.address.coords[1] + "], maxDistance: 50/3959, spherical: true})":""; 
			   },
			   criteria_type:'mongoose_query',
			   decors:[]},
		      ],
		     },
		     {item_name:"My Subscription",icon:"glyphicon glyphicon-check",
		      features:[
			  {feature_name:"My Subscription",
			   criteria:function(){
			       return ".where({'subscribers': '"+ ($rootScope.currentUser ? $rootScope.currentUser._id : '') +"'})"
			   },
			   criteria_type:'mongoose_query',
			   no_user_limit:true,
			   decors:[]},
		      ],
		     }
		 ]},
		{group_name: "Decoration Pros",
		 group_items: [
		     {item_name:"Browse",icon:"glyphicon glyphicon-leaf",},
		     {item_name:"My Pros",icon:"glyphicon glyphicon-tree-deciduous",},
		     {item_name:"Rate",icon:"glyphicon glyphicon-thumbs-up",}
		 ]},
		{group_name: "",
		 group_items: [
		     {item_name:"Where is lit",icon:"glyphicon glyphicon-globe",templateUrl:"mainrightmap"},
		     {item_name:"Feedback",icon:"glyphicon glyphicon-comment",},
		     {item_name:"Share",icon:"glyphicon glyphicon-share-alt",}
		 ]},
	    ],
	    groups_nologin:[
		{group_name: "",
		 group_items: [
		     {item_name:"Decor Stars",icon:"glyphicon glyphicon-star",
		      features: [
			  {feature_name:"Daves Landscape",criteria:"Dave Rykbost",criteria_type:'has_keyword',no_user_limit:true,decors:[]},
			  {feature_name:"Mike's Landscape Lighting",criteria:"Mike Brown",criteria_type:'has_keyword',no_user_limit:true,decors:[]},
			  {feature_name:"Premium Lighting",criteria:"Emma Wang",criteria_type:'has_keyword',no_user_limit:true,decors:[]},
		      ],
		      //status:"selected"
		     },
		     {item_name:"Most Popular",icon:"glyphicon glyphicon-heart",
		      features:[
			  {feature_name:"My Favorites",
			   criteria:function(){return ".gt('thumbs.up',100)"},
			   criteria_type:'mongoose_query',
			   no_user_limit:true,
			   decors:[]},
		      ],
		     },
		     {item_name:"Newly Added",icon:"glyphicon glyphicon-circle-arrow-up",
		      features: [
			  {feature_name:"Today",criteria:".gt('decor.last_mod_time',(new Date()).setDate((new Date()).getDate()-1))",criteria_type:'mongoose_query',no_user_limit:true,decors:[]},
			  {feature_name:"Past Week",criteria:".gt('decor.last_mod_time',(new Date()).setDate((new Date()).getDate()-7)).lt('decor.last_mod_time',(new Date()).setDate((new Date()).getDate()-1))",criteria_type:'mongoose_query',no_user_limit:true,decors:[]},
		      ]
		     }
		 ]},
		{group_name: "Decoration Pros",
		 group_items: [
		     {item_name:"Browse",icon:"glyphicon glyphicon-leaf",},
		     {item_name:"My Pros",icon:"glyphicon glyphicon-tree-deciduous",},
		     {item_name:"Rate",icon:"glyphicon glyphicon-thumbs-up",}
		 ]},
		{group_name: "",
		 group_items : [
		     {item_name:"Where is lit",icon:"glyphicon glyphicon-globe",templateUrl:"mainrightmap"},
		     {item_name:"Feedback",icon:"glyphicon glyphicon-comment",},
		     {item_name:"Share",icon:"glyphicon glyphicon-share-alt",}
		 ]},
	    ],
	};

	if($rootScope.currentUser){
	    $scope.menu_groups = $scope.menus.groups_login;
	}else{
	    $scope.menu_groups = $scope.menus.groups_nologin;
	}

	$scope.selectItem = function(item_name){
	    for(var i=0;i<$scope.menu_groups.length;i++){
		//clear selected status in the group first
		_.forEach($scope.menu_groups[i].group_items,function(item){
		    item.status = "";
		})
		var j = utilService.getArrayIndexWithPropertyEqualTo($scope.menu_groups[i].group_items,"item_name",item_name);
		if(j>=0){
		    $scope.menu_groups[i].group_items[j].status = 'selected';
		    //update decors_featured
		    if($scope.menu_groups[i].group_items[j].hasOwnProperty('features')){
			$scope.main_right_partial = 'mainrightshow';
			$scope.decors_featured = $scope.menu_groups[i].group_items[j].features;
		    }
		    if($scope.menu_groups[i].group_items[j].hasOwnProperty('templateUrl')){
			$scope.main_right_partial = $scope.menu_groups[i].group_items[j].templateUrl;
		    }
		}
	    }
	}

	//initilize decors_featured for decors to be shown in carousel by showing Most popular
	$scope.decors_featured = [];
	$scope.selectItem("Decor Stars");
	//$scope.decors_featured = $scope.menus.groups_nologin[0].group_items[0].features;
	//unfeatured decors
	$scope.decors = [];

	$scope.currentPage = -1;  //currentPage initially at -1
	$scope.loadTimes = 0;
	$scope.maxLoadTimes = 10;  //maximum show more 10 times to discourage endless loadMore

	$scope.excludeCurrentViewedDecor = function(decor){
	    return decor._id != $scope.decor_id_viewed;
	};

	$scope.allowLoadMore = function(){
	    return $scope.loadTimes < $scope.maxLoadTimes;
	}

	$scope.loadMoreDecors = function(){
	    $('#loadmoredecor').prop('disabled', true);
	    decorsListService.query({criteria: $scope.criteria, 
				     criteria_type: 'has_keyword', 
				     page:$scope.currentPage+1}).$promise.then(function(decors){
		$scope.decors = $scope.decors.concat(decors[0].decors);
		$scope.currentPage = parseInt(decors[0].page);
		if(decors[0].lastpage){
		    $scope.loadTimes = $scope.maxLoadTimes;
		}else{
		    $scope.loadTimes += 1;
		}
		$('#loadmoredecor').prop('disabled', false);

	        uiGmapGoogleMapApi.then(function(maps) {
		    var decors = $scope.decors;
		    if(decors.length>0){
			if(decors[0].decor.address.coords) {
			    $scope.map = { center: { latitude: decors[0].decor.address.coords[1], longitude: decors[0].decor.address.coords[0] }, 
					   zoom: 8,
					   bounds: { northeast: {latitude: _.max(decors,function(decor){return decor.decor.address.coords[1]}).decor.address.coords[1], 
								 longitude: _.max(decors,function(decor){return decor.decor.address.coords[0]}).decor.address.coords[0], 
								},
						     southwest: {latitude: _.min(decors,function(decor){return decor.decor.address.coords[1]}).decor.address.coords[1], 
								 longitude: _.min(decors,function(decor){return decor.decor.address.coords[0]}).decor.address.coords[0], 
								}
						   },
					   markers: _.pluck(decors,function(decor){
					       return {
						   id: decors.indexOf(decor),
						   decor_id: decor._id,
						   title: decor.decor.title,
						   coords: {
						       latitude:decor.decor.address.coords[1],
						       longitude:decor.decor.address.coords[0],
						   },
						   options: {
						       icon: {
							   url: '/img/maplight.png',
							   scaledSize: new google.maps.Size(28,28)
						       }
						   }
					       };
					   }),
					   windowOptions: {
					       visible: false
					   },
					   onClick: function(){
					       this.windowOptions.visible = !this.windowOptions.visible;
					   },
					   closeClick: function(){
					       this.windowOptions.visible = false;
					   }
					 }//end scope.map
			} //end if ...coords
		    };//if decors.length>0
		});
	    },function(err){
		$('#loadmoredecor').prop('disabled', false);
		$alert({
		    title: 'Error occurred while retrieving decor!',
		    content: err.data.message,
		    placement: 'top-right',
		    type: 'danger',
		    duration: 3
		});
	    });
	};

	$scope.loadMoreDecors();

	//navbarCtrl search update criteria and decors
	$scope.$on("searchcriteriachanged",function(event,args){
	    $scope.criteria = args.criteria;
	});

	$scope.$on("decorslistchanged",function(event,args){
	    //$scope.decors = args.decors;
	    $scope.decors = args.decors[0].decors;
	    $scope.loadTimes = 0;
	    $scope.currentPage = 0;
	});

	//enhance ui-bootstrap carousel to handle multiple image by collecting decors in each feature in decors_featured into groups
	$scope.myInterval = 15000;
	$scope.numDecorsEachFrame = 4;

	$scope.decors_watch_list = [];
	$scope.prepare_decors_featured = function(){
	    _.forEach($scope.decors_watch_list,function(unwatch){
		unwatch();
	    });
	    $scope.decors_watch_list = [];
	    var group_decors_in_feature = function(feature){
		$scope.decors_watch_list.push($scope.$watch(function(){return feature.decors}, function(values) {
		    //a contains frames of decors: [[decor1,decor2,decor3],[decor4,decor5]], ie a = [b,b,b]
		    //b contains each frame of multiple decors [decor1,decor2,decor3]
		    var i, a = [];
	    
		    for (i = 0; i < feature.decors.length; i += $scope.numDecorsEachFrame) {
			var b = [];  
		
			for (var j=0;j<$scope.numDecorsEachFrame;j++){
			    if(feature.decors[i+j]){
				b.push(feature.decors[i+j]);
			    }
			}

			a.push(b);
		    }

		    feature.groupedDecors = a;
		}, true));
	    };

	    for(var i=0;i<$scope.decors_featured.length;i++){
		//decorsListService.query({criteria: $scope.decors_featured[i].criteria, page:0}).$promise.then((function(i){
		decorsListService.query({criteria: $scope.decors_featured[i].criteria instanceof Function? $scope.decors_featured[i].criteria() : $scope.decors_featured[i].criteria, 
					 criteria_type: $scope.decors_featured[i].criteria_type, 
					 no_user_limit: $scope.decors_featured[i].no_user_limit, 
					 page:0}).$promise.then((function(i){
		    return function(decors){
			$scope.decors_featured[i].decors = decors[0].decors;
			$scope.decors_featured[i].page = parseInt(decors[0].page);
			//carousel show decors in feature by groups
			group_decors_in_feature($scope.decors_featured[i]);
		    }})(i),function(err){
		    });
	    }
	};

	$scope.$watch(function(){
	    return _.map($scope.decors_featured,function(feature){return feature.feature_name});
	},$scope.prepare_decors_featured,true);

    }]);
