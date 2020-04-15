<template>
    <div class="article">

    </div>
</template>

<script>
import axios from 'axios';
import Geolocator from "../lib/geolocator";
/*
前置條件:
    需登入
    需輸入經緯度
輸入參數
    lon: 經度，以度數表示
    lat: 緯度，以度數表示
    date: 篩選時間，以unix timestamp表示
輸出
    id: 文章ID
    (thumbnail: 文章圖片縮圖URL，大小512px*512px，有白邊padding)
    lon: 發文經度，以度數表示
    lat: 發文緯度，以度數表示
    author: 發文作者的 user id
*/
// var x = 0.1
// var y = 1.5
var Id = 'a123'
var currentPosition = {
    x: 0.1,
    y: 1.5,
    timestamp: 12.05
}
export default {
    data(){
        return{
            articleSrc: null
        };
    },
    mounted(){
    
        this.ready = false; //Whether the currentPosition is valid
        this.geolocator = new Geolocator();
        this.geolocator.getPosition();

        // this.success()

        // console.log('Latitude : '+ currentPosition.x);
        // console.log('Longitude : '+ currentPosition.y);
        // console.log('More or less '+ currentPosition.accuracy + ' meters.');
    }
    
}
</script>

<style scoped>

</style>