<template>
  <div class="wrap">
    <div class="month">
      <transition-group name="list-complete" tag="p" class="monthList">
        <span v-for="item in items" v-bind:key="item" class="list-complete-item">{{ item }}</span>
      </transition-group>
    </div>
    <div class="line"></div>
    <div class="date">
      <transition name="date-move" mode="out-in">
        <p>
          ▲
          <br />
          {{dateD}}
        </p>
      </transition>
    </div>
    <!-- for test -->
    <button v-on:click="minusChangDate">AddLeft</button>
    <button v-on:click="addChangDate">AddRight</button>
    <!-- end for test -->
  </div>
</template>
<script>
export default {
  name: "timeline",
  data() {
    return {
      dateD: "",
      dateNum: 0,
      items: [],
      isEditing: true
    };
  },
  props: {
    date: {
      type: Number,
      default: Math.floor(
        new Date(
          "".concat(
            new Date().getFullYear(),
            ",",
            new Date().getMonth() + 1,
            ",",
            new Date().getDate()
          )
        )
      )
    }
  },
  mounted() {
    this.getNowDate();
  },
  computed: {
    function() {
      if (this.date > this.dateNum) {
        this.dateNum = this.date;
        return this.addChangDate();
      } else {
        this.dateNum = this.date;
        return this.minusChangDate();
      }
    }
  },
  methods: {
    minusChangDate() {
      this.isEditing = !this.isEditing;
      if (this.dateD != 1) {
        this.dateD = this.dateD - 1;
      } else {
        var whichMonth = String(this.items[0]).split(" ");
        switch (parseInt(whichMonth[whichMonth.length - 1])) {
          case 1:
            this.dateD = 31;
            break;
          case 2:
            var year;
            if (whichMonth.length === 1) {
              var d = new Date();
              year = d.getFullYear();
            } else {
              year = parseInt(whichMonth[0]);
            }
            if (year % 4 == 0 && year % 100 != 0) {
              this.dateD = 29;
            } else if (year % 400 == 0) {
              this.dateD = 29;
            } else {
              this.dateD = 28;
            }
            break;
          case 3:
            this.dateD = 31;
            break;
          case 4:
            this.dateD = 30;
            break;
          case 5:
            this.dateD = 31;
            break;
          case 6:
            this.dateD = 30;
            break;
          case 7:
            this.dateD = 31;
            break;
          case 8:
            this.dateD = 31;
            break;
          case 9:
            this.dateD = 30;
            break;
          case 10:
            this.dateD = 31;
            break;
          case 11:
            this.dateD = 30;
            break;
          case 12:
            this.dateD = 31;
        }
        this.addLeft();
      }
      return this.dateD;
    },
    addChangDate() {
      this.isEditing = !this.isEditing;
      if (this.dateD < 28) {
        this.dateD = this.dateD + 1;
      } else {
        var whichMonth = String(this.items[1]).split(" ");
        switch (parseInt(whichMonth[whichMonth.length - 1])) {
          case 1:
            if (this.dateD === 31) {
              this.dateD = 1;
              this.addRight();
            } else {
              this.dateD = this.dateD + 1;
            }
            break;
          case 2:
            var year;
            if (whichMonth.length === 1) {
              var d = new Date();
              year = d.getFullYear();
            } else {
              year = parseInt(whichMonth[0]);
            }
            if (year % 4 == 0 && year % 100 != 0) {
              if (this.dateD === 29) {
                this.dateD = 1;
                this.addRight();
              } else {
                this.dateD = this.dateD + 1;
              }
            } else if (year % 400 == 0) {
              if (this.dateD === 29) {
                this.dateD = 1;
                this.addRight();
              } else {
                this.dateD = this.dateD + 1;
              }
            } else {
              if (this.dateD === 28) {
                this.dateD = 1;
                this.addRight();
              } else {
                this.dateD = this.dateD + 1;
              }
            }
            break;
          case 3:
            if (this.dateD === 31) {
              this.dateD = 1;
              this.addRight();
            } else {
              this.dateD = this.dateD + 1;
            }
            break;
          case 4:
            if (this.dateD === 30) {
              this.dateD = 1;
              this.addRight();
            } else {
              this.dateD = this.dateD + 1;
            }
            break;
          case 5:
            if (this.dateD === 31) {
              this.dateD = 1;
              this.addRight();
            } else {
              this.dateD = this.dateD + 1;
            }
            break;
          case 6:
            if (this.dateD === 30) {
              this.dateD = 1;
              this.addRight();
            } else {
              this.dateD = this.dateD + 1;
            }
            break;
          case 7:
            if (this.dateD === 31) {
              this.dateD = 1;
              this.addRight();
            } else {
              this.dateD = this.dateD + 1;
            }
            break;
          case 8:
            if (this.dateD === 31) {
              this.dateD = 1;
              this.addRight();
            } else {
              this.dateD = this.dateD + 1;
            }
            break;
          case 9:
            if (this.dateD === 30) {
              this.dateD = 1;
              this.addRight();
            } else {
              this.dateD = this.dateD + 1;
            }
            break;
          case 10:
            if (this.dateD === 31) {
              this.dateD = 1;
              this.addRight();
            } else {
              this.dateD = this.dateD + 1;
            }
            break;
          case 11:
            if (this.dateD === 30) {
              this.dateD = 1;
              this.addRight();
            } else {
              this.dateD = this.dateD + 1;
            }
            break;
          case 12:
            if (this.dateD === 31) {
              this.dateD = 1;
              this.addRight();
            } else {
              this.dateD = this.dateD + 1;
            }
        }
        return this.dateD;
      }
    },
    addLeft() {
      var d = new Date();
      var whichYear = String(this.items[0]).split(" ");
      this.items.splice(2, 1);
      this.items.splice(
        0,
        0,
        parseInt(whichYear[whichYear.length - 1]) === 1
          ? whichYear.length > 1
            ? parseInt(whichYear[0]) - 1 === d.getFullYear()
              ? "12"
              : "".concat(parseInt(whichYear[0]) - 1, " ", "12")
            : "".concat(d.getFullYear() - 1, " ", "12")
          : whichYear.length > 1
          ? "".concat(whichYear[0], " ", parseInt(whichYear[1]) - 1)
          : parseInt(whichYear[0]) - 1
      );
    },
    addRight() {
      var d = new Date();
      var whichYear = String(this.items[2]).split(" ");
      this.items.splice(0, 1);
      this.items.splice(
        2,
        0,
        parseInt(whichYear[whichYear.length - 1]) === 12
          ? whichYear.length > 1
            ? parseInt(whichYear[0]) + 1 === d.getFullYear()
              ? "1"
              : "".concat(parseInt(whichYear[0]) + 1, " ", "1")
            : "".concat(d.getFullYear() + 1, " ", "1")
          : whichYear.length > 1
          ? "".concat(whichYear[0], " ", parseInt(whichYear[1]) + 1)
          : parseInt(whichYear[0]) + 1
      );
    },
    dateChange() {
      this.dateD;
    },
    getNowDate() {
      var d = new Date(this.date);
      this.dateNum = this.date;
      this.dateD = d.getDate();
      var m = d.getMonth() + 1;
      this.items.splice(
        0,
        0,
        m === 1 ? "".concat(d.getFullYear() - 1, " ", "12") : m - 1
      );
      this.items.splice(1, 0, m);
      this.items.splice(
        2,
        0,
        m === 12 ? "".concat(d.getFullYear() + 1, " ", "1") : m + 1
      );
    }
  }
};
</script>

<style scoped lang="stylus">
.wrap {
  z-index: 100;
}

.line {
  box-sizing: border-box;
  border-bottom: solid 2px;
  border-color: black;
  width: 88vw;
  height: 2px;
  margin: 0 6vw;
}

.monthList {
  box-sizing: border-box;
  height: 2em;
  width: 100vw;
  display: flex;
  justify-content: space-around;

  .list-complete-item {
    margin: 0.25em 0;
    display: inline-block;
    text-align: center;
    font-size: 1.5em;
    height: 1.5em;
    width: 10em;
    transition-duration: 0.2s;
  }
}

.list-complete-enter, .list-complete-leave-to {
  opacity: 0;
  transform: translateY(-5vw);
}

.list-complete-leave-active {
  position: absolute;
}

.date {
  margin-top: 0.2em;
  line-height: 1.5em;
  text-align: center;

  p {
    font-size: 1.5em;
  }
}
</style>
