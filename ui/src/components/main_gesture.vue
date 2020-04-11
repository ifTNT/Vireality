<template>
    <div ref="testElement" :class="{'testElement':true, 'expand': tapped, 'post':swiped, 'timeLine':panned}"></div>
</template>

<script>
import * as Hammer from 'hammerjs';
export default {
    data(){
        return{
            tapped: false,
            panned: false,
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
        //上滑發文
        var swipeUp = new Hammer.Swipe({
            direction: Hammer.DIRECTION_UP
        });
        manager.add(swipeUp);
        manager.on('swipeup', (function(event){
            this.swiped = !this.swiped;
            console.log("swip up");
        }).bind(this));
        //
        //左右滑動跳出時間軸
        // var pan = new Hammer.Pan({
        //     direction: Hammer.DIRECTION_ALL
        // });
        // manager.add(pan);
        // manager.on('panleft panright', (function(event){
        //     this.panned = !this.panned;
        // }).bind(this));
        var panLeft = new Hammer.Pan({
            direction: Hammer.DIRECTION_LEFT
        });
        manager.add(panLeft);
        manager.on('panleft', (function(event){
            this.panned = !this.panned;
            console.log("left");
        }).bind(this));

        var panRight = new Hammer.Pan({
            direction: Hammer.DIRECTION_RIGHT
        });
        manager.add(panRight);
        manager.on('panright', (function(event){
            this.panned = !this.panned;
            console.log("right");
        }).bind(this));
        //縮小手勢將文章聚合
        var pinch = new Hammer.Pinch({
            direction: Hammer.DIRECTION_ALL
        });
        manager.add(pinch)
        manager.on('pinchin', (function(event){

        }));
        //
        //放大手勢散開文章
        manager.on('pinchout', (function(event){

        }));
        //
    },
};
</script>

<style scoped>
.testElement{
    width: 50%;
    height: 30%;
    position: fixed;
    left:25vw;
    top:35vh;
    background-color:black;
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