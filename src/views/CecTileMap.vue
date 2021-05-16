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
    <div id="popup" class="ol-popup">
      <a href="#" id="popup-closer" class="ol-popup-closer"></a>
      <div id="popup-content"></div>
    </div>
    <div id="map" style="width: 99vw; height: 90vh;"></div>
  </div>
</template>

<script>
import "ol/ol.css";
import { Map, View } from "ol";
import {
  Heatmap as HeatmapLayer,
  Vector as VectorLayer,
  Tile as TileLayer,
} from "ol/layer";
import { Vector as VectorSource, OSM as OMSSource } from "ol/source";
import * as olControl from "ol/control";
import * as olInteraction from "ol/interaction";
import { useGeographic, transform, fromLonLat, toLonLat } from "ol/proj";
import GeoJSON from "ol/format/GeoJSON";
import { Stroke, Style, Fill, Circle, Text } from "ol/style";
import Feature from "ol/Feature";
import { LineString, Point } from "ol/geom";
import Overlay from "ol/Overlay";
import {toStringHDMS} from 'ol/coordinate';

import Measure from "./Measure";
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
      local: null
    };
  },
  watch: {},
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      const raster = new TileLayer({
        source: new OMSSource({
          // layer: "toner",
        }),
      });

      var container = document.getElementById("popup");
      var content = document.getElementById("popup-content");
      var closer = document.getElementById("popup-closer");
      console.log(container)
      console.log(content)

      this.overlay = new Overlay({
        element: container,
        autoPan: true,
        autoPanAnimation: {
          duration: 250,
        },
        // position: [102, 35]
        // positioning: 'bottom-left'
      });
      console.log(this.overlay)
      

      this.map = new Map({
        layers: [raster],
        target: "map",
        view: new View({
          center: [102, 35],
          zoom: 5,
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
      console.log(this.overlay)

      // this.map.on("singleclick", function (e) {
      //   console.log(e.coordinate);
      // });
      closer.onclick = () => {
        this.overlay.setPosition(undefined);
        closer.blur();
        return false;
      };

      this.map.on("singleclick", evt => {
        var coordinate = evt.coordinate;
        this.local = coordinate
        var hdms = coordinate;

        content.innerHTML = "<p>You clicked here:</p><code>" + hdms + "</code>";
        this.overlay.setPosition(coordinate);
      });

      // this.renderHeatLayer();
      this.toggleSelectLayer();
      // this.renderlineLayer();
      // this.renderPointLayer();
    },
    ranging() {
      Measure.measure(this.map, "length");
    },
    surveyArea() {
      Measure.measure(this.map, "area");
    },

    renderHeatLayer() {
      //渲染热力图层
      if (this.heatmapLayer) this.map.removeLayer(this.heatmapLayer);

      // if (!data.length) return;
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
    toggleSelectLayer() {
      //渲染选中图层
      const source = new VectorSource({
        features: new GeoJSON().readFeatures(countriesData, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        }),
      });

      const select = new VectorLayer({
        source: source,
      });

      this.draw = new olInteraction.Draw({
        type: "Polygon",
        source: source,
      });
      this.snap = new olInteraction.Snap({
        source: source,
      });
      this.map.addLayer(select);
    },
    beginSelectLayer() {
      this.map.addInteraction(this.draw);
      this.map.addInteraction(this.snap);
    },
    endSelectLayer() {
      console.log("aaaaaaaaaa");
      this.map.removeInteraction(this.draw);
      this.map.removeInteraction(this.snap);
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
            stroke: new Stroke({ color: "#00FF00", width: 4 }),
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
}
</style>
