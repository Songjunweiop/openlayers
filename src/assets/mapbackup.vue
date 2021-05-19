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
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      >
      </el-option>
    </el-select>
    <!--  点击弹框 begin -->
    <div id="popup" class="ol-popup" ref="popup">
      <a
        href="#"
        id="popup-closer"
        class="ol-popup-closer"
        @click="closeTooptips()"
      ></a>
      <div id="popup-content" ref="popup_content">
        <div id="popup-content">
          目标位置：{{ targetFrom.coordinate }}
          <br />
          ID：{{ targetFrom.id }}
          <br />
          描述：{{ targetFrom.name }}
          <br />
          备注：{{ targetFrom.mark }}
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
    <!--  点击弹框 end -->

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
          当前目标位置：{{ addForm.targetCoordinate }}
          <el-form ref="form" :model="addForm" label-width="80px">
            <el-form-item label="描述">
              <el-input v-model="addForm.name"></el-input>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="addForm.mark"></el-input>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleCreatePoint()"
                >创建</el-button
              >
              <el-button @click="closeTooptips()">取消</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
    <!-- addPoint 点击弹框 end -->

    <!-- addLine 点击弹框 begin -->
    <!-- <div id="popup" class="ol-popup" ref="add_line_popup">
      <a
        href="#"
        id="popup-closer"
        class="ol-popup-closer"
        @click="closeTooptips()"
      ></a>
      <div id="popup-content" ref="add_line_popup_content">
        <div id="popup-content">
          当前点的位置：{{ addLineForm.lineCoordinate }}
          <el-form ref="form" :model="addLineForm" label-width="80px">
            <el-form-item label="描述">
              <el-input v-model="addLineForm.name"></el-input>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="addLineForm.mark"></el-input>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleCreateLine()"
                >立即创建</el-button
              >
              <el-button @click="closeTooptips()">取消</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div> -->
    <!-- addLine 点击弹框 end -->

    <!-- addPolygon 点击弹框 begin -->
    <!-- <div id="popup" class="ol-popup" ref="add_polygon_popup">
      <a
        href="#"
        id="popup-closer"
        class="ol-popup-closer"
        @click="closeTooptips()"
      ></a>
      <div id="popup-content" ref="add_polygon_popup_content">
        <div id="popup-content">
          当前坐标位置：{{ addPolygonForm.polygonCoordinate }}
          <el-form ref="form" :model="addForm" label-width="80px">
            <el-form-item label="描述">
              <el-input v-model="addPolygonForm.name"></el-input>
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="addPolygonForm.mark"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleCreatePolygon()"
                >立即创建</el-button
              >
              <el-button @click="closeTooptips()">取消</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div> -->
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
          value: "None",
          label: "No do",
        },
      ],
      selectedDrawValue: "None",
      overlay: null,
      infoOverlay: null,
      addOverlay: null,
      // addLineOverlay: null,
      // addPolygonOverlay: null,
      local: null,
      isDraw: false,
      targetFrom: {
        id: "",
        name: "",
        mark: "",
        coordinate: "",
      },
      addForm: {
        id: "",
        name: "",
        mark: "",
        targetCoordinate: [],
      },
      // addLineForm: {
      //   id: "",
      //   name: "",
      //   mark: "",
      //   lineCoordinate: [],
      // },
      // addPolygonForm: {
      //   id: "",
      //   name: "",
      //   mark: "",
      //   polygonCoordinate: [],
      // },
    };
  },
  watch: {},
  created() {},
  mounted() {
    this.initMap();
  },
  methods: {
    // 初始化map
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
      // 点击点弹出tooptips元素
      this.infoContainer = this.$refs.popup;

      // 创建点、线、面弹出form元素
      this.addContainer = this.$refs.add_popup;
      this.addLineContainer = this.$refs.add_line_popup;
      this.addPolygonContainer = this.$refs.add_polygon_popup;

      this.infoOverlay = new Overlay({
        element: this.infoContainer,
        autoPan: false,
        autoPanAnimation: {
          duration: 250,
        },
      });
      this.addOverlay = new Overlay({
        element: this.addContainer,
        autoPan: false,
        autoPanAnimation: {
          duration: 250,
        },
      });
      // this.addLineOverlay = new Overlay({
      //   element: this.addLineContainer,
      //   autoPan: false,
      //   autoPanAnimation: {
      //     duration: 250,
      //   },
      // });
      // this.addPolygonOverlay = new Overlay({
      //   element: this.addPolygonContainer,
      //   autoPan: false,
      //   autoPanAnimation: {
      //     duration: 250,
      //   },
      // });

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
        }).extend([new olInteraction.DragRotateAndZoom()]), //按住Shift旋转放大
        controls: olControl
          .defaults()
          .extend([
            new olControl.FullScreen(),
            new olControl.ZoomSlider(),
            new olControl.MousePosition(),
          ]),
        overlays: [
          this.infoOverlay,
          this.addOverlay,
          // this.addLineOverlay,
          // this.addPolygonOverlay,
        ],
      });
      console.log(this.map.getLayers());
    },

    // 关闭弹窗
    closeTooptips() {
      this.infoOverlay.setPosition(undefined);
      this.addOverlay.setPosition(undefined);
      // this.addLineOverlay.setPosition(undefined);
      // this.addPolygonOverlay.setPosition(undefined);
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

    // 添加点
    handleCreatePoint() {
      console.log(this.addForm);
      console.log(this.selectedDrawValue);
      if (this.selectedDrawValue === "Point") {
        console.log("这里是创建点");
        this.$emit("createPoint", this.addForm);
        this.renderPointLayer();
      } else if (this.selectedDrawValue === "LineString") {
        console.log("这里创建的线");
        this.$emit("createLine", this.addForm);
        this.renderLineLayer();
      } else if (this.selectedDrawValue === "Polygon") {
        console.log("这里创建的面");
        this.$emit("createPolygon", this.addForm);
        this.renderPolygonLayer();
      }

      this.closeTooptips();
    },

    // 添加线
    handleCreateLine() {
      console.log(this.addLineForm);
      this.$emit("createLine", this.addLineForm);
      this.closeTooptips();
      this.renderLineLayer();
    },

    // 添加面
    handleCreatePolygon() {
      console.log(this.addPolygonForm);
      console.log("添加了面了吗");
      this.$emit("createPolygon", this.addPolygonForm);
      this.closeTooptips();
      this.renderPolygonLayer();
    },

    // 删除点、线、面
    handleDeletePoint() {
      console.log(this.targetFrom);
      const isDeep = (arr) => arr.some((item) => item instanceof Array);
      const deletetype = isDeep(this.targetFrom.coordinate);
      console.log(deletetype);
      if (!deletetype) {
        console.log("我删除的是点");
        this.$emit("deletePoint", this.targetFrom.id);
      } else if (deletetype && this.targetFrom.coordinate.length !== 1) {
        console.log("我删除的是线");
        this.$emit("deleteLine", this.targetFrom.id);
      } else {
        console.log("我删除的是面");
        this.$emit("deletePolygon", this.targetFrom.id);
      }

      this.closeTooptips();
    },

    // 点击下拉框绘制要创建的画点、线、面
    toggleDrawmapLayer() {
      if (this.drawmapLayer) this.map.removeLayer(this.drawmapLayer);
      console.log("执行了吗");

      // this.map.removeEventListener();
      const source = new VectorSource({ wrapX: false });
      this.drawmapLayer = new VectorLayer({
        source: source,
      });

      // 选择标记类型
      if (this.selectedDrawValue !== "None") {
        this.map.removeInteraction(this.draw); // 清除之前的绘制图形

        this.draw = new olInteraction.Draw({
          source: source,
          type: this.selectedDrawValue,
        });
        this.map.addInteraction(this.draw);
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
        console.log(e.target.sketchCoords_);
        if (this.selectedDrawValue === "Point") {
          this.addForm.targetCoordinate = e.target.sketchCoords_;
          this.infoOverlay.setPosition(undefined);
          // this.addPolygonOverlay.setPosition(undefined);
          // this.addLineOverlay.setPosition(undefined);
          this.addOverlay.setPosition(e.target.sketchCoords_);
        } else if (this.selectedDrawValue === "LineString") {
          const lineCoordinate = e.target.sketchCoords_;
          // this.addLineForm.lineCoordinate = lineCoordinate;
          this.addForm.targetCoordinate = lineCoordinate;
          const finishCoordinate = lineCoordinate[1];
          // console.log(finishCoordinate);
          this.infoOverlay.setPosition(undefined);
          this.addOverlay.setPosition(finishCoordinate);
          // this.addPolygonOverlay.setPosition(undefined);
          // this.addLineOverlay.setPosition(finishCoordinate);
        } else if (this.selectedDrawValue === "Polygon") {
          this.addForm.targetCoordinate = e.target.sketchCoords_[0];
          const finishCoordinate = e.target.sketchCoords_[0][0];
          this.infoOverlay.setPosition(undefined);
          this.addOverlay.setPosition(finishCoordinate);
          // this.addLineOverlay.setPosition(undefined);
          // this.addPolygonOverlay.setPosition(finishCoordinate);
        }
      });
      this.setOverlayPosition();
      this.map.addLayer(this.drawmapLayer);
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
    handleCloseHeatLayer() {
      this.map.removeLayer(this.heatmapLayer);
    },

    // 渲染通联图
    renderLineLayer() {
      this.lineData.map((curline) => {
        const lineFeatures = new Feature({
          geometry: new LineString(curline.lineCoordinate),
        });
        lineFeatures.setProperties({
          id: curline.id,
          name: curline.name,
          location: curline.mark,
        });
        const vectorLineSource = new VectorSource({
          features: [lineFeatures],
        });
        // console.log(
        //   vectorLineSource.getFeatures()[0].getGeometry().getCoordinates()
        // );

        const lineLayer = new VectorLayer({
          source: vectorLineSource,
          style: new Style({
            stroke: new Stroke({ color: "#00FF00", width: 2 }),
          }),
        });
        this.map.addLayer(lineLayer);
      });
      this.setOverlayPosition();
    },

    // 渲染点图
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
          title: "mypointLayer",
          source: vectorPointSource,
          zindex: 99,
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

    // 渲染多边形图
    renderPolygonLayer() {
      console.log(this.map.polygonLayer);
      console.log("渲染多边形了吗");
      this.polygonData.map((curpolygon) => {
        const polygonCoordinates = JSON.parse(
          JSON.stringify(curpolygon.polygonCoordinate)
        );
        const polygonFeatures = new Feature({
          geometry: new Polygon([polygonCoordinates]),
        });
        polygonFeatures.setProperties({
          id: curpolygon.id,
          name: curpolygon.name,
          location: curpolygon.mark,
        });
        const vectorPolygonSource = new VectorSource({
          features: [polygonFeatures],
        });

        const polygonLayer = new VectorLayer({
          title: "mypointLayer",
          source: vectorPolygonSource,
        });
        this.map.addLayer(polygonLayer);
      });
      this.setOverlayPosition();
    },

    // map点击事件注册
    setOverlayPosition() {
      this.map.on("singleclick", (e) => {
        if (!this.isDraw) {
          // console.log(e.coordinate);
          // this.addOverlay.setPosition(undefined);
          // this.infoOverlay.setPosition(undefined);
          console.log(this.targetFrom);
          console.log("触发了点击事件");

          const pixel = this.map.getEventPixel(e.originalEvent);
          console.log(pixel);

          this.map.forEachFeatureAtPixel(pixel, (feature) => {
            // console.log(feature.getGeometry());
            console.log(feature.getProperties());
            console.log(feature.getProperties().geometry.flatCoordinates);

            // console.log(feature.getGeometry().getCoordinates());   //渲染出来的point的精确坐标，而不是点击的坐标
            const localPoint = feature.getGeometry().getCoordinates();

            if (feature.getProperties().id && !this.isDraw) {
              //如果是已存在目标的点击
              console.log(localPoint);
              console.log("我有选中这个点吗");
              this.targetFrom.id = feature.getProperties().id;
              this.targetFrom.name = feature.getProperties().name;
              this.targetFrom.mark = feature.getProperties().location;
              this.targetFrom.coordinate = localPoint;
              this.infoOverlay.setPosition(e.coordinate);
            }

            // console.log(this.infoOverlay.getPosition());
          });
        }
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
