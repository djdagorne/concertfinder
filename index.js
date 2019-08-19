'use strict'

const artistSearchUrl = 'https://ws.audioscrobbler.com/2.0/';
const artistApiKey = 'cca25a181d5244cbe7e1d7b94d8ce6f4';

const concertSearchUrl = 'https://app.ticketmaster.com/discovery/v2/events.json';
const concertApiKey = 'hmha3Dr0BjItrX7K98A1aK2Cxn7Cg2nn';

function formatQueryParams(artistParams) { //turning an object of key:value pairs into an array, then formatting it into a GET request
    const queryItems = Object.keys(artistParams).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(artistParams[key])}`)
    return queryItems.join('&');
}

function getArtistList(searchArtist, searchCity){
    const artistParams = { 
        method: 'artist.getSimilar',
        artist: searchArtist,
        api_key: artistApiKey,
        format: 'json',
        limit: '10'
    };

    const artistQueryString = formatQueryParams(artistParams);
    const artistUrl = artistSearchUrl + '?' + artistQueryString; 

    fetch(artistUrl)
        .then(response => {
            return response.json();
        })
        .then(responseJson =>{
            console.log(responseJson);
            if(responseJson.similarartists.artist.length>0){
                $('#js-error-message').empty();
                displayArtistList(responseJson, searchCity);
            }else{
                $('#results').addClass('hidden');
                $('#results-list').empty();
                throw new Error('No results found.');
            }
        })
        .catch(err => {
            console.log('this url is throwing an error: ' + err.message)
            $('#results').addClass('hidden');
            $('#results-list').empty();
            $('#js-error-message').text(`Something went wrong: ${err.message}`);
        });
};

function displayArtistList(responseJson, searchCity){
    $('#results-list').empty();
    const origArtist = responseJson.similarartists["@attr"].artist;
    const artistList = responseJson.similarartists.artist; //im lazy
    $('#results-list').append(`
        <li class="${origArtist}">
            <h3>${origArtist}</h3>
            <a id="origin" class="js-concert-expand" href='#'>Click to see ${origArtist}'s Concerts</a>
            <p id="js-origin-error-message" class="error-message hidden"></p>
            <section id="origin-concert-results" class="hidden">
                <h4>${origArtist} concert results</h4>
                
                <ul id="origin-results-list">
                </ul>
            </section>
        </li>`
    );
    for (let i=0; i < artistList.length; i++){ 
        $('#results-list').append(
            `<li class="${artistList[i].name}">
                <h3>${artistList[i].name}</h3>
                <a id="${i}" class="js-concert-expand" href='#'>Click to see ${artistList[i].name}'s Concerts</a>
                <p id="js-${i}-error-message" class="error-message hidden"></p>
                <section id="${i}-concert-results" class="hidden">
                    <h4>${artistList[i].name} concert results</h4>
                    
                    <ul id="${i}-results-list">
                    </ul>
                </section>
            </li>`
    )};
    $('#results').removeClass('hidden');
    watchArtist(searchCity)
}

function watchArtist(searchCity){
    $('.js-concert-expand').on('click', event => {
        event.preventDefault();
        const artistName = getArtistName(event.currentTarget);
        var targetArtist = $(event.currentTarget).attr("id"); //assigns a number to each targetArtist, so I can accurately update DOM
        getEventList(artistName, searchCity, targetArtist);  
    });
}

function getArtistName(eventTarget) {
    return $(eventTarget).parent().attr('class');
}

function getEventList(artistName, searchCity, targetArtist){

    const eventParams = {
        classificationName: 'music',
        apikey: concertApiKey,
        keyword: artistName, //testing
        city: searchCity,
        sort: 'date,asc',
    }
    const eventQueryString = formatQueryParams(eventParams);
    const eventUrl = concertSearchUrl + '?' + eventQueryString; 
    
    fetch(eventUrl)
        .then(response => {
            return response.json();
        })
        .then(responseJson => {
            console.log(responseJson);
            displayEventList(responseJson, searchCity, targetArtist); //we have the right responses, we just need to update the correct artists <li> item.
        })
        .catch(err => {
                $(`#js-${targetArtist}-error-message`).text(`Something went wrong: ${err.message}`);
                $(`#js-${targetArtist}-error-message`).removeClass(`hidden`);
            
        });
};

function displayEventList(eventJson, searchCity, targetArtist){ 

    $(`#${targetArtist}-concert-results`).addClass('hidden');
    $(`#${targetArtist}-results-list`).empty();

    if(eventJson.page.totalElements>0){ //if the event list is more than 0 items long...
        $(`#js-${targetArtist}-error-message`).addClass(`hidden`);
        console.log("events found");
        for(let i=0;i<eventJson._embedded.events.length;i++){       //make list items  the events using a for loop
            $(`#${targetArtist}-results-list`).append(`
                <li id="event-item-${i}"> 
                    <a href="${eventJson._embedded.events[i].url}">${eventJson._embedded.events[i].name}</a>
                </li>
            `);
        };        
        $(`#${targetArtist}-concert-results`).removeClass('hidden'); 
    }else if(eventJson.page.totalElements == 0 && searchCity != ''){
        console.log("no events in " + searchCity);
        $(`#${targetArtist}-concert-results-list`).empty();
        $(`#js-${targetArtist}-error-message`).text(`No concerts found, try a different city?`);
        $(`#js-${targetArtist}-error-message`).removeClass(`hidden`);
    }else if(eventJson.page.totalElements == 0 && searchCity == ''){
        console.log("no events found in all cities");
        $(`#${targetArtist}-concert-results-list`).empty();
        $(`#js-${targetArtist}-error-message`).text(`Artists' events not found.`);
        $(`#js-${targetArtist}-error-message`).removeClass(`hidden`);
    }
}

function watchForm(){
    $('form').submit(event => {
        event.preventDefault();
        const searchArtist = $('#js-search-artist').val(); 
        const searchCity = $('#js-search-city').val();
        
        getArtistList(searchArtist, searchCity);
    });
};

$(watchForm);