# openlayerstest1

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).


单击地图事件
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

关闭tooptips
 // closer.onclick = () => {
  //   this.overlay.setPosition(undefined);
  //   closer.blur();
  //   return false;
  // };

//地图双击事件
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

  //移动点
  // const modify = new olInteraction.Modify({ source: vectorPointSource });
  // this.map.addInteraction(modify);
  // console.log(modify);

  // const modify = new olInteraction.Modify({ source: vectorLineSource });
  // this.map.addInteraction(modify);


//已知点的坐标的坐标
// console.log(pointFeatures.getGeometry());
// console.log(
//   pointFeatures.getGeometry().getCoordinates() 
// );