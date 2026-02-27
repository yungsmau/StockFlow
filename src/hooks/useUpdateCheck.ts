import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";

interface UpdateInfo {
  currentVersion: string;
  newVersion: string;
  isMajorUpdate: boolean;
  downloadUrl: string;
}

const REPO_OWNER = "yungsmau";
const REPO_NAME = "StockFlow";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export function useUpdateCheck() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkForUpdates = async () => {
      if (!navigator.onLine) {
        console.log("Offline mode — skipping update check");
        setLoading(false);
        return;
      }

      const lastCheckStr = localStorage.getItem("lastUpdateCheck");
      const now = Date.now();

      if (lastCheckStr) {
        const lastCheck = parseInt(lastCheckStr, 10);
        if (now - lastCheck < CACHE_DURATION) {
          console.log("Using cached update info");
          const cached = localStorage.getItem("cachedUpdateInfo");
          if (cached) {
            try {
              setUpdate(JSON.parse(cached));
            } catch (e) {
              console.warn("Failed to parse cached update info", e);
            }
          }
          setLoading(false);
          return;
        }
      }

      try {
        const currentVersion = await getVersion();

        const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
        const response = await fetch(apiUrl, {
          headers: {
            "User-Agent": "StockFlow-App",
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `GitHub API error: ${response.status} ${response.statusText}`,
          );
        }

        const latestRelease = await response.json();

        if (!latestRelease?.tag_name) {
          throw new Error("No tag_name in release");
        }

        const latestVersion = latestRelease.tag_name.replace(/^v/, "");
        const isNewer = compareVersions(latestVersion, currentVersion) > 0;

        if (isNewer) {
          const isMajor = isMajorUpdate(currentVersion, latestVersion);
          const updateInfo: UpdateInfo = {
            currentVersion,
            newVersion: latestVersion,
            isMajorUpdate: isMajor,
            downloadUrl: latestRelease.html_url,
          };

          localStorage.setItem("lastUpdateCheck", now.toString());
          localStorage.setItem("cachedUpdateInfo", JSON.stringify(updateInfo));
          setUpdate(updateInfo);
        } else {
          localStorage.setItem("lastUpdateCheck", now.toString());
          localStorage.removeItem("cachedUpdateInfo");
        }
      } catch (error) {
        console.warn("Не удалось проверить обновления:", error);
      } finally {
        setLoading(false);
      }
    };

    checkForUpdates();
  }, []);

  return { update, loading };
}

function compareVersions(v1: string, v2: string): number {
  const normalize = (v: string) => {
    const parts = v.split(".").map(Number);
    while (parts.length < 3) parts.push(0);
    return parts;
  };

  const [a1, a2, a3] = normalize(v1);
  const [b1, b2, b3] = normalize(v2);

  if (a1 !== b1) return a1 > b1 ? 1 : -1;
  if (a2 !== b2) return a2 > b2 ? 1 : -1;
  if (a3 !== b3) return a3 > b3 ? 1 : -1;
  return 0;
}

function isMajorUpdate(current: string, next: string): boolean {
  const [currentMajor] = current.split(".").map(Number);
  const [nextMajor] = next.split(".").map(Number);
  return nextMajor > currentMajor;
}
