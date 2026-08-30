import { Suspense } from "react";
import StartClient from "./StartClient";

/**
 * /start — LP（Phase 2）。
 *
 * StartClient は流入経路タグ（?src=）の読み取りに useSearchParams を使うため、
 * Next.js の推奨どおり Suspense 境界で包む（プリレンダリング時はクライアント描画に切り替わる）。
 */
export default function StartPage() {
  return (
    <Suspense>
      <StartClient />
    </Suspense>
  );
}
