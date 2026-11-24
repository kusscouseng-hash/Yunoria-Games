"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { Avatar } from "@/components/community/avatar";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { updateAvatar, type AvatarState } from "@/lib/profile/actions";

const VIEW = 280; // Größe des Ausschnitt-Fensters in px
const OUT = 512; // Größe des hochgeladenen Bildes (Server verkleinert auf 256)
const MAX_ZOOM = 4;

type Crop = { img: HTMLImageElement; url: string; zoom: number; x: number; y: number };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Bild so verschieben, dass der runde Ausschnitt immer komplett gefüllt bleibt. */
function fit(c: Crop, zoom: number, x: number, y: number): Crop {
  const s = (VIEW / Math.min(c.img.naturalWidth, c.img.naturalHeight)) * zoom;
  const w = c.img.naturalWidth * s;
  const h = c.img.naturalHeight * s;
  return { ...c, zoom, x: clamp(x, VIEW - w, 0), y: clamp(y, VIEW - h, 0) };
}

const scaleOf = (c: Crop) => (VIEW / Math.min(c.img.naturalWidth, c.img.naturalHeight)) * c.zoom;

/** Profilbild ändern: Bild wählen → Ausschnitt verschieben und zoomen → speichern. */
export function AvatarForm({
  url,
  username,
  t,
  uploadAction = updateAvatar,
  hidden,
  preview,
  square = false,
}: {
  url: string | null;
  username: string;
  t: Dictionary["auth"]["account"];
  /** Andere Upload-Funktion (z. B. Gilden-Bild) – gleiches Zuschneiden */
  uploadAction?: (prev: AvatarState, fd: FormData) => Promise<AvatarState>;
  /** Zusätzliche Felder, die mitgeschickt werden */
  hidden?: Record<string, string>;
  /** Eigene Vorschau statt des Profilbilds */
  preview?: React.ReactNode;
  /** Eckiger statt runder Ausschnitt */
  square?: boolean;
}) {
  const [state, action, pending] = useActionState<AvatarState, FormData>(uploadAction, {});
  const [crop, setCrop] = useState<Crop | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => {
    if (crop) URL.revokeObjectURL(crop.url);
    setCrop(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onFile = (file: File | undefined) => {
    setFileError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setFileError(t.avatarErrors.type);
    if (file.size > 15 * 1024 * 1024) return setFileError(t.avatarErrors.size);
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const base: Crop = { img, url: objectUrl, zoom: 1, x: 0, y: 0 };
      const s = scaleOf(base);
      // Zentriert starten
      setCrop(fit(base, 1, (VIEW - img.naturalWidth * s) / 2, (VIEW - img.naturalHeight * s) / 2));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setFileError(t.avatarErrors.type);
    };
    img.src = objectUrl;
  };

  // Zoomen um die Mitte des Ausschnitts
  const zoomTo = (zoom: number) => {
    if (!crop) return;
    const z = clamp(zoom, 1, MAX_ZOOM);
    const sOld = scaleOf(crop);
    const sNew = sOld * (z / crop.zoom);
    const cx = (VIEW / 2 - crop.x) / sOld;
    const cy = (VIEW / 2 - crop.y) / sOld;
    setCrop(fit(crop, z, VIEW / 2 - cx * sNew, VIEW / 2 - cy * sNew));
  };

  const save = () => {
    if (!crop) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const s = scaleOf(crop);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(crop.img, -crop.x / s, -crop.y / s, VIEW / s, VIEW / s, 0, 0, OUT, OUT);
    canvas.toBlob(
      (blob) => {
        if (!blob) return setFileError(t.avatarErrors.generic);
        const fd = new FormData();
        fd.set("avatar", new File([blob], "avatar.webp", { type: blob.type || "image/webp" }));
        for (const [k, v] of Object.entries(hidden ?? {})) fd.set(k, v);
        startTransition(() => action(fd));
        close();
      },
      "image/webp",
      0.92,
    );
  };

  const s = crop ? scaleOf(crop) : 1;

  return (
    <div className="flex items-center gap-4">
      {preview ?? <Avatar url={url} name={username} size={64} className="border-2 border-accent/60" />}
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm font-semibold hover:border-accent/60">
            {pending ? t.avatarUploading : t.avatarChange}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="sr-only"
              disabled={pending}
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          {url && (
            <form action={action}>
              <input type="hidden" name="remove" value="1" />
              {Object.entries(hidden ?? {}).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <button type="submit" disabled={pending} className="text-sm text-subtle hover:text-foreground disabled:opacity-50">
                {t.avatarRemove}
              </button>
            </form>
          )}
        </div>
        <p className="text-xs text-subtle">{t.avatarHint}</p>
        {(fileError || state.error) && (
          <p role="alert" className="text-xs text-accent-hover">
            {fileError ?? t.avatarErrors[state.error!]}
          </p>
        )}
        {state.ok && !state.error && !fileError && <p className="text-xs text-success">{t.avatarSaved}</p>}
      </div>

      {/* Ausschnitt wählen */}
      {crop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label={t.avatarCropTitle}>
          <div className="w-full max-w-sm rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-2xl">
            <h2 className="text-lg font-bold">{t.avatarCropTitle}</h2>
            <p className="mt-1 text-sm text-muted">{t.avatarCropHint}</p>

            <div
              className="relative mx-auto mt-4 cursor-grab touch-none overflow-hidden rounded-xl bg-black active:cursor-grabbing"
              style={{ width: VIEW, height: VIEW }}
              onPointerDown={(e) => {
                drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                const d = drag.current;
                if (!d || d.id !== e.pointerId) return;
                const dx = e.clientX - d.x;
                const dy = e.clientY - d.y;
                d.x = e.clientX;
                d.y = e.clientY;
                setCrop((c) => (c ? fit(c, c.zoom, c.x + dx, c.y + dy) : c));
              }}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
              onWheel={(e) => zoomTo(crop.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08))}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- lokale Vorschau (Blob-URL) */}
              <img
                src={crop.url}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
                style={{ width: crop.img.naturalWidth * s, height: crop.img.naturalHeight * s, transform: `translate(${crop.x}px, ${crop.y}px)` }}
              />
              {/* Runde Maske: außen abgedunkelt */}
              <div
                className={`pointer-events-none absolute inset-0 border-2 border-white/80 ${square ? "rounded-2xl" : "rounded-full"}`}
                style={{ boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)" }}
              />
            </div>

            <label className="mt-5 flex items-center gap-3 text-sm text-muted">
              <span aria-hidden="true">−</span>
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={crop.zoom}
                onChange={(e) => zoomTo(Number(e.target.value))}
                aria-label={t.avatarZoom}
                className="flex-1 accent-[var(--color-accent)]"
              />
              <span aria-hidden="true">+</span>
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={close} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-foreground">
                {t.avatarCancel}
              </button>
              <button type="button" onClick={save} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover">
                {t.avatarSave}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
