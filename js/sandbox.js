

;(function(undefined){
  var url = "data/source.csv"

  d3.csv(url, function(error, csv){
    if(error) return console.warn(error)
    
    visualize(csv)
  })

  function visualize(data){
    
    window.data = data

    var columns = 10
      , width = document.querySelector('#animation').offsetWidth
      , height = document.querySelector('#animation').offsetHeight
      , padding = 5
      , personRadius = 5
      , tableRadius = 30
      , maxRadius = 10
      , animationTiming = 1200
      , animationTimer
      , dates = d3.keys(data[0]).filter(function(d,i){return i>0})
      , initialDate = 'date1'
      , currentDate = initialDate
      , playStatus = false
      , nodesData = []
      , linksData = []
      , tables
      , tables_index = {}

    // Init nodes and tables
    data.forEach(function(item,i){
      for(j in item){
        if(j != "person"){
          var table = item[j]
          if(tables_index[table])
            tables_index[table].count++
          else
            tables_index[table] = {count: 1}
        }
      }
    })

    tables = d3.keys(tables_index)

    tables.forEach(function(table, i){
      tables_index[table].x = (0.5 + i%columns) * (width / columns)
      tables_index[table].y = (0.5 + Math.floor(i/columns)) * (height / Math.ceil(tables.length / columns))
    })
    
    createButtons()

    var svg = d3.select("#animation").append("svg")
        .attr("width", width)
        .attr("height", height)

    // Draw tables
    var tableNodes = svg.selectAll("circle.table")
      .data(tables)
    tableNodes.enter().append("circle")
        .attr("class", "table")
        .attr("cx", function (d) { return tables_index[d].x })
        .attr("cy", function (d) { return tables_index[d].y })
        .attr("r", tableRadius)
        .attr("fill", 'none')
        .attr("stroke", '#000')

    // Nodes of the network (including persons and tables)
    data.forEach(function(item, i){

      nodesData.push({
        x: Math.random() * width
      , y: Math.random() * height
      , radius: personRadius
      , fixed: false
      })

    })

    tables.forEach(function(table){
      nodesData.push({
        x: tables_index[table].x
      , y: tables_index[table].y
      , radius: 10
      , fixed: true
      })
    })

    updateLinks(initialDate)

    var nodes = svg.selectAll("circle.node")
        .data(nodesData)

    nodes.enter().append("circle")
        .attr("class", "node")
        .attr("cx", function (d) { return d.x || 100 })
        .attr("cy", function (d) { return d.y || 100 })
        .attr("r", function (d) { return d.radius || 10 })
        // .style("fill", function (d) { return fill(d.make); })
        // .on("mouseover", function (d) { showPopover.call(this, d); })
        // .on("mouseout", function (d) { removePopovers(); })

    var force = d3.layout.force()
      .friction(.2)
      .gravity(0)
      .linkStrength(2)
      .chargeDistance(20)
      .nodes(nodesData)
      .links(linksData)

    window.switchTo = function(date){
      currentDate = date
      updateLinks(currentDate)
      force.links(linksData)
      var divs = document.querySelectorAll('#settings div.date-selector')
      for(i in divs){
        divs[i].className = 'date-selector'
      }
      document.querySelector('#'+date).className = 'date-selector active'
      draw(date)
    }

    window.switchTo(initialDate)

    window.playStop = function(){
      if(playStatus){

        // STOP

        playStatus = false
        document.querySelector('#play-stop-button').innerHTML = "PLAY"
        document.querySelector('#play-stop-message').innerHTML = ""

        // Clear timer
        window.clearTimeout(animationTimer)

      } else {

        // PLAY

        playStatus = true
        document.querySelector('#play-stop-button').innerHTML = "STOP"
        document.querySelector('#play-stop-message').innerHTML = "playing"

        // Set timer
        if(currentDate == dates[0]){
          window.nextDate()
        } else {
          window.switchTo(initialDate)
        }
        animationTimer = setInterval(nextDate, animationTiming)

      }
    }

    window.nextDate = function(){
      var nextFlag = false
        , switchHappens = false

      for(i in dates){
        var date = dates[i]
        if(nextFlag){
          window.switchTo(date)
          switchHappens = true
          break;
        }
        if(date == currentDate){
          nextFlag = true
        }
      }
      if(!switchHappens){
        window.playStop()
      }
    }

    function draw (date) {
      force.on("tick", tick(date))
      force.start()
    }

    function tick (date) {
      return function (e) {
        // data.forEach(function(item, i){
        //   var table = item[date]
        //   item.x += ((tables_index[table].x) - item.x) * e.alpha;
        //   item.y += ((tables_index[table].y) - item.y) * e.alpha;
        // })

        nodes.each(collide(.11))
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; });

      }
    }

    function collide(alpha) {
      var quadtree = d3.geom.quadtree(data)
      return function (d) {
        var r = d.radius + maxRadius + padding,
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r
        quadtree.visit(function(quad, x1, y1, x2, y2) {
          if (quad.point && (quad.point !== d)) {
            var x = d.x - quad.point.x,
                y = d.y - quad.point.y,
                l = Math.sqrt(x * x + y * y),
                r = d.radius + quad.point.radius + padding
            if (l < r) {
              l = (l - r) / l * alpha
              d.x -= x *= l
              d.y -= y *= l
              quad.point.x += x
              quad.point.y += y
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1
        })
      }
    }

    function updateLinks(date){
      linksData = []
      data.forEach(function(item, i){
        linksData.push({
          source: i
        , target: data.length + tables.indexOf(item[date])
        })
      })
    }

    function createButtons(){
      dates.forEach(function(date){
          var div = document.createElement('div')

          div.innerHTML = '<button onClick="switchTo(\''+date+'\')">'+date+'</button>'
          div.id = date
          div.className = "date-selector"
          document.querySelector('#settings').appendChild(div)
      })
    }

  }

})();