<template>
  <chat-window
    :currentUserId="currentUserId"
    :rooms="rooms"
    :messages="messages"
    :showFiles="false"
    :showAudio="false"
    :showEmojis="false"
    :showReactionEmojis="false"
    :messageActions="[]"
    :textMessages="textMessages"
    :menuActions="menuActions"
    @fetchMessages="fetchMessages"
    @menuActionHandler="menuActionHandler"
  />
</template>

<script>
import ChatWindow from "vue-advanced-chat";
import "vue-advanced-chat/dist/vue-advanced-chat.css";

export default {
  components: {
    ChatWindow,
  },
  data() {
    return {
      textMessages: {
        ROOMS_EMPTY: "趕快開始聊天吧",
        NEW_MESSAGES: "新訊息",
        MESSAGE_DELETED: "此訊息已刪除",
        MESSAGES_EMPTY: "沒有訊息",
        CONVERSATION_STARTED: "對話開始於：",
        TYPE_MESSAGE: "輸入您的訊息",
        SEARCH: "搜尋",
        IS_ONLINE: "線上",
        LAST_SEEN: "最後上線時間",
        IS_TYPING: "正在輸入...",
      },
      menuActions: [
        {
          name: "deleteRoom",
          title: "Delete Room",
        },
      ],
      rooms: [
        {
          roomId: 1,
          roomName: "Test Room 1",
          avatar: "/static/media/camera_g.png",
          //unreadCount: 4,
          lastMessage: {
            content: "HIHIHIHIHI",
            sender_id: 1234,
            username: "John Doe",
            timestamp: "10:20",
            date: 123242424, //可以讓套件幫你排序聊天室 類型不限 eg.string, datetime, timestamp
            // saved: true,
            // distributed: false,
            // seen: false,
            // new: true,
          },
          users: [
            {
              _id: 1234,
              username: "John Doe",
              avatar: "assets/imgs/doe.png",
            },
            {
              _id: 4321,
              username: "John Snow",
              avatar: "assets/imgs/snow.png",
            },
          ],
        },
      ],
      messages: [
        {
          _id: 7890,
          content: "message 1",
          sender_id: 1234, // 如果和currentUserId一樣 聊天室的訊息在右邊
          username: "John Doe",
          date: "13 November",
          timestamp: "10:20",
          // system: false,
          // saved: true,
          // distributed: true,
          // seen: false,
          // disable_actions: false,
          // disable_reactions: false,
        },
      ],
      currentUserId: 1234,
    };
  },
  mounted() {
    //   const rooms = []
    //   for (let i = 0; i < res.length; i++) {
    //      rooms.push(res)
    //   }
    //   this.rooms = rooms
    // this.$set(this.rooms, roomIndex, room)
  },
  methods: {
    fetchMessages(room) {
      console.log("fetchMessages");
      console.log(room);
      // this.messagesLoaded = false;
      // this.messages = [];

      // // use timeout to imitate async server fetched data
      // setTimeout(() => {
      //   this.messagesLoaded = true;
      // }, 0);
    },
    menuActionHandler({ roomId, action }) {
      switch (action.name) {
        case "deleteRoom":
          console.log(roomId);
          console.log("delete room");
      }
    },
  },
};
</script>
<style scoped>
</style>
