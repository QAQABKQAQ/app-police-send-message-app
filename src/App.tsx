import "./App.css";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
  PermissionState,
} from "@tauri-apps/plugin-notification";

function App() {
  async function sendNotificationTest() {
    // when using `"withGlobalTauri": true`, you may use
    // const { isPermissionGranted, requestPermission, sendNotification, } = window.__TAURI__.notification;

    // Do you have permission to send a notification?
    let permissionGranted = await isPermissionGranted();

    // If not we need to request it
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }
    /*  */
    // Once permission has been granted we can send the notification
    if (permissionGranted) {
      sendNotification({ title: "Tauri", body: "Tauri is awesome!" });
    }
  }

  return (
    <main className="pt-10">
      <header className="h-20 shadow-sm flex items-center px-4">
        <h1 className="text-2xl font-bold">Home</h1>
      </header>
      <div data-id="content" className="h-full px-4 pt-2">
        Hello this is test tauri 2.0 android demo
        <button onClick={sendNotificationTest}>test send notification</button>
      </div>
    </main>
  );
}

export default App;
