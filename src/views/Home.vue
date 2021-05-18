<template>
  <div class="home">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
    <CecTileMap />
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'
import CecTileMap from "@/components/CecTileMap/CecTileMap.vue"

export default {
  name: 'Home',
  components: {
    HelloWorld,
    CecTileMap
  }
}
</script>
