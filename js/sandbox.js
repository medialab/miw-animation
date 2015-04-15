

;(function(undefined){
  var url = "data/source.csv"

  d3.csv(url, function(error, csv){
    if(error) return console.warn(error)
    
    visualize(csv)    
  })

  function visualize(data){
    
    window.data = data

    var padding = 2
      , personRadius = 6
      , maxRadius = 100

    var tables = {}
    data.forEach(function(item,i){
      for(j in item){
        if(j != "person"){
          var table = item[j]
          tables[table] = (tables[table] || 0) + 1
        }
      }
      item.x = 0
      item.y = 0
      item.radius = personRadius
    })

    // Inspired by: view-source:http://projects.delimited.io/experiments/force-bubbles/
    
    var svg = d3.select("#animation").append("svg")
        .attr("width", document.querySelector('#animation').offsetWidth)
        .attr("height", document.querySelector('#animation').offsetHeight)

    var nodes = svg.selectAll("circle")
        .data(data)

    nodes.enter().append("circle")
        .attr("class", "node")
        .attr("cx", function (d) { return d.x || 100 })
        .attr("cy", function (d) { return d.y || 100 })
        .attr("r", function (d) { return d.radius || 10 })
        // .style("fill", function (d) { return fill(d.make); })
        // .on("mouseover", function (d) { showPopover.call(this, d); })
        // .on("mouseout", function (d) { removePopovers(); })

    var force = d3.layout.force()

    draw('date1')

    function draw (arrangement) {
      var centers = getCenters(arrangement, document.querySelector('#animation').offsetWidth, document.querySelector('#animation').offsetHeight);
      force.on("tick", tick(centers, arrangement));
      // labels(centers)
      force.start();
    }

    function getCenters(arrangement, width, height){

      // Note: for now, table positions do not depend on arrangements

      var columns = 8
        , centers = {}
        , tablesCount = d3.keys(tables).length
        , count = 0

      for(i in tables){
        centers[i] = {
            name: i
          , x: count%columns * (width / columns)
          , y: Math.floor(count/columns) * (height / Math.floor(tablesCount / columns))
          }
        count++
      }

      return centers;
    }

    function tick (centers, arrangement) {
      return function (e) {
        data.forEach(function(item, i){
          var value = item[arrangement] 
          item.x += ((centers[value].x) - item.x) * e.alpha;
          item.y += ((centers[value].y) - item.y) * e.alpha;
        })

        nodes.each(collide(.11))
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; });
      }
    }

    function collide(alpha) {
      var quadtree = d3.geom.quadtree(data);
      return function (d) {
        var r = d.radius + maxRadius + padding,
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
        quadtree.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== d)) {
            var x = d.x - quad.point.x,
                y = d.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + quad.point.radius + padding;
            if (l < r) {
              l = (l - r) / l * alpha;
              d.x -= x *= l;
              d.y -= y *= l;
              quad.point.x += x;
              quad.point.y += y;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      };
    }

  }

})();