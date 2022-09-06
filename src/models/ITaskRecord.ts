export interface ITaskRecord {
  taskId: string,
  userId: string,
  name: string,
  content: string | null,
  isDone: boolean,
}
