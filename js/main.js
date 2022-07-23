'use strict';

/** Class representing a transit agency. */
class Agency {
  /**
   * Create a transit agency object.
   * @param {string} id ID of the agency.
   * @param {string} name Name of the agency.
   * @param {string | null} shortName Short name of the agency.
   */
  constructor(id, name, shortName) {
    this.id = id;
    this.name = name;
    this.shortName = shortName;
  }
}

/** Class representing a transit bus record. */
class TransitBusRecord {
  /**
   * Create a transit bus record object.
   * @param {string} filename Filename of the image.
   * @param {string | null} notes Notes to the record.
   */
  constructor(filename, notes) {
    this.city = null;
    this.filename = filename;
    this.notes = notes;
    this.routeAgency = null;
    this.routeNo = null;
    this.utcTime = null;
    this.vehicleAgency = null;
    this.vehicleNo = null;
  }
}

/** Class representing a way of transport (e.g., bus, tram, etc.) in a city. */
class Transport {
  /**
   * Create a transport object.
   * @param {Agency[]} agencies An array of agencies.
   * @param {Object[]} records An array of records.
   */
  constructor(agencies, records) {
    this.agencies = agencies;
    this.records = records;
  }
}

/** Class representing a city. */
class City {
  /**
   * Create a city object.
   * @param {string} id - ID of the city.
   * @param {string} name - Name of the city.
   * @param {string | null} thumbnail - Thumbnail URL of the city.
   * @param {string} timezone - TZ database timezone of the city.
   */
  constructor(id, name, thumbnail, timezone) {
    this.id = id;
    this.name = name;
    this.thumbnail = thumbnail;
    this.timezone = timezone;
    this.transitBus = null;
  }
}

// HTML templates
const TRANSIT_BUS_RECORD_TEMPLATE = `          <div class="transit-bus-thumbnail-container col-sm-6 col-md-4 col-xl-3" data-agency="{{routeAgency}}">
            <div class="thumbnail">
              <a class="lightbox" href="{{originalPhotoUrl}}">
                <img class="thumbnail-image" src="{{thumbnailUrl}}" alt="Thumbnail of {{captionText}}" />
              </a>
              <div class="caption">
                <h3>{{caption}}</h3>
                <p>{{vehicle}}</p>
                <p>{{time}}</p>
                <p class="notes text-break">{{notes}}</p>
              </div>
            </div>
          </div>`;
const HOMEPAGE_CTIY_TEMPLATE = `          <div class="col-sm-6 col-md-4 col-xl-3">
            <div class="thumbnail">
              <a class="lightbox" href="{{url}}">
                <img class="thumbnail-image" src="{{thumbnailUrl}}" alt="Thumbnail of {{caption}}" />
              </a>
              <div class="caption">
                <h3>{{caption}}</h3>
              </div>
            </div>
          </div>`;
// Image endpoints
const ORIGINAL_PHOTO_URL_ENDPOINT = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? `${window.location.pathname}img` : 'https://onemanager0.herokuapp.com/transit-gallery';
const THUMBNAIL_URL_ENDPOINT = `${window.location.pathname}img`;
// Other constants
const BOOTSTRAP_DISPLAY_NONE = 'd-none';

// Get query strings from URL: https://stackoverflow.com/a/2880929
let urlParams = {};
(window.onpopstate = () => {
  let match;
  const pl = /\+/g;  // Regex for replacing addition symbol with a space
  const search = /([^&=]+)=?([^&]*)/g;
  const decode = (s) => decodeURIComponent(s.replace(pl, ' '));
  const query = window.location.search.substring(1);

  while (match = search.exec(query)) {
    if (decode(match[1]) in urlParams) {
      if (!Array.isArray(urlParams[decode(match[1])])) {
        urlParams[decode(match[1])] = [urlParams[decode(match[1])]];
      }
      urlParams[decode(match[1])].push(decode(match[2]));
    } else {
      urlParams[decode(match[1])] = decode(match[2]);
    }
  }
})();

/**
 * Wrapper of jQuery.getJSON() method.
 * @async
 * @function getJSON
 * @param {string} cityParam A city ID or the string 'cities'.
 * @return {JSON} A JSON object.
 */
const getJSON = async (cityParam) => {
  return $.getJSON(`data/${cityParam}.json`).fail(() => {
    console.error('An error has occurred.');
  });
};

/**
 * Get the transit agency by its agency ID.
 * @function getAgency
 * @param {Map<string, Agency>} agencies An ID-agency map.
 * @param {string} agencyId An agency ID.
 * @return {Agency | string} An agency object or the agency ID if not found.
 */
const getAgency = (agencies, agencyId) =>
  typeof agencies.get(agencyId) === 'undefined' ? agencyId : agencies.get(agencyId);

/**
 * Process a JSON object.
 * @function processJSON
 * @param {JSON} json A JSON object.
 * @return {City} A city object.
 */
const processJSON = (json) => {
  const city = new City(json.id, json.name, json.thumbnail, json.timezone);

  // Transit bus
  const jsonTransitBus = json.transitBus;
  if (jsonTransitBus) {
    // Create agencies
    const agencies = new Map();
    const jsonAgencies = jsonTransitBus.agencies;
    if (Array.isArray(jsonAgencies)) {
      jsonAgencies.forEach((jsonAgency) => {
        agencies.set(jsonAgency.id, Object.assign(new Agency(), jsonAgency));
      });
    }

    // Create transit bus records
    const records = [];
    const jsonRecords = jsonTransitBus.records;
    if (Array.isArray(jsonRecords)) {
      jsonRecords.forEach((jsonRecord) => {
        if (jsonRecord.filename && jsonRecord.filename !== '') {
          const record = new TransitBusRecord(jsonRecord.filename, jsonRecord.notes);
          const filenameElements = record.filename.split(/[-.]+/);
          if (Array.isArray(filenameElements) && filenameElements.length === 5) {
            let fileExt = null;
            // eslint-disable-next-line no-unused-vars
            [record.city, record.routeAgency, record.vehicleAgency, record.utcTime, fileExt] = filenameElements;
            const routeElements = record.routeAgency.split('_');
            if (Array.isArray(routeElements)) {
              record.routeAgency = getAgency(agencies, routeElements[0]);
              if (routeElements.length === 2) {
                record.routeNo = routeElements[1] === 'unk' ? null : routeElements[1];
              }
            }
            const vehicleElements = record.vehicleAgency.split('_');
            if (Array.isArray(vehicleElements)) {
              record.vehicleAgency = getAgency(agencies, vehicleElements[0]);
              if (vehicleElements.length === 2) {
                record.vehicleNo = vehicleElements[1] === 'unk' ? null : vehicleElements[1];
              }
            }
            record.utcTime = new Date(record.utcTime.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:00Z'));
          }
          records.push(record);
        }
      });
    }

    city.transitBus = new Transport(agencies, records);
  }

  return city;
};

/**
 * Render city page.
 * @function renderPage
 * @param {City} city A city object.
 */
const renderPage = (city) => {
  $('#banner-img-container').empty();
  if (city.thumbnail) {
    $('#banner-img-container').append(`<img src='${city.thumbnail}' alt='Banner image' />`);
  }
  $('#page-description').text(`${city.name}`);
  $('#homepage-container').remove();

  // Transit bus
  const transitBus = city.transitBus;
  if (transitBus) {
    // Render gallery
    const $gallaryContainer = $('#transit-bus-gallery-row');
    $gallaryContainer.empty();
    const routeAgencies = new Set();
    const routeAgencyShortNamesMap = new Map();
    transitBus.records.forEach((record) => {
      const routeAgency = record.routeAgency instanceof Agency ? record.routeAgency.name : record.routeAgency;
      routeAgencies.add(routeAgency);
      let routeAgencyShortName = routeAgency;
      if (record.routeAgency instanceof Agency && record.routeAgency.shortName != null) {
        routeAgencyShortName = record.routeAgency.shortName;
        routeAgencyShortNamesMap.set(routeAgency, routeAgencyShortName);
      }
      const captionText = routeAgencyShortName + ' ' + (record.routeNo == null ? '' : record.routeNo);
      const caption = routeAgencyShortName !== routeAgency
          ? `<span class="hover-tooltip" data-toggle="tooltip" title="${routeAgency}">${routeAgencyShortName}</span> `
              + (record.routeNo == null ? '' : record.routeNo)
          : captionText;
      const vehicleAgency = record.vehicleAgency instanceof Agency ? record.vehicleAgency.name : record.vehicleAgency;
      const vehicleAgencyShortName = record.vehicleAgency instanceof Agency && record.vehicleAgency.shortName != null
          ? record.vehicleAgency.shortName
          : vehicleAgency;
      const vehicle = (vehicleAgencyShortName !== vehicleAgency
          ? `<span class="hover-tooltip" data-toggle="tooltip" title="${vehicleAgency}">${vehicleAgencyShortName}</span>`
          : vehicleAgency)
        + ' '
        + (record.vehicleNo == null ? 'vehicle' : `#${record.vehicleNo}`);
      let notes = record.notes.replaceAll(/\[SPECIAL\]/g, '<span class="text-danger">[SPECIAL]</span>');
      // Parse notes with Markdown parser
      // Override Markdown links: https://github.com/markedjs/marked/issues/655
      const renderer = new marked.Renderer();
      const linkRenderer = renderer.link;
      renderer.link = (href, title, text) => {
          const html = linkRenderer.call(renderer, href, title, text);
          return html.replace(/^<a /, '<a target="_blank" ');
      };
      notes = marked.parse(notes, { renderer: renderer });
      // Remove outermost <p> tag
      const domParser = new DOMParser();
      const notesDom = domParser.parseFromString(notes, 'application/xml');
      notes = notesDom.children[0].innerHTML;

      $gallaryContainer.append(TRANSIT_BUS_RECORD_TEMPLATE
        .replaceAll(/{{routeAgency}}/g, routeAgency)
        .replaceAll(/{{thumbnailUrl}}/g, `${THUMBNAIL_URL_ENDPOINT}/transit-buses/thumbnails/${record.filename}`)
        .replaceAll(/{{originalPhotoUrl}}/g, `${ORIGINAL_PHOTO_URL_ENDPOINT}/transit-buses/processed/${record.filename}`)
        .replaceAll(/{{captionText}}/g, captionText)
        .replaceAll(/{{caption}}/g, caption)
        .replaceAll(/{{vehicle}}/g, vehicle)
        .replaceAll(/{{time}}/g, record.utcTime.toLocaleString('en-US', {
          day: 'numeric',
          hour: '2-digit',
          hour12: false,
          minute: '2-digit',
          month: 'numeric',
          timeZone: city.timezone,
          timeZoneName: 'short',
          year: 'numeric'
        }))
        .replaceAll(/{{notes}}/g, notes)
      );
    });

    // Render filter
    const $agencyForm = $('#transit-bus-agency-form');
    const $agencySelect = $('#transit-bus-agency-select');
    $agencySelect.empty();
    if (routeAgencies.size > 1) {
      $agencySelect.append('<option value="all" selected="selected">All</option>');
      Array.from(routeAgencies).sort().forEach((routeAgency) => {
        let routeAgencyDisplayName = routeAgency;
        if (routeAgencyShortNamesMap.get(routeAgency)) {
          routeAgencyDisplayName += ` (${routeAgencyShortNamesMap.get(routeAgency)})`;
        }
        $agencySelect.append(`<option value="${routeAgency}">${routeAgencyDisplayName}</option>`);
      });
      $agencyForm.removeClass(BOOTSTRAP_DISPLAY_NONE);
    } else {
      $agencyForm.remove();
    }
    // Register change event for filter
    $('#transit-bus-agency-select').change(() => {
      let selectedRouteAgency = null;
      $('#transit-bus-agency-select option:selected').each((_, element) => {
        selectedRouteAgency = $(element).val();
        $('.transit-bus-thumbnail-container').each((_, thumbnailContainer) => {
          if (selectedRouteAgency === 'all' || $(thumbnailContainer).data('agency') === selectedRouteAgency) {
            $(thumbnailContainer).removeClass(BOOTSTRAP_DISPLAY_NONE);
          } else {
            $(thumbnailContainer).addClass(BOOTSTRAP_DISPLAY_NONE);
          }
        });
      });
    });

    $('#transit-bus-container').removeClass(BOOTSTRAP_DISPLAY_NONE);
  } else {
    $('#transit-bus-container').addClass(BOOTSTRAP_DISPLAY_NONE);
  }
};

/**
 * Render homepage.
 * @function renderHomepage
 * @param {JSON} json A JSON object.
 */
const renderHomepage = (json) => {
  $('#page-description').text('Choose an area to begin');
  $('.non-homepage-container').remove();
  const $gallaryContainer = $('#homepage-gallery-row');
  $gallaryContainer.empty();
  if (Array.isArray(json)) {
    json.forEach((city) => {
      $gallaryContainer.append(HOMEPAGE_CTIY_TEMPLATE
        .replaceAll(/{{thumbnailUrl}}/g, city.thumbnail)
        .replaceAll(/{{url}}/g, `${window.location.pathname}?city=${city.id}`)
        .replaceAll(/{{caption}}/g, city.name)
      );
    });
  }
  $('#homepage-container').removeClass(BOOTSTRAP_DISPLAY_NONE);
};

$(document).ready(async () => {
  try {
    const cityParam = urlParams['city'] ? urlParams['city'].toLowerCase() : null;
    if (cityParam) {
      const json = await getJSON(cityParam);
      const city = processJSON(json);
      renderPage(city);
      baguetteBox.run('.tz-gallery');
    } else {
      const json = await getJSON('cities');
      renderHomepage(json);
    }
  } catch (error) {
    console.error(error);
    if (error.status && error.status === 404) {
      $('#page-description').text('Photos are not available for this area.');
    } else {
      $('#page-description').text('An error has occurred.');
    }
  }
  $('#page-description-spinner').addClass(BOOTSTRAP_DISPLAY_NONE);
  $('#page-description').removeClass(BOOTSTRAP_DISPLAY_NONE);
  $('[data-toggle="tooltip"]').tooltip();
});
