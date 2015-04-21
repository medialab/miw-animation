

;(function(undefined){

  var public_spreadsheet_url = '12Slk94URdI1jGPox8mmYGdDP--LluDJnk3k3-fDAQRs';

  Tabletop.init( { key: public_spreadsheet_url,
                   callback: visualize,
                   simpleSheet: true } );

  function visualize(data){
    window.data = data

    var columns = 10
      , width = document.querySelector('#animation').offsetWidth
      , height = document.querySelector('#animation').offsetHeight
      , padding = 8
      , tableRadius = 36
      , individualRadius = 4
      , maxRadius = 10
      , animationTiming = 1200
      , animationTimer
      , dates = d3.keys(data[0]).filter(function(d,i){return i>0})
      , initialDate = 'date1'
      , currentDate = initialDate
      , playStatus = false
      , tables
      , tables_index = {}
      , tableObjects = []
      , individualsObjects = data.map(function(item){
          return  {
                    x: 10 * Math.random() - 5
                  , y: 10 * Math.random() - 5
                  , radius: individualRadius
                  , table: 1
                  }
        })

    var svg = d3.select("#animation").append("svg")
        .attr("width", width)
        .attr("height", height)

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
      var tableObj = tables_index[table]
      tableObj.x = (0.5 + i%columns) * (width / columns)
      tableObj.y = (0.5 + Math.floor(i/columns)) * (height / Math.ceil(tables.length / columns))
      tableObj.radius = tableRadius
      tableObj.weight = 1
      tableObj.force = d3.layout.force()
        .friction(.1)
        .gravity(1)
        .charge(-300)

      tableObjects.push(tableObj)
    })
    
    createButtons()

    updateDistribution(initialDate)

    // Draw tables
    var tableNodes = svg.selectAll("circle.table")
        .data(tableObjects)

    tableNodes.enter().append("circle")
        .attr("class", "table")
        .attr("cx", function (d) { return d.x})
        .attr("cy", function (d) { return d.y})
        .attr("r", function (d) { return d.radius})
        .attr("fill", 'none')
        .attr("stroke", '#000')

    // Draw individuals
    var individualsNodes = svg.selectAll("circle.individuals")
        .data(individualsObjects)

    individualsNodes.enter().append("circle")
        .attr("class", "individuals")
        .attr("cx", function (d) { return d.x })
        .attr("cy", function (d) { return d.y })
        .attr("r", function (d) { return d.radius})

    var tablesForce = d3.layout.force()
      .friction(.7)
      .charge(-150)
      .size([width, height])
      .nodes(tableObjects)
      .on("tick", function(e){

        tables.forEach(function(table, i){
          tables_index[table].force.start().alpha(tablesForce.alpha()).tick()
        })

        tableNodes
          .each(collide(.1, tableObjects))
          .attr("cx", function (d) { return d.x })
          .attr("cy", function (d) { return d.y })

        individualsNodes
          .each(function(d){
            d.x += tables_index[d.table].x
            d.y += tables_index[d.table].y
          })
          .each(collide(.1, individualsObjects))
          .attr("cx", function (d) { return d.x })
          .attr("cy", function (d) { return d.y })
          .each(function(d){
            d.x -= tables_index[d.table].x
            d.y -= tables_index[d.table].y
          })

        tables.forEach(function(table, i){
          tables_index[table].force.stop()
        })

      })

    window.switchTo = function(date){
      currentDate = date
      
      tablesForce.stop()   
      
      updateDistribution(currentDate)
      // force.links(linksData)
      var divs = document.querySelectorAll('#settings div.date-selector')
      for(i in divs){
        divs[i].className = 'date-selector'
      }
      document.querySelector('#'+date).className = 'date-selector active'

      tablesForce.start()
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

    function collide(alpha, nodesData) {
      var quadtree = d3.geom.quadtree(nodesData)
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

    function updateDistribution(date){
      // Items per table: rebuild
      tables.forEach(function(table){
        var tableObj = tables_index[table]

        tableObj.items = []
        tableObj.force.nodes(tableObj.items)
      })

      data.forEach(function(item, i){
        var table = item[date]
          , tableObj = tables_index[table]
          , oldtable = individualsObjects[i].table
          , oldtableObj = tables_index[oldtable]
          , individualsObject = individualsObjects[i]

        individualsObject.table = table
        individualsObject.x -= tableObj.x - oldtableObj.x
        individualsObject.y -= tableObj.y - oldtableObj.y
        
        tableObj.items.push(individualsObjects[i])
        
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