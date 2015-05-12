angular.module("lightgalaApp")
  .directive("widgets",['lightAnimService','utilService','$popover',function(lightAnimService,utilService,$popover){
    return {
      restrict: 'EA',
      //widgets.html is loaded from widgets directive, which is called in link like: http://localhost:3000/decor/0/
      //however widgets.html static file is under public/html, available at http://localhost:3000/html/widgets.html
      //templateUrl: "widgets.html",
      templateUrl: "../../partials/widgets.html",
      link: function(scope,ele,attrs){
	  //popover needed for subcat popover
	  var infer_anims=function(anims,i){
	      //start from i-th anim, infer dur, begin, pattern_code, stopcolor1, stopcolor2, 
	      //this helps us to quickly enter animations of a pattern
	      var keys = ['set','segment','start_second','color'];
	      //var values1 = ['begin','dur'];  //continuous value
	      var values1 = [{name:'begin',regex:'^([0-9.]+)s$'},
			     {name:'dur',regex:'^([0-9.]+)s$'}];  //continuous value
	      var values2 = [
		  {name:'calcmode',steps:[{'value':'discrete','text':'N'},{'value':'','text':'Y'}]},
		  //match all value
		  {name:'pattern_code',steps:[{'value':'^[01]+$','text':'*'}]},
		  {name:'stopcolor1',steps:[{'value':'^hsl\(\d+,[\d.]+%,[\d.]+%\)$','text':'*'}],when:{name:'colorname',regex:'^rgb$'}},
		  {name:'stopcolor2',steps:[{'value':'^hsl\(\d+,[\d.]+%,[\d.]+%\)$','text':'*'}],when:{name:'colorname',regex:'^rgb$'}}
	      ];     //discrete value
	      var values2_inc_func = function(value_name,value,inc_by){
		  var v2 = _.find(values2,function(v){
		      return v.name == value_name;
		  });
		  var v2_step_i = _.findIndex(v2.steps,function(s){
		      return s.value == value || (new RegExp(s.value,"i")).test(value);
		  });
		  v2_step_i_inc = (v2_step_i + inc_by)%v2.steps.length;
		  //return v2.steps[v2_step_i_inc].value;
		  return v2_step_i_inc==0 ? value : v2.steps[v2_step_i_inc].value;
	      }
	      var anims_dl = _.filter(anims,function(anim){
		  return anim.decor_line_id == anims[i].decor_line_id;
	      }).sort(utilService.dynamicSortMultiple("decor_line_id","start_second","set","segment","color"));
	      var i_dl = _.findIndex(anims_dl,function(anim){
		  return angular.equals(anim,anims[i]);
	      });
	      if(i_dl>0){
		  var keys_diff = _.filter(keys,function(key){
		      return anims_dl[i_dl][key] != anims_dl[i_dl-1][key];
		  });
		  var values1_diff = _.filter(values1,function(value){
		      return anims_dl[i_dl].config[value.name] != anims_dl[i_dl-1].config[value.name] || 
			     (anims_dl[i_dl+1] && anims_dl[i_dl].config[value.name] != anims_dl[i_dl+1].config[value.name]);
		  });
		  //when anims_dl[i_dl] and anims_dl[i_dl-1] values are the same, process both values
		  //values1_diff = values1_diff.length==0? values1 : values1_diff;
		  if(keys_diff.length==1){
		      //for now, only handle one key different situation
		      var key = keys_diff[0];
		      //process continues config values
		      //for(var value_i=0; value_i<values1_diff.length; value_i++){
		      for(value_i in values1_diff){
			  var value = values1_diff[value_i];
			  var anims_dl_i_value = anims_dl[i_dl].config[value.name];
			  var anims_dl_i1_value = anims_dl[i_dl-1].config[value.name];
			  var delta_value = 0;
			  var anims_dl_i_value_m = (new RegExp(value.regex)).exec(anims_dl_i_value);
			  var anims_dl_i1_value_m = (new RegExp(value.regex)).exec(anims_dl_i1_value);
			  if(anims_dl_i_value_m && anims_dl_i1_value_m){
			      //anims_dl_i_value like 0.3s, needs to parse the float value
			      //delta_value = Math.round((parseFloat(anims_dl_i_value.substr(0,anims_dl_i_value.length-1)) - parseFloat(anims_dl_i1_value.substr(0,anims_dl_i1_value.length-1)))*100)/100;
			      delta_value = Math.round((parseFloat(anims_dl_i_value_m[1]) - parseFloat(anims_dl_i1_value_m[1]))*100)/100;
			      for(var j_dl=i_dl+1;j_dl<anims_dl.length;j_dl++){
				  var j = _.findIndex(anims,function(anim){
				      return angular.equals(anim,anims_dl[j_dl]);
				  });
				  anims[j].config[value.name] = Math.round((parseFloat(anims_dl_i_value_m[1]) + delta_value*(j_dl-i_dl))*100)/100 + 's';
			      }
			  }//end if
		      }
		      //process discrete config values, values 2 is a array of objects with name and steps
		      //var values2_names = _.pluck(values2,function(v){return v.name});
		      //for(value_i in values2_names){
		      for(value_i in values2){
			  //var value = values2_names[value_i];
			  var value = values2[value_i].name;
			  var steps = values2[value_i].steps;
			  var when = values2[value_i].when;
			  var anims_dl_i_value = anims_dl[i_dl].config[value];
			  var anims_dl_i_value_step = _.findIndex(steps,function(s){
			      return s.value == anims_dl_i_value;
			  })
			  var anims_dl_i1_value = anims_dl[i_dl-1].config[value];
			  var anims_dl_i1_value_step = _.findIndex(steps,function(s){
			      return s.value == anims_dl_i1_value;
			  })
			  if(angular.isUndefined(when) ||
			     ((new RegExp(when.regex,"i")).test(anims_dl[i_dl].config[when.name]) &&
			      (new RegExp(when.regex,"i")).test(anims_dl[i_dl-1].config[when.name]))
			    ){
			      var delta_value = Math.abs(anims_dl_i_value_step - anims_dl_i1_value_step);
			      for(var j_dl=i_dl+1;j_dl<anims_dl.length;j_dl++){
				  var j = _.findIndex(anims,function(anim){
				      return angular.equals(anim,anims_dl[j_dl]);
				  });
				  anims[j].config[value] = values2_inc_func(value,anims_dl_i_value,delta_value*(j_dl-i_dl));
			      }			  
			  }
		      }
		  }
	      }
	  }
          scope.$watch('data.animations',function(newanims,oldanims){
	      var anim_service = lightAnimService.getAnim();
	      for(var i=0;i<newanims.length; i++){
		  var newanim = newanims[i];
		  var oldanim = _.find(oldanims,function(anim){
		      return anim.color == newanim.color &&
			     anim.start_second == newanim.start_second &&
			     anim.decor_line_id == newanim.decor_line_id &&
			     anim.segment == newanim.segment &&
			     anim.set == newanim.set;
		  });
		  if(!oldanim){
		      newanim.anim_id = anim_service.formAnimId(newanim.decor_line_id,newanim.segment,newanim.set,newanim.color,newanim.start_second);
		      //console.log("reenter anim for " + newanim.decor_line_id + " and update anim_id to " + newanim.anim_id);
		      if(scope.decor_line_anim_enter_func){
			  scope.decor_line_anim_enter_func(newanim.decor_line_id);
		      }
		      break;
		  }else{
		      if(!angular.equals(newanim.config,oldanim.config)){
			  //console.log("reenter anim for " + newanim.decor_line_id);
			  //infer dur or delay value change by anim_keys: set/segment/start_second/color
			  if(i>0){
			      infer_anims(newanims,i);
			  }
			  //end infer
			  scope.decor_line_anim_enter_func(newanim.decor_line_id);
			  break;
		      }
		  }
	      }
          },true);
      } //end link function
    } //end return directive object
  }])
