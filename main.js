const TASTEDIVE_API_ENDPOINT = "https://tastedive.com/api/similar";
const APP_STATE = {
                    resultType: null,
                    resultItems: []
                  };

function scrollToFavoritesInput() {
  APP_STATE.resultType = $("#result-type").find(":selected").val();
  
  $("#splash-page").addClass("hidden");
  $("#get-favorites").removeClass("hidden");
}

function scrollToFavoriteBand(event) {
  if (event.key === "Enter") {
    $("#favorite-book").blur();
  } else if (event.type === "focusout") {
    $("#favorite-book").addClass("hidden");
    $("#favorite-band").removeClass("hidden");
  }
}

function scrollToFavoriteMovie(event) {
  if (event.key === "Enter") {
    $("#favorite-band").blur();
  } else if (event.type === "focusout") {
    $("#favorite-band").addClass("hidden");
    $("#favorite-movie").removeClass("hidden");
  }
}

function scrollToResults(event) {
  if (event.key === "Enter") {
    $("#favorite-movie-txt").blur();
  } else if (event.type === "focusout") {
    // Get TasteDive data
    getRecommendationFromTasteDive();
    
    $("#favorite-movie").addClass("hidden");
    $("#get-favorites").addClass("hidden");
    $("#results").removeClass("hidden");
  }
}

function dummyCallback(response) {}

function getRecommendationFromTasteDive() {
  const favBook    = $("#favorite-book-txt").val(),
        favBand    = $("#favorite-band-txt").val(),
        favMovie   = $("#favorite-movie-txt").val(),
        query      = { q:        `book:${favBook},music:${favBand},movie:${favMovie}`,
                       type:      APP_STATE.resultType,
                       k:         TASTEDIVE_KEY,
                       callback: "dummyCallback"
                     };
  
  $.ajax({url:       TASTEDIVE_API_ENDPOINT,
          dataType: "jsonp",
          method:   "GET",
          data:      query,
          success:   function(response) {console.log("successsssss", response);},
          error:     function(xhr, status) {console.log("errorrrrr", xhr, status);}
        });
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