import Vue from 'vue'
import Router from 'vue-router'
import ARView from '@/components/ar'
import ListRoute from '@/components/list_route'
import Camera from '@/components/camera'
import Post from '@/components/article'
import FirstFaceDetection from '@/components/first_face_detection'
import Article from '@/components/article'
import Profile from '@/components/profile'
import Gesture from '@/components/main_gesture'
import Toolbar from '@/components/toolbar'
import ProfilePicture from '@/components/profile_picture'
import TimeLine from '@/components/timeline'
import TestGeolocator from '@/components/test_geolocator'
import FriendListAround from '@/components/friend_list_around'
import Main from '@/components/main'
import TestAbsSpeed from '@/components/friend_list_around'

Vue.use(Router)

const AppName = 'Vireality'

let router = new Router({
  routes: [
    {
      path: '/',
      name: 'Developing Index',
      component: ListRoute
    },
    {
      path: '/ar_example',
      name: 'AR example',
      component: ARView
    },
    {
      path: '/camera_test',
      name: 'Camera test',
      component: Camera
    },
    {
      path: '/post',
      name: 'Post',
      component: Post,
    },
    {
      path: '/first_face_detection',
      name: 'First face detection',
      component: FirstFaceDetection
    },
    {
      path: '/article',
      name: 'Article',
      component: Article
    },
    {
      path: '/profile',
      name: 'Profile',
      component: Profile
    },
    {
      path: '/main_gesture',
      name: 'Gesture',
      component: Gesture
    },
    {
      path:'/toolbar',
      name:'Toolbar',
      component:Toolbar
    },
    {
      path:'/profile_picture',
      name:'Propic',
      component:ProfilePicture
    },
    {
      path:'/main',
      name:'Main',
      component:Main 
    },
    //==========test================
    {
      path: '/timeline',
      name: 'feef',
      component: TimeLine
    },
    {
      path: '/test_geolocator',
      name: 'Test Geolocator',
      component: TestGeolocator
    },
    {
      path: '/test_abs_speed_sensor',
      name: 'Test Absolte Speed Sensor',
      component: TestAbsSpeed
    },
    //=======end test===============
  ]
})

router.beforeEach((to, from, next) => {
  document.title = `${AppName} - ${to.name}`;
  next()
})

export default router;
