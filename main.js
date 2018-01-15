'use strict';

const TASTEDIVE_API_ENDPOINT         = "https://tastedive.com/api/similar",
      GOOGLE_BOOKS_API_ENDPOINT      = "https://www.googleapis.com/books/v1/volumes",
      IDREAMBOOKS_API_ENDPOINT       = "https://idreambooks.com/api/books/reviews.json",
      MUSICGRAPH_API_ENDPOINT        = "http://api.musicgraph.com/api/v2/artist/",
      LAST_FM_API_ENDPOINT           = "http://ws.audioscrobbler.com/2.0/",
      THEMOVIEDB_SEARCH_API_ENDPOINT = "https://api.themoviedb.org/3/search/movie",
      THEMOVIEDB_MOVIE_API_ENDPOINT  = "https://api.themoviedb.org/3/movie/",
      MOVIE_POSTER_URL               = "http://image.tmdb.org/t/p/w780",
      APP_STATE = {
                    resultType:     null,
                    results:        [],
                    sidebarItems:   [],
                    resultMetadata: { book:        { },
                                      music:       { },
                                      movie:       { }
                                    }
                  };

function scrollToNextSection() {
  const $currentSec = $("section:not(.hidden)"),
        $nextSec    = $currentSec.next(),
        $nextInput  = $nextSec.find("input");
  
  $currentSec.toggleClass("hidden");
  $nextSec   .toggleClass("hidden");
  $(document).off("keypress");
  
  // Toggle focus on input if there is one
  if ($nextInput.length > 0) {
    $nextInput.focus();
  }
}

function generateLoadingHTML() {
  const typeTxt = $("#result-type").find(":selected").attr("data-val");
  $("#result-type-txt").text(typeTxt);
}

function inputEventHandler(event) {
  if (event.key === "Enter" || event.type === "click") {
    // If last input section, query TasteDive
    if ($("section:not(.hidden)").attr("id") === "get-favorite-movie") {
      getRecommendationFromTasteDive();
      generateLoadingHTML();
    }
    
    scrollToNextSection();
  }
}

function dummyCallback(response) { console.log("dummy"); }

function generateReviewHTML(review) {
  const $review  = $("<article>"),
        $author  = $("<h1>"),
        $content = $("<p>");
  
  $author.html(`<a href=${review.url} target="_blank">${review.author}</a>`);
  $author.addClass("review-author");
  $content.text(review.content);
  $content.addClass("review-content");
  $review.append( [$author, $content] );
  $review.addClass("review");
  
  return $review;
}

function generateReviewSection() {
  return APP_STATE.resultMetadata.book.critic_reviews.map(review => generateReviewHTML(review));
}

function generateBookResultHTML() {
  const returnObj = { bannerImg:      {},
                      contentWrapper: {},
                      resultsMenu:    []
                    },
        $infoDiv       = $("<div>"),
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
  const infoFields = ["title", "sub_title", "author", "description"],
        bookInfo   = extractInfo(bookInfoPath, infoFields);
  generateInfoHTML($infoDiv, bookInfo);
  
  $infoDiv.attr("id", "result-info");
  returnObj.contentWrapper.divs.push($infoDiv);
  menu.push("info");
  
  // Generate reviews
  if (bookInfoPath.critic_reviews && bookInfoPath.critic_reviews.length > 0) {
    let reviewsHTML = generateReviewSection();
    
    $reviewDiv.append(reviewsHTML);
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
  const $album = $("<li>"),
        $year  = $("<span>");
  
  $year.addClass("album-year");
  $year.text(album.release_year);
  
  $album.addClass("album");
  $album.text(`${album.title} `);
  $album.append($year);
  
  return $album;
}

function generateAlbumsSection($albumsSec) {
  const albumsHTML = APP_STATE.resultMetadata.music.albums.map(album => generateAlbumHTML(album)),
        $albumList = $("<ul>");
  
  $albumList.append(albumsHTML);
  
  $albumsSec.append($albumList);
  $albumsSec.addClass("discography");
}

function extractInfo(infoPath, infoNameArr) {
  const infoObj = {};
  
  infoNameArr.forEach(infoName => {
    // Make sure infoName is in the infoPath and not null/undefined, else skip
    if (infoPath.hasOwnProperty(infoName) && infoPath[infoName]) {
      // infoPath[infoName] could be an array of values
      // if so, we don't want to put it into another array
      if (infoPath[infoName] instanceof Array) {
        infoObj[infoName] = infoPath[infoName];
      } else {
        infoObj[infoName] = [ infoPath[infoName] ];
      }
    }
  });
  
  return infoObj;
}

function generateInfoHTML($infoDiv, infoObj) {
  for (let info in infoObj) {
    if (infoObj.hasOwnProperty(info)) {
      // infoObj[info] will be an array, so join all elements together
      // separated by commas
      let infoHTML = `<p><b>${info}</b>: ${infoObj[info].join(", ")}</p>`;
      $infoDiv.append(infoHTML);
    }
  }
}

function generateMusicResultHTML() {
  const returnObj = { bannerImg:      {},
                      contentWrapper: {},
                      resultsMenu:    []
                    },
        $infoDiv       = $("<div>"),
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
  const infoFields = ["name", "main_genre", "decade", "country_of_origin", "bio"],
        artistInfo = extractInfo(artistInfoPath, infoFields);
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
  return movieInfoPath.reviews.results.map(review => generateReviewHTML(review));
}

function generateMenu(menuItemsArr) {
  const liItems = menuItemsArr.map(menuItem => {
    const $li = $("<li>");
    $li.text(menuItem);
    $li.addClass("menu-item");
    $li.attr("tabindex", 0);
    $li.attr("role","button");
    $li.attr("aria-pressed", "false");
    return $li;
  });
  
  return liItems;
}

function generateMovieResultHTML() {
  const returnObj = { bannerImg:      {},
                      contentWrapper: {},
                      resultsMenu:    []
                    },
        $infoDiv      = $("<div>"),
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
  
  const infoFields = ["cast", "producer", "director", "screenplay", "overview", "genres", "release_date"],
        movieInfo = extractInfo(movieInfoPath, infoFields);
  generateInfoHTML($infoDiv, movieInfo);
  
  $infoDiv.attr("id", "result-info");
  returnObj.contentWrapper.divs.push($infoDiv);
  menu.push("info");
  
  // Create trailer div
  const trailers = movieInfoPath.videos.results.filter(elem => elem.name.search(/trailer/i) > -1);
  if (trailers.length > 0) {
    const youtubeId = trailers[0].key;
    $trailerDiv.html(`<iframe id="ytplayer" type="text/html" width="640" height="360" src="https://www.youtube.com/embed/${youtubeId}?rel=0&showinfo=0" frameborder="0"></iframe>`);
    
    // Push trailer to the navigational menu
    $trailerDiv.attr("id", "result-trailer");
    $trailerDiv.addClass("hidden");
    returnObj.contentWrapper.divs.push($trailerDiv);
    menu.push("trailer");
  }
  
  // Create review div
  const reviews = extractMovieReviews(movieInfoPath);
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
}

function renderResultToDOM() {
  let htmlObject;
  if (APP_STATE.resultType === "books") {
    htmlObject = generateBookResultHTML();
  } else if (APP_STATE.resultType === "music") {
    htmlObject = generateMusicResultHTML();
  } else if (APP_STATE.resultType === "movie") {
    htmlObject = generateMovieResultHTML();
  } else {
    
  }
  
  const $banner         = $("#banner-img"),
        $contentWrapper = $("#content-wrapper"),
        $resultsMenu    = $("#results-menu");
  
  $banner.attr("src", htmlObject.bannerImg.src);
  $banner.attr("alt", htmlObject.bannerImg.alt);
  
  $contentWrapper.append(htmlObject.contentWrapper.divs);
  
  // Set first menu item as the active one
  htmlObject.resultsMenu[0].addClass("menu-item-active")
                           .attr("aria-pressed", "true");
  $resultsMenu.append(htmlObject.resultsMenu);
  
  // Indicate that loading is over
  markLoadingAsComplete();
}

function getInformationFromIDreamBooks(isbn) {
  const query = { q:   isbn,
                  key: IDREAMBOOKS_KEY
                };
                    
  return queryAPI( IDREAMBOOKS_API_ENDPOINT,
                  "json",
                   query
                 );
}

function getInformationFromGoogle(bookTitle) {
  const query = { q:          bookTitle,
                  key:        GOOGLE_BOOKS_KEY,
                  maxResults: 1,
                  fields:    "items(volumeInfo/title,volumeInfo/authors,volumeInfo/previewLink,volumeInfo/imageLinks,volumeInfo/description,volumeInfo/industryIdentifiers)"
                };
  
  return queryAPI( GOOGLE_BOOKS_API_ENDPOINT,
                  "json",
                   query
                 );
}

function processBookPromises(data) {
  const [ iDreamBooksData ] = data,
        dataObj = { author:    iDreamBooksData.book.author,
                    genre:     iDreamBooksData.book.genre,
                    sub_title: iDreamBooksData.book.sub_title,
                    title:     iDreamBooksData.book.title,
                    pages:     iDreamBooksData.book.pages
                  };
  
  dataObj.critic_reviews = iDreamBooksData.book.critic_reviews.map(elem =>
  ({
    url:     elem.review_link,
    author:  elem.source,
    content: elem.snippet,
    date:    elem.review_date,
    stars:   elem.star_rating
  }));
  
  Object.assign(APP_STATE.resultMetadata.book, dataObj);
  
  renderResultToDOM();
}

async function getBookMetadata(bookTitle) {
  const googleResponse          = await getInformationFromGoogle(bookTitle);
  APP_STATE.resultMetadata.book = googleResponse.items[0].volumeInfo;
    
  const isbn = APP_STATE.resultMetadata.book.industryIdentifiers[0].identifier;
  
  Promise.all([
    getInformationFromIDreamBooks(isbn),
  ])
    .then(processBookPromises)
    .catch(processError);
}

function processMusicPromises(data) {
  const [ albumData, lastFMData ] = data;
  
  APP_STATE.resultMetadata.music.albums = albumData;
  Object.assign(APP_STATE.resultMetadata.music, lastFMData.artist);
  
  renderResultToDOM();
}

function getArtistInformationFromLastFm(artistName) {
  const query = { method: "artist.getinfo",
                  artist:  artistName,
                  api_key: LAST_FM_KEY,
                  format: "json"
                };
  
  return queryAPI( LAST_FM_API_ENDPOINT,
                  "json",
                   query
                 );
}

function getArtistAlbums(artistId) {
  const query = { api_key: MUSICGRAPH_KEY,
                  id:      artistId
                };
          
  return queryAPI( MUSICGRAPH_API_ENDPOINT + artistId + "/albums",
                  "json",
                   query
                 );
}

function getArtistInformationFromMusicGraph(artistName) {
  const query = { api_key: MUSICGRAPH_KEY,
                  name:    artistName,
                  limit:   1
                };
          
  return queryAPI( MUSICGRAPH_API_ENDPOINT + "search",
                  "json",
                   query
                 );
}

async function getArtistMetadata(artistName) {
  const musicGraphResponse = await getArtistInformationFromMusicGraph(artistName).catch(processError);
  
  if (musicGraphResponse) {
    APP_STATE.resultMetadata.music = musicGraphResponse.data[0];
      
    const artistId = APP_STATE.resultMetadata.music.id;
    
    Promise.all([
      getArtistAlbums(artistId),
      getArtistInformationFromLastFm(artistName)
    ])
      .then(processMusicPromises)
      .catch(processError);
  }
}

function processError(error) {
  markLoadingAsComplete();
  
  $("#results-wrapper").html(`<p class="large-text">Oops! We had a problem generating your ${APP_STATE.resultType} recommendation.</p>
  <p>The technical details are: ${error.responseText}</p>`);
}

function processMoviePromises(data) {
  const [ movieDbData ] = data;
  Object.assign(APP_STATE.resultMetadata.movie, movieDbData);
  
  // Pre-process some elements of the movieDbData to set up for easier HTML generation
  const cast   = movieDbData.credits.cast.filter( (elem, idx) => idx < 4),
        crew   = movieDbData.credits.crew.filter(elem => elem.job.search(/^Director$|^Screenplay$|^Producer$/i) > -1),
        genres = movieDbData.genres;
  
  APP_STATE.resultMetadata.movie.cast   = cast.map(elem => elem.name);
  APP_STATE.resultMetadata.movie.genres = genres.map(elem => elem.name);
  crew.forEach(crewMember => APP_STATE.resultMetadata.movie[crewMember.job.toLowerCase()] = crewMember.name);
  
  renderResultToDOM();
}

function getMovieInformation(movieId) {
  const query = { api_key: THEMOVIEDB_KEY,
                  append_to_response: "videos,images,reviews,credits"
                };
          
  return queryAPI( THEMOVIEDB_MOVIE_API_ENDPOINT + movieId,
                  "json",
                   query
                 );
}

function getInformationFromTheMovieDb(movieTitle) {
  const query = { api_key: THEMOVIEDB_KEY,
                  query:   movieTitle
                };
  
  return queryAPI( THEMOVIEDB_SEARCH_API_ENDPOINT,
                  "json",
                   query
                 );
}

async function getMovieMetadata(movieTitle) {
  const theMovieDbResponse       = await getInformationFromTheMovieDb(movieTitle).catch(processError);
  APP_STATE.resultMetadata.movie = theMovieDbResponse.results[0];
    
  const movieId = APP_STATE.resultMetadata.movie.id;
  
  Promise.all([
    getMovieInformation(movieId),
  ])
    .then(processMoviePromises)
    .catch(processError);
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

function queryAPI(endpointURL, dataType, queryObj) {
  const ajaxRequestObject = {url:       endpointURL,
                             dataType:  dataType,
                             method:   "GET",
                             data:      queryObj
                            };
  
  return $.ajax(ajaxRequestObject);
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
            query
          )
    .then(processTasteDiveResponse);
}

function switchDisplayDiv(event) {
  if (event.key === "Enter" || event.type === "click") {
    const $menuItemToActivate = $(event.target),
          $activeMenuItem     = $("#results-menu").find(".menu-item-active"),
          divIdDisplayed      = `#result-${$activeMenuItem.html()}`,
          divIdToDisplay      = `#result-${$menuItemToActivate.html()}`;
        
    // Switch which menu item is active
    $activeMenuItem.removeClass("menu-item-active")
                   .attr("aria-pressed", "false");
    $menuItemToActivate.addClass("menu-item-active")
                       .attr("aria-pressed", "true");
    
    // Switch which div is displayed
    $(divIdDisplayed).addClass("hidden");
    $(divIdToDisplay).removeClass("hidden");
  }
}

function displayUserMessage(event = null) {
  if (event && event.key !== "Enter") {
    const $userMsg = $("section:not(.hidden) .user-msg");
    $userMsg.removeClass("hidden");
    
    //Remove old event listener on event.target and replace
    $(event.target).off();
    $(event.target).keypress(inputEventHandler);
    $(document).keypress(inputEventHandler);
  } else if (event === null) {
    const $userMsg = $("section:not(.hidden) .user-msg");
    $userMsg.removeClass("hidden");
    $(document).keypress(inputEventHandler);
  }
}

function resetApp() {
  // Reset APP_STATE
  APP_STATE.resultType           = null,
  APP_STATE.results              = [],
  APP_STATE.sidebarItems         = [],
  APP_STATE.resultMetadata.book  = { },
  APP_STATE.resultMetadata.music = { },
  APP_STATE.resultMetadata.movie = { };
  
  // Reset DOM elements
  $("#result-name").empty();
  $("#results-menu").empty();
  $("#content-wrapper div").remove();
  
  // Reset all inputs
  $("#result-type").val("_");
  $("input").val("");
  
  // Reset all event listeners
  $("*").off();
  addEventListeners();
  
  // Hide user messages
  $("p.user-msg").addClass("hidden");
  
  // Switch to beginning
  const $currentSec = $("section:not(.hidden)"),
        $firstSec   = $("#splash-page");
  
  $currentSec.addClass("hidden");
  $firstSec.removeClass("hidden");
}

function addEventListeners() {
  $("#result-type")       .change  (displayUserMessage);
  $(".user-msg")          .click   (inputEventHandler);
  $("#favorite-book-txt") .keypress(displayUserMessage);
  $("#favorite-band-txt") .keypress(displayUserMessage);
  $("#favorite-movie-txt").keypress(displayUserMessage);
  $("#results-menu")      .on      ("click", "li", switchDisplayDiv);
  $("#results-menu")      .on      ("keypress", "li", switchDisplayDiv);
  $("#reset-btn")         .click   (resetApp);
}

function initApp() {
  addEventListeners();
}

$(initApp);