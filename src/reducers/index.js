import { combineReducers } from 'redux'
import {
    UPDATE_ERDDAPINPUT,
    REQUEST_ERDDAP_DATA,
    RECEIVE_ERDDAP_DATA,
    UPDATE_FEATURE_COUNT,
  } from '../actions/actions'

// these are our initial isochrones settings
const initialIsochronesControlsState = {
  erddapInput: "",
  erddapResults: [],
  featureCount: 0,
  isFetching: false,
}

// our reducer constant returning an unchanged or updated state object depending on the users action, many cases will follow
const isochronesControls = (state = initialIsochronesControlsState, action) => {
  switch (action.type) {
    case UPDATE_ERDDAPINPUT:
        return {
        ...state,
        erddapInput: action.payload.inputValue
        }
    // let the app know the request is being made (for our spinner)
    case REQUEST_ERDDAP_DATA:
        return {
        ...state,
        isFetching: true
        }
    // when results are returned by the API update the state with addresses and let the app know it is no longer fetching
    case RECEIVE_ERDDAP_DATA:
        return {
        ...state,
        erddapResults: [...state.erddapResults, action.results],
        isFetching: false
        }
    case UPDATE_FEATURE_COUNT:
      return {
        ...state,
        featureCount: action.payload.featureCount
      }
    default:
      return state
  }
}

// creates a root reducer and combines different reducers if needed
const rootReducer = combineReducers({
  isochronesControls
})

export default rootReducer