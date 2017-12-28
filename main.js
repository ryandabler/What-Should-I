const TASTEDIVE_API_ENDPOINT         = "https://tastedive.com/api/similar",
      GOOGLE_BOOKS_API_ENDPOINT      = "https://www.googleapis.com/books/v1/volumes",
      LIBRIVOX_API_ENDPOINT          = "https://librivox.org/api/feed/audiobooks/",
      IDREAMBOOKS_API_ENDPOINT       = "http://idreambooks.com/api/books/reviews.json",
      MUSICGRAPH_API_ENDPOINT        = "http://api.musicgraph.com/api/v2/artist/",
      SPOTIFY_API_ENDPOINT           = "https://api.spotify.com/v1/artists/",
      THEMOVIEDB_SEARCH_API_ENDPOINT = "https://api.themoviedb.org/3/search/movie",
      THEMOVIEDB_MOVIE_API_ENDPOINT  = "https://api.themoviedb.org/3/movie/",
      MOVIE_POSTER_URL               = "http://image.tmdb.org/t/p/w780/",
      APP_STATE = {
                    resultType:     null,
                    results:        [],
                    sidebarItems:   [],
                    resultMetadata: { google:      null,
                                      librivox:    null,
                                      iDreamBooks: null,
                                      musicGraph:  { artist: null,
                                                     albums: null
                                                   },
                                      spotify:     null,
                                      theMovieDb:  null
                                    }
                  };

function scrollToFavoritesInput() {
  APP_STATE.resultType = $("#result-type").find(":selected").val();
  
  $("#splash-page").addClass("hidden");
  $("#get-favorites").removeClass("hidden");
  $("#favorite-book-txt").focus();
}

function scrollToFavoriteBand(event) {
  if (event.key === "Enter") {
    // Blur input box to force the focusout event to fire.
    // This prevents duplicate API calls because all action
    // is pushed to the focusout event rather than the keypress
    // event while still maintaining the appearance of both
    // causing the app to progress.
    $("#favorite-book-txt").blur();
  } else if (event.type === "focusout") {
    $("#favorite-book").addClass("hidden");
    $("#favorite-band").removeClass("hidden");
    $("#favorite-band-txt").focus();
  }
}

function scrollToFavoriteMovie(event) {
  if (event.key === "Enter") {
    // Blur input box to force the focusout event to fire.
    // This prevents duplicate API calls because all action
    // is pushed to the focusout event rather than the keypress
    // event while still maintaining the appearance of both
    // causing the app to progress.
    $("#favorite-band-txt").blur();
  } else if (event.type === "focusout") {
    $("#favorite-band").addClass("hidden");
    $("#favorite-movie").removeClass("hidden");
    $("#favorite-movie-txt").focus();
  }
}

function scrollToResults(event) {
  if (event.key === "Enter") {
    // Blur input box to force the focusout event to fire.
    // This prevents duplicate API calls because all action
    // is pushed to the focusout event rather than the keypress
    // event while still maintaining the appearance of both
    // causing the app to progress.
    $("#favorite-movie-txt").blur();
  } else if (event.type === "focusout") {
    // Get TasteDive data
    getRecommendationFromTasteDive();
    
    $("#favorite-movie").addClass("hidden");
    $("#get-favorites").addClass("hidden");
    $("#results").removeClass("hidden");
  }
}

function dummyCallback(response) { console.log("dummy"); }

function generateReviewHTML(review) {
  let $review  = $("<article>"),
      $source  = $("<a>"),
      $snippet = $("<p>");
  
  // Process source link
  $source.attr("href", review.review_link);
  $source.addClass("review-source");
  $source.text(review.source);
  
  // Process snippet
  $snippet.addClass("review-snippet");
  $snippet.text(review.snippet);
  
  // Put everything together
  $review.addClass("book-review");
  $review.append( [$source, $snippet] );
  return $review;
}

function generateReviewSection($reviewSec) {
  let reviewsHTML = [],
      $h1         = $("<h1>");
      
  APP_STATE.resultMetadata.iDreamBooks.critic_reviews.forEach(review => reviewsHTML.push(generateReviewHTML(review)));
  
  $h1.text("Reviews");
  $h1.addClass("review-header");
  
  $reviewSec.append($h1, reviewsHTML);
  $reviewSec.addClass("book-reviews");
}

function generateBookResultHTML() {
  let $mainInfoSec = $("<section>"),
      $reviewSec   = $("<section>"),
      $coverImg    = $("<img>");
  
  // Set image attributes
  $coverImg.attr("src", APP_STATE.resultMetadata.google.imageLinks.thumbnail);
  $coverImg.attr("id", "cover-image");
  
  // Generate reviews
  generateReviewSection($reviewSec);
  
  // Create main info section
  let title   = APP_STATE.results[0],
      authors = APP_STATE.resultMetadata.google.authors,
      desc    = APP_STATE.resultMetadata.google.description,
      $title  = $("<h1>"),
      $author = $("<span>"),
      $desc   = $("<p>");
  
  $author.text(` by ${authors.join(", ")}`);
  $author.addClass("book-authors");
  
  $title.text(title);
  $title.append($author);
  $title.addClass("book-title");
  
  $desc.text(desc);
  $desc.addClass("book-description");
  
  $mainInfoSec.append( [$title, $coverImg, $desc] );
  $mainInfoSec.addClass("book-info");
  
  return [ $mainInfoSec, $reviewSec ];
}

function generateAlbumHTML(album) {
  let $album = $("<li>"),
      $year  = $("<span>");
  
  $year.addClass("album-year");
  $year.text(album.release_year);
  
  $album.addClass("album");
  $album.text(album.title);
  $album.append($year);
  
  return $album;
}

function generateAlbumsSection($albumsSec) {
  let albumsHTML = [],
      $h1        = $("<h1>");
      $albumList = $("<ul>");
      
  APP_STATE.resultMetadata.musicGraph.albums.forEach(album => albumsHTML.push(generateAlbumHTML(album)));
  
  $h1.text("Discography");
  $h1.addClass("discography-header");
  
  $albumList.append(albumsHTML);
  
  $albumsSec.append($h1, $albumList);
  $albumsSec.addClass("discography");
}

function generateMusicResultHTML() {
  let $mainInfoSec = $("<section>"),
      $albumsSec   = $("<section>"),
      $artistImg   = $("<img>");
  
  // Set image
  $artistImg.attr("src", APP_STATE.resultMetadata.spotify.images[0].url);
  $artistImg.attr("id", "cover-image");
  
  // Generate discography
  generateAlbumsSection($albumsSec);
  
  // Create main info section
  let artist  = APP_STATE.results[0],
      genre   = APP_STATE.resultMetadata.musicGraph.artist.main_genre;
      $artist = $("<h1>"),
      $genre  = $("<span>");
      
  $genre.text(`(${genre})`);
  $genre.addClass("genre");
  
  $artist.text(`${artist} `);
  $artist.append($genre);
  $artist.addClass("artist");
  
  $mainInfoSec.append( [$artist, $artistImg] );
  $mainInfoSec.addClass("artist-info");
  
  return [ $mainInfoSec, $albumsSec ];
}

function generateMovieResultHTML() {
  
}

function renderResultToDOM() {
  let htmlSections;
  
  if (APP_STATE.resultType === "books") {
    htmlSections = generateBookResultHTML();
  } else if (APP_STATE.resultType === "music") {
    htmlSections = generateMusicResultHTML();
  } else if (APP_STATE.resultType === "movie") {
    htmlSections = generateMovieResultHTML();
  } else {
    
  }
  
  $("#results").html(htmlSections);
}

function stripArticleFromTitle(title) {
  return title.replace(/^The |^An? /, "");
}

function processLibrivoxResponse(response) {
  if (response.hasOwnProperty("error")) {
    APP_STATE.resultMetadata.librivox = "error";
  } else {
    APP_STATE.resultMetadata.librivox = response.books[0];
    console.log(APP_STATE.resultMetadata.librivox);
  }
}

function getInformationFromLibrivox(title) {
  let title = stripArticleFromTitle(title);
  const query = { title:     title,
                  format:   "jsonp",
                  callback: "processLibrivoxResponse"
                };
  
  queryAPI( LIBRIVOX_API_ENDPOINT,
           "jsonp",
            query,
            dummyCallback,
            dummyCallback // Error event always fires after success callback
          );
}

function processIDreamBooksResponse(response) {
  APP_STATE.resultMetadata.iDreamBooks = response.book;
  
  renderResultToDOM();
}

function getInformationFromIDreamBooks(isbn) {
  let queryParams = { q: isbn,
                      key: IDREAMBOOKS_KEY
                    };
                    
  queryAPI( IDREAMBOOKS_API_ENDPOINT,
           "json",
            queryParams,
            processIDreamBooksResponse,
            function(xhr, status) {console.log("error",xhr, status);}
          );
}

function processGoogleResponse(response) {
  APP_STATE.resultMetadata.google = response.items[0].volumeInfo;
  
  let isbn = APP_STATE.resultMetadata.google.industryIdentifiers[0].identifier;
  getInformationFromIDreamBooks(isbn);
}

function getInformationFromGoogle(bookTitle) {
  let query = { q:          bookTitle,
                key:        GOOGLE_BOOKS_KEY,
                maxResults: 1,
                fields:    "items(volumeInfo/title,volumeInfo/authors,volumeInfo/previewLink,volumeInfo/imageLinks,volumeInfo/description,volumeInfo/industryIdentifiers)"
              };
  
  queryAPI( GOOGLE_BOOKS_API_ENDPOINT,
           "json",
            query,
            processGoogleResponse,
            function(xhr, status) {console.log(xhr, status);}
          );
}

function getBookMetadata(bookTitle) {
  getInformationFromGoogle(bookTitle);
}

function processSpotifyResponse(response) {
  APP_STATE.resultMetadata.spotify = response;
  
  renderResultToDOM();
}

function getArtistInformationFromSpotify(spotifyId) {
  queryAPI( SPOTIFY_API_ENDPOINT + spotifyId,
           "json",
            {},
            processSpotifyResponse,
            function(xhr, status) {console.log(xhr, status);},
            { "Authorization": "Bearer " + SPOTIFY_OAUTH }
          );
}

function processMusicGraphAlbumResponse(response) {
  APP_STATE.resultMetadata.musicGraph.albums = response.data;
  
  getArtistInformationFromSpotify(APP_STATE.resultMetadata.musicGraph.artist.spotify_id);
}

function getArtistAlbums(artistId) {
  let query = { api_key: MUSICGRAPH_KEY,
                id:      artistId
              };
          
  queryAPI( MUSICGRAPH_API_ENDPOINT + artistId + "/albums",
           "json",
            query,
            processMusicGraphAlbumResponse,
            function(xhr, status) {console.log(xhr, status);}
          );
}

function processMusicGraphArtistResponse(response) {
  APP_STATE.resultMetadata.musicGraph.artist = response.data[0];
  
  getArtistAlbums(APP_STATE.resultMetadata.musicGraph.artist.id);
}

function getArtistInformationFromMusicGraph(artistName) {
  let query = { api_key: MUSICGRAPH_KEY,
                name:    artistName,
                limit:   1
              };
          
  queryAPI( MUSICGRAPH_API_ENDPOINT + "search",
           "json",
            query,
            processMusicGraphArtistResponse,
            function(xhr, status) {console.log(xhr, status);}
           );
}

function getArtistMetadata(artistName) {
  getArtistInformationFromMusicGraph(artistName);
}

function processMovieInformation(response) {
  APP_STATE.resultMetadata.theMovieDb = response;
}

function getMovieInformation(movieId) {
  let query = { api_key: THEMOVIEDB_KEY,
                append_to_response: "videos,images,reviews"
              };
          
  queryAPI( THEMOVIEDB_MOVIE_API_ENDPOINT + movieId,
           "json",
            query,
            processMovieInformation,
            function(xhr, status) {console.log(xhr, status);}
          );
}

function processTheMovieDbSearchResponse(response) {
  getMovieInformation(response.results[0].id)
}

function getInformationFromTheMovieDb(movieTitle) {
  let query = { api_key: THEMOVIEDB_KEY,
                query:   movieTitle
              };
  
  queryAPI( THEMOVIEDB_SEARCH_API_ENDPOINT,
           "json",
            query,
            processTheMovieDbSearchResponse,
            function(xhr, status) {console.log(xhr, status);}
          );
}

function getMovieMetadata(movieTitle) {
  getInformationFromTheMovieDb(movieTitle);
}

function processTasteDiveResponse(response) {
  // Enter the names of the results into application state
  response.Similar.Results.forEach(elem => APP_STATE.results.push(elem.Name));
  
  if (APP_STATE.resultType === "books") {
    getBookMetadata(APP_STATE.results[0]);
  } else if (APP_STATE.resultType === "music") {
    getArtistMetadata(APP_STATE.results[0]);
  } else if (APP_STATE.resultType === "movie") {
    getMovieMetadata(APP_STATE.results[0]);
  } else {
    
  }
}

function queryAPI(endpointURL, dataType, queryObj, successCallback, errorCallback, header = null) {
  let ajaxRequestObject = {url:       endpointURL,
                           dataType:  dataType,
                           method:   "GET",
                           data:      queryObj,
                           success:   successCallback,
                           error:     errorCallback
                          };
  if (header !== null) {
    ajaxRequestObject.headers = header;
  }
  
  $.ajax(ajaxRequestObject);
}

function getRecommendationFromTasteDive() {
  const favBook    = $("#favorite-book-txt").val(),
        favBand    = $("#favorite-band-txt").val(),
        favMovie   = $("#favorite-movie-txt").val(),
        query      = { q:        `book:${favBook},music:${favBand},movie:${favMovie}`,
                       type:      APP_STATE.resultType,
                       k:         TASTEDIVE_KEY,
                       callback: "dummyCallback"
                     };
  
  queryAPI( TASTEDIVE_API_ENDPOINT,
           "jsonp",
            query,
            processTasteDiveResponse,
            function(xhr, status) {console.log("errorrrrr", xhr, status)}
          );
}

function addEventListeners() {
  $("#result-type").change(scrollToFavoritesInput);
  
  $("#favorite-book").focusout(scrollToFavoriteBand);
  $("#favorite-book").keypress(scrollToFavoriteBand);
  
  $("#favorite-band").focusout(scrollToFavoriteMovie);
  $("#favorite-band").keypress(scrollToFavoriteMovie);
  
  $("#favorite-movie").focusout(scrollToResults);
  $("#favorite-movie").keypress(scrollToResults);
}

function initApp() {
  addEventListeners();
}

$(initApp);