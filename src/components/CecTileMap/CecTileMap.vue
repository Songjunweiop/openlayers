<template>
  <div>
    <!-- <el-button @click="beginSelectLayer()">选区</el-button> -->
    <!-- <el-button @click="endSelectLayer()">结束选区</el-button> -->
    <!-- <el-button type="primary" @click="renderHeatLayer()"
      >show heatMap</el-button
    >
    <el-button type="primary" @click="renderLineLayer()"
      >show lineMap</el-button
    >
    <el-button type="primary" @click="renderPointLayer()"
      >show pointMap</el-button
    > -->
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
    <!-- point 点击弹框 begin -->
    <div id="popup" class="ol-popup" ref="popup">
      <a
        href="#"
        id="popup-closer"
        class="ol-popup-closer"
        @click="closeTooptips()"
      ></a>
      <div id="popup-content" ref="popup_content">
        <div id="popup-content">
          当前点的位置：{{ pointForm.pointCoordinate }}
          <br />
          ID：{{ pointForm.id }}
          <br />
          描述：{{ pointForm.name }}
          <br />
          备注：{{ pointForm.mark }}
          <br />
          <el-button
            type="danger"
            icon="el-icon-delete"
            circle
            @click="handleDeletePoint()"
          ></el-button>
        </div>
      </div>
    </div>
    <!-- point 点击弹框 end -->

    <!-- addPoint 点击弹框 begin -->
    <div id="popup" class="ol-popup" ref="add_popup">
      <a
        href="#"
        id="popup-closer"
        class="ol-popup-closer"
        @click="closeTooptips()"
      ></a>
      <div id="popup-content" ref="add_popup_content">
        <div id="popup-content">
          当前点的位置：{{ addPointForm.pointCoordinate }}
          <el-form ref="form" :model="addPointForm" label-width="80px">
            <el-form-item label="描述">
              <el-input v-model="addPointForm.name"></el-input>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="addPointForm.mark"></el-input>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleCreatePoint()"
                >立即创建</el-button
              >
              <el-button @click="closeTooptips()">取消</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
    <!-- addPoint 点击弹框 end -->

    <!-- 地图 -->
    <div id="map" style="width: 99vw; height: 90vh;"></div>
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

import countriesData from "../../assets/countries.json";

useGeographic();
export default {
  name: "CecTileMap",
  props: {
    // tileMapURL: { type: String, default: "http://localhost:8080" },
    heatData: { type: Object, default: () => ({}) },
    pointsData: { type: Array, default: []}
  },
  data() {
    return {
      map: null,
      container: "",
      content: "",
      addContainer: "",
      addContent: "",
      heatmapLayer: null,
      drawmapLayer:null,
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
      addOverlay: null,
      local: null,

      pointForm: {
        id: "",
        name: "",
        mark: "",
        pointCoordinate: "",
      },
      addPointForm: {
        id: "",
        name: "",
        mark: "",
        pointCoordinate: "",
      },
    };
  },
  watch: {},
  created(){},
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
      // tooptips元素
      this.container = this.$refs.popup;
      this.content = this.$refs.popup_content.children;
      // 添加点form元素
      this.addContainer = this.$refs.add_popup;
      this.addContent = this.$refs.add_popup_content.children;


      this.infoOverlay = new Overlay({
        element: this.container,
        autoPan: true,
        autoPanAnimation: {
          duration: 250,
        },
        // position: [102, 35]
      });
      this.addOverlay = new Overlay({
        element: this.addContainer,
        autoPan: true,
        autoPanAnimation: {
          duration: 250,
        },
        // position: [102, 35]
      });

      this.map = new Map({
        layers: [vector, raster],
        target: "map",
        view: new View({
          // projection: "EPSG:4326",
          // projection: "EPSG:3857",
          center: [102, 35],
          // center: [-11000000, 4600000],
          // zoom: 4,
          // center: [110, 35],
          zoom: 4,
        }),
        interactions: new olInteraction.defaults({
          doubleClickZoom: false,
          mouseWheelZoom: true,
        }).extend([new olInteraction.DragRotateAndZoom()]), //旋转
        controls: olControl
          .defaults()
          .extend([
            new olControl.FullScreen(),
            new olControl.ZoomSlider(),
            new olControl.MousePosition(),
          ]),
        overlays: [this.infoOverlay, this.addOverlay],
      });
      console.log(this.map.getLayers())

      // this.renderHeatLayer();
      // this.renderlineLayer();
      // this.renderPointLayer();
    },
    closeTooptips() {
      this.infoOverlay.setPosition(undefined);
      this.addOverlay.setPosition(undefined);
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
          features: new GeoJSON().readFeatures(this.heatData, {
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
    // 添加点
    handleCreatePoint() {
      console.log(this.addPointForm);
      this.$emit("createPoint", this.addPointForm);
      this.closeTooptips();
      this.renderPointLayer()
    },
    // 删除点
    handleDeletePoint() {
      console.log(this.pointForm);
      this.$emit("deletePoint", this.pointForm.id);
      this.closeTooptips();
    },
    // 添加线
    handleCreateLine() {
      console.log(this.addLineForm);
      this.$emit("createLine", this.addLineForm);
      this.closeTooptips();
      // this.renderPointLayer()
    },
    // 删除线
    handleDeleteLine() {
      console.log(this.pointForm);
      this.$emit("deletePoint", this.pointForm.id);
      this.closeTooptips();
    },

    toggleDrawmapLayer() {
      if(this.drawmapLayer) this.map.removeLayer(this.drawmapLayer)
      
      console.log("执行了吗");

      this.map.removeEventListener();
      const source = new VectorSource({ wrapX: false });
      this.drawmapLayer = new VectorLayer({
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
        this.map.addInteraction(this.draw);
      } else {
        this.map.removeInteraction(this.draw);
        // this.renderPointLayer();
      }
      this.setOverlayPosition();
      this.map.addLayer(this.drawmapLayer);
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

        this.map.addLayer(lineLayer);
      });
    },

    renderPointLayer() {
      console.log("渲染点了吗");
      this.pointsData.map((curpoint) => {
        const pointFeatures = new Feature({
          geometry: new Point(curpoint.coordinate),
        });
        pointFeatures.setProperties({
          id: curpoint.id,
          name: curpoint.name,
          location: curpoint.mark,
        });

        const vectorPointSource = new VectorSource({
          features: [pointFeatures],
        });
        // console.log(pointFeatures.getGeometry());
        // console.log(
        //   pointFeatures.getGeometry().getCoordinates() //渲染点坐标
        // );

        const pointLayer = new VectorLayer({
          title: 'mypointLayer',
          source: vectorPointSource,
          style: new Style({
            image: new Circle({
              radius: 5,
              fill: new Fill({ color: "red" }),
              stroke: new Stroke({ color: "red", size: 1 }),
            }),
          }),
        });
        this.map.addLayer(pointLayer);
      });
      this.setOverlayPosition();
    },
    // map点击事件注册
    setOverlayPosition() {
      this.map.on("singleclick", (e) => {
        console.log(this.pointForm)
        console.log("dianlema ");

        const pixel = this.map.getEventPixel(e.originalEvent);
        console.log(pixel);

        this.map.forEachFeatureAtPixel(pixel, (feature) => {
          // console.log(feature.getGeometry());
          console.log(feature.getProperties());

          // console.log(feature.getGeometry().getCoordinates());   //渲染出来的point的精确坐标，而不是点击的坐标
          const localPoint = feature.getGeometry().getCoordinates();

          if (feature.getProperties().id) {
            this.pointForm.id = feature.getProperties().id;
            this.pointForm.name = feature.getProperties().name;
            this.pointForm.mark = feature.getProperties().location;
            this.pointForm.pointCoordinate = localPoint;
            this.addOverlay.setPosition(undefined);
            this.infoOverlay.setPosition(localPoint);
          } else {
            this.addPointForm.pointCoordinate = localPoint;
            this.infoOverlay.setPosition(undefined);
            this.addOverlay.setPosition(localPoint);
          }

          console.log(this.infoOverlay.getPosition());
        });
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
