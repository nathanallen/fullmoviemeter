document.addEventListener('DOMContentLoaded', function(){
  App.init() 
})

var App = {
  movieData: [], 
  init: function(){
    this.viewControl = ViewControl
    this.rottenAPI = RottenAPI
    this.redditAPI = RedditAPI
    //this.fullMovieListings = []
    this.getMoviesAndRatings()
  },
  getMoviesAndRatings: function(){
    this.redditAPI.getMovies(function(movieList){
      App.rottenAPI.getRatings(movieList, 'combineResults')
    })
  },
  combineResults: function(movie,data){
    if (data.movies[0]){
      movie.audience_rating = data.movies[0].ratings.audience_score
      movie.critics_rating = data.movies[0].ratings.critics_score
    }
    //this.fullMovieListings.push(movie)
    this.viewControl.buildAndAppendMovie(movie)
  },
}

var ViewControl = {
  target: document.body.children[0],
  addMovies: function(movieData){
    movieData.forEach(
      ViewControl.buildAndAppendMovie(movie)
    )
  },
  buildAndAppendMovie: function(movie){
    htmlString = ("<div class=\"movieListing\">")
    htmlString += ("<strong>")
    htmlString += ("<a href=\"" + movie.youtube_url + "\">") + movie.title + "</a>" 
    htmlString += ("</strong> ")
    htmlString += (movie.year + "<br>")
    if (movie.audience_rating & movie.critics_rating){
      htmlString += ("Ratings: " + (movie.audience_rating || "none") + " / " + (movie.critics_rating || "none"))
    } else {
      htmlString += ("No Reviews")
    }
    htmlString += ("</div>")
    this.addMovie(htmlString)
  },
  addMovie: function(htmlString){
    this.target.insertAdjacentHTML('afterend', htmlString)
  }
}

var RottenAPI = {
  base_url: "http://api.rottentomatoes.com/api/public/v1.0",
  getRatings: function(movieList,callbackStr){
    this.callbackStr = callbackStr
    movieList.forEach(function(movie,i){
      setTimeout(function(){
        RottenAPI.getAndParseRatings(movie)
      },i*200)
    })
  },
  getAndParseRatings: function(movie){
    RottenAPI.getRatingsJSON(movie.title,function(data){
      App[RottenAPI.callbackStr](movie,data)
    })
  },
  getRatingsJSON: function(title,callback){
    $.ajax({
      url: RottenAPI.buildUrl(title),
      dataType: "jsonp",
      success: callback
    })
  },
  buildUrl: function(query){
    request_url = this.base_url
    request_url += "/movies.json?"
    request_url += "q=" + encodeURI(query)
    request_url += "&page_limit=5&page=1&apikey="
    request_url += Secret.rotten_key
    return request_url
  }
}

var RedditAPI = {
  movieData: [],
  baseUrl: "http://www.reddit.com/r/fullmoviesonyoutube.json",
  getMovies: function(callback){
    $.get(this.baseUrl).done(function(response){
      $(response.data.children).each(function(){
        var listingData = RedditAPI.cherryPick(this.data)
        if (!(listingData.title == "" & listingData.year == NaN)){
          RedditAPI.movieData.push(listingData)
        }
      })
      callback(RedditAPI.movieData)
    })
  },
  cherryPick: function(json){
    var listingData = this.parseTitle(json.title)
    listingData.youtube_url = json.url
    return listingData
  },
  parseTitle: function(title){   //e.g. "Fist of the North Star (1986) [360p]"
    var endOfTitle = title.search(/\s\(\d{4}\)/)
    var y = parseInt(title.substr(endOfTitle+2,4))
    var t = title.substr(0,endOfTitle)
    return {title: t, year: y}
  }
}



