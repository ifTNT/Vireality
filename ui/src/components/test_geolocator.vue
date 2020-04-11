<template>
    <div>
        <canvas ref="canvas"></canvas>
        <div class="debug" ref="debug">
              Debugger:<br>
              X: {{rawX}}<br>
              Y: {{rawY}}<br>
              Init X: {{initX}}<br>
              Init Y: {{initY}}<br>
              Accuracy: {{accuracy.toFixed(5)}}<br>
              Timestamp: {{timestamp}}<br>
              History Count: {{this.cnt}}<br>
              <ul>
                <li v-for="(item, index) in history">
                  {{index}}: ({{item.x.toFixed(5)}}, {{item.y.toFixed(5)}})
                </li> 
              </ul>
        </div>
    </div>
</template>

<script>
import Geolocator from '../lib/geolocator'
import * as Hammer from 'hammerjs';
export default{
    data: () => ({
        geolocator: null,
        ctx: null,
        rawX: 0,
        rawY: 0,
        accuracy: -1,
        initX: 0,
        initY: 0,
        deltaX: 0,
        deltaY: 0,
        activeDeltaX: 0,
        activeDeltaY: 0,
        history: []
    }),
    computed: {
        timestamp: ()=>+Date.now(),
        cnt: function(){return this.history.length},
        totalDeltaX: function(){return this.deltaX+this.activeDeltaX},
        totalDeltaY: function(){return this.deltaY+this.activeDeltaY}
    },
    mounted(){
        this.geolocator = new Geolocator();
        this.geolocator.watchPosition(this.onGeolocationRead.bind(this));

        this.$refs.canvas.width = window.innerWidth;
        this.$refs.canvas.height = window.innerHeight;
        this.ctx = this.$refs.canvas.getContext('2d');
        this.ctx.fillStyle = 'red';

        let gesture = new Hammer(this.$refs.canvas);
        gesture.get('pan').set({ direction: Hammer.DIRECTION_ALL });
        gesture.on('panmove panend', this.onCanvasPan.bind(this));
    },
    methods: {
        onGeolocationRead: function(pos){
            this.rawX = pos.x * 10;
            this.rawY = pos.y * 10;
            this.accuracy = pos.accuracy;
            if(this.cnt==0){
                this.initX = this.rawX;
                this.initY = this.rawY;
            }
            let x = this.rawX - this.initX;
            let y = -(this.rawY - this.initY); //Invert Y-axis
            
            x += window.innerWidth / 2;
            y += window.innerHeight / 2;

            // Push new point and draw
            this.history.push({x,y});
            this.draw();
        },
        onCanvasPan(e){
            if(e.isFinal){
                this.deltaX += e.deltaX;
                this.deltaY += e.deltaY;
                this.activeDeltaX = 0;
                this.activeDeltaY = 0;
            }else{
                this.activeDeltaX = e.deltaX;
                this.activeDeltaY = e.deltaY;
            }

            window.requestAnimationFrame(this.draw.bind(this));
        },
        draw(){ //Let center of canvas be (x,y), then draw.
            
            //Last element in history
            let {x, y} = this.history.slice(-1)[0];
            
            //Clear last frame
            this.ctx.clearRect(0,0,window.innerWidth, window.innerHeight);
            
            this.ctx.save();

            //Draw grid
            let gridSize = 10;
            this.ctx.strokeStyle = '#efefef';
            
            this.ctx.beginPath();
            //Verticle
            for(let i=this.totalDeltaX%gridSize; i<window.innerWidth; i+=gridSize){
                this.ctx.moveTo(i, 0);
                this.ctx.lineTo(i, window.innerHeight);
            }
            //Horizontal
            for(let i=this.totalDeltaY%gridSize; i<window.innerHeight; i+=gridSize){
                this.ctx.moveTo(0, i);
                this.ctx.lineTo(window.innerWidth, i);
            }
            this.ctx.closePath();
            this.ctx.stroke();

            this.ctx.translate(x, y);
            
            //Draw history point
            for(let [index,point] of this.history.entries()){
                let newX = point.x-x+this.totalDeltaX;
                let newY = point.y-y+this.totalDeltaY;
                //Use different color to indicate the age of point.
                this.ctx.fillStyle=
                `hsl(0,${(index+1)/this.history.length*100}%,50%)`
                this.ctx.fillRect(newX, newY, 2, 2);
            }
            this.ctx.restore();
        }
    }
}
</script>

<style scoped lang="stylus">
.debug
    position fixed
    bottom 0px
    left 0px
    font-size 12px
    line-height 1.5em
    padding 1em
    box-sizing border-box
    max-height 20em
    overflow-x scroll
</style>
