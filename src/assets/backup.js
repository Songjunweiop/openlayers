
  var raster = new TileLayer({
    source: new OSMSource(),
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
      image: new Circle({
        radius: 7,
        fill: new Fill({
          color: "#ffcc33",
        }),
      }),
    }),
  });
  this.map.addLayer(raster);
  this.map.addLayer(vector);
  // this.map = new Map({
  //   layers: [raster, vector],
  //   target: "map",
  //   view: new View({
  //     center: [-11000000, 4600000],
  //     zoom: 15,
  //   }),
  // });
  var sketch;
  var helpTooltipElement;
  var helpTooltip;
  var measureTooltipElement;
  var measureTooltip;
  var continuePolygonMsg = "Click to continue drawing the polygon";

  /**
   * Message to show when the user is drawing a line.
   * @type {string}
   */
  var continueLineMsg = "Click to continue drawing the line";

  /**
   * Handle pointer move.
   * @param {import("../src/ol/MapBrowserEvent").default} evt The event.
   */
  var pointerMoveHandler = function (evt) {
    if (evt.dragging) {
      return;
    }
    /** @type {string} */
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

    // helpTooltipElement.classList.remove("hidden");
  };

  // this.map = new Map({
  //   layers: [raster, vector],
  //   target: "this.map",
  //   view: new View({
  //     center: [-11000000, 4600000],
  //     zoom: 15,
  //   }),
  // });

  this.map.on("pointermove", pointerMoveHandler);

  this.map.getViewport().addEventListener("mouseout", function () {
    // helpTooltipElement.classList.add("hidden");
  });

  var typeSelect = "LineString";

  let draw; // global so we can remove it later

  /**
   * Format length output.
   * @param {LineString} line The line.
   * @return {string} The formatted length.
   */
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

  /**
   * Format area output.
   * @param {Polygon} polygon The polygon.
   * @return {string} Formatted area.
   */
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

  const addInteraction = () => {
    var type = typeSelect.value == "area" ? "Polygon" : "LineString";
    draw = new olInteraction.Draw({
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
        image: new Circle({
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
    this.map.addInteraction(draw);

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
  };

  const createHelpTooltip = () => {
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
    this.map.addOverlay(helpTooltip);
  };

  const createMeasureTooltip = () => {
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
    this.map.addOverlay(measureTooltip);
  };
  addInteraction();
