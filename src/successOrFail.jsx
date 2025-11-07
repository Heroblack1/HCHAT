import { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";

function SuccessOrFail() {
  const { message } = useParams();
  return (
    <>
      <div className="bodyy">
        <h1 className="email">Verification Portal</h1>
        <p className="header">{message}</p>
        <Link className="whiteLet" to="/login">
          Login
        </Link>
      </div>
    </>
  );
}

export default SuccessOrFail;
