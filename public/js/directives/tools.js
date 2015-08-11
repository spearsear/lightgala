angular.module("lightgalaApp")
  .directive("tools",['$timeout','utilService',function($timeout,utilService){
    return {
      restrict: 'EA',
      //templateUrl: "tools.html",
      templateUrl: "../../partials/tools.html",
      link: function(scope,ele,attrs){
	  //allow attachToolMenu only twice
	  scope.attachToolMenu = utilService.nceFunc(function(){
	      //console.log("attach tool submenu");
	      var toolname;
	      //just in case 1 secon timeout delay is not enough in tools.js before run attach tool menu
	      for(var i=0;i<scope.data.tools.length;i++){
		  if(scope.data.tools[i].options.length>0){
		      toolname = scope.data.tools[i].name;
		      $('#tool-'+toolname).toolbar({
			  content: '#options-'+toolname, 
			  position: 'bottom',
			  hideOnClick: true
		      });
		      $('.tool-item[toolbox-name='+toolname+']').on('click touchstart',function(e){
			  scope.selectTool($(this).attr("name"));
		      });      	  
	      }
	      }
	  },2);
	  scope.$on("data_ready",function(event,args){
	      $timeout(scope.attachToolMenu,1000);
	  });
	  scope.current.music.totalMusics = scope.app_data.musics.length;
	  scope.current.music.musicsPerPage = 5;
	  scope.current.music.currentPage = 1;
	  scope.current.music.maxSize = 5;
	  scope.$watch('current.music.currentPage + current.music.musicsPerPage',function(){
	      var begin = (scope.current.music.currentPage - 1) * scope.current.music.musicsPerPage,
	          end = begin + scope.current.music.musicsPerPage;
	      scope.current.music.filteredMusics = scope.app_data.musics.slice(begin,end);
	  });
      }, //end link function
    } //end return directive object
  }])
