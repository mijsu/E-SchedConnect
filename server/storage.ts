// This application uses Firebase Firestore for data persistence.
// All data operations are handled directly through Firebase SDK in the frontend and backend.
// No local storage implementation is needed.

export interface IStorage {
  // Storage interface placeholder - all data operations use Firebase Firestore
}

export class MemStorage implements IStorage {
  constructor() {
    // No-op: Using Firebase Firestore
  }
}

export const storage = new MemStorage();
