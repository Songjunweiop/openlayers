<template>
  <div class="home">
    <el-button type="primary" @click="showHeatMap">热力图</el-button>
    <el-button @click="closeHeatMap">关闭热力图</el-button>
    <el-button type="primary" @click="showPointMap">点图</el-button>
    <el-button type="primary" @click="showLineMap">通联图</el-button>
    <el-button type="primary" @click="showPolygonMap">多边形图</el-button>
    <CecTileMap
      :heatData="heatData"
      :pointsData="pointsList"
      :lineData="linesList"
      :polygonData="polygonList"
      :type="renderMapType"
      @createPoint="createNewPoint"
      @deletePoint="deletePoint"
      @createLine="createNewLine"
      @deleteLine="deleteLine"
      @createPolygon="createNewPolygon"
      @deletePolygon="deletePolygon"
      ref="CecMap"
    />
  </div>
</template>

<script>
import CecTileMap from "@/components/CecTileMap/CecTileMap.vue";
import heatData from "../assets/all_month.json";

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
    };
  },
  created() {
    this.getHeatData();
    this.getPointList();
    this.getLineList();
    this.getpolygonList();
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
          name: "军",
          mark: "11军",
          coordinate: [100, 40],
        },
        {
          id: "2",
          name: "师",
          mark: "2师",
          coordinate: [110, 35],
        },
        {
          id: "3",
          name: "旅",
          mark: "3旅",
          coordinate: [102, 25],
        },
        {
          id: "4",
          name: "团",
          mark: "4团",
          coordinate: [108, 30],
        },
        {
          id: "5",
          name: "营",
          mark: "5营",
          coordinate: [106, 36],
        },
        {
          id: "6",
          name: "连",
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
          name: "军",
          mark: "11军",
          lineCoordinate: [
            [108, 30],
            [100, 40],
          ],
        },
        {
          id: "02",
          name: "师",
          mark: "2师",
          lineCoordinate: [
            [108, 30],
            [110, 35],
          ],
        },
        {
          id: "03",
          name: "旅",
          mark: "3旅",
          lineCoordinate: [
            [108, 30],
            [102, 25],
          ],
        },
        {
          id: "04",
          name: "团",
          mark: "4团",
          lineCoordinate: [
            [108, 30],
            [106, 36],
          ],
        },
        {
          id: "05",
          name: "营",
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
          name: "多边形1",
          mark: "多边形1的备注",
          polygonCoordinate: [
            [100, 30],
            [110, 20],
            [120, 40],
          ],
        },
        {
          id: "02",
          name: "多边形2",
          mark: "多边形2的备注",
          polygonCoordinate: [
            [125, 30],
            [130, 20],
            [135, 40],
          ],
        },
      ];
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
    //删除点
    deletePoint(point) {
      console.log(point);
      this.pointsList.shift();
      this.$message.success("删除成功");
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
    //删除线
    deleteLine(line) {
      console.log(line);
      this.linesList.shift();
      this.$message.success("删除成功");
      console.log(this.linesList);
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
    closeHeatMap(){
      this.$refs.CecMap.handleCloseHeatLayer()
    },
    showPointMap() {
      this.$refs.CecMap.renderPointLayer();
    },
    showLineMap() {
      this.$refs.CecMap.renderLineLayer();
    },
    showPolygonMap() {
      this.$refs.CecMap.renderPolygonLayer();
    },
  },
};
</script>
