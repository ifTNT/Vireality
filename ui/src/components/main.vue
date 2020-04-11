<template>
    <div class="main" >
    <toolbar></toolbar>
    <friendList v-if="isShowFriendList"></friendList>
    <timeLine v-if="isShowTimeLine"></timeLine>
    <ar ></ar>
    <gesture></gesture>
    </div>
</template>


<script>
import Toolbar from './toolbar.vue'
import AR from './ar.vue'
import Gesture from './main_gesture.vue'
import FriendList from './friend_list_around.vue'
import TimeLine from './timeline.vue'

export default {
    name:"main",
    data(){
        return{
            isShowFriendList:true,
            isShowTimeLine:false
        };
    },
    components:{
        toolbar : Toolbar,
        ar : AR,
        gesture : Gesture,
        friendList : FriendList,
        timeLine : TimeLine,
    }
};
</script>

<style scoped>
    toolbar{
        z-index:3;
    }
    ar{
        z-index: 1; 
    }
    gesture{
        z-index: -999;
    }
</style>