import {firebase} from '@firebase/app'
import '@firebase/firestore'
import '@firebase/database'
import '@firebase/storage'

export function initFirebase(){
    firebase.initializeApp(firebaseConfig);
}

export {firebase}
export const db = firebase.firestore()
export const storageRef = firebase.storage().ref()

export const usersRef = db.collection('users')
export const roomsRef = db.collection('chatRooms')

export const filesRef = storageRef.child('files')

export const dbTimestamp = firebase.firestore.FieldValue.serverTimestamp()
export const deleteDbField = firebase.firestore.FieldValue.delete()

const firebaseConfig = {
  apiKey: "AIzaSyBnDO5kPUSJmMN413GXCjCpN-Ye5hnga7I",
  authDomain: "vireality-chatroom.firebaseapp.com",
  databaseURL: "https://vireality-chatroom.firebaseio.com",
  projectId: "vireality-chatroom",
  storageBucket: "vireality-chatroom.appspot.com",
  messagingSenderId: "820242761275",
  appId: "1:820242761275:web:d83f1ce817961b5c2c3e1e"
};