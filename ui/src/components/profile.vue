<template>
    <div class="profile">
            <div class="circle"></div>
            <!-- <img class="changePicture" src="static/media/camera.png"> -->
                <div class="name">使用者</div>
                <div class="hobbies">興趣</div>
                <div class="description">形容自己的一句話</div>
            <button class="button" type="button" color="black">聊天室</button>
        </div>
</template>

<script>
export default {
    name: "friend_profile",
    data(){
        return{

        };
    }
};
</script>

<style scoped>
.profile{
    width: 80vw;
    height: 80vh;
    background-color: rgba(0,0,0,0.4);
    border-radius:50px;
    position:fixed;
    top:10vh;
    left:10vw;
    /* text-align:center; */
}
.circle{
    width: 23vw;
    height: 23vw;
    background:white;
    border-radius: 50%;
    position: fixed;
    left:39vw;
    top:18vh; 
}
.changePicture{
    width: 3vh;
    height: 3vh;
    position: fixed;
    left: 56vw;
    top: 32vh;
}
.name{
    color:white;
    font-size: 7vw;
    font-family: Microsoft JhengHei;
    position: fixed;
    top:38vh;
    left: 40vw;
}
.hobbies{
    font-size: 5vw;
    font-family: Microsoft JhengHei;
    color:white;
    position:fixed;
    top:48vh;
    left:20vw;
}
.description{
    font-size: 5vw;
    font-family: Microsoft JhengHei;
    color:white;
    position:fixed;
    top:62vh;
    left:20vw;
}
.button{
    background-color:#E8E8E8;
    border:none;
    color:black; 
    padding:2vh 5vw;
    text-align:center;
    font-size:3vh;
    position:fixed;
    top:75vh;
    left:37.5vw;
}
</style>