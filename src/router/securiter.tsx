import { Navigate, Outlet} from "react-router-dom";
import { TokenValide } from "../api/db_glpi";

function SecureRoute() {
	const verification = TokenValide();

	if (!verification) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	return (
		<div style={{ display: "flex", minHeight: "100vh" }}>
			<main style={{ flex: 1, marginLeft: "18%", width: "calc(100% - 18%)" }}>
				<Outlet />
			</main>
		</div>
	);
}

export default SecureRoute;
