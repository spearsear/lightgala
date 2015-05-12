//this service holds the decor data, can be used as a staging area for data for multiple controllers to access
angular.module("lightgalaApp")
  .factory('decorDataService',function(){
      //initial data for new decor
      var data_empty = {decor:{//designer: 'spearsear',
	                       //backgroundurl : "/img/house.jpg",
	                       views: 0,
			    /*order_lines: [{order_line_id: 1, category: 'Roof Lighting', sub_category: 'Fascia', qty: '20', price: '1.99'},
					  {order_line_id: 2, category: 'Roof Lighting', sub_category: 'Ridges', qty: '20', price: '1.99'},
					  {order_line_id: 3, category: 'Tree Lighting', sub_category: 'Canopy w/ C-9', qty: '40', price: '2.99'},
					  {order_line_id: 4, category: 'Shrubs', sub_category: '', qty: '30', price: '1.99'},
					  {order_line_id: 5, category: 'Ground Lighting', sub_category: 'Stakes', qty: '10', price: '3.99'}
					 ],*/
			    decor_width: 941,  //svg width captured when user save the decor, decor_line coordinates are based on this width
			    decor_aspect_ratio: 0.65,  //picture background default aspect ratio
			    decor_lines: [/*{decor_line_id: 1, 
					   decor_line_type: 'roof lighting',
					   elements: [//{id: 1, type: 'C1', color: 'red', x: 12, y: 88, w: 8, h: 10, scale_factor: 0.3},
						      //{id: 2, type: 'C1', color: 'red', x: 22, y: 88, w: 8, h: 10, scale_factor: 0.3},
						      //{id: 3, type: 'C1', color: 'red', x: 32, y: 88, w: 8, h: 10, scale_factor: 0.3},
						     ],
					   },*/
					 ]
			   }, //end decor
		     //widgets contain line categories and other common tools
		     widgets:[
			 {id: 1, name: "Windows/Features", subcats:[
			  ],
			  instructions: ''
			 },
			 {id: 2, name: "Daytime Decor", subcats:[
			     //name should be tool_name in toolService
			     {name: 'Garland', toolname: 'fancygarlandimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Fancy Wreath', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Wreath 24"', toolname: '24inchwreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Wreath 30"', toolname: '30inchwreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Wreath 36"', toolname: '36inchwreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Wreath 48"', toolname: '48inchwreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Wreath 60"', toolname: '60inchwreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Wreath 24" Battery w/ Picks', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Bows 12"', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Bows 18"', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Bow 24"', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Bows structural 24"', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Bows structural 36"', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Sprays 24"', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Baskets', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Pre lit Tree', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Decor Mesh', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Mixed grn/bry/pine cone Picks', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: 'Bulbs', toolname: 'fancywreathimagetool', price: 1.2, icon: 'glyphicon-tree-conifer'},
			  ],
			  instructions: '',
			 },
			 {id: 3, name: "Roof Lighting", subcats:[
			     {name: "Fascia",price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: "Ridges",price: 1.2, icon: 'glyphicon-tree-conifer'},
			  ],
			  instructions: '',
			 },
			 {id: 4, name: "Tree Lighting", subcats:[
			     {name: "Canopy w/ C-9",price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: "Trunk Wrap",price: 1.2, icon: 'glyphicon-tree-conifer'},			     
			     {name: "Branch Wrap",price: 1.2, icon: 'glyphicon-tree-conifer'},
			     {name: "Canopy w/ C-9 Evergreen",price: 1.2, icon: 'glyphicon-tree-conifer'},
			  ],
			  instructions: '',
			 },
			 {id: 5, name: "Ground Lighting", subcats:[
			     {name: "",price: null, icon: 'glyphicon-tree-conifer'},
			     {name: "Stakes",price: 1.2, icon: 'glyphicon-tree-conifer'},
			  ],
			  instructions: '',
			 },
			 {id: 6, name: "Shrubs", subcats:[
			  ],
			  instructions: '',
			 },
			 {id: 7, name: "Timers", subcats:[
			     {name: "Water proof boxes",price: 1.2, icon: 'glyphicon-tree-conifer'},
			  ],
			  instructions: '',
			 },
		     ],
		     //tools contain tools for decoration
		     tools:[
			 {id: 0, name: "shiningxmaslighttypetool", icons: ['icon-shiningxmaslight'], options:[], modes: ['edit']},
			 {id: 1, name: "basicxmaslighttypetool", icons: ['icon-basicxmaslight'], options:[], modes: ['edit']},
			 {id: 2, name: "basicgroundlighttypetool", icons: ['icon-basicgroundlight'], options:[], modes: ['edit']},
			 {id: 3, name: "sizeuptool", icons: ['icon-expand'], options:[], modes: ['edit']},
			 {id: 4, name: "sizedowntool", icons: ['icon-contract'], options:[], modes: ['edit']},
			 {id: 4.5, name: "shadowsizeuptool", icons: ['icon-shadowup'], options:[], modes: ['edit']},
			 {id: 4.6, name: "shadowsizedowntool", icons: ['icon-shadowdown'], options:[], modes: ['edit']},
			 {id: 5, name: "gapuptool", icons: ['icon-expand2'], options:[], modes: ['edit']},
			 {id: 6, name: "gapdowntool", icons: ['icon-contract2'], options:[], modes: ['edit']},
			 {id: 6.1, name: "setsizeuptool", icons: ['icon-setsizeup'], options:[], modes: ['edit']},
			 {id: 6.2, name: "setsizedowntool", icons: ['icon-setsizedown'], options:[], modes: ['edit']},
			 {id: 7, name: "rotatetool", icons: ['icon-sharable'], options: [
			     {name: "rotatelefttool", icon: 'icon-undo'},
			     {name: "rotaterighttool", icon: 'icon-redo'},
			     {name: "rotaterandomtool", icon: 'icon-shuffle'},
			 ], modes: ['edit']},
			 {id: 11, name: "lineonetool", icons: ['icon-dot'], options:[], modes: ['edit']},
			 {id: 12, name: "linemultitool", icons: ['icon-ellipsis'], options:[], modes: ['edit']},
			 {id: 13, name: "polymultitool", icons: ['icon-polymulti'], options:[], modes: ['edit']},
			 {id: 14, name: "measuretool", icons: ['icon-measurement-tape'], options:[], modes: ['edit']},
			 //icons are used when user click on the tool
			 {id: 15, name: "animatestarttool", icons: ['glyphicon glyphicon-play', 'glyphicon glyphicon-pause'], options:[], modes: ['edit','play']},
			 {id: 16, name: "nighttool", icons: ['icon-moon', 'icon-sun'], options:[], modes: ['edit','play']},
			 {id: 17, name: "musictool", icons: ['icon-music', 'icon-pause'], options:[], modes: ['donotshow']},
			 {id: 17.5, name: "volumeonofftool", icons: ['glyphicon glyphicon-volume-off', 'glyphicon glyphicon-volume-up'], options:[], modes: ['edit','play']},
			 {id: 18, name: "colorchoosertool", icons: ['icon-palette'], options: [
			    {name: 'yellowcolortool', icon: 'icon-danielbruce icon-yellow'},
			    {name: 'orangecolortool', icon: 'icon-danielbruce icon-orange'},
			    {name: 'bluecolortool', icon: 'icon-danielbruce icon-blue'},
			    {name: 'redcolortool', icon: 'icon-danielbruce icon-red'},
			    {name: 'greencolortool', icon: 'icon-danielbruce icon-green'},
			    {name: 'purplecolortool', icon: 'icon-danielbruce icon-purple'},
			    {name: 'whitecolortool', icon: 'icon-danielbruce icon-white'},
			    {name: 'randomcolortool', icon: 'icon-danielbruce icon-randomcolor'},
			    {name: 'rgbcolortool', icon: 'icon-danielbruce icon-rgbcolor'}], modes: ['edit']
			 },
			 {id: 19, name: "weathertool", icons: ['icon-soundcloud'], options: 
			   [{name: 'snowtool', icon: 'icon-pawn'},
			    {name: 'raintool', icon: 'icon-droplets'},
			    {name: 'sunnytool', icon: 'icon-sun'}], modes: ['edit','play']
			 },
			 {id: 21, name: "savetool", icons: ['icon-disk'], options:[], modes: ['edit']},
			 {id: 22, name: "deletetool", icons: ['glyphicon glyphicon-trash'], options:[], modes: ['edit']},
			 {id: 23, name: "cameratool", icons: ['icon-camera'], options:[], modes: ['edit']},
			 {id: 24, name: "loadmediatool", icons: ['icon-music'], options:[], modes: ['edit']},
			 {id: 25, name: "exittool", icons: ['icon-exit'], options:[], modes: ['edit']},
		     ],
		     defs: [
			 {type: "radialGradient",
			  desc: "definitions of supported colors used in lighting effects rendered as radial gradient",
			  attributes : [
			      {id:'lightflash-blue',colorname:'blue',stopcolor1:'hsl(200, 99%, 23%)',stopcolor2:'hsl(200, 99%, 63%)',dur:'1.8s',begin:'0s',animate:true},
			      {id:'lightflash-red',colorname:'red',stopcolor1:'hsl(6, 63%, 16%)',stopcolor2:'hsl(6, 63%, 56%)',dur:'1.25s',begin:'0s',animate:true},
			      {id:'lightflash-yellow',colorname:'yellow',stopcolor1:'hsl(48, 89%, 20%)',stopcolor2:'hsl(48, 89%, 70%)',dur:'1.25s',begin:'0s',animate:true},
			      {id:'lightflash-orange',colorname:'orange',stopcolor1:'hsl(28, 90%, 22%)',stopcolor2:'hsl(28, 90%, 62%)',dur:'1.75s',begin:'0s',animate:true},
			      {id:'lightflash-green',colorname:'green',stopcolor1:'hsl(145, 83%, 24%)',stopcolor2:'hsl(145, 83%, 66%)',dur:'1.5s',begin:'0s',animate:true},
			      {id:'lightflash-purple',colorname:'purple',stopcolor1:'hsl(282, 100%, 21%)',stopcolor2:'hsl(282, 100%, 71%)',dur:'1.8s',begin:'0s',animate:true},
			      {id:'lightflash-white',colorname:'white',stopcolor1:'hsl(0, 0%, 43%)',stopcolor2:'hsl(0, 100%, 100%)',dur:'1.9s',begin:'0s',animate:true},
			      {id:'lightflash-rgb',colorname:'rgb',stopcolor1:'hsl(6, 63%, 56%)',stopcolor2:'hsl(200, 99%, 63%)',dur:'1s',begin:'0s',animate:true},
			  ]},
		     ],
		     animations: [
			 //initial animations at start_second=0 will be initialized from defs[0].attributes
			 //{anim_id: 'allblue', decor_line_id: 1, color: 'blue', start_second: 10, config: {desc:'lightflash-blue',colorname:'blue',stopcolor1:'hsl(204, 70%, 23%)',stopcolor2:'hsl(204, 70%, 83%)',dur:'1.8s',begin:'0s',animate:true,pattern_code:'10110'}},
			 //{anim_id: 'allwhite', decor_line_id: 1, color: 'white', start_second: 10, config: {desc:'lightflash-white',colorname:'white',stopcolor1:'hsl(0, 0%, 43%)',stopcolor2:'hsl(0, 100%, 100%)',dur:'1.9s',begin:'0s',animate:true,pattern_code:'10110'}},
		     ],
		     links: [
			 {id: 1, name: "map"},
			 {id: 2, name: "pic2"},
		     ]
		    }; //end data
      //application data should store data such as tools, widgets, musics etc
      var app_data = {
	  musics: [{name:"Christmas Morning",author:"Paul Gentry",url:"/img/PaulGentry_ChristmasMorning.mp3"},
		   {name:"The Shepherds Song",author:"Paul Gentry",url:"/img/PaulGentry_TheShepherdsSong.mp3"},
		   {name:"The Christmas Song",author:"",url:"/img/TheChristmasSong.wav"},
		   {name:"I Wonder As I Wander",author:"Richard Souther",url:"/img/RichardSouther_IWonderAsIWander.mp3"},
		   {name:"Joy To The World",author:"Louis Landon",url:"/img/LouisLandon_JoyToTheWorld.mp3"},
		   {name:"Silent Night",author:"Michele McLaughlin",url:"/img/MicheleMcLaughlin_SilentNight.mp3"},
		   {name:"What Child Is This",author:"Denny Jiosa",url:"/img/DennyJiosa_WhatChildIsThis.mp3"},
		   {name:"The First Noel",author:"Michael Dulin",url:"/img/MichaelDulin_TheFirstNoel.mp3"},
		   {name:"Angels We Have Heard On High",author:"Solomon Keal",url:"/img/AngelsWeHaveHeardOnHigh_SolomonKeal.mp3"},
		   {name:"Away In A Manger",author:"Joe Bongiorno",url:"/img/JoeBongiorno_AwayInAManger.mp3"},
		   {name:"Carol Of The Bells",author:"Doug Hammer",url:"/img/DougHammer_CarolOfTheBells.mp3"},
		   {name:"O Little Town Of Bethlehem",author:"Jennifer Haines",url:"/img/JenniferHaines_OLittleTownOfBethlehem.mp3"},
		  ],
      };
      app_data.widgets = angular.copy(data_empty).widgets;
      app_data.tools = angular.copy(data_empty).tools;
      app_data.defs = angular.copy(data_empty).defs;
      return {
	  data: angular.copy(data_empty),  //keep data_empty as immutable
	  app_data: app_data,
	  //decor data methods
	  getData: function(){
	      return this.data;
	  },
	  setData: function(newData){
	      //cache newData in data
	      this.data = newData;
	  },
	  resetData: function(){
	      this.data = angular.copy(data_empty);
	  },
	  resetAppData: function(){
	      //use specific appdata
	      app_data.widgets = angular.copy(data_empty).widgets;
	      app_data.tools = angular.copy(data_empty).tools;
	  },
	  //app data methods
	  getAppData: function(){
	      return this.app_data;
	  },
      }
  });
