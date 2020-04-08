<template>
    <div ref="testElement" :class="{testElement:true, expand: tapped}"></div>
</template>

<script>

export default {
    data(){
        return{
            tapped: false
        };
    },
    mounted(){
        var testElement = this.$ref.testElement;
        var manager = new Hammer.Manager(testElement);
        var Tap = new Hammer.Tap({
            taps:1
        });
        manager.add(Tap);
        manager.on('tap', (function(e){
            this.tapped = !this.tapped;
        }).bind(this));
    },
    gestureDetect(){
            
            //var hammertime = new Hammer(testElement);

            // hammer.on("panup panleft panright pinchin pinchout tap", function(ev){ //上滑 左滑 右滑 縮小 放大 點擊
            //     testElement.textContent = ev.type + "gesture detected.";
            // });
            // hammertime.on('press', function(e){
            //     e.target.classList.toggle('expand');
            //     console.log("You're pressing me!");
            //     console.log(e);
            // });
    }
};
</script>

<style scoped>
.testElement{
    width: 50%;
    height: 50%;
    position: fixed;
    left:0vw;
    top:0vh;
    background-color:black;
    transition: transform 300ms ease-out;
    /* text-align:center;
    font: 30px/300px Helvetica, Arial, sans-serif;
    color:white; */
}
.expand{
    transform: scale(2.5);
}
</style>