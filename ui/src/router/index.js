import Vue from 'vue'
import Router from 'vue-router'
import ARView from '@/components/ar'
import ListRoute from '@/components/list_route'
import FirstFaceDetection from '@/components/first_face_detection'
import Article from '@/components/article'
import Toolbar from '@/components/toolbar'
import ProfilePicture from '@/components/profile_picture'

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
      path:'/toolbar',
      name:'Toolbar',
      component:Toolbar
    },
    {
      path:'/profile_picture',
      name:'Propic',
      component:ProfilePicture 
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = `${AppName} - ${to.name}`;
  next()
})

export default router;