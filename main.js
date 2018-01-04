const TASTEDIVE_API_ENDPOINT         = "https://tastedive.com/api/similar",
      GOOGLE_BOOKS_API_ENDPOINT      = "https://www.googleapis.com/books/v1/volumes",
      LIBRIVOX_API_ENDPOINT          = "https://librivox.org/api/feed/audiobooks/",
      IDREAMBOOKS_API_ENDPOINT       = "http://idreambooks.com/api/books/reviews.json",
      MUSICGRAPH_API_ENDPOINT        = "http://api.musicgraph.com/api/v2/artist/",
      LAST_FM_API_ENDPOINT           = "http://ws.audioscrobbler.com/2.0/";
      THEMOVIEDB_SEARCH_API_ENDPOINT = "https://api.themoviedb.org/3/search/movie",
      THEMOVIEDB_MOVIE_API_ENDPOINT  = "https://api.themoviedb.org/3/movie/",
      MOVIE_POSTER_URL               = "http://image.tmdb.org/t/p/w780",
      APP_STATE = {
                    resultType:     null,
                    results:        [],
                    sidebarItems:   [],
                    resultMetadata: { librivox:    null,
                                      book:        { },
                                      music:       { },
                                      movie:       { }
                                    }
                  };

function scrollToNextSection() {
  let $currentSec = $("section:not(.hidden)"),
      $nextSec    = $currentSec.next(),
      $nextInput  = $nextSec.find("input");
  
  $currentSec.toggleClass("hidden");
  $nextSec   .toggleClass("hidden");
  
  // Toggle focus on input if there is one
  if ($nextInput.length > 0) {
    $nextInput.focus();
  }
}

function generateLoadingHTML() {
  let typeTxt = $("#result-type").find(":selected").attr("data-val");
  $("#result-type-txt").text(typeTxt);
}

function inputEventHandler(event) {
  if (event.key === "Enter") {
    // If last input section, query TasteDive
    if (event.target.id === "favorite-movie-txt") {
      getRecommendationFromTasteDive();
      generateLoadingHTML();
    }
    
    scrollToNextSection();
  }
}

function dummyCallback(response) { console.log("dummy"); }

function generateReviewHTML(review) {
  let $review  = $("<article>"),
      $author  = $("<h1>"),
      $content = $("<p>");
  
  $author.html(`<a href=${review.url}>${review.author}</a>`);
  $author.addClass("review-author");
  $content.text(review.content);
  $content.addClass("review-content");
  $review.append( [$author, $content] );
  $review.addClass("review");
  
  return $review;
}

function generateReviewSection($reviewDiv) {
  let reviewsHTML = [];
      
  APP_STATE.resultMetadata.book.critic_reviews.forEach(review => reviewsHTML.push(generateReviewHTML(review)));
  
  $reviewDiv.append(reviewsHTML);
}

function generateBookResultHTML(returnObj) {
  let $infoDiv       = $("<div>"),
      $reviewDiv     = $("<div>"),
      menu           = [],
      book           = APP_STATE.results[0],
      bookInfoPath   = APP_STATE.resultMetadata.book;
  
  // Set image attributes
  returnObj.bannerImg.src = bookInfoPath.imageLinks.thumbnail;
  returnObj.bannerImg.alt = `Cover of ${book}`;
  
  // Begin generating div content
  returnObj.contentWrapper.divs = [];
  
  // Create main info section
  let infoFields = ["title", "sub_title", "author", "description"],
      bookInfo   = extractInfo(bookInfoPath, infoFields);
  generateInfoHTML($infoDiv, bookInfo);
  
  $infoDiv.attr("id", "result-info");
  returnObj.contentWrapper.divs.push($infoDiv);
  menu.push("info");
  
  // Generate reviews
  if (bookInfoPath.critic_reviews && bookInfoPath.critic_reviews.length > 0) {
    generateReviewSection($reviewDiv);
  
    $reviewDiv.attr("id", "result-reviews");
    $reviewDiv.addClass("hidden");
    returnObj.contentWrapper.divs.push($reviewDiv);
    menu.push("reviews");
  }
  
  // Generate menu elements
  returnObj.resultsMenu = generateMenu(menu);
  
  return returnObj;
}

function generateAlbumHTML(album) {
  let $album = $("<li>"),
      $year  = $("<span>");
  
  $year.addClass("album-year");
  $year.text(album.release_year);
  
  $album.addClass("album");
  $album.text(`${album.title} `);
  $album.append($year);
  
  return $album;
}

function generateAlbumsSection($albumsSec) {
  let albumsHTML = [],
      $albumList = $("<ul>");
      
  APP_STATE.resultMetadata.music.albums.forEach(album => albumsHTML.push(generateAlbumHTML(album)));
  
  $albumList.append(albumsHTML);
  
  $albumsSec.append($albumList);
  $albumsSec.addClass("discography");
}

function extractInfo(infoPath, infoNameArr) {
  let infoObj = {};
  
  for (let n = 0; n < infoNameArr.length; n++) {
    let infoName = infoNameArr[n];
    
    // Make sure infoName is even in the infoPath, else skip
    if (infoPath.hasOwnProperty(infoName) && infoPath[infoName]) {
      // infoPath[infoName] could be an array of values
      // if so, we don't want to put it into another array
      if (infoPath[infoName] instanceof Array) {
        infoObj[infoName] = infoPath[infoName];
      } else {
        infoObj[infoName] = [ infoPath[infoName] ];
      }
    }
  }
  
  return infoObj;
}

function generateInfoHTML($infoDiv, infoObj) {
  for (let info in infoObj) {
    if (infoObj.hasOwnProperty(info)) {
      let infoHTML = `<p><b>${info}</b>: ${infoObj[info].join(", ")}</p>`;
      $infoDiv.append(infoHTML);
    }
  }
}

function generateMusicResultHTML(returnObj) {
  let $infoDiv       = $("<div>"),
      $discoDiv      = $("<div>"),
      menu           = [],
      artist         = APP_STATE.results[0],
      artistInfoPath = APP_STATE.resultMetadata.music;
  
  // Set image
  returnObj.bannerImg.src = artistInfoPath.image[4]["#text"];
  returnObj.bannerImg.alt = `Picture of ${artist}`;
  
  // Begin generating div content
  returnObj.contentWrapper.divs = [];
  
  // Create main info section
  let infoFields = ["name", "main_genre", "decade", "country_of_origin", "bio"];
  let artistInfo = extractInfo(artistInfoPath, infoFields);
  generateInfoHTML($infoDiv, artistInfo);
  
  $infoDiv.attr("id", "result-info");
  returnObj.contentWrapper.divs.push($infoDiv);
  menu.push("info");
  
  // Generate discography
  generateAlbumsSection($discoDiv);
  
  $discoDiv.attr("id", "result-albums");
  $discoDiv.addClass("hidden");
  returnObj.contentWrapper.divs.push($discoDiv);
  menu.push("albums");
  
  // Generate menu elements
  returnObj.resultsMenu = generateMenu(menu);
  
  return returnObj;
}

function extractMovieReviews(movieInfoPath) {
  let reviews          = movieInfoPath.reviews.results,
      processedReviews = [];
      
  reviews.forEach(review => processedReviews.push(generateReviewHTML(review)));
  
  return processedReviews;
}

function generateMenu(menuItemsArr) {
  let liItems = [],
      $li;
      
  for (let n = 0; n < menuItemsArr.length; n++) {
    $li = $("<li>");
    $li.text(menuItemsArr[n]);
    $li.addClass("menu-item");
    
    liItems.push($li);
  }
  
  return liItems;
}

function generateMovieResultHTML(returnObj) {
  let $infoDiv      = $("<div>"),
      $trailerDiv   = $("<div>"),
      $reviewsDiv   = $("<div>"),
      $moreDiv      = $("<div>"),
      menu          = [], // Will be used to generate <li> navigational elements
      movieInfoPath = APP_STATE.resultMetadata.movie,
      movieName     = APP_STATE.results[0];
  
  // Set $image values
  returnObj.bannerImg.src = MOVIE_POSTER_URL + movieInfoPath.poster_path;
  returnObj.bannerImg.alt = `Poster for ${movieName}`;
  
  // Gather important data about movie and assemble into $infoDiv
  returnObj.contentWrapper.divs = [];
  
  let infoFields = ["cast", "producer", "director", "screenplay", "overview", "genres", "release_date"];
  let movieInfo = extractInfo(movieInfoPath, infoFields);
  generateInfoHTML($infoDiv, movieInfo);
  
  $infoDiv.attr("id", "result-info");
  returnObj.contentWrapper.divs.push($infoDiv);
  menu.push("info");
  
  // Create trailer div
  let trailers = movieInfoPath.videos.results.filter(elem => elem.name.search(/trailer/i) > -1);
  if (trailers.length > 0) {
    let youtubeId = trailers[0].key;
    $trailerDiv.html(`<iframe id="ytplayer" type="text/html" width="640" height="360" src="https://www.youtube.com/embed/${youtubeId}?rel=0&showinfo=0" frameborder="0"></iframe>`);
    
    // Push trailer to the navigational menu
    $trailerDiv.attr("id", "result-trailer");
    $trailerDiv.addClass("hidden");
    returnObj.contentWrapper.divs.push($trailerDiv);
    menu.push("trailer");
  }
  
  // Create review div
  let reviews = extractMovieReviews(movieInfoPath);
  if (reviews.length > 0) {
    $reviewsDiv.append(reviews);
    
    // Push reviews to the navigational menu
    $reviewsDiv.attr("id", "result-reviews");
    $reviewsDiv.addClass("hidden");
    returnObj.contentWrapper.divs.push($reviewsDiv);
    menu.push("reviews");
  }
  
  // Generate menu elements
  returnObj.resultsMenu = generateMenu(menu);
  
  return returnObj;
}

function markLoadingAsComplete() {
  $("#result-name").text(APP_STATE.results[0]);
  displayUserMessage();
  $("#loading-results").keypress(inputEventHandler);
  $("#loading-results p.user-msg span.keyboard").focus();
}

function renderResultToDOM() {
  let htmlObject = { bannerImg:      {},
                     contentWrapper: {},
                     resultsMenu:    []
                   };
  if (APP_STATE.resultType === "books") {
    generateBookResultHTML(htmlObject);
  } else if (APP_STATE.resultType === "music") {
    generateMusicResultHTML(htmlObject);
  } else if (APP_STATE.resultType === "movie") {
    generateMovieResultHTML(htmlObject);
  } else {
    
  }
  
  let $banner         = $("#banner-img"),
      $contentWrapper = $("#content-wrapper"),
      $resultsMenu    = $("#results-menu");
      
  $banner.attr("src", htmlObject.bannerImg.src);
  $banner.attr("alt", htmlObject.bannerImg.alt);
  
  $contentWrapper.append(htmlObject.contentWrapper.divs);
  
  htmlObject.resultsMenu[0].addClass("menu-item-active");
  $resultsMenu.append(htmlObject.resultsMenu);
  
  // Indicate that loading is over
  markLoadingAsComplete();
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
  let newTitle = stripArticleFromTitle(title);
  const query = { title:     newTitle,
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
  let responseObj = { author:    response.book.author,
                      genre:     response.book.genre,
                      sub_title: response.book.sub_title,
                      title:     response.book.title,
                      pages:     response.book.pages,
                      critic_reviews: []
  };
  
  response.book.critic_reviews.forEach(elem => responseObj.critic_reviews.push(
    {
      url:     elem.review_link,
      author:  elem.source,
      content: elem.snippet,
      date:    elem.review_date,
      stars:   elem.star_rating
  }));
  
  Object.assign(APP_STATE.resultMetadata.book, responseObj);
  
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
  APP_STATE.resultMetadata.book = response.items[0].volumeInfo
  
  let isbn = APP_STATE.resultMetadata.book.industryIdentifiers[0].identifier;
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

function processLastFmResponse(response) {
  Object.assign(APP_STATE.resultMetadata.music, response.artist);
  APP_STATE.resultMetadata.music.bio = APP_STATE.resultMetadata.music.bio.content;
  
  renderResultToDOM();
}

function getArtistInformationFromLastFm(artistName) {
  let query = { method: "artist.getinfo",
                artist:  artistName,
                api_key: LAST_FM_KEY,
                format: "json"
              };
  
  queryAPI( LAST_FM_API_ENDPOINT,
           "json",
            query,
            processLastFmResponse,
            function(xhr, status) {console.log(xhr, status);}
          );
}

function processMusicGraphAlbumResponse(response) {
  APP_STATE.resultMetadata.music.albums = response.data;
  
  getArtistInformationFromLastFm(APP_STATE.results[0]);
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
  Object.assign(APP_STATE.resultMetadata.music, response.data[0]);
  
  getArtistAlbums(APP_STATE.resultMetadata.music.id);
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
  Object.assign(APP_STATE.resultMetadata.movie, response);
  
  // Pre-process some elements of the response to set up for easier HTML generation
  APP_STATE.resultMetadata.movie.cast   = [];
  APP_STATE.resultMetadata.movie.genres = [];
  
  let cast   = response.credits.cast.filter( (elem, idx) => idx < 4);
      crew   = response.credits.crew.filter(elem => elem.job.search(/^Director$|^Screenplay$|^Producer$/i) > -1),
      genres = response.genres;
      
  cast.forEach(castMember => APP_STATE.resultMetadata.movie.cast.push(castMember.name));
  crew.forEach(crewMember => APP_STATE.resultMetadata.movie[crewMember.job.toLowerCase()] = crewMember.name);
  genres.forEach(genre => APP_STATE.resultMetadata.movie.genres.push(genre.name));
  
  renderResultToDOM();
}

function getMovieInformation(movieId) {
  let query = { api_key: THEMOVIEDB_KEY,
                append_to_response: "videos,images,reviews,credits"
              };
          
  queryAPI( THEMOVIEDB_MOVIE_API_ENDPOINT + movieId,
           "json",
            query,
            processMovieInformation,
            function(xhr, status) {console.log(xhr, status);}
          );
}

function processTheMovieDbSearchResponse(response) {
  APP_STATE.resultMetadata.movie = response.results[0];
  getMovieInformation(APP_STATE.resultMetadata.movie.id);
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
  APP_STATE.resultType = $("#result-type").find(":selected").val();
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

function switchDisplayDiv(event) {
  let $menuItemToActivate = $(event.target),
      $activeMenuItem     = $("#results-menu").find(".menu-item-active"),
      divIdDisplayed      = `#result-${$activeMenuItem.html()}`,
      divIdToDisplay      = `#result-${$menuItemToActivate.html()}`;
      
  // Switch which menu item is active
  $activeMenuItem.removeClass("menu-item-active");
  $menuItemToActivate.addClass("menu-item-active");
  
  // Switch which div is displayed
  $(divIdDisplayed).addClass("hidden");
  $(divIdToDisplay).removeClass("hidden");
}

function displayUserMessage(event = null) {
  let $userMsg = $("section:not(.hidden) .user-msg");
  $userMsg.removeClass("hidden");
}

function addEventListeners() {
  $("#result-type")       .change  (displayUserMessage);
  $("#splash-page")       .keypress(inputEventHandler);
  $("#get-favorite-book") .keypress(inputEventHandler);
  $("#favorite-book-txt") .keypress(displayUserMessage);
  $("#get-favorite-band") .keypress(inputEventHandler);
  $("#favorite-band-txt") .keypress(displayUserMessage);
  $("#get-favorite-movie").keypress(inputEventHandler);
  $("#favorite-movie-txt").keypress(displayUserMessage);
  $("#results-menu")      .on      ("click", "li", switchDisplayDiv);
}

function initApp() {
  addEventListeners();
}

$(initApp);