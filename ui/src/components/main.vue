<template>
    <div ref="arGesture" :class="{'arGesture':true}" >
        <toolbar></toolbar>   
        <ar class="ar"></ar>
        <friendList v-if="isShowFriendList"></friendList>
        <timeLine v-if="isShowTimeLine" v-bind:date="timestamp"></timeLine> 
    </div>
</template>


<script>
import Toolbar from './toolbar.vue'
import AR from './ar.vue'
import Gesture from './main_gesture.vue'
import FriendList from './friend_list_around.vue'
import TimeLine from './timeline.vue'
import * as Hammer from 'hammerjs';

const oneDay = 86400000; //Timestamp coresponding to one day.
// var Content = "none";
export default {
    name:"main",
    data(){
        return{
            isShowFriendList:true,
            isShowTimeLine:false,
            canDoPan : true, //防止pinch之後會偵測到pan
            timestamp: +Date.now() //時間軸的時間 預設為現在
            // tapped: false,
            // swipedUp: false,
            // swiped: false,
            // testContent:Content
        };
    },
    components:{
        toolbar : Toolbar,
        ar : AR,
        gesture : Gesture,
        friendList : FriendList,
        timeLine : TimeLine,
    },
    mounted(){
        var direction;
        var testElement = this.$refs.arGesture;
        var manager = new Hammer.Manager(testElement);
        var Test = document.getElementsByClassName("arGesture")[0];
        
        // var count = 0
        var tap = new Hammer.Tap({
            taps:1,
            pointers: 1
        });
        //點擊展開文章
        manager.add(tap);
        manager.on('tap', this.click.bind(this));
        //

        //上滑發文
        var swipe = new Hammer.Swipe({
            direction: Hammer.DIRECTION_ALL,
            pointers: 1
        });

        manager.add(swipe);
        manager.on('swipeup',this.swipeUp.bind(this));
        // manager.on('swipeup', (function(event){
        //     // this.swipedUp = !this.swipedUp;
        //     // console.log(this);
        //      console.log("swipeup");
        //      if(this.isShowTimeLine)
        //         this.isShowTimeLine = !this.isShowTimeLine;
        //      Test.style.backgroundColor = "orange";
        // }).bind(this));
        //

        //左右滑動跳出時間軸
        var pan = new Hammer.Pan({
            direction: Hammer.DIRECTION_ALL,
            pointers: 1
        });
        manager.add(pan);
        manager.on('panleft', this.panLeft.bind());
        manager.on('panright', this.panRight.bind());
        // manager.on('panleft', (function(event){
            
        //     // this.swiped = !this.swiped;
        //     // event.enable = true;
        //     console.log("panleft");
        //     this.isShowTimeLine=true;
        //     Test.style.backgroundColor = "blue";
        // }).bind(this));

        // manager.on('panright', (function(event){
        //     // this.swiped = !this.swiped;
        //     // event.enable = true;
        //     console.log("panright");
        //     this.isShowTimeLine=true;
        //     Test.style.backgroundColor = "yellow";
        // }).bind(this));
        //

        //Due to swipe and pan are asynchronous
        swipe.recognizeWith(pan);



        //縮小手勢將文章聚合
        var pinch = new Hammer.Pinch({
            direction: Hammer.DIRECTION_ALL,
            pointers: 2
        });
        manager.add(pinch)
        manager.on('pinchend' , this.pinch.bind(this));
        // manager.on('pinchend',(function(event){
        //     this.setNotDoPan();
        //     this.timer = setTimeout(this.setDoPan, 3000);
        //     // console.log(this);
        //     if(this.isShowTimeLine)
        //         this.isShowTimeLine = false;
        //     if(event.scale > 1){
        //         console.log("pinchout");
        //     }  
        //     else{
        //         console.log("pinchin");
        //     }
        // }));

        
    //     manager.on('pinchin', (function(event){
    //         console.log("pinchin");
    //         if(this.isShowTimeLine)
    //             this.isShowTimeLine = !this.isShowTimeLine;
    //         Test.style.backgroundColor = "black";


    //     }));
        
    //    //放大手勢散開文章
    //     manager.on('pinchout', (function(event){
    //         console.log("pinchout");
    //         if(this.isShowTimeLine)
    //             this.isShowTimeLine = !this.isShowTimeLine;
    //         Test.style.backgroundColor  = "purple";
    //     }));
        
    },
    methods: {
        click(event){
            console.log("click");
            if(this.isShowTimeLine)
                this.isShowTimeLine = !this.isShowTimeLine;
        },
        swipeUp(event){
            console.log("swipeup");
            if(this.isShowTimeLine)
                this.isShowTimeLine = !this.isShowTimeLine;
        },
        panLeft(event){
            console.log("panleft");
            this.isShowTimeLine=true;
            this.timestamp += oneDay;
        },
        panRight(event){
            console.log("panright");
            this.isShowTimeLine=true;
            this.timestamp -= oneDay;
        },
        pinch(event){
            //this.setNotDoPan();
            //this.timer = setTimeout(this.setDoPan, 3000);
            // console.log(this);
            if(this.isShowTimeLine)
                this.isShowTimeLine = false;
            if(event.scale > 1){
                console.log("pinchout");
            }  
            else{
                console.log("pinchin");
            }
        },

        setDoPan() {
            console.log("setDoPan");
            canDoPan = true;
        },
        setNotDoPan() {
            console.log("setNotDoPan");
            canDoPan = false;
        }
    }
};
</script>

<style scoped>
    toolbar{
        position:absolute;
        left:0px;
        top:0px;
        z-index:3;
    }
    .ar{
       
        height: 100vh !important;
        width:100vw;
        position:absolute;
        left:0px;
        top:0vh !important; 
        z-index:-19999;
    }
    /* .gesture{
        height: 95vh !important;
        position:absolute;
        left:0px;
        top:5vh;
        z-index:-99999999;
       
    } */
    .arGesture{
        width: 100vw;
        height: 100vh;
    
    
        position:absolute;
        left:0px;
        top:0vh !important;  
        background-color:deepskyblue;
        transition: transform 300ms ease-out;
        z-index:-99999999;
    }
    /* .expand{
        transform: scale(2.5);
      
    }
    .post{
        width:80%;
        height: 80%;
        position:fixed;
        left:0vw;
        top:0vh;
        background-color:silver;
    }
    .timeLine{
        width:80%;
        height:5%;
        position:fixed;
        left:10vw;
        top: 5vh;
        background-color: blue;
    } */
</style>