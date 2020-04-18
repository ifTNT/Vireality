<template>
    <div ref="arGesture" :class="{'arGesture':true}" >
        <toolbar></toolbar>   
        <ar class="ar"></ar>
        <friendList v-if="isShowFriendList"></friendList>
        <timeLine v-if="isShowTimeLine"></timeLine> 
    </div>
</template>


<script>
import Toolbar from './toolbar.vue'
import AR from './ar.vue'
import Gesture from './main_gesture.vue'
import FriendList from './friend_list_around.vue'
import TimeLine from './timeline.vue'
import * as Hammer from 'hammerjs';
//  var Count = 10;
export default {
    name:"main",
    data(){
        return{
            isShowFriendList:true,
            isShowTimeLine:false,
            // tapped: false,
            // swipedUp: false,
            // swiped: false,
            //  count:Count
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
            taps:1
        });
        //點擊展開文章
        manager.add(tap);
        manager.on('tap', (function(event){
            // this.tapped = !this.tapped;
            console.log("click");
            if(this.isShowTimeLine)
                this.isShowTimeLine = !this.isShowTimeLine;
            Test.style.backgroundColor = "red";
            // Test.innerHTML = count;
        }).bind(this));
        //

        //上滑發文
        var swipe = new Hammer.Swipe({
            direction: Hammer.DIRECTION_ALL
 
        });
        manager.add(swipe);
        manager.on('swipeup', (function(event){
            // this.swipedUp = !this.swipedUp;
             console.log("swipeup");
             if(this.isShowTimeLine)
                this.isShowTimeLine = !this.isShowTimeLine;
             Test.style.backgroundColor = "orange";
        }).bind(this));
        //

        //左右滑動跳出時間軸
        var pan = new Hammer.Pan({
            direction: Hammer.DIRECTION_ALL
        });
        manager.add(pan);

        manager.on('panleft', (function(event){
            // this.swiped = !this.swiped;
            // event.enable = true;
            console.log("panleft");
            this.isShowTimeLine=true;
            Test.style.backgroundColor = "blue";
        }).bind(this));

        manager.on('panright', (function(event){
            // this.swiped = !this.swiped;
            // event.enable = true;
            console.log("panright");
            this.isShowTimeLine=true;
            Test.style.backgroundColor = "yellow";
        }).bind(this));
        //
        
        //Due to swipe and pan are asynchronous
        swipe.recognizeWith(pan);

        //縮小手勢將文章聚合
        var pinch = new Hammer.Pinch({
            direction: Hammer.DIRECTION_ALL
        });
        manager.add(pinch)
        manager.on('pinchin', (function(event){
            console.log("pinchin");
            if(this.isShowTimeLine)
                this.isShowTimeLine = !this.isShowTimeLine;
            Test.style.backgroundColor = "black";


        }));
        //
        //放大手勢散開文章
        manager.on('pinchout', (function(event){
            console.log("pinchout");
            if(this.isShowTimeLine)
                this.isShowTimeLine = !this.isShowTimeLine;
            Test.style.backgroundColor  = "purple";
        }));
        //
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