import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <div className="text-center mt-20">
      <h1 className="text-3xl font-bold mb-4">Unauthorized</h1>
      <p>You don’t have permission to view this page.</p>
      <Link to="/login" className="text-blue-500 underline">Go back to login</Link>
    </div>
  );
}

export default Unauthorized;