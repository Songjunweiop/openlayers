<template>
  <div>
    <el-button type="primary" @click="ranging()">测距</el-button>
    <el-button type="primary" @click="surveyArea()">测面积</el-button>
    <el-select
      v-model="selectedDrawValue"
      placeholder="请选择"
      @change="toggleDrawmapLayer()"
    >
      <el-option
        v-for="item in drawOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      >
      </el-option>
    </el-select>
    <!--  点击弹框 begin -->
    <div class="ol-popup" ref="popup">
      <a
        href="#"
        id="popup-closer"
        class="ol-popup-closer"
        @click="closeTooptips()"
      ></a>
      <div class="popup-content" ref="popup_content">
        <p>目标位置：{{ targetFrom.coordinate }}</p>
        <el-form ref="form" :model="targetFrom" label-width="80px">
          <el-form-item label="标记">
            <el-input v-model="targetFrom.mark"></el-input>
          </el-form-item>
          <el-form-item label="距离" v-show="hasMath">
            <el-input v-model="targetFrom.math" disabled></el-input>
          </el-form-item>

          <el-form-item>
            <el-button
              plain
              size="mini"
              type="primary"
              @click="handleUpdate('update')"
              >保存</el-button
            >
            <el-button
              plain
              size="mini"
              @click="handleDelete('delete')"
              type="danger"
              >删除</el-button
            >
          </el-form-item>
        </el-form>
      </div>
    </div>
    <!--  点击弹框 end -->

    <!-- addPoint 点击弹框 begin -->
    <div class="ol-popup" ref="add_popup">
      <a
        href="#"
        id="popup-closer"
        class="ol-popup-closer"
        @click="closeTooptips()"
      ></a>
      <div ref="add_popup_content">
        <p>当前目标位置：{{ addForm.targetCoordinate }}</p>

        <el-form ref="form" :model="addForm" label-width="80px">
          <!-- <el-form-item label="描述">
            <el-input v-model="addForm.name"></el-input>
          </el-form-item> -->
          <el-form-item label="备注">
            <el-input v-model="addForm.mark"></el-input>
          </el-form-item>
          <el-form-item label="距离" v-show="hasMath">
            <el-input v-model="output"></el-input>
          </el-form-item>

          <el-form-item>
            <el-button plain size="mini" type="primary" @click="handleCreate()"
              >创建</el-button
            >
            <el-button plain size="mini" @click="closeTooptips()"
              >取消</el-button
            >
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 地图 -->
    <div id="map" style="width: 98vw; height: 85vh;"></div>
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
import {
  Vector as VectorSource,
  OSM as OSMSource,
  XYZ as XYZSource,
} from "ol/source";
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
import lodash from "lodash";
useGeographic();
export default {
  name: "CecTileMap",
  props: {
    heatData: { type: Object, default: () => ({}) },
    pointsData: { type: Array, default: [] },
    lineData: { type: Array, default: [] },
    polygonData: { type: Array, default: [] },
  },
  data() {
    return {
      map: null,
      infoContainer: "",
      addContainer: "",
      addLineContainer: "",
      addPolygonContainer: "",
      heatmapLayer: null,
      drawmapLayer: null,
      draw: null,
      snap: null,
      drawOptions: [
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
          value: "None",
          label: "No do",
        },
      ],
      selectedDrawValue: "None",
      overlay: null,
      infoOverlay: null,
      addOverlay: null,
      local: null,
      isDraw: false,
      targetFrom: {
        id: "",
        math: 0,
        mark: "",
        coordinate: "",
      },
      addForm: {
        id: "",
        math: 0,
        mark: "",
        targetCoordinate: [],
      },
      output: 0,
      hasMath: true,
    };
  },
  watch: {
    heatData() {
      this.renderHeatLayer();
    },
    pointsData() {
      this.renderPointLayer();
    },
    lineData() {
      this.renderLineLayer();
    },
    polygonData() {
      this.renderPolygonLayer();
    },
  },
  created() {},
  mounted() {
    this.initMap();
  },
  methods: {
    // 初始化map
    initMap() {
      const source = new XYZSource({
        maxZoom: 15,
        url:
          "https://services.arcgisonline.com/arcgis/rest/services/" +
          "ESRI_Imagery_World_2D/MapServer/tile/{z}/{y}/{x}",
        projection: "EPSG:4326",
        tileSize: 512, // the tile size supported by the ArcGIS tile service
        maxResolution: 180 / 512, // Esri's tile grid fits 180 degrees on one 512 px tile
        wrapX: false,
        imageSmoothing:false,
      });
      const raster = new TileLayer({
        source: source,
      });
      // 点击点弹出tooptips元素
      this.infoContainer = this.$refs.popup;

      // 获取创建点、线、面弹出的form元素
      this.addContainer = this.$refs.add_popup;

      // 显示目标信息的弹框层
      this.infoOverlay = new Overlay({
        element: this.infoContainer,
        autoPan: false,
        autoPanAnimation: {
          duration: 250,
        },
      });
      // 显示添加绘制目标的弹框层
      this.addOverlay = new Overlay({
        element: this.addContainer,
        autoPan: false,
        autoPanAnimation: {
          duration: 250,
        },
      });

      this.map = new Map({
        layers: [raster,],
        target: "map",
        view: new View({
          // projection: "EPSG:4326", //正确
          projection: "EPSG:3857",
          center: [102, 35],
          zoom: 5,
          minZoom: 2,
          maxZoom: 10
        }),
        interactions: new olInteraction.defaults({
          doubleClickZoom: false,
          mouseWheelZoom: true,
        }).extend([new olInteraction.DragRotateAndZoom()]), //按住Shift旋转放大
        controls: olControl
          .defaults()
          .extend([
            // new olControl.FullScreen(),
            new olControl.ZoomSlider(),
            new olControl.MousePosition(),
          ]),
        overlays: [this.infoOverlay, this.addOverlay],
      });
      this.setPointerMove();
    },

    // 关闭弹窗
    closeTooptips() {
      this.infoOverlay.setPosition(undefined);
      this.addOverlay.setPosition(undefined);
      return false;
    },

    // 测距离
    ranging() {
      Measure.measure(this.map, "LineString");
    },
    // 测面积
    surveyArea() {
      Measure.measure(this.map, "area");
    },

    // 添加点、线、面
    handleCreate() {
      if (this.selectedDrawValue === "Point") {
        this.$emit("pointChange", "create", this.addForm);
        this.renderPointLayer();
      } else if (this.selectedDrawValue === "LineString") {
        this.addForm.math = this.output;
        this.$emit("lineChange", "create", this.addForm);
        this.renderLineLayer();
      } else if (this.selectedDrawValue === "Polygon") {
        this.addForm.math = this.output;
        this.$emit("polygonChange", "create", this.addForm);
        this.renderPolygonLayer();
      }
      this.closeTooptips();
    },

    // 更新点、线、面
    handleUpdate() {
      const isDeep = (arr) => arr.some((item) => item instanceof Array);
      const updatetype = isDeep(this.targetFrom.coordinate);

      if (!updatetype) {
        this.$emit("pointChange", "update", this.targetFrom);
      } else if (updatetype && this.targetFrom.coordinate.length !== 1) {
        this.$emit("lineChange", "update", this.targetFrom);
      } else {
        this.$emit("polygonChange", "update", this.targetFrom);
      }

      this.closeTooptips();
    },

    // 删除点、线、面
    handleDelete() {
      const isDeep = (arr) => arr.some((item) => item instanceof Array);
      const deletetype = isDeep(this.targetFrom.coordinate);
      const allLayers = this.map.getLayers().array_;
      if (!deletetype) {
        allLayers.forEach((curLayer) => {
          if (curLayer.values_.pointLayerId === this.targetFrom.id) {
            this.map.removeLayer(curLayer);
          }
        });
        this.$emit("pointChange", "delete", this.targetFrom.id);
      } else if (deletetype && this.targetFrom.coordinate.length !== 1) {
        allLayers.forEach((curLayer) => {
          if (curLayer.values_.lineLayerId === this.targetFrom.id) {
            this.map.removeLayer(curLayer);
          }
        });
        this.$emit("lineChange", "delete", this.targetFrom.id);
      } else {
        allLayers.forEach((curLayer) => {
          if (curLayer.values_.polygonLayerId === this.targetFrom.id) {
            this.map.removeLayer(curLayer);
          }
        });
        this.$emit("polygonChange", "delete", this.targetFrom.id);
      }

      this.closeTooptips();
    },

    // 点击下拉框绘制要创建的画点、线、面
    toggleDrawmapLayer() {
      if (this.drawmapLayer) this.map.removeLayer(this.drawmapLayer);

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

        this.map.addInteraction(this.draw);
      } else {
        this.map.removeInteraction(this.draw);
        this.isDraw = false;
      }

      this.draw.on("drawstart", (e) => {
        this.addForm.mark = "";
        this.isDraw = true;
        this.selectedDrawValue = e.target.type_;
        this.output = 0;
        const sketch = e.feature;

        sketch.getGeometry().on("change", (evt) => {
          let geom = evt.target;
          // let output;
          if (geom instanceof Polygon) {
            this.output = this.formatArea(geom);
          } else if (geom instanceof LineString) {
            this.output = this.formatLength(geom);
          }
        });
      });

      this.draw.on("drawend", (e) => {
        this.infoOverlay.setPosition(undefined);
        let finishCoordinate;
        if (this.selectedDrawValue === "Point") {
          this.hasMath = false;
          this.addForm.targetCoordinate = e.target.sketchCoords_;
          finishCoordinate = e.target.sketchCoords_;
        } else if (this.selectedDrawValue === "LineString") {
          this.hasMath = true;
          const lineCoordinate = e.target.sketchCoords_;
          this.addForm.targetCoordinate = lineCoordinate;
          finishCoordinate = lineCoordinate[1];
        } else if (this.selectedDrawValue === "Polygon") {
          this.hasMath = true;
          this.addForm.targetCoordinate = e.target.sketchCoords_[0];
          finishCoordinate = e.target.sketchCoords_[0][0];
        }
        this.addOverlay.setPosition(finishCoordinate);
        // this.map.removeLayer(this.drawmapLayer)
        // this.map.removeInteraction(this.draw);
        // this.selectedDrawValue = "None"
        // this.isDraw = false;
      });

      // this.setTooptipsPosition();
      this.map.addLayer(this.drawmapLayer);
    },
    // 获取长度
    formatLength(line) {
      // const sourceProj = this.map.getView().getProjection();
      //ol/sphere里有getLength()和getArea()用来测量距离和区域面积，默认的投影坐标系是EPSG:3857, 其中有个options的参数，可以设置投影坐标系
      const length = getLength(line, {
        projection: "EPSG:4326" /*, radius: 6371008.8*/,
      });
      let output;
      if (length > 100) {
        output = Math.round((length / 1000) * 100) / 100 + " " + "km";
      } else {
        output = Math.round(length * 100) / 100 + " " + "m";
      }
      return output;
    },
    // 获取面积
    formatArea(polygon) {
      //获取投影坐标系
      const area = getArea(polygon, { projection: "EPSG:4326" });
      let output;
      if (area > 10000) {
        output = Math.round((area / 1000000) * 100) / 100 + " " + "km²";
      } else {
        output = Math.round(area * 100) / 100 + " " + "m²";
      }
      return output;
    },

    //渲染热力图
    renderHeatLayer() {
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

    // 关闭热力图
    handleCloseHeatLayer() {
      this.map.removeLayer(this.heatmapLayer);
    },

    // 渲染点图
    renderPointLayer() {
      this.clearAllPointLayers();
      let pointAry = [];
      this.pointsData.map((curpoint) => {
        const pointFeatures = new Feature({
          geometry: new Point(curpoint.coordinate),
        });
        pointFeatures.setProperties({
          id: curpoint.id,
          // math: curpoint.math,
          location: curpoint.mark,
        });

        const vectorPointSource = new VectorSource({
          features: [pointFeatures],
        });

        const pointLayer = new VectorLayer({
          pointLayerId: curpoint.id,
          title: "mypointLayer",
          source: vectorPointSource,
          style: new Style({
            image: new Circle({
              radius: 5,
              fill: new Fill({ color: "red" }),
              stroke: new Stroke({ color: "red", size: 1 }),
            }),
          }),
        });
        pointAry.push(pointLayer);
        // this.map.addLayer(pointLayer);
      });
      console.log(pointAry)
      this.map.addLayer(pointAry);

      this.setTooptipsPosition();
    },

    // 关闭点图层
    clearAllPointLayers() {
      const pointLayers = this.map.getLayerGroup().getLayersArray();
      pointLayers.forEach((curLayer) => {
        if (curLayer.get("title") === "mypointLayer")
          this.map.removeLayer(curLayer);
      });
    },

    // 渲染通联图
    renderLineLayer() {
      this.clearAllLineLayers();
      this.lineData.map((curline) => {
        const lineFeatures = new Feature({
          geometry: new LineString(curline.lineCoordinate),
        });
        lineFeatures.setProperties({
          id: curline.id,
          math: curline.math,
          location: curline.mark,
        });
        const vectorLineSource = new VectorSource({
          features: [lineFeatures],
        });

        const lineLayer = new VectorLayer({
          lineLayerId: curline.id,
          title: "mylineLayer",
          source: vectorLineSource,
          style: new Style({
            stroke: new Stroke({ color: "#00FF00", width: 2 }),
          }),
        });
        this.map.addLayer(lineLayer);
      });
      this.setTooptipsPosition();
    },

    // 关闭通联层
    clearAllLineLayers() {
      const pointLayers = this.map.getLayerGroup().getLayersArray();
      pointLayers.forEach((curLayer) => {
        if (curLayer.get("title") === "mylineLayer")
          this.map.removeLayer(curLayer);
      });
    },

    // 渲染多边形图
    renderPolygonLayer() {
      this.clearAllPolygonLayers();
      this.polygonData.map((curpolygon) => {
        const polygonCoordinates = JSON.parse(
          JSON.stringify(curpolygon.polygonCoordinate)
        );
        const polygonFeatures = new Feature({
          geometry: new Polygon([polygonCoordinates]),
        });
        polygonFeatures.setProperties({
          id: curpolygon.id,
          math: curpolygon.math,
          location: curpolygon.mark,
        });
        const vectorPolygonSource = new VectorSource({
          features: [polygonFeatures],
        });

        const polygonLayer = new VectorLayer({
          polygonLayerId: curpolygon.id,
          title: "mypolygonLayer",
          source: vectorPolygonSource,
        });
        this.map.addLayer(polygonLayer);
      });
      this.setTooptipsPosition();
    },

    // 关闭多边形层
    clearAllPolygonLayers() {
      const pointLayers = this.map.getLayerGroup().getLayersArray();
      pointLayers.forEach((curLayer) => {
        if (curLayer.get("title") === "mypolygonLayer")
          this.map.removeLayer(curLayer);
      });
    },

    // map点击事件注册
    setTooptipsPosition() {
      this.map.on("singleclick", (e) => {
        if (!this.isDraw) {
          this.infoOverlay.setPosition(undefined); //点击空白处清除弹框
          const pixel = this.map.getEventPixel(e.originalEvent);
          const feature = this.map.forEachFeatureAtPixel(
            pixel,
            (feature) => feature
          );
          if (feature && !this.isDraw) {
            //如果是已存在目标的点击
            this.displayInfoForm(feature, e.coordinate);
          }
        }
      });
    },

    // map移入feature中事件
    setPointerMove() {
      this.map.on("pointermove", (e) => {
        var pixel = this.map.getEventPixel(e.originalEvent);
        const feature = this.map.forEachFeatureAtPixel(
          pixel,
          (feature) => feature
        );
        if (feature) {
          this.map.getTargetElement().style.cursor = "pointer";
        } else {
          this.map.getTargetElement().style.cursor = "";
        }
      });
    },

    // 传回给父组件的信息
    handleClickOnTarget(feature) {
      const featureType = feature.getGeometry().getType();
      this.$emit("handleClickOnTarget", featureType, this.targetFrom);
    },

    //点击目标，弹出tooltips
    displayInfoForm(feature, clickCoordinate) {
      this.targetFrom.id = feature.getProperties().id;
      if (feature.getProperties().math) {
        this.hasMath = true;
        this.targetFrom.math = feature.getProperties().math;
      } else {
        this.hasMath = false;
      }

      this.targetFrom.mark = feature.getProperties().location;
      this.targetFrom.coordinate = feature.getGeometry().getCoordinates();
      this.infoOverlay.setPosition(clickCoordinate);
      this.handleClickOnTarget(feature);
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
  text-align: left;
  position: absolute;
  background-color: rgb(0, 0, 0);
  font-size: 14px;
  color: white;
  padding: 15px;
  border-radius: 10px;
  bottom: 12px;
  left: -50px;
  min-width: 260px;
  p {
    margin: 20px 0;
  }
  .el-form {
    .el-form-item {
      margin-bottom: 18px;
      .el-form-item__label {
        color: white;
        width: 60px !important;
      }
      .el-form-item__content {
        margin-left: 69px !important;
      }
    }
    .el-input.is-disabled .el-input__inner {
      color: #606266;
    }
    .el-input__inner {
      height: 32px;
    }
    .el-button--danger {
      color: black;
    }
    .el-button--danger.is-plain {
      background: #fef0f0;
    }
    .el-button--danger.is-plain:hover {
      background: #f56c6c;
    }
  }
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
  border-top-color: rgb(0, 0, 0);
  border-width: 10px;
  left: 48px;
  margin-left: -10px;
}
.ol-popup:before {
  // border-top-color: #cccccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}
.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
  color: white;
}
.ol-popup-closer:after {
  content: "✖";
}
</style>
