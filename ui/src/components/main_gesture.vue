<template>
    <div ref="testElement" :class="{'testElement':true, 'expand': tapped, 'post':swipedUp, 'timeLine':swiped}"></div>
</template>

<script>
import * as Hammer from 'hammerjs';
export default {
    data(){
        return{
            tapped: false,
            swipedUp: false,
            swiped: false
        };
    },
    mounted(){
        var direction;
        var testElement = this.$refs.testElement;
        var manager = new Hammer.Manager(testElement);
        //點擊展開文章
        var tap = new Hammer.Tap({
        
            taps:1
        });
        manager.add(tap);
        manager.on('tap', (function(event){
            this.tapped = !this.tapped;
            console.log("click");
        }).bind(this));
        //

        //左右滑動跳出時間軸
        var swipe = new Hammer.Swipe({
            direction: Hammer.DIRECTION_ALL
        });
        manager.add(swipe);
        manager.on('swipeleft', (function(event){
            this.swiped = !this.swiped;
            console.log("swipleft");
        }).bind(this));
        manager.on('swiperight', (function(event){
            this.swiped = !this.swiped;
            console.log("swipright");
        }).bind(this));
        //

        //上滑發文
        manager.on('swipeup', (function(event){
            this.swipedUp = !this.swipedUp;
             console.log("swipup");
        }).bind(this));
        //

        //縮小手勢將文章聚合
        var pinch = new Hammer.Pinch({
            direction: Hammer.DIRECTION_ALL
        });
        manager.add(pinch)
        manager.on('pinchin', (function(event){
            console.log("pinchin");


        }));
        //
        //放大手勢散開文章
        manager.on('pinchout', (function(event){
            console.log("pinchout");
        }));
        //
    },
};
</script>

<style scoped>
.testElement{
    width: 100vw;
    height: 100vh;
  /*  width: 50%;
    height: 70%;*/
   /* position: fixed;
    left:25vw;
    top:25vh;*/
    background-color:deepskyblue;
    transition: transform 300ms ease-out;
}
.expand{
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
}
</style>