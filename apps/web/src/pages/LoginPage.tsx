import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { toErrorMessage } from "../services/api";
import { Icon } from "../components/Common/Icon";

export function LoginPage() {
  const { user, isSupervisor, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in as supervisor, redirect to dashboard
  if (user && isSupervisor) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      const msg = "Please enter your email and password.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email.trim(), password);
      toast.success("Signed in successfully as Supervisor.");
      navigate("/", { replace: true });
    } catch (err) {
      const msg = toErrorMessage(err, "Login failed. Please check your credentials.");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      // Direct login without modifying or filling form input fields
      await login("supervisor@doca.gov.in", "demo123");
      toast.success("Welcome, Demo Supervisor!");
      navigate("/", { replace: true });
    } catch (err) {
      const msg = toErrorMessage(err, "Demo login failed. Please ensure the server is running.");
      setError(msg);
      toast.error(msg);
    } finally {
      setDemoLoading(false);
    }
  };

  const isBusy = loading || authLoading || demoLoading;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/login-bg.png')" }}
    >
      {/* Dark/blur backdrop overlay */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-none" />

      <div className="w-full max-w-4xl bg-white/95 backdrop-blur-md border border-white/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10">
        {/* Left banner side */}
        <div className="md:w-1/2 bg-white flex items-center justify-center relative overflow-hidden min-h-[220px] md:min-h-[560px] p-6 border-b md:border-b-0 md:border-r border-slate-200">
          <img
            src="/doca-banner.png"
            alt="Department of Consumer Affairs Banner"
            className="w-full h-full max-h-[480px] object-contain object-center"
          />
        </div>

        {/* Right login form side */}
        <div className="md:w-1/2 bg-white p-6 sm:p-8 md:p-9 flex flex-col justify-center">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <span className="w-12 h-12 bg-gradient-to-br from-[#5e6ad2] to-[#4338ca] text-white text-2xl font-extrabold flex items-center justify-center rounded-xl shadow-lg shadow-indigo-500/30">
                L
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Labelly Supervisor Portal
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Legal Metrology (Packaged Commodities) Rules Enforcement
            </p> 
            <div className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-semibold uppercase tracking-wider text-green-800 bg-green-100 px-2.5 py-1 rounded-full">
              <span>Department of Consumer Affairs</span>
              <span className="opacity-60">•</span>
              <span>Government of India</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs bg-rose-50 border border-rose-200 text-rose-700 mb-4" role="alert">
              <Icon name="alert" size={16} />
              <span>{error}</span>
            </div>
          )}

          <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="email" className="text-xs font-semibold text-slate-700">
                Official Email Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#5e6ad2] focus:ring-3 focus:ring-indigo-100 transition-all disabled:bg-slate-100 disabled:opacity-75 disabled:cursor-not-allowed"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@doca.gov.in"
                autoComplete="username"
                required
                disabled={isBusy}
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-3.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#5e6ad2] focus:ring-3 focus:ring-indigo-100 transition-all disabled:bg-slate-100 disabled:opacity-75 disabled:cursor-not-allowed"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={isBusy}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#5e6ad2] hover:bg-[#4d58bf] rounded-lg shadow-md shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              disabled={isBusy}
            >
              {loading ? "Authenticating..." : "Sign In to Oversight Dashboard"}
            </button>
          </form>

          <div className="flex items-center my-3.5 text-slate-400 text-xs font-semibold uppercase tracking-wider before:flex-1 before:border-b before:border-slate-200 after:flex-1 after:border-b after:border-slate-200 [&>span]:px-3">
            <span>or</span>
          </div>

          <button
            type="button"
            className="w-full py-2 px-4 text-sm font-semibold text-[#5e6ad2] bg-slate-50 hover:bg-[#eef0fb] border border-[#d2d7f6] hover:border-[#5e6ad2] rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isBusy}
            onClick={handleDemoLogin}
          >
            {demoLoading ? (
              <span>Logging in...</span>
            ) : (
              <>
                {/* <span className="bg-green-700/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  Demo
                </span> */}
                <span>Quick Demo Login as Supervisor</span>
              </>
            )}
          </button>

          <footer className="mt-5 text-center text-xs text-slate-400">
            <span>Protected System for Authorized Metrology Officers Only</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
