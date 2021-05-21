// 点击下拉框绘制要创建的画点、线、面
toggleDrawmapLayer() {
  if (this.drawmapLayer) this.map.removeLayer(this.drawmapLayer);
  console.log("执行了吗");

  const source = new VectorSource({ wrapX: false });
  this.drawmapLayer = new VectorLayer({
    source: source,
  });

  // 选择标记类型
  if (this.selectedDrawValue !== "None") {
    this.map.removeInteraction(this.draw);

    this.draw = new olInteraction.Draw({
      source: source,
      type: this.selectedDrawValue,
    });

    if (this.selectedDrawValue === "LineString") {
      // ************************************************************/
      var sketch;
      // var helpTooltipElement;
      // var helpTooltip;
      // var measureTooltipElement;
      // var measureTooltip;
      // var continuePolygonMsg = "";
      // var continueLineMsg = "";

      // const pointerMoveHandler = (evt) => {
      //   if (evt.dragging) {
      //     return;
      //   }
      //   var helpMsg = "请点击开始绘制";

      //   if (sketch) {
      //     var geom = sketch.getGeometry();
      //     if (geom instanceof Polygon) {
      //       helpMsg = continuePolygonMsg;
      //     } else if (geom instanceof LineString) {
      //       helpMsg = continueLineMsg;
      //     }
      //   }

      //   // helpTooltipElement.innerHTML = helpMsg;
      //   // helpTooltip.setPosition(evt.coordinate);

      //   // helpTooltipElement.classList.remove("hidden");
      // };

      // this.map.on("pointermove", pointerMoveHandler);

      this.map.getViewport().addEventListener("mouseout", () => {
        // helpTooltipElement.classList.add("hidden");
      });

      const formatLength = (line) => {
        var sourceProj = this.map.getView().getProjection(); //获取投影坐标系

        // var geom = line.clone().transform(sourceProj, "EPSG:4326");
        // var length = getLength(line);
        //获取投影坐标系
        //ol/sphere里有getLength()和getArea()用来测量距离和区域面积，默认的投影坐标系是EPSG:3857, 其中有个options的参数，可以设置投影坐标系
        var length = getLength(line, {
          projection: sourceProj /*, radius: 6371008.8*/,
        });
        console.log(length);
        var output;
        if (length > 100) {
          output = Math.round((length / 1000) * 100) / 100 + " " + "km";
        } else {
          output = Math.round(length * 100) / 100 + " " + "m";
        }
        return output;
      };

      let source;
      // 获取存放feature的vectorlayer层。map初始化的时候可以添加好了
      for (let layerTmp of this.map.getLayers().getArray()) {
        if (layerTmp.get("name") == "feature") {
          // layer = layerTmp;
          // layerTmp.setSource(null)
          source = layerTmp.getSource();
        }
      }

      const addInteraction = () => {
        console.log(this);
        this.draw = new olInteraction.Draw({
          source: source,
          type: "LineString",
        });
        this.map.addInteraction(this.draw);
        console.log("到这里了吗");
        // createMeasureTooltip();
        // createHelpTooltip();

        var listener;
        this.draw.on(
          "drawstart",
          (evt) => {
            sketch = evt.feature;
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
              // measureTooltipElement.innerHTML = output;
              console.log(output);
              // measureTooltip.setPosition(tooltipCoord);
            });
          }
        );

        this.draw.on(
          "drawend",
          () => {
            // measureTooltipElement.className = "tooltip tooltip-static";
            // measureTooltip.setOffset([0, -7]);
            // unset sketch
            // sketch = null;
            // unset tooltip so that a new one can be created
            // measureTooltipElement = null;
            // createMeasureTooltip();
            // unByKey(listener);
            // 单次测距
            // this.map.un("pointermove", pointerMoveHandler);
            // this.map.removeInteraction(this.draw);
            // helpTooltipElement.classList.add("hidden");
          },
          this
        );
      };

      // const createHelpTooltip = () => {
      //   if (helpTooltipElement) {
      //     helpTooltipElement.parentNode.removeChild(helpTooltipElement);
      //   }
      //   helpTooltipElement = document.createElement("div");
      //   helpTooltipElement.className = "tooltip hidden";
      //   helpTooltip = new Overlay({
      //     element: helpTooltipElement,
      //     offset: [15, 0],
      //     positioning: "center-left",
      //   });
      //   this.map.addOverlay(helpTooltip);
      // };

      // const createMeasureTooltip = () => {
      //   if (measureTooltipElement) {
      //     measureTooltipElement.parentNode.removeChild(
      //       measureTooltipElement
      //     );
      //   }
      //   measureTooltipElement = document.createElement("div");
      //   measureTooltipElement.className = "ol-tooltip tooltip-measure";
      //   measureTooltip = new Overlay({
      //     element: measureTooltipElement,
      //     offset: [0, -15],
      //     positioning: "bottom-center",
      //   });
      //   this.map.addOverlay(measureTooltip);
      // };
      addInteraction();

      // ************************************************************/
    } else if (this.selectedDrawValue === "Polygon") {

    }

    // this.map.addInteraction(this.draw);
  } else {
    this.map.removeInteraction(this.draw);
    console.log(this.draw);
    this.isDraw = false;
  }

  this.draw.on("drawstart", (e) => {
    this.isDraw = true;
    this.selectedDrawValue = e.target.type_;
  });
  this.draw.on("drawend", (e) => {
    this.infoOverlay.setPosition(undefined);
    let finishCoordinate;
    console.log(e.target.sketchCoords_);
    if (this.selectedDrawValue === "Point") {
      this.addForm.targetCoordinate = e.target.sketchCoords_;
      finishCoordinate = e.target.sketchCoords_;
    } else if (this.selectedDrawValue === "LineString") {
      const lineCoordinate = e.target.sketchCoords_;
      this.addForm.targetCoordinate = lineCoordinate;
      finishCoordinate = lineCoordinate[1];
    } else if (this.selectedDrawValue === "Polygon") {
      this.addForm.targetCoordinate = e.target.sketchCoords_[0];
      finishCoordinate = e.target.sketchCoords_[0][0];
    }
    this.addOverlay.setPosition(finishCoordinate);
  });

  // this.setTooptipsPosition();
  this.map.addLayer(this.drawmapLayer);
}