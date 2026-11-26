importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js','https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey:"AIzaSyB4vfR2nCgGMlNSNGl5a0iHlNaNI0LFHuM",
  authDomain:"harune-eb66f.firebaseapp.com",
  databaseURL:"https://harune-eb66f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:"harune-eb66f",
  messagingSenderId:"555612322072",
  appId:"1:555612322072:web:b13dbf38f139a38c89066d"
});
// ข้อความที่ส่งแบบ notification จะถูกแสดงโดย FCM เอง และแตะแล้วเปิดลิงก์ที่กำหนด
firebase.messaging();
