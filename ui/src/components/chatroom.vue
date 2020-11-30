<template>
  <chat-window
    :currentUserId="currentUserId"
    :rooms="rooms"
    :messages="messages"
    :height="height"
    :showFiles="false"
    :showAudio="false"
    :showEmojis="false"
    :showReactionEmojis="false"
    :messageActions="[]"
    :textMessages="textMessages"
    :messagesLoaded="messagesLoaded"
    :showNewMessagesDivider="false"
    :showAddRoom="false"
    @fetchMessages="fetchMessages"
    @sendMessage="sendMessage"
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
      rooms: [],
      messages: [],
      currentUserId: 1234,
      messagesLoaded:true,
      height:"90vh"
    };
  },
  mounted() {
    //   const rooms = []
    //   for (let i = 0; i < res.length; i++) {
    //      rooms.push(res)
    //   }
    //   this.rooms = rooms
    this.rooms = [
      {
        roomId: 1,
        roomName: "Test Room 1",
        avatar: "/static/media/avatar.png",
        //unreadCount: 4,
        lastMessage: {
          content: "HIHIHIHIHI",
          sender_id: 1234,
          username: "John Doe",
          timestamp: "10:20", //顯示
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
            //avatar: "assets/imgs/doe.png",
          },
          {
            _id: 4321,
            username: "John Snow",
            //avatar: "assets/imgs/snow.png",
          },
        ],
      },
      {
        roomId: 2,
        roomName: "Test Room 22222",
        avatar: "/static/media/avatar.png",
        //unreadCount: 4,
        lastMessage: {
          content: "HIHIHIHIHI",
          sender_id: 789,
          username: "John Doe",
          timestamp: "10:30",
          date: 123242420, //可以讓套件幫你排序聊天室 類型不限 eg.string, datetime, timestamp
          // saved: true,
          // distributed: false,
          // seen: false,
          // new: true,
        },
        users: [
          {
            _id: 1234,
            username: "John Doe",
            //avatar: "assets/imgs/doe.png",
          },
          {
            _id: 4444,
            username: "John Snow",
            //avatar: "assets/imgs/snow.png",
          },
        ],
      },
    ];
    // this.$set(this.rooms, roomIndex, room)
  },
  methods: {
    fetchMessages(room) {
      console.log("fetchMessages");
      console.log(room);
      this.messagesLoaded = false;
      this.messages = [
        {
          _id: 1111,
          content: "*message 1*",
          target_id: 123444,
          sender_id: 1234, // 如果和currentUserId一樣 聊天室的訊息在右邊
          username: "John Doe",
          date: "13 November",
          timestamp: "10:20",
          // system: false,
          // saved: true,
          // distributed: true,
          //seen: true,
          // disable_actions: false,
          // disable_reactions: false,
        },
        {
          _id: 1112,
          content: "message 222222",
          sender_id: 5555, // 如果和currentUserId一樣 聊天室的訊息在右邊
          username: "John Doe",
          date: "13 November",
          timestamp: "10:30",
          // system: false,
          // saved: true,
          // distributed: true,
          //seen: true,
          // disable_actions: false,
          // disable_reactions: false,
        },
      ];

      // use timeout to imitate async server fetched data
      setTimeout(() => {
        this.messagesLoaded = true;
      }, 0);
    },
    sendMessage({ roomId, content }) {
      console.log("sendMessage");
      console.log(roomId);
      console.log(content);
    },
  },
};
</script>
<style scoped>
</style>
