import Vue from 'vue'
import Router from 'vue-router'
import ARView from '@/components/ar'
import ListRoute from '@/components/list_route'
import Camera from '@/components/camera'
import Post from '@/components/article'
import FirstFaceDetection from '@/components/first_face_detection'
import Article from '@/components/article'

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
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = `${AppName} - ${to.name}`;
  next()
})

export default router;