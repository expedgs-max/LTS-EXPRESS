declare global {
  interface Window {
    google?: any;
    initGoogleMaps?: () => void;
    initGoogleMapPickerCallback?: () => void;
  }
}

export {};
