import Vue from "vue";
import Router from "vue-router";
import ARView from "@/components/ar";
import ListRoute from "@/components/list_route";
import Camera from "@/components/camera";
import Post from "@/components/post_article";
import FirstFaceDetection from "@/components/first_face_detection";
import Article from "@/components/article";
import Profile from "@/components/profile";
import Gesture from "@/components/main_gesture";
import Toolbar from "@/components/toolbar";
import ProfilePicture from "@/components/profile_picture";
import TimeLine from "@/components/timeline";
import TestGeolocator from "@/components/test_geolocator";
import FriendListAround from "@/components/friend_list_around";
import Main from "@/components/main";
import PostLocation from "@/components/post_article_location";
import TestAbsSpeed from "@/components/friend_list_around";
import TestTimeLine from "@/components/test_timeline";

Vue.use(Router);

const AppName = "Vireality";

let router = new Router({
  routes: [
    {
      path: "/",
      name: "Developing Index",
      component: ListRoute
    },
    {
      path: "/ar_example",
      name: "AR example",
      component: ARView
    },
    {
      path: "/camera_test",
      name: "Camera test",
      component: Camera
    },
    {
      path: "/post",
      name: "Post",
      component: Post
    },
    {
      path: "/first_face_detection",
      name: "First face detection",
      component: FirstFaceDetection
    },
    {
      path: "/article",
      name: "Article",
      component: Article
    },
    {
      path: "/profile",
      name: "Profile",
      component: Profile
    },
    {
      path: "/main_gesture",
      name: "Gesture",
      component: Gesture
    },
    {
      path: "/toolbar",
      name: "Toolbar",
      component: Toolbar
    },
    {
      path: "/profile_picture",
      name: "Propic",
      component: ProfilePicture
    },
    {
      path: "/main",
      name: "Main",
      component: Main,
      children: [
        {
          path: "post",
          name: "Main-Post",
          components: {
            default: Main,
            lightBox: Post
          }
        },
        {
          path: "article",
          name: "Main-Article",
          components: {
            default: Main,
            lightBox: Article
          }
        },
        {
          path: "profile",
          name: "Main-Profile",
          components: {
            default: Main,
            lightBox: Profile
          }
        }
      ]
    },
    {
      path: "/post_article_location",
      name: "Post Choose location",
      component: PostLocation
    },
    //==========test================
    {
      path: "/timeline",
      name: "Test Timeline",
      component: TimeLine
    },
    {
      path: "/test_timeline",
      name: "Test timeline",
      component: TestTimeLine
    },
    {
      path: "/test_geolocator",
      name: "Test Geolocator",
      component: TestGeolocator
    },
    {
      path: "/test_abs_speed_sensor",
      name: "Test Absolte Speed Sensor",
      component: TestAbsSpeed
    },
    {
      path: "/friend_list_around",
      name: "Test Friend List Around",
      component: FriendListAround
    }
    //=======end test===============
  ]
});

router.beforeEach((to, from, next) => {
  document.title = `${AppName} - ${to.name}`;
  next();
});

export default router;
