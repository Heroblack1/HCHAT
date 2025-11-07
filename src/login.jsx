import { useState } from "react";
import { useFormik } from "formik";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const endPoint = "http://localhost:5000/home/login";
        const user = values;
        const req = await axios.post(endPoint, user);

        console.log(req.data.message, req.data.status);
        setResponse(req.data.message);

        if (req.data.status) {
          localStorage.setItem("token", req.data.token);
          navigate("/dashboard", { state: { user: req.data } });
        }
      } catch (err) {
        console.error("Login failed:", err);
        setResponse("Login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    validate: (values) => {
      const errors = {};
      if (!values.email) errors.email = "This field is required";

      if (!values.password) {
        errors.password = "This field is required";
      } else if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
          values.password
        )
      ) {
        errors.password =
          "Password must have 8+ chars, upper/lowercase, number & special character";
      }
      return errors;
    },
  });

  return (
    <div className="bodyy">
      <form className="login-form" onSubmit={formik.handleSubmit}>
        <h1>Login</h1>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            placeholder="Enter email"
            id="email"
            name="email"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.email && <small>{formik.errors.email}</small>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            id="password"
            name="password"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.password && <small>{formik.errors.password}</small>}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? <span className="spinnerr"></span> : "LOGIN"}
        </button>

        {response && <p className="response-text">{response}</p>}
        <Link rel="stylesheet" to="/getStarted" className="rell">
          Create an account
        </Link>
      </form>
    </div>
  );
}

export default Login;
