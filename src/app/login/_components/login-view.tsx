"use client";

import { Eye, EyeOff, LogIn, Radio } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/input";
import { APP_NAME, APP_TAGLINE } from "@/constants/defaults";
import { APP_VERSION, api, errorMessage, USE_MOCK } from "@/lib/api";
import { useAppStore } from "@/stores/use-app-store";
import { isSessionValid, useAuthStore } from "@/stores/use-auth-store";

const DEFAULT_TARGET = "/dashboard/fly";

/** Only allow redirects back into the dashboard. */
function safeNext(value: string | null): string {
  return value?.startsWith("/dashboard") ? value : DEFAULT_TARGET;
}

export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const hydrated = useAppStore((s) => s.hydrated);
  const session = useAuthStore((s) => s.session);
  const setSession = useAuthStore((s) => s.setSession);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const userId = useId();
  const passId = useId();

  useEffect(() => {
    if (hydrated && isSessionValid(session)) router.replace(next);
  }, [hydrated, session, next, router]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Isi nama pengguna dan kata sandi.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await api.auth.login({
        username: username.trim(),
        password,
      });
      setSession(created);
      router.replace(next);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gcs-root px-4">
      <div className="grid-overlay absolute inset-0" aria-hidden />

      <div className="relative w-full max-w-sm motion-safe:animate-fade-in">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center border border-cyan/40 bg-cyan/10">
            <Radio size={18} className="text-cyan" aria-hidden />
          </span>
          <div>
            <p className="font-mono text-lg font-bold tracking-tight text-txt-primary">
              {APP_NAME}
            </p>
            <p className="text-[11px] text-txt-tertiary">{APP_TAGLINE}</p>
          </div>
        </div>

        <form
          onSubmit={submit}
          noValidate
          className="panel flex flex-col gap-4 border-t-2 border-t-cyan p-5"
        >
          <div>
            <h1 className="text-base font-semibold text-txt-primary">
              Masuk ke stasiun kendali
            </h1>
            <p className="mt-1 text-xs text-txt-secondary">
              Gunakan akun yang diberikan administrator sistem.
            </p>
          </div>

          <Field label="Nama pengguna" htmlFor={userId}>
            <TextInput
              id={userId}
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-9"
            />
          </Field>

          <Field label="Kata sandi" htmlFor={passId}>
            <div className="relative">
              <TextInput
                id={passId}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-txt-tertiary hover:text-txt-primary"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>

          {error && (
            <div
              role="alert"
              className="border border-red/40 bg-red/10 px-3 py-2 text-xs text-red"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={LogIn}
            loading={busy}
            className="w-full"
          >
            Masuk
          </Button>
        </form>

        {USE_MOCK && (
          <div className="panel-inset mt-3 flex items-center gap-3 px-3 py-2.5 text-[11px] text-txt-secondary">
            <p className="flex-1 leading-relaxed">
              Mode demo. Akun:{" "}
              <span className="font-mono text-txt-primary">operator</span> /{" "}
              <span className="font-mono text-txt-primary">pasupati</span> atau{" "}
              <span className="font-mono text-txt-primary">admin</span> /{" "}
              <span className="font-mono text-txt-primary">admin12345</span>
            </p>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                setUsername("operator");
                setPassword("pasupati");
              }}
            >
              Isi otomatis
            </Button>
          </div>
        )}

        <p className="mt-6 font-mono text-[10px] text-txt-muted">
          v{APP_VERSION}. Akses terbatas, seluruh aktivitas dicatat.
        </p>
      </div>
    </div>
  );
}
