<template>
  <div class="home">
    <el-button type="primary" @click="showHeatMap">热力图</el-button>
    <el-button type="primary" @click="showPointMap" >点图</el-button>
    <el-button type="primary" @click="showLineMap">通联图</el-button>
    <CecTileMap
      :pointsData="pointsList"
      :heatData="heatData"
      :lineData="linesList"
      :type="renderMapType"
      @createPoint="createNewPoint"
      @deletePoint="deletePoint"
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
      renderMapType: '',
      heatData: '',
      pointsList: [],
      linesList: []
    };
  },
  created() {
    this.getPointList();
    this.getHeatData()

  },
  methods: {
    // 获取热力图数据
    getHeatData(){
      this.heatData = heatData
      console.log(this.heatData)
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
      ];
      // console.log(this.pointsList);
    },
    // 创建点
    createNewPoint(point) {
      console.log(point);
      this.pointsList.push({
        id: "999",
        name: point.name,
        mark: point.mark,
        coordinate: point.pointCoordinate,
      });
      this.$message.success("添加成功");
    },
    //删除点
    deletePoint(point) {
      console.log(point);
      this.pointsList.shift()
      this.$message.success("删除成功");
    },
    showHeatMap(){
      this.$refs.CecMap.renderHeatLayer()
    },
    showPointMap(){
      this.$refs.CecMap.renderPointLayer()
    },
    showLineMap(){
      this.$refs.CecMap.renderLineLayer()
    }
    
  },
};
</script>
