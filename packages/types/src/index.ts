export type MetaType = {
  page: number
  limit: number
  total: number
}

export type ResponseType<T> = {
  success: boolean
  message: string
  data: T
}

export type ArrayResponseType<T> = {
  success: boolean
  message: string
  data: T[]
  meta: MetaType
}
