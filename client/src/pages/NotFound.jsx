import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Button from "../components/ui/Button.jsx";

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>404 Page Not Found | Aaditya Builders</title>
      </Helmet>

      <main className="min-h-[75vh] flex items-center justify-center bg-[#FFFBF5] px-4">
        <div className="text-center flex flex-col items-center max-w-md bg-white border border-amber-100 rounded-3xl p-8 shadow-sm">
          <span className="text-7xl mb-4 select-none">🏗️</span>
          <h1 className="text-5xl font-extrabold font-display text-[#E8871E]">404</h1>
          <h2 className="text-xl font-bold font-display text-[#2E2A26] mt-2">Page Under Construction</h2>
          <p className="text-xs text-[#6B625A] mt-2 leading-relaxed">
            The page you're trying to reach doesn't exist or has been shifted. Let's return back to the homepage to explore our ongoing residential properties.
          </p>
          <Link to="/" className="mt-6 w-full">
            <Button variant="primary" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </main>
    </>
  );
}
