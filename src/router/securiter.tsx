import { Navigate, Outlet, useLocation } from "react-router-dom";
import { TokenValide } from "../api/db_glpi";
import { SecureLayout } from "../pages/inc/NavBar";
import '../pages/inc/nav.css';

function SecureRoute() {
  const location = useLocation();
  const isValid  = TokenValide();

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