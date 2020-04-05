<template>
  <div>
    <div class="month">
      <p class="month0">{{month0}}</p>
      <p class="month1">{{month1}}</p>
      <p class="month2">{{month2}}</p>
      <p class="month3">{{month3}}</p>
      <p class="month4">{{month4}}</p>
    </div>
    <div class="line"></div>
    <div class="date">
      <p>▲</p>
      <p>{{ date }}</p>
    </div>
  </div>
</template>
<script>
export default {
  name: "timeline",
  data() {
    return {
      date: "",
      month0: "",
      month1: "",
      month2: "",
      month3: "",
      month4: ""
    };
  },
  mounted() {
    this.getNowDate()
  },
  methods: {
    monthChange(e) {
      if (e === 0) {
        var d = new Date();
        var target = document.querySelectorAll('.month p');
        
        var clName = parseInt(target[0].className.split('h')[1]);
        var newTar = document.createElement('p');
        newTar.className = ''.concat('month',clName-1);
        var path = Math.abs(clName-3) - this.month2;
        if(path >= 0){
          var year = d.getFullYear() - Math.floor(path/12) - 1;
          if(path % 12 != 0){
            newTar.innerText = ''.concat(year,' ',12 - path % 12);
          }else{
            newTar.innerText = ''.concat(year,' ',12);
          }
        }else{
          newTar.innerText = this.month2 - Math.abs(clName-3);
        }
        console.log(newTar.innerText)
        target[4].parentNode.removeChild(target[4]);
        target[0].parentNode.insertBefore(newTar,target[0]);
      } else {
        var d = new Date();
        var target = document.querySelectorAll('.month p');
        var clName = parseInt(target[4].className.split('h')[1]);
        var newTar = document.createElement('p');
        newTar.className = ''.concat('month',clName+1);
        newTar.style+="width: 10em;";
        var path = Math.abs(clName-1) + this.month2;
        if(path >= 12){
          var year = d.getFullYear() + Math.floor(path/12);
          if(path % 12 != 0){
            newTar.innerText = ''.concat(year,' ',1 + path % 12);
          }else{
            newTar.innerText = ''.concat(year,' ',1);
          }
        }else{
          newTar.innerText = this.month2 + Math.abs(clName - 1);
        }
        console.log(newTar.innerText)

        target[0].parentNode.removeChild(target[0]);
        target[4].parentNode.appendChild(newTar);
      }
    },
    dateChange() {
      this.date;
    },
    getNowDate() {
      var d = new Date();
      this.date = d.getDate();
      var m = d.getMonth() + 1;
      this.month0 =
        m <= 2
          ? "".concat(
              d.getFullYear() - 1,
              " ",
              m === 2 ? "12" : "11"
            )
          : m - 2;
      this.month1 =
        m === 1
          ? "".concat(d.getFullYear() - 1, " ", "12")
          : m - 1;
      this.month2 = m;
      this.month3 =
        m === 12
          ? "".concat(d.getFullYear() + 1, " ", "1")
          : m + 1;
      this.month4 =
        m >= 11
          ? "".concat(
              d.getFullYear() + 1,
              " ",
              m === 12 ? "12" : "11"
            )
          : m + 2;
    }
  }
};
</script>

<style scoped lang="stylus">
.line {
  box-sizing: border-box;
  border-bottom: solid 2px;
  border-color: black;
  width: 88vw;
  height: 2px;
  margin: 0 6vw;
}

.month {
  box-sizing: border-box;
  height: 2em;
  width: 160vw;
  margin-left: -30vw;
  display: flex;
  justify-content: space-around;
  animation-duration:0.2s;

  p {
    margin: 0.25em 0;
    display: inline-block;
    text-align: center;
    font-size: 1.5em;
    height: 1.5em;
    width: 10em;
  }

  .month1 {
  }

  .month2 {
  }

  .month3 {
  }
}

.date {
  margin-top: 0.2em;
  line-height: 1.5em;
  text-align: center;
  p
  {
    font-size 1.5em
  }
}
</style>
