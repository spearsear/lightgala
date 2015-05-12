angular.module("lightgalaApp")
  .directive("snow",['$document',function($document){
    //this directive generate snow svg components inside the decor svg foreground
    return {
      restrict: 'EA',
      templateUrl: "../../partials/weather.html",
      controller: ["$scope","$element","$timeout",function($scope,$element,$timeout){
	  $timeout(function(){
	      var xhtmlNS = 'http://www.w3.org/1999/xhtml';
	      var canvas = $document[0].getElementsByTagNameNS(xhtmlNS,'canvas')[0];
	      var snowfall = function(canvas){
			    var ctx = canvas.getContext("2d");
			    var W = canvas.width;
			    var H = canvas.height;
	
			    //snowflake particles
			    var mp = 100; //max particles
			    var particles = [];
			    for(var i = 0; i < mp; i++){
				particles.push({
				    x: Math.random()*W, //x-coordinate
				    y: Math.random()*H, //y-coordinate
				    r: Math.random()*3+1, //radius
			            d: Math.random()*mp //density
				})
			    }
	
			    //draw the flakes, night sky
			    function draw(){
				ctx.clearRect(0, 0, W, H);
				//nightsky
				var skyGradient = ctx.createLinearGradient(0, 0, 0, H);
				skyGradient.addColorStop(1,'white');
				skyGradient.addColorStop(0.9,'rgba(0,0,51,0.25)');
				skyGradient.addColorStop(0, 'rgba(112,112,112,0.75)');
				ctx.fillStyle = skyGradient;
				ctx.fillRect(0, 0, W, H);
				//flakes
				ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
				ctx.beginPath();
				for(var i = 0; i < mp; i++){
				    var p = particles[i];
				    ctx.moveTo(p.x, p.y);
				    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2, true);
				}
				ctx.fill();
				update();
			    }	

			    //Function to move the snowflakes
			    //angle will be an ongoing incremental flag. Sin/Cos funcs are applied to it to create vert/horiz movements of the flakes
			    var angle = 0;
			    function update(){
				angle += 0.01;
				for(var i = 0; i < mp; i++){
				    var p = particles[i];
				    //Updating X and Y coordinates
				    //We will add 1 to the cos function to prevent negative values which will lead flakes to move upwards
				    //Every particle has its own density which can be used to make the downward movement different for each flake
				    //Lets make it more random by adding in the radius
				    p.y += Math.cos(angle+p.d) + 1 + p.r/2;
				    p.x += Math.sin(angle) * 2;
			
				    //Sending flakes back from the top when it exits
				    //Lets make it a bit more organic and let flakes enter from the left and right also.
				    if(p.x > W+5 || p.x < -5 || p.y > H){
					if(i%3 > 0){ //66.67% of the flakes
					    particles[i] = {x: Math.random()*W, y: -10, r: p.r, d: p.d};
					}else{
					    //If the flake is exitting from the right
					    if(Math.sin(angle) > 0){
						//Enter from the left
						particles[i] = {x: -5, y: Math.random()*H, r: p.r, d: p.d};
					    }else{
						//Enter from the right
						particles[i] = {x: W+5, y: Math.random()*H, r: p.r, d: p.d};
					    }
					}
				    }
				}
			    }
	
			    //animation loop
			    setInterval(draw, 33);
			};//end snowfall;
	      snowfall(canvas);
	  },1000)//$timeout
      }] //end directive controler function
    } //end return directive object
  }])
