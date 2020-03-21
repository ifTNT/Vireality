import Vue from 'vue'
import Router from 'vue-router'
import ARComponent from '@/components/ar-component'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/ar_example',
      name: 'AR_example',
      component: ARComponent
    }
  ]
})
