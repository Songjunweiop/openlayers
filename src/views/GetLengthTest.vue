<template>
  <div>
    <div id="map" class="map"></div>
    <form class="form-inline">
      <label for="type">Measurement type &nbsp;</label>
      <select id="type">
        <option value="length">Length (LineString)</option>
        <option value="area">Area (Polygon)</option>
      </select>
    </form>
  </div>
</template>

<script>
import "ol/ol.css";
import Draw from "ol/interaction/Draw";
import Map from "ol/Map";
import Overlay from "ol/Overlay";
import View from "ol/View";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { LineString, Polygon } from "ol/geom";
import { OSM, Vector as VectorSource } from "ol/source";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { getArea, getLength } from "ol/sphere";
import { unByKey } from "ol/Observable";
import {
  useGeographic,
  transform,
  fromLonLat,
  toLonLat,
  getTransform,
} from "ol/proj";

export default {
  name: "CecTileMap",
  props: {
    tileMapURL: { type: String, default: "http://localhost:8080" },
    heatData: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      map: null,
    };
  },
  watch: {},
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      var raster = new TileLayer({
        source: new OSM(),
      });

      var source = new VectorSource();

      var vector = new VectorLayer({
        source: source,
        style: new Style({
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)",
          }),
          stroke: new Stroke({
            color: "#ffcc33",
            width: 2,
          }),
          image: new CircleStyle({
            radius: 7,
            fill: new Fill({
              color: "#ffcc33",
            }),
          }),
        }),
      });

      var sketch;
      var helpTooltipElement;
      var helpTooltip;
      var measureTooltipElement;
      var measureTooltip;
      var continuePolygonMsg = "Click to continue drawing the polygon";
      var continueLineMsg = "Click to continue drawing the line";
      var pointerMoveHandler = function (evt) {
        if (evt.dragging) {
          return;
        }
        var helpMsg = "Click to start drawing";

        if (sketch) {
          var geom = sketch.getGeometry();
          if (geom instanceof Polygon) {
            helpMsg = continuePolygonMsg;
          } else if (geom instanceof LineString) {
            helpMsg = continueLineMsg;
          }
        }

        helpTooltipElement.innerHTML = helpMsg;
        helpTooltip.setPosition(evt.coordinate);

        helpTooltipElement.classList.remove("hidden");
      };

      var map = new Map({
        layers: [raster, vector],
        target: "map",
        view: new View({
          // center: [-11000000, 4600000],
          center: fromLonLat([37.41, 8.82]),
          // center: [110, 35],
          // zoom: 4,
          // center: [102, 35],
          zoom: 4,
        }),
      });
      // console.log(map.getCode())

      map.on("pointermove", pointerMoveHandler);

      map.getViewport().addEventListener("mouseout", function () {
        helpTooltipElement.classList.add("hidden");
      });

      var typeSelect = document.getElementById("type");

      var draw; 
      var formatLength = function (line) {
        var length = getLength(line);
        var output;
        if (length > 100) {
          output = Math.round((length / 1000) * 100) / 100 + " " + "km";
        } else {
          output = Math.round(length * 100) / 100 + " " + "m";
        }
        return output;
      };

      var formatArea = function (polygon) {
        var area = getArea(polygon);
        var output;
        if (area > 10000) {
          output =
            Math.round((area / 1000000) * 100) / 100 + " " + "km<sup>2</sup>";
        } else {
          output = Math.round(area * 100) / 100 + " " + "m<sup>2</sup>";
        }
        return output;
      };

      function addInteraction() {
        var type = typeSelect.value == "area" ? "Polygon" : "LineString";
        draw = new Draw({
          source: source,
          type: type,
          style: new Style({
            fill: new Fill({
              color: "rgba(255, 255, 255, 0.2)",
            }),
            stroke: new Stroke({
              color: "rgba(0, 0, 0, 0.5)",
              lineDash: [10, 10],
              width: 2,
            }),
            image: new CircleStyle({
              radius: 5,
              stroke: new Stroke({
                color: "rgba(0, 0, 0, 0.7)",
              }),
              fill: new Fill({
                color: "rgba(255, 255, 255, 0.2)",
              }),
            }),
          }),
        });
        map.addInteraction(draw);

        createMeasureTooltip();
        createHelpTooltip();

        var listener;
        draw.on("drawstart", function (evt) {
          // set sketch
          sketch = evt.feature;

          /** @type {import("../src/ol/coordinate.js").Coordinate|undefined} */
          var tooltipCoord = evt.coordinate;

          listener = sketch.getGeometry().on("change", function (evt) {
            var geom = evt.target;
            var output;
            if (geom instanceof Polygon) {
              output = formatArea(geom);
              tooltipCoord = geom.getInteriorPoint().getCoordinates();
            } else if (geom instanceof LineString) {
              output = formatLength(geom);
              tooltipCoord = geom.getLastCoordinate();
            }
            measureTooltipElement.innerHTML = output;
            measureTooltip.setPosition(tooltipCoord);
          });
        });

        draw.on("drawend", function () {
          measureTooltipElement.className = "ol-tooltip ol-tooltip-static";
          measureTooltip.setOffset([0, -7]);
          // unset sketch
          sketch = null;
          // unset tooltip so that a new one can be created
          measureTooltipElement = null;
          createMeasureTooltip();
          unByKey(listener);
        });
      }
      function createHelpTooltip() {
        if (helpTooltipElement) {
          helpTooltipElement.parentNode.removeChild(helpTooltipElement);
        }
        helpTooltipElement = document.createElement("div");
        helpTooltipElement.className = "ol-tooltip hidden";
        helpTooltip = new Overlay({
          element: helpTooltipElement,
          offset: [15, 0],
          positioning: "center-left",
        });
        map.addOverlay(helpTooltip);
      }
      function createMeasureTooltip() {
        if (measureTooltipElement) {
          measureTooltipElement.parentNode.removeChild(measureTooltipElement);
        }
        measureTooltipElement = document.createElement("div");
        measureTooltipElement.className = "ol-tooltip ol-tooltip-measure";
        measureTooltip = new Overlay({
          element: measureTooltipElement,
          offset: [0, -15],
          positioning: "bottom-center",
        });
        map.addOverlay(measureTooltip);
      }
      typeSelect.onchange = function () {
        map.removeInteraction(draw);
        addInteraction();
      };

      addInteraction();
    },
  },
};
</script>

<style lang="scss">
.map {
  width: 100%;
  height: 400px;
}
.ol-tooltip {
  position: relative;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  color: white;
  padding: 4px 8px;
  opacity: 0.7;
  white-space: nowrap;
  font-size: 12px;
}
.ol-tooltip-measure {
  opacity: 1;
  font-weight: bold;
}
.ol-tooltip-static {
  background-color: #ffcc33;
  color: black;
  border: 1px solid white;
}
.ol-tooltip-measure:before,
.ol-tooltip-static:before {
  border-top: 6px solid rgba(0, 0, 0, 0.5);
  border-right: 6px solid transparent;
  border-left: 6px solid transparent;
  content: "";
  position: absolute;
  bottom: -6px;
  margin-left: -7px;
  left: 50%;
}
.ol-tooltip-static:before {
  border-top-color: #ffcc33;
}
</style>
