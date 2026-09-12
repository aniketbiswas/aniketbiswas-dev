import { defaultPlan, validatePlan } from "./plan.js";

const MAX_BYTES = 500_000;
const STORAGE_WARNING = "Browser storage is unavailable. No saved device data can be accessed; you can continue temporarily without saving on this device.";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function checkSize(text) {
  if (new TextEncoder().encode(text).byteLength > MAX_BYTES) {
    throw new Error("Calculator data must not exceed 500 KB.");
  }
}

function snapshot(plan) {
  validatePlan(plan);
  let text;
  try {
    text = JSON.stringify(plan);
  } catch (cause) {
    throw new Error("This plan cannot be serialized for saving.", { cause });
  }
  checkSize(text);
  const result = JSON.parse(text);
  validatePlan(result);
  return result;
}

function conflict() {
  return Object.assign(new Error("This calculator's data has changed. Reload before saving or changing whether it is remembered."), { status: 409 });
}

function freshRecord() {
  return { revision: 0, plan: defaultPlan() };
}

function nextRecord(revision, plan) {
  if (!Number.isSafeInteger(revision + 1)) {
    throw new Error("The calculator revision limit has been reached. Clear saved data explicitly to start again.");
  }
  const record = { revision: revision + 1, plan };
  checkSize(JSON.stringify(record));
  return record;
}

function newGeneration() {
  return globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function parseStored(text) {
  try {
    checkSize(text);
    const value = JSON.parse(text);
    if (!value || Array.isArray(value) || !Number.isSafeInteger(value.revision) || value.revision < 0) {
      throw new Error("The saved revision must be a non-negative safe integer.");
    }
    validatePlan(value.plan);
    if (value.generation !== undefined &&
        (typeof value.generation !== "string" || !value.generation || value.generation.length > 160)) {
      throw new Error("The saved generation is invalid.");
    }
    return {
      record: { revision: value.revision, plan: value.plan },
      generation: value.generation ?? null,
    };
  } catch (cause) {
    throw new Error("Saved calculator data is malformed or invalid. Clear saved data explicitly to start again.", { cause });
  }
}

export function createBrowserStore({
  key = "home-loan-lab:v1",
  getStorage = () => globalThis.localStorage,
  withLock = async (fn) => fn(),
} = {}) {
  let memory = freshRecord();
  let persistent = false;
  let storageAvailable = true;
  let warning = null;
  let accessFailure = null;
  let remembered = null;
  let queue = Promise.resolve();

  function transaction(action) {
    const result = queue.then(() => withLock(action));
    queue = result.then(() => undefined, () => undefined);
    return result;
  }

  function storageError(action, cause) {
    if (cause?.name === "SecurityError") {
      storageAvailable = false;
      warning = STORAGE_WARNING;
      accessFailure = cause;
    }
    return new Error(`Unable to ${action} this calculator's saved device data.${cause?.name === "SecurityError" ? ` ${STORAGE_WARNING}` : ""}`, { cause });
  }

  function unavailable() {
    return new Error(STORAGE_WARNING, { cause: accessFailure });
  }

  function accessible() {
    storageAvailable = true;
    warning = null;
    accessFailure = null;
  }

  function readDevice(allowUnavailable = false) {
    let storage;
    let text;
    try {
      storage = getStorage();
      text = storage.getItem(key);
    } catch (cause) {
      const error = storageError("access", cause);
      if (allowUnavailable && cause?.name === "SecurityError") return null;
      throw error;
    }
    accessible();
    return { storage, saved: text === null ? null : parseStored(text) };
  }

  function checkRevision(revision) {
    if (revision !== memory.revision) throw conflict();
  }

  function checkRemembered(saved, revision) {
    if (!saved || saved.record.revision !== revision ||
        saved.generation !== remembered?.generation ||
        JSON.stringify(saved.record) !== JSON.stringify(remembered?.record)) {
      throw conflict();
    }
  }

  function writeDevice(storage, record, generation) {
    const text = JSON.stringify({ ...record, generation });
    checkSize(text);
    try {
      storage.setItem(key, text);
    } catch (cause) {
      throw storageError("save", cause);
    }
    accessible();
    memory = record;
    remembered = { record, generation };
    persistent = true;
    return clone(memory);
  }

  function removeDevice(storage) {
    try {
      storage.removeItem(key);
    } catch (cause) {
      throw storageError("remove", cause);
    }
    accessible();
  }

  function saveSnapshot(revision, plan) {
    checkRevision(revision);
    const record = nextRecord(revision, plan);
    if (!persistent) {
      memory = record;
      return clone(memory);
    }
    const { storage, saved } = readDevice();
    checkRemembered(saved, revision);
    return writeDevice(storage, record, saved.generation ?? newGeneration());
  }

  return {
    get persistent() { return persistent; },
    get storageAvailable() { return storageAvailable; },
    get warning() { return warning; },

    async load() {
      return transaction(() => {
        const device = readDevice(true);
        if (!device) {
          persistent = false;
        } else if (device.saved) {
          memory = device.saved.record;
          remembered = device.saved;
          persistent = true;
        } else {
          if (remembered) memory = freshRecord();
          remembered = null;
          persistent = false;
        }
        return clone(memory);
      });
    },

    async save(revision, plan) {
      const currentPlan = snapshot(plan);
      return transaction(() => saveSnapshot(revision, currentPlan));
    },

    async setRemember(enabled, revision, plan) {
      if (typeof enabled !== "boolean") throw new TypeError("Remember must be enabled or disabled.");
      const currentPlan = snapshot(plan);
      return transaction(() => {
        if (enabled === persistent) return saveSnapshot(revision, currentPlan);
        checkRevision(revision);
        if (!storageAvailable) throw unavailable();
        const record = nextRecord(revision, currentPlan);
        const { storage, saved } = readDevice();
        if (enabled) {
          if (saved) throw conflict();
          // A new generation prevents old tabs reviving data after clear and re-opt-in.
          return writeDevice(storage, record, newGeneration());
        }
        checkRemembered(saved, revision);
        removeDevice(storage);
        memory = record;
        remembered = null;
        persistent = false;
        return clone(memory);
      });
    },

    async clear() {
      return transaction(() => {
        if (!storageAvailable) throw unavailable();
        let storage;
        try {
          storage = getStorage();
        } catch (cause) {
          throw storageError("remove", cause);
        }
        removeDevice(storage);
        memory = freshRecord();
        remembered = null;
        persistent = false;
        return clone(memory);
      });
    },
  };
}
