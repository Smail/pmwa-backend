export interface ISerializable {
  serializeToObject(): Object;

  deserializeFromObject(serialized: Object): void;

  // This is used internally by JSON.stringify TODO
  // toJSON(): {};
}

export function deserialize<T extends ISerializable>(TCreator: new() => T, serializedObject: Object): T {
  const o = new TCreator();
  o.deserializeFromObject(serializedObject);
  return o;
}
