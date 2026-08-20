// Mirrors the server's `passwordSchema` in server.js — keep these two in sync.
const PASSWORD_REQUIREMENTS = [
  { key: "length", label: "At least 10 characters", test: (pw) => pw.length >= 10 },
  { key: "uppercase", label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { key: "lowercase", label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { key: "number", label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { key: "special", label: "One special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const STRENGTH_LEVELS = [
  { max: 1, label: "Weak", text: "text-red-400", bar: "bg-red-500" },
  { max: 3, label: "Fair", text: "text-amber-400", bar: "bg-amber-500" },
  { max: 4, label: "Good", text: "text-[#438eef]", bar: "bg-[#438eef]" },
  { max: 5, label: "Strong", text: "text-green-400", bar: "bg-green-500" },
];

function PasswordStrength({ password }) {
  const metCount = PASSWORD_REQUIREMENTS.filter((req) => req.test(password)).length;
  const level = STRENGTH_LEVELS.find((l) => metCount <= l.max) || STRENGTH_LEVELS[STRENGTH_LEVELS.length - 1];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {PASSWORD_REQUIREMENTS.map((req, i) => (
            <span
              key={req.key}
              className={`flex-1 h-1.5 rounded-full transition-colors ${i < metCount ? level.bar : "bg-slate-700"}`}
            />
          ))}
        </div>
        {password && <span className={`text-xs font-semibold ${level.text}`}>{level.label}</span>}
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const met = req.test(password);
          return (
            <li
              key={req.key}
              className={`flex items-center gap-1.5 text-xs transition-colors ${met ? "text-green-400" : "text-slate-500"}`}
            >
              <i className={`fa-solid ${met ? "fa-check" : "fa-xmark"} text-[10px] w-2.5`}></i>
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default PasswordStrength;
