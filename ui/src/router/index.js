import Vue from 'vue'
import Router from 'vue-router'
import ARView from '@/components/ar'
import ListRoute from '@/components/list_route'
import Camera from '@/components/camera'
import Post from '@/components/article'

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
<<<<<<< HEAD
      path: '/camera_test',
      name: 'Camera test',
      component: Camera
=======
      path: '/post',
      name: 'Post',
      component: Post
>>>>>>> 7bf8cca7a5278b39ac5aa1463bb4a9bc7056b333
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = `${AppName} - ${to.name}`;
  next()
})

export default router;