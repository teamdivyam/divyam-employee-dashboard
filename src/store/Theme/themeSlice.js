// store/themeSlice.js
import { createSlice } from "@reduxjs/toolkit";

const savedTheme = localStorage.getItem("theme");

console.log("savedTHeme:", savedTheme);

const themeSlice = createSlice({
  name: "theme",
  initialState: savedTheme || "light",
  reducers: {
    setLightTheme: () => "light",
    setDarkTheme: () => "dark",
    toggleTheme: (state) => (state === "light" ? "dark" : "light"),
  },
});

export const { setLightTheme, setDarkTheme, toggleTheme } =
  themeSlice.actions;

export default themeSlice.reducer;