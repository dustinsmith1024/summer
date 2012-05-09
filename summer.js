Goals = new Meteor.Collection("goals");
Progress = new Meteor.Collection("progress");

if (Meteor.is_client) {
	Template.header.greeting = function () {
    return "Welcome to summer.";
    };

  Template.graph.events = {
    'draw' : function (e) {
      var new_goals = Goals.find({complete: 'new'}).count();
      var goals = Goals.find({}).count();
      var un_goals = Goals.find({complete: 'true'}).count();
      var data = [{text: 'New', value: new_goals}, {text:"Total", value:goals}, {text:"Complete",value: un_goals}];
      $(e.target).html('');
      //var chart = d3.select(e.target).append("svg").attr("class", "chart");
       var chart = d3.select("#graph").append("svg")
            .attr("class", "chart")
            .attr("width", 440)
            .attr("height", 140).append("g").attr("transform", "translate(10,15)");
      var x = d3.scale.linear()
           .domain([0, goals])
           .range(["0", "420"]);
      console.log(x);
      
      var y = d3.scale.ordinal().domain([new_goals, goals, un_goals])
        .rangeBands([0,120]);
      console.log(y);

     chart.selectAll("line")
     .data(x.ticks(4))
     .enter().append("line")
     .attr("x1", x)
     .attr("x2", x)
     .attr("y1", 0)
     .attr("y2", 120)
     .style("stroke", "#ccc");

     chart.selectAll(".rule")
          .data(x.ticks(8))
        .enter().append("text")
          .attr("class", "rule")
          .attr("x", x)
          .attr("y", 0)
          .attr("dy", -3)
          .attr("text-anchor", "middle")
          .text(String);

        chart.selectAll("rect")
        .data(data)
        .enter().append("rect").transition().duration(100)
             .attr("y", function(d,i) { return (i)*40;})
             .attr("width", function (d) {return x(d.value);})
             .attr("height", 30);

        chart.selectAll(".bar")
           .data(data)
         .enter().append("text").attr("class", "bar")
           .attr("x", 0)
           .attr("y", function(d, i) { console.log(d.value); return i*40 + 13; })
           .attr("dx", "5px") // vertical-align: middle
           .attr("dy", ".40em") // vertical-align: middle
           .attr("text-anchor", "begin") // text-align: right
           .text(function(d){return d.text;});

      chart.append("line")
           .attr("y1", 0)
           .attr("y2", 120)
           .style("stroke", "#000");

    }
  };

  Template.new_goal.types = function () {
    return [{"name": 'Sports'}, 
      {"name":'Reading'}]
  };
  
  Template.progress_list.progress = function () {
  	return Progress.find({goal:Session.get('selected_goal')});
  }
  
  Template.progress_row.events = {
  	'click .remove': function (e) {
  		console.log(this, e);
  		Progress.remove({_id: this._id});
  		$('#line-graph').trigger('redraw-line');
  	}
  }
  
  Template.goal.chart = function (e) {
  	console.log('This', this, e);	
  	//$(document).trigger('draw_line', {'id':this._id});
  }
  
  $(document).on('draw_line', function(e,d) {
  	console.log('Event:', e, d);
  	function checkBurn () {
	    if ($(".burn-" + d.id).length) {
	      clearInterval(interval);
		  draw_line(d.id)
	    }
  	}
  	var interval = setInterval(checkBurn, 100); // 1000 ms = 1 second
  });
  
  function draw_line (goal_id) {
	var goal = Goals.findOne({ _id: goal_id });
	if (!goal_id) return false;
	var data = [];
	var amount = goal.amount;
	Progress.find({goal:goal_id}).forEach(function(p){
		amount = amount - Number(p.amount);
		if (amount <= 0) amount = 0;
		data.push({x: Number(p.date.replace(/-/gi,'')), y: amount});
	});
	
	var margin = {top: 10, right: 10, bottom: 20, left: 40},
		width = 460 - margin.left - margin.right,
		height = 200 - margin.top - margin.bottom;

	var x = d3.scale.linear()
	    .domain([20120104, 20120901])
	    .range([0, width]);
	
	var y = d3.scale.linear()
	    .domain([0, goal.amount])
	    .range([height, 0]);
	
	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom");
	
	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left");
	
	var line = d3.svg.line()
	    .x(function(d) { return x(d.x); })
	    .y(function(d) { return y(d.y); });
	
	var area = d3.svg.area()
	    .x(line.x())
	    .y1(line.y())
	    .y0(y(0));

	var svg = d3.select(".burn-" + goal_id).append("svg")
	    .datum(data)
	    .attr("class", "line-chart")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  	.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	/* Fix this to be just the drawing area */
	svg.append("svg:rect")
	    .attr("width", 410)
	    .attr("height", 170)
	    .style("fill", "lightsteelBlue").style("opacity",".2");
	    
	svg.append("path")
	    .attr("class", "area")
	    .attr("d", area)
	    .style("fill", "url(#gradient)");
		;
	
	var gradient = svg.append("svg:defs")
	  .append("svg:linearGradient")
	    .attr("id", "gradient")
	    .attr("x1", "0%")
	    .attr("y1", "0%")
	    .attr("x2", "100%")
	    .attr("y2", "100%")
	    .attr("spreadMethod", "pad");
	    
	    gradient.append("svg:stop")
	    .attr("offset", "0%")
	    .attr("stop-color", "#FF0000")
	    .attr("stop-opacity", 1);
	
	/*
	gradient.append("svg:stop")
	    .attr("offset", "50%")
	    .attr("stop-color", "#FFFF00")
	    .attr("stop-opacity", 1);
	*/
	gradient.append("svg:stop")
	    .attr("offset", "100%")
	    .attr("stop-color", "#00FF00")
	    .attr("stop-opacity", 1);
	    
	svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(xAxis);
	
	svg.append("g")
	    .attr("class", "y axis")
	    .call(yAxis);
	
	svg.append("path")
	    .attr("class", "line")
	    .attr("d", line);
	
	svg.selectAll(".dot")
	    .data(data.filter(function(d) { return d.y; }))
	  .enter().append("circle")
	    .attr("class", "dot")
	    .attr("cx", line.x())
	    .attr("cy", line.y())
	    .attr("r", 3.5);
	 return true;

  }
  
  Template.goal.selected = function () {
  	return Session.equals("selected_goal", this._id);
  }
  
  Template.goal.percent = function () {
	return get_percent(this) + '%';
  }
  
  Template.goal.progress_complete = function () {
  	return get_percent(this) >= 100;
  }
  Template.goal.percent_class = function () {
	var p = get_percent(this);
	console.log(p);
	if (p >= 100) {
		return 'success';
	}else if (p > 70) {
		return 'info';
	}else if (p > 40) {
		return 'warning';
	}else{
		return 'important';
	}
  }
  Template.progress_row.percent = function () {
  	return get_progress_percent(this) + '%';
  }

  function get_progress_percent (progress) {
  	var goal = Goals.findOne({_id: progress.goal})
  	if ( goal )
  		return Math.round((progress.amount / goal.amount * 100));
  	return null;
  }
  
  function get_percent (goal) {
  	var progress = Progress.find({goal:goal._id});
  	if (progress.count()){
  		if (progress.count() > 1) {
  			var total = 0;
  			var list = Progress.find({goal:goal._id}).map(function(o){
  				return o.amount;
  			})
  			var total_progress = _.reduce(list, function(one, two){
  				return Number(one) + Number(two);
  			}, 0);
  		}else{
  			total_progress = progress.fetch()[0].amount;
  		}
  		return Math.round((total_progress / goal.amount * 100));
  	}
  	return 0;  	
  }
  
  Template.goal_list.goals = function () {
  	return Goals.find({});
  }

	Template.goal.events = {
		'click .shut': function (e) {
			Session.set('selected_goal', null);
		},
		'click .open': function (e) {
			Session.set('selected_goal', this._id);
			$('#line-graph').trigger('draw-line');
		},
	}
	
	Template.chart.events = {
		'afterinsert': function (e) {
			console.log('After insert', e, this._id);
			if(e.target.className==='burn-' + this._id){
				console.log('hiiiiiiii', this, e.target.className);
	  			console.log($(".burn-" + this._id));
	  			draw_line(this._id); //Might be able to change this to just THIS
  			}
		}		
	}
	
  Template.new_goal.events = {
    'submit' : function (e) {
      e.preventDefault();
      var data = $(e.target).serializeObject();
      Goals.insert(data);
      $('#graph').trigger('redraw');
    }
  };

  Template.new_progress.events = {
    'submit' : function (e) {
      e.preventDefault();
      var data = $(e.target).serializeObject();
      data['goal'] = Session.get('selected_goal');
      Progress.insert(data);
      $('#graph').trigger('redraw');
      $('#line-graph').trigger('redraw-line');
    }
  };

  $(document).on('redraw', function(e) {
  	var chart = d3.selectAll(".chart");
    var new_goals = Goals.find({complete: 'new'}).count();
	var goals = Goals.find({}).count();
	var un_goals = Goals.find({complete: 'true'}).count();
	var data = [{text: 'New', value: new_goals}, {text:"Total", value:goals}, {text:"Complete",value: un_goals}];
	var x = d3.scale.linear()  
     		.domain([0, goals])
     		.range(["0", "420"]);
   
     var y = d3.scale.ordinal().domain(data)
     	.rangeBands([0,120]);

        chart.selectAll("rect")
        .data(data).transition().duration(1000)
             .attr("y", function(d,i) { return (i)*40;})
             .attr("width", function (d) {return x(d.value);})
             .attr("height", 30);

        chart.selectAll(".bar")
           .data(data).transition().duration(1100)
           .attr("x", 0)
           .attr("y", function(d, i) { console.log(d.value); return i*40 + 13; })
           .attr("dx", "5px") // vertical-align: middle
           .attr("dy", ".40em") // vertical-align: middle
           .attr("text-anchor", "begin") // text-align: right
           .text(function(d){return d.text;});

  });

	$(document).on('redraw-line', function() {
		var goal_id = Session.get('selected_goal');
		var goal = Goals.findOne({ _id: goal_id });
		console.log('Redraw', goal_id, goal);
		
		var data = [];
		var amount = goal.amount;
		Progress.find({goal:goal_id}).forEach(function(p){
			amount = amount - Number(p.amount);
			if (amount <= 0) amount = 0;
			data.push({x: Number(p.date.replace(/-/gi,'')), y: amount});
		});
		var margin = {top: 10, right: 10, bottom: 20, left: 40},
	    	width = 460 - margin.left - margin.right,
	    	height = 200 - margin.top - margin.bottom;
	    	
		var svg = d3.select(".line-chart g")
    				.datum(data)
    	//var svg = d3.select(".line-chart g");
    		/*transition().duration(3000)
    		.attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		    .select('.line-chart g')
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			*/
    	console.log('re-SVG:', svg);
		svg.append("path")
		    .attr("class", "area")
		    .attr("d", area)
		    .style("fill", "url(#gradient)");
			;
			
	    var x = d3.scale.linear()
	    	.domain([20120104, 20120901])
	    	.range([0, width]);
	
		var y = d3.scale.linear()
	    	.domain([0, goal.amount])
	    	.range([height, 0]);
    
    	var line = d3.svg.line()
		    .x(function(d) { return x(d.x); })
		    .y(function(d) { return y(d.y); });
		
		var area = d3.svg.area()
		    .x(line.x())
		    .y1(line.y())
		    .y0(y(0));
		
		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom");
		
		var yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left");
		    
		svg.select("g")
		    .attr("class", "x axis")
		    .attr("transform", "translate(0," + height + ")")
		    .call(xAxis);
		
		svg.select("g")
		    .attr("class", "y axis")
		    .call(yAxis);
			
		svg.select('.area')
		    .attr("d", area)
		    .style("fill", "url(#gradient)");
		
		svg.select(".line")
		    .attr("d", line);
		
		//svg.select(".line")	
		//    .attr("d", line).transition().duration(3000);
		
		svg.selectAll(".dot")
		    .data(data.filter(function(d) { return d.y; }))
		    .enter().append("circle")
		    .attr("class", "dot")
		    .attr("cx", line.x())
		    .attr("cy", line.y()).transition().duration(500)
		    .attr("r", 3.5);
		
	});
	
	
	
	$(document).on("draw-line", function(){
					/*var data = d3.range(40).map(function(i) {
  			return {x: i / 39, y: (Math.sin(i / 3) + 2) / 4};
		});*/
		
		
	});


  function checkChart () {
    if ($("#graph").length) {
      clearInterval(interval);
      $("#graph").trigger('draw');
    }
  }
  var interval = setInterval(checkChart, 500); // 1000 ms = 1 second

  $.fn.serializeObject = function()
  {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
      if (o[this.name] !== undefined) {
        if (!o[this.name].push) {
          o[this.name] = [o[this.name]];
        }
        o[this.name].push(this.value || '');
      } else {
        o[this.name] = this.value || '';
      }
    });
    return o;
  }; 

/*
  Template.graph.init = function (e) {
    console.log(this, e);
    var el = $('<div id="graph" />')[0];
    console.log(el);
    var data = [4, 8, 15, 16, 23, 42];
    var chart = d3.select(el).append("div").attr("class", "chart");
    var c = chart.selectAll("div")
      .data(data)
      .enter().append("div")
      .style("width", function(d) { return d * 10 + "px"; })
      .text(function(d) { return d; });
    console.log($("#graph"), c);
    $("body").append(el);
  };
*/
}

if (Meteor.is_server) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
