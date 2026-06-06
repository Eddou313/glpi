import { Navigate, Outlet, useLocation } from "react-router-dom";
import { TokenValide } from "../api/db_glpi";

function SecureRoute() {
  const location = useLocation();
  const isValid = TokenValide();

  if (!isValid) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default SecureRoute;