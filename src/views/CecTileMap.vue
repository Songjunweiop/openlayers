<template>
  <div>
    <!-- <el-button @click="beginSelectLayer()">选区</el-button> -->
    <!-- <el-button @click="endSelectLayer()">结束选区</el-button> -->
    <el-button type="primary" @click="renderHeatLayer()"
      >show heatMap</el-button
    >
    <el-button type="primary" @click="renderLineLayer()"
      >show lineMap</el-button
    >
    <el-button type="primary" @click="renderPointLayer()"
      >show pointMap</el-button
    >
    <el-button type="primary" @click="ranging()">测距</el-button>
    <el-button type="primary" @click="surveyArea()">测面积</el-button>
    <el-select
      v-model="selectedValue"
      placeholder="请选择"
      @change="toggleDrawmapLayer()"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      >
      </el-option>
    </el-select>
    <div id="popup" class="ol-popup" ref="popup">
      <a
        href="#"
        id="popup-closer"
        class="ol-popup-closer"
        @click="closeTooptips()"
      ></a>
      <div id="popup-content" ref="popup_content" v-html="content"></div>
    </div>
    <!-- dddddddddddddddddddddddddddddddddddddddddd -->
    <!-- <div id="popup" class="ol-popup">
        <a href="#" id="popup-closer" class="ol-popup-closer"></a>
        <div id="popup-content"></div>
    </div> -->
    <div id="map" style="width: 99vw; height: 90vh;"></div>
    <!-- <div id="map" class="map"></div>
    <form class="form-inline">
      <label for="type">Measurement type &nbsp;</label>
      <select id="type">
        <option value="length">Length (LineString)</option>
        <option value="area">Area (Polygon)</option>
      </select>
    </form> -->
    CecTileMap @createPoint={fetch}
  </div>
</template>

<script>
import "ol/ol.css";
import { Map, View } from "ol";
import { Projection } from "ol/proj";
import {
  Heatmap as HeatmapLayer,
  Vector as VectorLayer,
  Tile as TileLayer,
} from "ol/layer";
import { Vector as VectorSource, OSM as OSMSource } from "ol/source";
import * as olControl from "ol/control";
import * as olInteraction from "ol/interaction";
import {
  useGeographic,
  transform,
  fromLonLat,
  toLonLat,
  getTransform,
} from "ol/proj";
import GeoJSON from "ol/format/GeoJSON";
import { Stroke, Style, Fill, Circle, Text } from "ol/style";
import Feature from "ol/Feature";
import { LineString, Point, Polygon } from "ol/geom";
import Overlay from "ol/Overlay";
import { toStringHDMS } from "ol/coordinate";
import { getArea, getLength } from "ol/sphere";
import { unByKey } from "ol/Observable";

import Measure from "./Measure";
// import Measure from "./Measurecopy";
//静态资源
import heatData from "../assets/all_month.json";
import countriesData from "../assets/countries.json";

useGeographic();
export default {
  name: "CecTileMap",
  props: {
    tileMapURL: { type: String, default: "http://localhost:8080" },
    heatData: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      map: null,
      container: "",
      content: "",
      heatmapLayer: null,
      draw: null,
      snap: null,
      options: [
        {
          value: "Point",
          label: "Point",
        },
        {
          value: "LineString",
          label: "LineString",
        },
        {
          value: "Polygon",
          label: "Polygon",
        },
        {
          value: "Circle",
          label: "Circle",
        },
        {
          value: "None",
          label: "No do",
        },
      ],
      points: [
        [100, 40],
        [110, 35],
        [102, 25],
        [108, 30],
        [106, 36],
      ],
      pointArys: [
        [
          [104.057, 30.639],
          [116.399, 39.913],
        ],
        [
          [104.057, 30.639],
          [113.064, 23.113],
        ],
        [
          [104.057, 30.639],
          [114.296, 30.593],
        ],
        [
          [104.057, 30.639],
          [91.178, 29.646],
        ],
        [
          [104.057, 30.639],
          [103.827, 36.058],
        ],
      ],
      selectedValue: "None",
      aaa: [],
      overlay: null,
      local: null,
    };
  },
  watch: {},
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      const raster = new TileLayer({
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

      this.container = this.$refs.popup;
      this.content = this.$refs.popup_content;
      console.log(this.container);
      // this.closeTooptips()

      // console.log(content);
      // console.log(this.$refs.popup)
      // console.log(this.$refs.popup_content)

      this.overlay = new Overlay({
        element: this.container,
        autoPan: true,
        autoPanAnimation: {
          duration: 250,
        },
        // position: [102, 35]
        // positioning: 'bottom-left'
      });
      console.log(this.overlay);

      this.map = new Map({
        layers: [vector, raster],
        target: "map",
        projection: new Projection("EPSG:3857"),
        view: new View({
          center: [102, 35],
          // center: [-11000000, 4600000],
          // zoom: 4,
          // center: [110, 35],
          zoom: 4,
        }),

        interactions: new olInteraction.defaults({
          doubleClickZoom: true,
          mouseWheelZoom: true,
        }).extend([new olInteraction.DragRotateAndZoom()]), //旋转
        controls: olControl
          .defaults()
          .extend([
            new olControl.FullScreen(),
            new olControl.ZoomSlider(),
            new olControl.MousePosition(),
          ]),
        overlays: [this.overlay],
      });
      console.log(this.overlay);
      // 渲染点击坐标
      this.map.on("singleclick", (e) => {
        console.log(e.coordinate);
        const coordinate = e.coordinate;

        var pixel = this.map.getEventPixel(e.originalEvent);
        console.log(pixel)
        this.map.forEachFeatureAtPixel(pixel, (feature) => {
          //coodinate存放了点击时的坐标信息
          // var coodinate = e.coordinate;
          //设置弹出框内容，可以HTML自定义
          this.content = "<p>你点击的坐标为：" + coordinate + "</p>";
          //设置overlay的显示位置
          this.overlay.setPosition(coordinate);
          //显示overlay
          // this.map.addOverlay(overlay);
        });
        this.content =
          "<p>You clicked here:</p><code>" + coordinate + "</code>";
        // this.overlay.setPosition(coordinate);
      });

      // this.renderHeatLayer();
      // this.renderlineLayer();
      // this.renderPointLayer();
    },
    closeTooptips() {
      this.overlay.setPosition(undefined);
      console.log("closed");
      return false;
    },
    ranging() {
      Measure.measure(this.map, "LineString");
    },
    surveyArea() {
      Measure.measure(this.map, "area");
    },

    renderHeatLayer() {
      //渲染热力图层
      if (this.heatmapLayer) this.map.removeLayer(this.heatmapLayer);

      this.heatmapLayer = new HeatmapLayer({
        source: new VectorSource({
          features: new GeoJSON().readFeatures(heatData, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          }),
        }),
        blur: 10,
        radius: 8,
      });

      this.map.addLayer(this.heatmapLayer);
    },
    drawPoints(data) {
      data.array.forEach((element) => {});
    },

    handleCreatePoint(data) {
      this.$emit("createPoint", data);
    },
    toggleDrawmapLayer() {
      console.log("执行了吗");

      const source = new VectorSource({ wrapX: false });
      const drawmapLayer = new VectorLayer({
        source: source,
      });

      // 选择标记类型
      if (this.selectedValue !== "None") {
        this.map.removeInteraction(this.draw);
        // this.draw = null

        this.draw = new olInteraction.Draw({
          source: source,
          type: this.selectedValue,
        });

        this.draw.on(
          "drawend",
          function (e) {
            console.dir(e);
            console.log(e.target.downPx_);

            // helpTooltip = new Overlay({
            //   element: e.target.downPx_,
            //   offset: [15, 0],
            //   positioning: "center-left",
            // });
            // this.map.addOverlay(helpTooltip);
          },
          this
        );

        const modify = new olInteraction.Modify({ source: source });
        this.map.addInteraction(modify);

        this.map.addInteraction(this.draw);
      } else {
        this.map.removeInteraction(this.draw);
      }
      this.map.addLayer(drawmapLayer);
    },

    renderLineLayer() {
      this.pointArys.map((curitem) => {
        const lineFeatures = new Feature({
          geometry: new LineString(curitem),
        });
        const vectorLineSource = new VectorSource({
          features: [lineFeatures],
        });
        console.log(
          vectorLineSource.getFeatures()[0].getGeometry().getCoordinates()
        );

        const lineLayer = new VectorLayer({
          source: vectorLineSource,
          style: new Style({
            stroke: new Stroke({ color: "#00FF00", width: 2 }),
          }),
        });

        const modify = new olInteraction.Modify({ source: vectorLineSource });
        this.map.addInteraction(modify);

        this.map.addLayer(lineLayer);
      });
    },

    renderPointLayer() {
      this.points.map((curpoint) => {
        const pointFeatures = new Feature({
          geometry: new Point(curpoint),
        });
        const vectorPointSource = new VectorSource({
          features: [pointFeatures],
        });
        console.log(
          vectorPointSource.getFeatures()[0].getGeometry().getCoordinates()
        );

        const pointLayer = new VectorLayer({
          source: vectorPointSource,
          style: new Style({
            image: new Circle({
              radius: 5,
              fill: new Fill({ color: "red" }),
              stroke: new Stroke({ color: "red", size: 1 }),
            }),
          }),
        });
        const modify = new olInteraction.Modify({ source: vectorPointSource });
        this.map.addInteraction(modify);
        console.log(modify);
        this.map.addLayer(pointLayer);
      });
    },
    cheju() {},
  },
};
</script>

<style lang="scss">
#map {
  .ol-full-screen {
    top: 35px;
  }

  .ol-zoom {
    top: 68px;
    right: 0.5em;
    left: auto;

    .ol-zoom-out {
      margin-top: 206px;
    }
  }

  .ol-zoomslider {
    top: 95px;
    right: 0.5em;
    left: auto;
    background-color: transparent;
  }
}

.ol-popup {
  position: absolute;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #cccccc;
  bottom: 12px;
  left: -50px;
  min-width: 280px;
}
.ol-popup:after,
.ol-popup:before {
  top: 100%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}
.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  left: 48px;
  margin-left: -10px;
}
.ol-popup:before {
  border-top-color: #cccccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}
.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
}
.ol-popup-closer:after {
  content: "✖";
}
</style>
