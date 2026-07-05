import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { isAuth } from "../../store/Auth/Authentication";
const Logout = () => {
  const dispatch = useDispatch();

  const isAUthenticated = useSelector((state) => state?.Auth?.isAuthenticate);

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("AppID")) {
      localStorage.removeItem("AppID");
      navigate("/login");
      // set state false
      dispatch(isAuth());
    }
    navigate("/login");
  }, []);

  return <div>Logout</div>;
};

export default Logout;
