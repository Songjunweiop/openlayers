import Draw from "ol/interaction/Draw";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import Point from "ol/geom/Point";
import { DoubleClickZoom } from "ol/interaction";

import { unByKey } from "ol/Observable.js";
import Overlay from "ol/Overlay";
import { Feature } from "ol";
import { getLength, getArea, getDistance } from "ol/sphere";

import LineString from "ol/geom/LineString";
import Polygon from "ol/geom/Polygon";

import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style.js";
export default {
  measure(map, measureType) {
    // 删除默认的双击事件
    const dblClickInteraction = map
      .getInteractions()
      .getArray()
      .find((interaction) => {
        return interaction instanceof DoubleClickZoom;
      });
    map.removeInteraction(dblClickInteraction);
    
    var source = new VectorSource();

    var vector = new VectorLayer({
      id: "lineAndArea",
      source: source,
      style: new Style({
        stroke: new Stroke({
          color: "#ffcc33",
          width: 3,
        }),
      }),
      zIndex: 16,
    });
    map.addLayer(vector);
    /**
     * Currently drawn feature.
     * @type {module:ol/Feature~Feature}
     */
    var sketch;

    /**
     * The help tooltip element.
     * @type {Element}
     */
    var helpTooltipElement;

    /**
     * Overlay to show the help messages.
     * @type {module:ol/Overlay}
     */
    var helpTooltip;

    /**
     * The measure tooltip element.
     * @type {Element}
     */
    var measureTooltipElement;

    /**
     * Overlay to show the measurement.
     * @type {module:ol/Overlay}
     */
    var measureTooltip;

    /**
     * Message to show when the user is drawing a polygon.
     * @type {string}
     */
    var continuePolygonMsg = "";

    /**
     * Message to show when the user is drawing a line.
     * @type {string}
     */
    var continueLineMsg = "";

    /**
     * Handle pointer move.
     * @param {module:ol/MapBrowserEvent~MapBrowserEvent} evt The event.
     */
    var pointerMoveHandler = function (evt) {
      if (evt.dragging) {
        return;
      }
      /** @type {string} */
      var helpMsg = "请点击开始绘制";

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

    map.on("pointermove", pointerMoveHandler);

    map.getViewport().addEventListener("mouseout", function () {
      helpTooltipElement.classList.add("hidden");
    });

    var draw;

    var formatLength = function (line) {
      // var sourceProj = map.getView().getProjection(); //获取投影坐标系
      
      // var geom = line.clone().transform(sourceProj, "EPSG:4326");
      var length = getLength(line);
      //获取投影坐标系
      //ol/sphere里有getLength()和getArea()用来测量距离和区域面积，默认的投影坐标系是EPSG:3857, 其中有个options的参数，可以设置投影坐标系
      // var length = getLength(line, {
      //   projection: sourceProj /*, radius: 6371008.8*/,
      // });
      console.log(length);
      var output;
      if (length > 100) {
        output = Math.round((length / 1000) * 100) / 100 + " " + "km";
      } else {
        output = Math.round(length * 100) / 100 + " " + "m";
      }
      return output;
    };

    var formatArea = function (polygon) {
      //获取投影坐标系
      var sourceProj = map.getView().getProjection();
      var area = getArea(polygon, { projection: sourceProj });
      //var area = getArea(polygon);
      //console.info(area)
      var output;
      if (area > 10000) {
        output =
          Math.round((area / 1000000) * 100) / 100 + " " + "km<sup>2</sup>";
      } else {
        output = Math.round(area * 100) / 100 + " " + "m<sup>2</sup>";
      }
      return output;
    };
    var source;
    // var layer ;
    // 获取存放feature的vectorlayer层。map初始化的时候可以添加好了
    for (let layerTmp of map.getLayers().getArray()) {
      if (layerTmp.get("name") == "feature") {
        // layer = layerTmp;
        // layerTmp.setSource(null)
        source = layerTmp.getSource();
      }
    }

    function addInteraction() {
      var type = measureType == "area" ? "Polygon" : "LineString";
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
      draw.on(
        "drawstart",
        function (evt) {
          // set sketch
          sketch = evt.feature;

          /** @type {module:ol/coordinate~Coordinate|undefined} */
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
        },
        this
      );

      draw.on(
        "drawend",
        function () {
          measureTooltipElement.className = "tooltip tooltip-static";
          measureTooltip.setOffset([0, -7]);
          // unset sketch
          sketch = null;
          // unset tooltip so that a new one can be created
          measureTooltipElement = null;
          createMeasureTooltip();
          unByKey(listener);
          // 单次测距
          map.un("pointermove", pointerMoveHandler);
          map.removeInteraction(draw);
          helpTooltipElement.classList.add("hidden");
        },
        this
      );
    }

    function createHelpTooltip() {
      if (helpTooltipElement) {
        helpTooltipElement.parentNode.removeChild(helpTooltipElement);
      }
      helpTooltipElement = document.createElement("div");
      helpTooltipElement.className = "tooltip hidden";
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
      measureTooltipElement.className = "ol-tooltip tooltip-measure";
      measureTooltip = new Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: "bottom-center",
      });
      map.addOverlay(measureTooltip);
    }
    // 量测调用
    addInteraction();

    //绘制结束
  },
};
