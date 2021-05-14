<template>
  <div>
    <!--    <el-button @click="beginSelectLayer()">选区</el-button>-->
    <!--    <el-button @click="endSelectLayer()">结束选区</el-button>-->
    <el-select
      v-model="selectedValue"
      placeholder="请选择"
      @change="toggleDrawLayer()"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      >
      </el-option>
    </el-select>
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
import { useGeographic, transform } from "ol/proj";

import GeoJSON from "ol/format/GeoJSON";

import heatData from "../assets/all_month.json";
import countriesData from "../assets/countries.json";

import { Stroke, Style, Fill } from 'ol/style';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point'


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
          label: "None",
        }
      ],
      selectedValue: "None",
      aaa: [],
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




      this.map = new Map({
        // 初始化map
        layers: [raster],
        target: "map",
        view: new View({
          center: [105, 30],
          zoom: 5,
        }),
        interactions: new olInteraction.defaults({
          doubleClickZoom: true, //双击
          mouseWheelZoom: true, //滚轮
        }).extend([new olInteraction.DragRotateAndZoom()]), //旋转
        controls: olControl
          .defaults()
          .extend([
            new olControl.FullScreen(),
            new olControl.ZoomSlider(),
            new olControl.MousePosition(),
          ]),
      });

      this.toggleHeatMapLayer();
      // this.toggleSelectLayer();
      this.toggleDrawLayer();
      this.toggleFlightLayer()
    },

    toggleHeatMapLayer() {
      //渲染热力图层
      if (this.heatmapLayer) this.map.removeLayer(this.heatmapLayer);

      // if (!data.length) return;
      const heatmap = new HeatmapLayer({
        source: new VectorSource({
          features: new GeoJSON().readFeatures(heatData, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          }),
        }),
        blur: 10,
        radius: 8,
      });

      this.map.addLayer(heatmap);
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

    toggleDrawLayer() {
      const source = new VectorSource({ wrapX: false });
      const drawLayer = new VectorLayer({
        source: source,
      });


      // 选择标记类型
      if (this.selectedValue !== "None") {
        this.map.removeInteraction(this.draw); //重置
        this.draw = new olInteraction.Draw({
          source: source,
          type: this.selectedValue,
        });
        this.map.addInteraction(this.draw);
      } else {
        this.map.removeInteraction(this.draw);
      }

      this.map.addLayer(drawLayer);
    },

    toggleFlightLayer() {
      const points = [[116.399, 39.913], [104.057, 30.639]];

      const featureLine = new Feature({
        geometry: new LineString(points)
      });

      const vectorLine = new VectorSource({});
      vectorLine.addFeature(featureLine);

      const lineLayer = new VectorLayer({
        source: vectorLine,
        style: new Style({
          fill: new Fill({ color: '#00FF00', weight: 4 }),
          stroke: new Stroke({ color: '#00FF00', width: 2 })
        })
      });
      this.map.addLayer(lineLayer);


      const points1 = [[100, 40], [100, 50]];

      const featureLine1 = new Feature({
        geometry: new Point(points1)
      });

      const vectorLine1 = new VectorSource({});
      vectorLine.addFeature(featureLine1);

      const lineLayer1 = new VectorLayer({
        source: vectorLine1,
        style: new Style({
          // fill: new Fill({ color: '#00FF00', weight: 4 }),
          // stroke: new Stroke({ color: '#00FF00', width: 2 })
        })
      });
      this.map.addLayer(lineLayer1);
    }
  }
}
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
</style>
