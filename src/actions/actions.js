export const UPDATE_ERDDAPINPUT = 'UPDATE_ERDDAPINPUT'
export const REQUEST_ERDDAP_DATA = 'REQUEST_ERDDAP_DATA'
export const RECEIVE_ERDDAP_DATA = 'RECEIVE_ERDDAP_DATA'
export const UPDATE_FEATURE_COUNT = 'UPDATE_FEATURE_COUNT'

export const fetchErddapData = payload => dispatch => {

    // It dispatches a further action to let our state know that requests are about to be made (loading spinner listens to this!)
    dispatch(requestErddapData())
  
    // we define our url and parameters to be sent along
    let url = new URL(payload.inputValue)
  
    // we use the fetch API to call erddap
    return fetch(url)
      // when a response is returned we extract the json data
      .then(response => response.json())
      // and this data we dispatch for processing in processGeocodeResponse
      .then(data => dispatch(processErddapResponse(data, url)))
      .catch(error => console.error(error))
  }

const parseErddapResponse = (json) => {
  // parsing the response
  console.log(json)
  if(json.features){
    return json
  }
}

const processErddapResponse = (json, url) => dispatch => {
    // parse the json file and dispatch the results which will be reduced
    const results = parseErddapResponse(json)
    // let's let the loading spinner now that it doesn't have to spin anymore
    dispatch(receiveErddapData({'url':url, 'name':url.pathname.match(/tabledap\/(.*)\.geoJson/)[1], 'data':results, 'visibile':true}))
  }

export const receiveErddapData = payload => ({
    type: RECEIVE_ERDDAP_DATA,
    results: payload
  })

export const updateFeatureCount = payload => ({
    type: UPDATE_FEATURE_COUNT,
    payload
  })

export const requestErddapData = payload => ({
    type: REQUEST_ERDDAP_DATA,
    ...payload
  })

export const updateErddapInput = payload => ({
  type: UPDATE_ERDDAPINPUT,
  payload
})