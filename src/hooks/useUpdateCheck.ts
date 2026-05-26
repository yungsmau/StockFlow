import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { ask } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";

interface UpdateInfo {
  currentVersion: string;
  newVersion: string;
  isMajorUpdate: boolean;
  downloadUrl: string;
}

const REPO_OWNER = "yungsmau";
const REPO_NAME = "StockFlow";
const CACHE_DURATION = 12 * 60 * 60 * 1000;

export function useUpdateCheck() {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [readyToInstall, setReadyToInstall] = useState(false);
  const [installing, setInstalling] = useState(false);

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

        // ПРИОРИТЕТ 1: Tauri Updater
        try {
          const updaterUpdate = await check();

          if (updaterUpdate) {
            const isMajor = isMajorUpdate(
              currentVersion,
              updaterUpdate.version,
            );
            const updateInfo: UpdateInfo = {
              currentVersion,
              newVersion: updaterUpdate.version,
              isMajorUpdate: isMajor,
              downloadUrl: `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/v${updaterUpdate.version}`,
            };

            localStorage.setItem("lastUpdateCheck", now.toString());
            localStorage.setItem(
              "cachedUpdateInfo",
              JSON.stringify(updateInfo),
            );
            setUpdate(updateInfo);
            setLoading(false);
            return;
          }
        } catch (updaterError) {
          console.warn(
            "Tauri Updater check failed, falling back to GitHub API:",
            updaterError,
          );
        }

        // ПРИОРИТЕТ 2: GitHub API (fallback)
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

  // ШАГ 1: Скачать обновление (с прогрессом)
  const downloadUpdate = async () => {
    if (!update || downloading) return;

    setDownloading(true);
    setDownloadProgress(0);
    setReadyToInstall(false);

    try {
      const updaterUpdate: Update | null = await check();

      if (!updaterUpdate) {
        throw new Error("Обновление больше не доступно");
      }

      await updaterUpdate.download((event) => {
        if (event.event === "Started") {
          console.log(
            `Download started: ${event.data.contentLength ?? "unknown"} bytes`,
          );
        } else if (event.event === "Progress") {
          const contentLength = (event.data as any).contentLength;
          const chunkLength = event.data.chunkLength;

          if (contentLength && contentLength > 0) {
            const percent = Math.round((chunkLength / contentLength) * 100);
            setDownloadProgress(percent);
          } else {
            setDownloadProgress((prev) => Math.min(prev + 5, 95));
          }
        } else if (event.event === "Finished") {
          console.log("Download finished");
          setDownloadProgress(100);
        }
      });

      setReadyToInstall(true);
    } catch (error) {
      console.error("Failed to download update:", error);
      alert("Не удалось загрузить обновление. Попробуйте скачать вручную.");
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  // ШАГ 2: Подтверждение и установка
  const installUpdate = async () => {
    // ПРОВЕРКА: update и update.newVersion не должны быть null
    if (!readyToInstall || !update?.newVersion) {
      console.error("Update not ready or version is null");
      return;
    }

    const confirmed = await ask(
      `Обновление версии ${update.newVersion} загружено.\n\nПриложение перезапустится для установки. Продолжить?`,
      {
        title: "Готово к установке",
        kind: "info",
        okLabel: "Установить и перезапустить",
        cancelLabel: "Позже",
      },
    );

    if (!confirmed) {
      setReadyToInstall(false);
      setDownloading(false);
      setDownloadProgress(0);
      return;
    }

    setInstalling(true);

    try {
      const updaterUpdate: Update | null = await check();

      // ИСПРАВЛЕНО: проверяем на null вместо .available
      if (updaterUpdate) {
        await updaterUpdate.install();
        await relaunch();
      } else {
        throw new Error("Обновление больше не доступно");
      }
    } catch (error) {
      console.error("Failed to install update:", error);
      alert("Не удалось установить обновление. Попробуйте скачать вручную.");
      window.open(update.downloadUrl, "_blank");
    } finally {
      setInstalling(false);
    }
  };

  // Отмена загрузки/установки
  const cancelUpdate = () => {
    setDownloading(false);
    setReadyToInstall(false);
    setInstalling(false);
    setDownloadProgress(0);
  };

  // Fallback: открыть страницу загрузки в браузере
  const openDownloadPage = () => {
    if (update?.downloadUrl) {
      window.open(update.downloadUrl, "_blank");
    }
  };

  if (typeof window !== "undefined") {
    (window as any).testUpdate = () => {
      setUpdate({
        currentVersion: "0.1.4",
        newVersion: "1.1.5",
        isMajorUpdate: true,
        downloadUrl: "https://github.com/yungsmau/StockFlow/releases/latest",
      });
      console.log("[TEST] Обновление активировано! Открой уведомления.");
    };
  }

  return {
    update,
    loading,
    downloading,
    downloadProgress,
    readyToInstall,
    installing,
    downloadUpdate,
    installUpdate,
    cancelUpdate,
    openDownloadPage,
  };
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
