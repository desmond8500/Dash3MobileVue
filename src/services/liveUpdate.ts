/**
 * Mises à jour à chaud (OTA) du code web de l'appli.
 *
 * La GitHub Action .github/workflows/live-update.yml publie à chaque push sur
 * main une release "v<versionName>-<n>" avec dist.zip. Ici, au démarrage et à
 * chaque retour au premier plan, on regarde la dernière release :
 *  - si elle vise la même versionName que l'APK installé et qu'elle est
 *    différente du bundle courant, on la télécharge en tâche de fond ;
 *  - elle est appliquée dès que l'appli passe en arrière-plan.
 *
 * Si un bundle plante au démarrage (notifyAppReady non appelé), le plugin
 * revient tout seul au bundle précédent.
 */
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { CapacitorUpdater } from "@capgo/capacitor-updater";

const LATEST_RELEASE_URL = "https://api.github.com/repos/desmond8500/Dash3MobileVue/releases/latest";
const ASSET_NAME = "dist.zip";

let pendingBundleId: string | null = null;
let checking = false;

/** "v1.0-42" -> "1.0" (versionName de l'APK visé) */
function nativeVersionOf(tag: string): string | null {
  const m = /^v(.+)-\d+$/.exec(tag);
  return m ? m[1] : null;
}

async function checkForUpdate() {
  if (checking) return;
  checking = true;
  try {
    const res = await fetch(LATEST_RELEASE_URL, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) return;
    const release = await res.json();
    const tag: string = release.tag_name;
    const asset = (release.assets ?? []).find((a: any) => a.name === ASSET_NAME);
    if (!tag || !asset) return;

    const { bundle, native } = await CapacitorUpdater.current();
    if (bundle.version === tag) return; // déjà à jour
    if (nativeVersionOf(tag) !== native) return; // bundle prévu pour un autre APK

    // Déjà téléchargé lors d'une vérification précédente ?
    const { bundles } = await CapacitorUpdater.list();
    const existing = bundles.find((b) => b.version === tag && b.status === "success");
    const ready = existing ?? (await CapacitorUpdater.download({ url: asset.browser_download_url, version: tag }));

    pendingBundleId = ready.id;
  } catch (err) {
    console.warn("[liveUpdate] vérification impossible", err);
  } finally {
    checking = false;
  }
}

async function applyPendingUpdate() {
  if (!pendingBundleId) return;
  const id = pendingBundleId;
  pendingBundleId = null;
  try {
    await CapacitorUpdater.set({ id }); // recharge l'appli sur le nouveau bundle
  } catch (err) {
    console.warn("[liveUpdate] application impossible", err);
  }
}

export function initLiveUpdate() {
  if (!Capacitor.isNativePlatform()) return;

  // Indique que ce bundle démarre correctement (sinon retour arrière automatique).
  CapacitorUpdater.notifyAppReady();

  checkForUpdate();
  App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) checkForUpdate();
    else applyPendingUpdate();
  });
}
