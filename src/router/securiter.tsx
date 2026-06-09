import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { TokenValide } from "../api/db_glpi";
import { SecureLayout } from "../pages/inc/NavBar";
import '../pages/inc/nav.css';
import { useEffect, useState } from "react";

function SecureRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isValid, setIsValid] = useState<boolean>(TokenValide());

  useEffect(() => {
    const interval = setInterval(() => {
      const valid = TokenValide();

      setIsValid(valid);

      if (!valid) {
        navigate("/login", {
          replace: true,
          state: { from: location }
        });
      }
    }, 5000); 

    return () => clearInterval(interval);
  }, [navigate, location]);

  if (!isValid) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <SecureLayout>
      <Outlet />
    </SecureLayout>
  );
}

export default SecureRoute;