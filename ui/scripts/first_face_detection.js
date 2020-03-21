// 顯示怎麼偵測的文字
var TeachMessage = new Vue({
    el: '.teachDescription',
    data: {
        teachMessage: '請慢慢轉動頭部，直到中間圈圈填滿'
    }
  })
// 顯示偵測不到臉部的訊息以及是否顯示 正常不會顯示
var WarningNoDetection = new Vue({
    el: '.warningNoDetection',
    data: {
        warningMessage: '偵測不到臉部T^T',
        showWarningMessage: false
    }
  })
// 顯示完成掃描的圖 正常不會顯示
  var CompeleteFaceDetection = new Vue({
      el: '.compeleteFaceDetection',
      data:{
        showCompeleteFaceDetection: false
      }
  })

