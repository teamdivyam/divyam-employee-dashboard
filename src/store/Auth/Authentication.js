import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isAuthenticate: false,
    user: null,
    token: "",
    adminID: ""
}

const authSlice = createSlice({
    name: "Auth",
    initialState,
    reducers: {
        authenticate: (state) => ({
            ...state,
            isAuthenticate: true,
        }),
        isAuth: function (state, action) {
            return {
                ...state,
                isAuthenticate: localStorage.getItem("AppID")
            }
        },
        setToken: function (state, action) {
            return {
                ...state,
                token: action.payload
            }
        },
        setUSER: function (state, action) {
            return {
                ...state,
                userID: action.payload
            }
        }
    }
});

export default authSlice.reducer
export const { authenticate, isAuth, setToken, setUSER } = authSlice.actions; 
