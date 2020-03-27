import Vue from 'vue'
import Router from 'vue-router'
import ARView from '@/components/ar'
import ListRoute from '@/components/list_route'
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
      path: '/post',
      name: 'Post',
      component: Post
    }
  ]
})

router.beforeEach((to, from, next) => {
  document.title = `${AppName} - ${to.name}`;
  next()
})

export default router;