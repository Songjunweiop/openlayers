#### 单击地图事件

```js
this.map.on("singleclick", (e) => {
  if (!this.isDraw) {
    // console.log(e.coordinate);   // 鼠标点击的坐标
    console.log(this.targetFrom);
    // console.log("触发了点击事件");
    this.infoOverlay.setPosition(undefined); //点击空白处清除弹框
    const pixel = this.map.getEventPixel(e.originalEvent);
    const feature = this.map.forEachFeatureAtPixel(
      pixel,
      (feature) => feature
    );
    if (feature) {
      console.log(feature.getGeometry());
      console.log(feature.getProperties());

      // console.log(feature.getGeometry().getCoordinates());   //渲染出来的point的精确坐标，而不是点击的坐标
    
      if (feature.getProperties().id && !this.isDraw) {
        //如果是已存在目标的点击
        console.log(localPoint);
        console.log("我有选中这个点吗");
        this.displayInfoForm(feature, e.coordinate);
      }
    
      // console.log(this.infoOverlay.getPosition());
    } else {
    }

  }
});
```

#### 关闭tooptips

```js
closer.onclick = () => {
    this.overlay.setPosition(undefined);
    closer.blur();
    return false;
};
```

#### 地图双击事件

```js
  map.on("dblclick", function (evt) {
    var point = new Point(evt.coordinate);
    source.addFeature(new Feature(point));
    // idea = false;

    // alert(idea)

  });

  CecTileMap @createPoint={fetch}
  
  console.log(this.map.getLayers())
  console.log(this.map.getLayers().array_)
  const aa = this.map.getLayers().array_.map((curitem)=>{
    // console.log(curitem.values_.title)
    console.log(curitem.values_)
    // if()
  })
```

####   移动点

```js
const modify = new olInteraction.Modify({ source: vectorPointSource });
this.map.addInteraction(modify);
console.log(modify);

const modify = new olInteraction.Modify({ source: vectorLineSource });
this.map.addInteraction(modify);
```

#### 点击下拉框绘制要创建的画点、线、面

    toggleDrawmapLayer() {
      if (this.drawmapLayer) this.map.removeLayer(this.drawmapLayer);
      console.log("执行了吗");
      const source = new VectorSource({ wrapX: false });
      this.drawmapLayer = new VectorLayer({
        source: source,
      });
    
      // 选择标记类型
      if (this.selectedDrawValue !== "None") {
        if(this.selectedDrawValue === 'LineString'){
    
        }else if(this.selectedDrawValue === 'Polygon'){
    
        }
        this.map.removeInteraction(this.draw);
    
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
    },

## 一、图层

#### 1.获取当前map的所有图层数组

```js
console.log(this.map.getLayerGroup().getLayersArray())
```

## 二、投影和坐标

#### 1. 坐标之间的转换

```js
import { transform } from "ol/proj";
transform(coordinate, "EPSG:4326", "EPSG:3857")
```

#### 2. 控制鼠标位置的坐标

```js
controls: olControl.defaults().extend([
    new olControl.FullScreen(),
    new olControl.ZoomSlider(),
    new olControl.MousePosition({
    	projection: "EPSG:4326",
    }),
]),
```

#### 3. 获取当前map的投影模式

```js
console.log(this.map.getView().getProjection())
```

#### 4. 已知点的坐标的坐标

```js
console.log(pointFeatures.getGeometry());
console.log(
    pointFeatures.getGeometry().getCoordinates() 
);
```

#### 