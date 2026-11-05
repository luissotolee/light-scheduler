export type Priority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  priority: Priority
  done: boolean
  createdAt: number
}

export interface NewTask {
  title: string
  priority: Priority
}
