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

輸出結果範例
    輸入:
        GET /api/v1/articles/geolocation?lon=122.34&lat=23.5&1865451
    輸出:
        { "ok": "true",
    "result":
    [
        {
            "id": "0",
            "thumbnail": "https://i.imgur.com/07XbOpL.png"
            "lon": "122.339999",
            "lat": "23.4999",
            "author": "test"
        },
        {
            "id": "1",
            "thumbnail": "https://i.imgur.com/07XbOpL.png"
            "lon": "122.339998",
            "lat": "23.49989",
            "author": "test"
        }
    ]
}
*/
// var x = 0;
// var y = 0;
// var accuracy = 0;
// var articleId = 'a123';
// var date = Date.now();
export default {
    data(){
              
        return{
            articleSrc: null,
            // date
        };
    },
    mounted(){
        this.currentPosition = {
            x: 0,
            y: 0
        };
        // let { x, y, accuracy } = this.currentPosition;
        
        // this.isLocationFixed = false;
        // this.geolocator = new Geolocator();
        // this.geolocator.watchPosition(this.handleGeolocationUpdate.bind(this));

        // console.log(this.currentPosition.x, this.currentPosition.y);
        
       navigator.geolocation.getCurrentPosition(function(position){
           this.currentPosition.x = position.coords.latitude;
           this.currentPosition.y = position.coords.longitude;
           console.log(this.currentPosition);
        //    console.log(date);
           axios.get(server.apiUrl('/geolocation?lon='+this.currentPosition.y+'&lat='+this.currentPosition.x+'&'+Date.now()))
            .then(function (response){
                this.articleSrc = response.data.articles
            }.bind(this))
            .catch(function (error){
                console.log(error);
             });

       }.bind(this));
       
       
       
    //    axios.get(server.apiUrl('articles/geolocation?lon='+this.currentPosition.y+'&lat='+this.currentPosition.x+'&'+date))
    //         .then(function (response){
    //             this.articleSrc = response.data.articles
    //         }.bind(this))
    //         .catch(function (error){
    //             console.log(error)
    //          });

        
    },
    method: {
        //timestamp: () => +Date.now(),
        // handleGeolocationUpdate(pos){
        //     let { x, y } = pos;
        //     if(this.isLocationFixed === false) {
        //         this.currentPosition.x = x;
        //         this.currentPosition.y = y;
        //         this.isLocationFixed = true;
        //     }
        // }
    }
    
}
</script>

<style scoped>

</style>