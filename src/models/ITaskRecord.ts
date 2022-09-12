export interface ITaskRecord {
  taskId: string,
  name: string,
  content: string | null,
  isDone: boolean,
  startDate: Date | null;
  endDate: Date | null;
}
