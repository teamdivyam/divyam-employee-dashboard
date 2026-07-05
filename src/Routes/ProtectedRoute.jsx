import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import isTokenExpired from "@/utils/isTokenExpired.js";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("AppID");

  if (isTokenExpired(token)) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default ProtectedRoute;
