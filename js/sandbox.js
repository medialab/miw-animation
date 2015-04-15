

;(function(undefined){
  var url = "data/source.csv"
    , data

  d3.csv(url, function(error, csv){
    if(error) return console.warn(error)
    data = csv

    console.log(csv)
  })
})();