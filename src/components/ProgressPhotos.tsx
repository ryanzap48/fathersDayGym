"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { shortDate } from "@/lib/utils/format";

const BUCKET = "progress-photos";

interface Photo {
  path: string;
  url: string;
  createdAt: string;
}

export function ProgressPhotos({ userId }: { userId: string }) {
  const supabase = createClient();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(userId, { sortBy: { column: "created_at", order: "desc" } });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    const files = (data ?? []).filter((f) => f.id);
    const signed = await Promise.all(
      files.map(async (f) => {
        const path = `${userId}/${f.name}`;
        const { data: s } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
        return { path, url: s?.signedUrl ?? "", createdAt: f.created_at ?? "" };
      }),
    );
    setPhotos(signed.filter((p) => p.url));
    setError(null);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    // Async load; setState happens in promise callbacks, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
    if (error) setError(error.message);
    else await load();
    setUploading(false);
    e.target.value = "";
  }

  async function remove(path: string) {
    if (!window.confirm("Delete this photo?")) return;
    await supabase.storage.from(BUCKET).remove([path]);
    setPhotos((prev) => prev.filter((p) => p.path !== path));
  }

  return (
    <div>
      <label className="btn btn-ghost cursor-pointer text-sm text-accent">
        {uploading ? "Uploading…" : "+ Add photo"}
        <input type="file" accept="image/*" className="hidden" onChange={upload} disabled={uploading} />
      </label>

      {error && (
        <p className="mt-3 text-sm text-bad">
          {/Bucket not found/i.test(error)
            ? "Storage isn't set up yet — run migration 0001 in Supabase to enable progress photos."
            : error}
        </p>
      )}

      {loading ? (
        <p className="py-8 text-sm text-faint">Loading…</p>
      ) : photos.length === 0 ? (
        <p className="py-8 text-sm text-faint">
          No photos yet. A monthly progress shot is a great companion to the numbers.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <li key={p.path} className="group relative">
              {/* Signed Supabase URLs are dynamic, so use an unoptimized img. */}
              <Image
                src={p.url}
                alt={`Progress ${p.createdAt ? shortDate(p.createdAt) : ""}`}
                width={300}
                height={400}
                unoptimized
                className="h-44 w-full rounded object-cover"
              />
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span>{p.createdAt ? shortDate(p.createdAt) : ""}</span>
                <button onClick={() => remove(p.path)} className="text-faint hover:text-bad">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
