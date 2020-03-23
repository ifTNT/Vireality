var getResponsed = new Vue({
    el: '.articleRespondBlock',
    data: {
        respondMessage: ''
    }
})

var placeAuther = new Vue({
    el: '.articleAuthor',
    data: {
        autherName: 'Auther'
    }
})

var placeArticleText = new Vue({
    el: '.articleText',
    data:{
        articleTexts: ''
    }
})


$(function() {
    $(".articlePictures").flexslider({
        slideshowSpeed: 5000, //展示时间间隔ms
        animationSpeed: 500, //滚动时间ms
        touch: true, //是否支持触屏滑动
        animation: "slide"
    });
});	


document.querySelector(".articlePictures")