// src/db.ts
import Dexie, { type Table } from "dexie";
import type { League } from "../../../shared/models";

export class MySubClassedDexie extends Dexie {
  leagues!: Table<League, number>;

  constructor() {
    super("MyDatabase");
    this.version(1).stores({
      leagues: "++id, name, year"
    });
  }
}

export const db = new MySubClassedDexie();
