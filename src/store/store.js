import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import notificationReducer from './notificationSlice';
import messageReducer from './messageSlice';
import connectionReducer from './connectionSlice';
  
const store = configureStore({
  reducer: {
    user: userReducer,
    notifications: notificationReducer, 
    messages: messageReducer,
    connections: connectionReducer,
  },
});

export default store;
