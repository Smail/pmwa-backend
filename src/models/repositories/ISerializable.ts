export interface ISerializable {
  serializeToObject(): object;

  deserializeFromObject(serialized: object): void;

  // This is used internally by JSON.stringify TODO
  // toJSON(): {};
}

export function deserialize<T extends ISerializable>(TCreator: new() => T, serializedObject: object): T {
  const o = new TCreator();
  o.deserializeFromObject(serializedObject);
  return o;
}
