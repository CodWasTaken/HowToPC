export const ONBOARDING_STORAGE_KEY="howtopc:onboarding:v1";

interface StorageReader {
  getItem(key:string):string|null;
}

interface StorageWriter {
  setItem(key:string,value:string):void;
}

export function shouldShowOnboarding(storage:StorageReader):boolean {
  return storage.getItem(ONBOARDING_STORAGE_KEY)!=="seen";
}

export function markOnboardingSeen(storage:StorageWriter):void {
  storage.setItem(ONBOARDING_STORAGE_KEY,"seen");
}
