"use client";

import { CheckCircle2, PlugZap, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TextInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TELEMETRY_PROTOCOL_LABEL } from "@/constants/labels";
import { api, errorMessage } from "@/lib/api";
import { TELEMETRY_URL_EXAMPLE } from "@/lib/validators";
import type { LinkTestResult, TelemetryProtocol } from "@/types/drone";
import type { DroneFormErrors, DroneFormValues } from "../_lib/drone-form";
import { FormSection } from "./section";

const PROTOCOLS = (
  Object.keys(TELEMETRY_PROTOCOL_LABEL) as TelemetryProtocol[]
).map((value) => ({
  value,
  label: TELEMETRY_PROTOCOL_LABEL[value],
}));

interface Props {
  values: DroneFormValues;
  errors: DroneFormErrors;
  onChange: (patch: Partial<DroneFormValues>) => void;
}

export function TelemetryLinkFields({ values, errors, onChange }: Props) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<LinkTestResult | null>(null);
  const mavlink = values.telemetryProtocol.startsWith("mavlink");

  const test = async () => {
    setTesting(true);
    setResult(null);
    try {
      setResult(
        await api.drones.testLink(
          {
            enabled: values.telemetryEnabled,
            protocol: values.telemetryProtocol,
            url: values.telemetryUrl.trim(),
            systemId:
              mavlink && values.systemId.trim()
                ? Number(values.systemId)
                : null,
          },
          values.id.trim() || undefined,
        ),
      );
    } catch (error) {
      setResult({ ok: false, latencyMs: null, message: errorMessage(error) });
    } finally {
      setTesting(false);
    }
  };

  return (
    <FormSection
      title="Tautan telemetri"
      description="Bridge terhubung sendiri ke server: DJI ke ws://<server>:8080/telemetry/<ID drone>, Autel/lainnya ke ws://<server>:8080/ws/drone. Untuk bridge, URL WebSocket boleh dikosongkan."
    >
      <Switch
        checked={values.telemetryEnabled}
        onChange={(telemetryEnabled) => {
          setResult(null);
          onChange({ telemetryEnabled });
        }}
        label="Telemetri aktif"
        description="Matikan untuk drone yang hanya mengirim video."
      />
      {values.telemetryEnabled && (
        <>
          <div className="grid grid-cols-[1fr_96px] gap-2">
            <Field label="Protokol">
              <Select
                value={values.telemetryProtocol}
                options={PROTOCOLS}
                onChange={(telemetryProtocol) => {
                  setResult(null);
                  onChange({ telemetryProtocol });
                }}
              />
            </Field>
            {mavlink && (
              <Field label="System ID" error={errors.systemId}>
                <TextInput
                  inputMode="numeric"
                  value={values.systemId}
                  invalid={!!errors.systemId}
                  onChange={(e) => onChange({ systemId: e.target.value })}
                />
              </Field>
            )}
          </div>
          <Field
            label="Alamat telemetri"
            required
            error={errors.telemetryUrl}
            hint={`Contoh: ${TELEMETRY_URL_EXAMPLE[values.telemetryProtocol]}`}
          >
            <TextInput
              value={values.telemetryUrl}
              invalid={!!errors.telemetryUrl}
              placeholder={TELEMETRY_URL_EXAMPLE[values.telemetryProtocol]}
              spellCheck={false}
              onChange={(e) => {
                setResult(null);
                onChange({ telemetryUrl: e.target.value });
              }}
            />
          </Field>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              icon={PlugZap}
              loading={testing}
              disabled={!values.telemetryUrl.trim()}
              onClick={test}
            >
              Uji koneksi
            </Button>
            {result && (
              <span
                className={
                  result.ok
                    ? "flex items-center gap-1 text-[11px] text-green"
                    : "flex items-center gap-1 text-[11px] text-red"
                }
              >
                {result.ok ? (
                  <CheckCircle2 size={12} aria-hidden />
                ) : (
                  <XCircle size={12} aria-hidden />
                )}
                {result.message}
                {result.latencyMs !== null && ` (${result.latencyMs} ms)`}
              </span>
            )}
          </div>
        </>
      )}
    </FormSection>
  );
}
