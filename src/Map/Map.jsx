import React from 'react'
import { connect } from 'react-redux'
import L, { map } from 'leaflet'
import * as esri from 'esri-leaflet';
import * as d3 from 'd3'
import '@asymmetrik/leaflet-d3'
import 'leaflet.heat'

import PropTypes from 'prop-types'

import HereTileLayers from './hereTileLayers'

import {
  updateFeatureCount
} from "../actions/actions"

// modify hexbin on the fly so removing the layer from the map works.
// from https://github.com/Asymmetrik/leaflet-d3/issues/54#issuecomment-538822001
L.HexbinLayer.prototype.onRemove = function(map) {
  L.SVG.prototype.onRemove.call(this);
  // Destroy the svg container
  this._destroyContainer();
  // Remove events
  map.off({ 'moveend': this.redraw }, this);
  this._map = null;
  // Explicitly will leave the data array alone in case the layer will be shown again
  //this._data = [];
  d3.select(this._container).remove();
};


// defining the container styles the map sits in
const style = {
  width: '100%',
  height: '100vh'
}

// use these or add your own HERE Maps credentials
const hereAppCode = '0XXQyxbiCjVU7jN2URXuhg'
const hereAppId = 'yATlKFDZwdLtjHzyTeCK'

// using the reduced.day map styles, have a look at the imported hereTileLayers for more
const hereReducedDay = HereTileLayers.here({
  appId: hereAppId,
  appCode: hereAppCode,
  scheme: 'reduced.day'
})

const esriOceans = esri.basemapLayer('Oceans')

// for this app we create two leaflet layer groups to control, one for the isochrone centers and one for the isochrone contours
const markersLayer = L.featureGroup();
const markersClusterLayer = L.markerClusterGroup();
const isochronesLayer = L.featureGroup();
const heatLayer = L.heatLayer();

var options = {
	radius : 18,
	opacity: 0.3,
	duration: 200,

	colorScaleExtent: [ 1, undefined ],
	radiusScaleExtent: [ 1, undefined ],
	colorDomain: null,
	radiusDomain: null,
	colorRange: [ '#f7fbff', '#08306b' ],
	radiusRange: [ 5, 18 ],
	
	pointerEvents: 'all'
};
const hexLayer = L.hexbinLayer(options).hoverHandler(L.HexbinHoverHandler.tooltip());
const colorScale = d3.scaleLog().range(['white', '#ffecb3', '#e85285', '#6a1b9a']).interpolate(d3.interpolateLab);
hexLayer.colorScale(colorScale);

// we define our bounds of the map
const southWest = L.latLng(-90, -280),
  northEast = L.latLng(90, 280),
  bounds = L.latLngBounds(southWest, northEast)

// a leaflet map consumes parameters, I'd say they are quite self-explanatory
const mapParams = {
  center: [50, -140.729687],
  zoomControl: false,
  maxBounds: bounds,
  maxZoom: 20,
  zoom: 3,
  layers: [markersClusterLayer, hereReducedDay]
}

// this you have seen before, we define a react component
class Map extends React.Component {

  static propTypes = {
    isochronesControls: PropTypes.object.isRequired,
    mapEvents: PropTypes.object,
    dispatch: PropTypes.func.isRequired
  }

  // and once the component has mounted we add everything to it
  componentDidMount() {

    // our map!
    this.map = L.map('map', mapParams)

    // we create a leaflet pane which will hold all isochrone polygons with a given opacity
    var isochronesPane = this.map.createPane('isochronesPane')
    isochronesPane.style.opacity = 0.9

    // our basemap and add it to the map
    const baseMaps = {
      'HERE reduced.day': hereReducedDay,
      'esri Oceans': esriOceans
    }
    const overlays = {
      'Points': markersLayer,
      'Point Cluster': markersClusterLayer,
      'Hex Bin': hexLayer,
      'Heat Map': heatLayer
    }
    L.control.layers(baseMaps).addTo(this.map)
    L.control.layers(overlays).addTo(this.map)

    // we do want a zoom control
    L.control
      .zoom({
        position: 'topright'
      })
      .addTo(this.map)

  }

  // https://data.cioospacific.ca/erddap/tabledap/IOS_BOT_Profiles.geoJson?profile%2Clatitude%2Clongitude&time%3E=2019-08-04T00%3A00%3A00Z&time%3C=2019-08-11T22%3A44%3A33Z
  // https://data.cioospacific.ca/erddap/tabledap/IOS_BOT_Profiles.geoJson?profile%2Clatitude%2Clongitude&distinct()
  // https://data.cioospacific.ca/erddap/tabledap/IOS_CTD_Profiles.geoJson?profile%2Clatitude%2Clongitude&distinct()
  // https://data.cioospacific.ca/erddap/tabledap/IOS_CTD_Moorings.geoJson?profile%2Clatitude%2Clongitude&distinct()
  // https://data.cioospacific.ca/erddap/tabledap/IOS_ADCP_Moorings.geoJson?station%2Clatitude%2Clongitude&distinct()
  addErddap(prevProps) {
    const datasets = this.props.isochronesControls.erddapResults;
    const map = this.map
    var myIcon = L.divIcon({className: 'my-div-icon', iconSize: 8});
    var coords = []; //define an array to store coordinates
    var coords_rev = []
    var features = []
    var fcount = 0

    datasets.forEach(dataset => {
      if(!dataset.visibile){
        return;
      } 
      var points = dataset.data
      features = L.geoJSON(points.features, {
        pointToLayer: function (feature, latlng) {
          return L.marker(latlng, { icon: myIcon })
        },
        onEachFeature: function (feature, layer) {
          coords.push(feature.geometry.coordinates);
          coords_rev.push([feature.geometry.coordinates[1], feature.geometry.coordinates[0]])
        },
        filter: function(feature, layer) {
          var bounds = map.getBounds();
          return bounds.contains(L.GeoJSON.coordsToLatLngs([feature.geometry.coordinates]));
        }
      })
      
      fcount = fcount + coords.length
      features.addTo(markersClusterLayer)
      hexLayer.data(coords)
      if(heatLayer){
        heatLayer.setLatLngs(coords_rev)
      }else{
        console.log('heatLayer is null: ' + heatLayer)
      }         

      // limit point layer to 1000 points
      if (coords.length + markersLayer.getLayers().length < 1001){
        features.addTo(markersLayer);
      }else{
        markersLayer.clearLayers();
      }

    })
    
    const { dispatch, featureCount } = this.props;
    if(fcount > 0 && fcount != featureCount){
      console.log('fcount: ' + fcount + ' fc: ' + featureCount)
      dispatch(
        updateFeatureCount({'featureCount': fcount})
      );
      
    }
  }

  componentDidUpdate(prevProps, prevState) {
    this.addErddap(prevProps);
  }

  // don't forget to render it :-)
  render() {
    return <div id="map" style={style} />
  }
}

// and we already map the redux store to properties which we will start soon
const mapStateToProps = (state) => {
  const isochronesControls = state.isochronesControls
  const featureCount = state.isochronesControls.featureCount
  return {
    isochronesControls,
    featureCount
  }
}

export default connect(mapStateToProps)(Map)