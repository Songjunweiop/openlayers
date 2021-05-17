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
 this.map.on("singleclick", function (e) {
   console.log(e.coordinate);
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