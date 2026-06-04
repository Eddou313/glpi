import { Link } from "react-router-dom";

export function Test()
{
    return (
        <div>
            <h1>Test</h1>
            <Link to="/user">Go to Users</Link>
        </div>
    );
}
