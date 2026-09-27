"use client";

import { KeyRound } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { api, errorMessage } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import { SettingsCard } from "./settings-card";

const MIN_LENGTH = 8;

/** 0..4 based on length and character variety. */
function strength(password: string): number {
  if (!password) return 0;
  let score = password.length >= MIN_LENGTH ? 1 : 0;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

const STRENGTH_LABEL = [
  "Terlalu pendek",
  "Lemah",
  "Cukup",
  "Kuat",
  "Sangat kuat",
];
const STRENGTH_TONE = ["red", "red", "amber", "green", "green"] as const;

type Errors = Partial<Record<"current" | "next" | "confirm", string>>;

export function AccountSection() {
  const user = useAuthStore((s) => s.session?.user);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const score = strength(next);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation: Errors = {};
    if (!current) validation.current = "Isi kata sandi saat ini";
    if (next.length < MIN_LENGTH)
      validation.next = `Minimal ${MIN_LENGTH} karakter`;
    else if (next === current)
      validation.next = "Harus berbeda dari kata sandi saat ini";
    if (confirm !== next) validation.confirm = "Konfirmasi tidak sama";
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSaving(true);
    try {
      const session = await api.auth.changePassword({
        currentPassword: current,
        newPassword: next,
      });
      // Other sessions are signed out; this one continues with the new token.
      useAuthStore.getState().setSession(session);
      toast.success("Kata sandi diperbarui");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (error) {
      const message = errorMessage(error);
      setErrors(
        /saat ini/i.test(message) ? { current: message } : { next: message },
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {user && (
        <SettingsCard title="Profil">
          <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-xs">
            <dt className="text-txt-tertiary">Nama</dt>
            <dd className="text-txt-primary">{user.displayName}</dd>
            <dt className="text-txt-tertiary">Nama pengguna</dt>
            <dd className="font-mono text-txt-primary">{user.username}</dd>
            <dt className="text-txt-tertiary">Peran</dt>
            <dd className="text-txt-primary capitalize">{user.role}</dd>
            {user.unit && (
              <>
                <dt className="text-txt-tertiary">Satuan</dt>
                <dd className="text-txt-primary">{user.unit}</dd>
              </>
            )}
          </dl>
        </SettingsCard>
      )}

      <SettingsCard
        title="Ganti kata sandi"
        description="Akun dikelola administrator. Kata sandi baru berlaku pada login berikutnya."
      >
        <form
          onSubmit={submit}
          noValidate
          className="flex max-w-sm flex-col gap-3"
        >
          <Field label="Kata sandi saat ini" error={errors.current}>
            <TextInput
              type="password"
              autoComplete="current-password"
              value={current}
              invalid={!!errors.current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <Field label="Kata sandi baru" error={errors.next}>
            <TextInput
              type="password"
              autoComplete="new-password"
              value={next}
              invalid={!!errors.next}
              onChange={(e) => setNext(e.target.value)}
            />
          </Field>
          {next && (
            <div className="flex items-center gap-2">
              <ProgressBar
                value={(score / 4) * 100}
                tone={STRENGTH_TONE[score]}
                label="Kekuatan kata sandi"
              />
              <span className="w-24 shrink-0 text-right text-[11px] text-txt-tertiary">
                {STRENGTH_LABEL[score]}
              </span>
            </div>
          )}
          <Field label="Ulangi kata sandi baru" error={errors.confirm}>
            <TextInput
              type="password"
              autoComplete="new-password"
              value={confirm}
              invalid={!!errors.confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          <Button
            type="submit"
            variant="primary"
            icon={KeyRound}
            loading={saving}
            className="self-start"
          >
            Simpan kata sandi
          </Button>
        </form>
      </SettingsCard>
    </div>
  );
}
