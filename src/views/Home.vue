<template>
  <div class="home">
    <el-button type="primary" @click="showHeatMap">热力图</el-button>
    <el-button @click="closeHeatMap">关闭热力图</el-button>
    <el-button type="primary" @click="showPointMap">点图</el-button>
    <el-button @click="closePointMap">关闭点图</el-button>
    <el-button type="primary" @click="showLineMap">通联图</el-button>
    <el-button @click="closeLineMap">关闭通联图</el-button>
    <el-button type="primary" @click="showPolygonMap">多边形图</el-button>
    <el-button @click="closePolygonMap">关闭多边形图</el-button>
    <el-card class="box-card" v-show="isShow">
      <div slot="header" class="clearfix">
        <span>{{targetType}}</span>
        <el-button style="float: right; padding: 3px 0;" type="text" @click="isShow = false"
          >x</el-button
        >
      </div>
      <p>目标ID：{{targetForm.id}}</p>
      <p>长度/面积：{{targetForm.math}}</p>
      <p>mark：{{targetForm.mark}}</p>
      <p>coordinate：<br>{{targetForm.coordinate}}</p>
    </el-card>
    <CecTileMap
      :heatData="heatData"
      :pointsData="pointsList"
      :lineData="linesList"
      :polygonData="polygonList"
      @pointChange="handlePointChange"
      @lineChange="handleLineChange"
      @polygonChange="handlePolygonChange"
      @handleClickOnTarget="handleMapClick"
      ref="CecMap"
    />
  </div>
</template>

<script>
import CecTileMap from "@/components/CecTileMap/CecTileMap.vue";
import heatData from "../assets/all_month.json";
//  @click="handleMapClick(type : point , line, polygon; data, location{x,y})" slot
export default {
  name: "Home",
  components: {
    CecTileMap,
  },
  data() {
    return {
      renderMapType: "",
      heatData: "",
      pointsList: [],
      linesList: [],
      polygonList: [],
      targetForm:{
        id: "",
        math: '',
        mark: "",
        coordinate: "",
      },
      targetType:'',
      isShow: false
    };
  },
  created() {
    this.getHeatData();
    this.getPointList();
    this.getLineList();
    this.getpolygonList();
  },
  mounted() {
    // this.showPointMap()
  },
  methods: {
    // 获取热力图数据
    getHeatData() {
      this.heatData = heatData;
    },
    // 获取点的数据
    getPointList() {
      console.log("获取了新数据");
      this.pointsList = [
        {
          id: "1",
          // name: "",
          mark: "11军",
          coordinate: [100, 40],
        },
        {
          id: "2",
          // name: "",
          mark: "2师",
          coordinate: [110, 35],
        },
        {
          id: "3",
          // name: "",
          mark: "3旅",
          coordinate: [102, 25],
        },
        {
          id: "4",
          // name: "",
          mark: "4团",
          coordinate: [108, 30],
        },
        {
          id: "5",
          // name: "",
          mark: "5营",
          coordinate: [106, 36],
        },
        {
          id: "6",
          // name: "",
          mark: "5连",
          coordinate: [121, 25],
        },
      ];
      // console.log(this.pointsList);
    },
    // 获取线的数据
    getLineList() {
      console.log("获取了线的数据");
      this.linesList = [
        {
          id: "01",
          math: "33m",
          mark: "11军",
          lineCoordinate: [
            [108, 30],
            [100, 40],
          ],
        },
        {
          id: "02",
          math: "22m",
          mark: "2师",
          lineCoordinate: [
            [108, 30],
            [110, 35],
          ],
        },
        {
          id: "03",
          math: "33m",
          mark: "3旅",
          lineCoordinate: [
            [108, 30],
            [102, 25],
          ],
        },
        {
          id: "04",
          math: "66m",
          mark: "4团",
          lineCoordinate: [
            [108, 30],
            [106, 36],
          ],
        },
        {
          id: "05",
          math: "34m",
          mark: "5营",
          lineCoordinate: [
            [108, 30],
            [121, 25],
          ],
        },
      ];
    },
    // 获取多边形的数据
    getpolygonList() {
      console.log("获取了多边形的数据");
      this.polygonList = [
        {
          id: "01",
          math: "1523m²",
          mark: "多边形1的备注",
          polygonCoordinate: [
            [100, 30],
            [110, 20],
            [120, 40],
          ],
        },
        {
          id: "02",
          math: "666m²",
          mark: "多边形2的备注",
          polygonCoordinate: [
            [125, 30],
            [130, 20],
            [135, 40],
          ],
        },
      ];
    },

    /***********************点************************/
    handlePointChange(type, point) {
      console.log(type);
      if (type === "create") {
        this.createNewPoint(point);
      } else if (type === "delete") {
        this.deletePoint(point);
      } else if (type === "update") {
        this.updatePoint(point);
      }
    },

    // 创建点
    createNewPoint(point) {
      console.log(point);
      this.pointsList.push({
        id: "999",
        name: point.name,
        mark: point.mark,
        coordinate: point.targetCoordinate,
      });
      this.$message.success("添加成功");
      console.log(this.pointsList);
    },
    // 更新点
    updatePoint(point) {
      console.log(point);
      console.log("我更新了点");

      const res = this.pointsList.map((curpoint) => {
        if (curpoint.id === point.id) {
          curpoint.mark = point.mark;
        }
        return curpoint;
      });
      this.pointsList = res;
    },
    //删除点
    deletePoint(point) {
      console.log("父组件已删除的点：" + point);
      this.pointsList.shift();
      this.$message.success("删除成功");
    },

    /************************线***********************/
    handleLineChange(type, line) {
      console.log(type);
      console.log(line);
      if (type === "create") {
        this.createNewLine(line);
      } else if (type === "update") {
        this.updateLine(line);
      } else if (type === "delete") {
        this.deleteLine(line);
      }
    },

    // 创建线
    createNewLine(line) {
      console.log(line);
      this.linesList.push({
        id: "999",
        name: line.name,
        mark: line.mark,
        lineCoordinate: line.targetCoordinate,
      });
      this.$message.success("添加成功");
      console.log(this.linesList);
    },
    // 更新线
    updateLine(line) {
      console.log(line);
      console.log("我更新了线");
      const res = this.linesList.map((curline) => {
        if (curline.id === line.id) {
          curline.mark = line.mark;
        }
        return curline;
      });
      this.linesList = res;
    },
    //删除线
    deleteLine(line) {
      console.log(line);
      this.linesList.shift();
      this.$message.success("删除成功");
      console.log(this.linesList);
    },

    /**********************面*************************/
    handlePolygonChange(type, polygon) {
      console.log(type);
      console.log(polygon);
      if (type === "create") {
        this.createNewPolygon(polygon);
      } else if (type === "update") {
        this.updatePolygon(polygon);
      } else if (type === "delete") {
        this.deletePolygon(polygon);
      }
    },
    // 创建面
    createNewPolygon(polygon) {
      console.log(polygon);
      this.polygonList.push({
        id: "999",
        name: polygon.name,
        mark: polygon.mark,
        polygonCoordinate: polygon.targetCoordinate,
      });
      this.$message.success("添加成功");
      console.log(this.polygonList);
    },
    // 更新面
    updatePolygon(polygon) {
      console.log("我更新了面");
      console.log(polygon);
      const res = this.polygonList.map((curpolygon) => {
        if (curpolygon.id === polygon.id) {
          curpolygon.mark = polygon.mark;
        }
        return curpolygon;
      });
      this.polygonList = res;
    },
    //删除面
    deletePolygon(polygon) {
      console.log(polygon);
      this.polygonList.shift();
      this.$message.success("删除成功");
      console.log(this.polygonList);
    },

    showHeatMap() {
      this.$refs.CecMap.renderHeatLayer();
    },
    closeHeatMap() {
      this.$refs.CecMap.handleCloseHeatLayer();
    },
    showPointMap() {
      this.$refs.CecMap.renderPointLayer();
    },
    closePointMap() {
      this.$refs.CecMap.clearAllPointLayers();
    },
    showLineMap() {
      this.$refs.CecMap.renderLineLayer();
    },
    closeLineMap() {
      this.$refs.CecMap.clearAllLineLayers();
    },
    showPolygonMap() {
      this.$refs.CecMap.renderPolygonLayer();
    },
    closePolygonMap() {
      this.$refs.CecMap.clearAllPolygonLayers();
    },

    handleMapClick(type, data) {
      console.log(type);
      console.log(data);
      this.renderForm(type, data);
    },
    renderForm(type, data) {
      console.log(data)
      this.targetType = type
      this.targetForm = data
      this.isShow = true
    },
  },
};
</script>
<style lang="scss">
.el-card  {
  width: 300px;
  position: absolute;
  z-index: 9999;
  top: 167px;
  border-radius: 0 !important;
  background-color: rgba(0, 0, 0, 0.5) !important;
  color: aliceblue !important;
  border: 0 !important;
  p{
    text-align: left;
  }
  .text {
    font-size: 14px;
    
  }

  .item {
    margin-bottom: 18px;
  }

  .clearfix:before,
  .clearfix:after {
    display: table;
    content: "";
  }
  .clearfix:after {
    clear: both;
  }
}
</style>
