import { useState } from "react";
import axios from "axios";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function Getstarted() {
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API = import.meta.env.VITE_API_URL;

  let formik = useFormik({
    initialValues: {
      email: "",
      nickName: "",
      password: "",
    },
    onSubmit: (values) => {
      setIsLoading(true);
      let endPoint = `${API}/home/register`;
      let user = values;
      console.log(user);
      axios.post(endPoint, user).then((req) => {
        console.log(req.data.message, req.data.status);
        setResponse(req.data.message);
        console.log(response);
        setIsLoading(false);
      });
    },
    validate: (values) => {
      let errors = {};
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!values.email) {
        errors.email = "This field is required";
      } else if (!emailRegex.test(values.email)) {
        errors.email = "Invalid email format";
      }

      if (values.nickName.length < 4) {
        errors.nickName = "Nick Name must be at least 4 characters long";
      }

      if (values.password.length < 8) {
        errors.password = "Password must be at least 8 characters long";
      } else if (!/[a-z]/.test(values.password)) {
        errors.password = "Password must contain at least one lowercase letter";
      } else if (!/[A-Z]/.test(values.password)) {
        errors.password = "Password must contain at least one uppercase letter";
      } else if (!/\d/.test(values.password)) {
        errors.password = "Password must contain at least one number";
      } else if (!/[@$!%?&]/.test(values.password)) {
        errors.password =
          "Password must contain at least one special character (@, $, !, %, ?, or &)";
      }

      return errors;
    },
  });

  return (
    <>
      <form onSubmit={formik.handleSubmit} className="bodyy">
        <p
          className="green"
          style={{ display: response === "" ? "none" : "block" }}
        >
          {response}
        </p>
        <h1 className="email">
          please enter your email address to get started
        </h1>
        <input
          type="text"
          name="email"
          placeholder="email"
          className="emailInput"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />

        {formik.touched.email && formik.errors.email && (
          <small className="valMess">{formik.errors.email}</small>
        )}

        <input
          type="text"
          className="emailInput"
          name="nickName"
          placeholder="nickname"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />

        {formik.touched.nickName && formik.errors.nickName && (
          <small className="valMess">{formik.errors.nickName}</small>
        )}

        <input
          type="text"
          name="password"
          className="emailInput"
          placeholder="password"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
        />

        {formik.touched.password && formik.errors.password && (
          <small className="valMess">{formik.errors.password}</small>
        )}

        <button type="submit" disabled={isLoading} className="loading-button">
          {isLoading ? (
            <span className="loading-spinner"></span>
          ) : (
            "Get Started"
          )}
        </button>

        <Link rel="stylesheet" to="/login" className="rell">
          Login
        </Link>
      </form>
    </>
  );
}

export default Getstarted;
