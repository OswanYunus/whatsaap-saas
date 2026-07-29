export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Log in</h1>
        <p className="mt-2 text-sm text-gray-500">
          Login form placeholder — wire up to POST /api/auth/login.
        </p>
      </div>
    </div>
  );
}