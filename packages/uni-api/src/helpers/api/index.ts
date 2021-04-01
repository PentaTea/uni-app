import { isPlainObject } from '@vue/shared'
import { ApiOptions, ApiProtocols } from '../../protocols/type'
import { API_TYPE_ON_PROTOCOLS, validateProtocols } from '../protocol'
import {
  invokeCallback,
  createAsyncApiCallback,
  createKeepAliveApiCallback,
} from './callback'
import { promisify } from './promise'

export const API_TYPE_ON = 0
export const API_TYPE_TASK = 1
export const API_TYPE_SYNC = 2
export const API_TYPE_ASYNC = 3

type API_TYPES =
  | typeof API_TYPE_ON
  | typeof API_TYPE_TASK
  | typeof API_TYPE_SYNC
  | typeof API_TYPE_ASYNC

function formatApiArgs(args: any[], options?: ApiOptions) {
  const params = args[0]
  if (
    !options ||
    (!isPlainObject(options.formatArgs) && isPlainObject(params))
  ) {
    return args
  }
  const formatArgs = options.formatArgs!
  Object.keys(formatArgs).forEach((name) => {
    formatArgs[name](args[0][name], params)
  })
  return args
}

function wrapperOnApi(name: string, fn: Function) {
  return (callback: Function) =>
    fn.apply(null, createKeepAliveApiCallback(name, callback))
}

function wrapperTaskApi(name: string, fn: Function, options?: ApiOptions) {
  return (args: Record<string, any>) =>
    fn.apply(null, [args, createAsyncApiCallback(name, args, options)])
}

function wrapperSyncApi(fn: Function) {
  return (...args: any[]) => fn.apply(null, args)
}

function wrapperAsyncApi(name: string, fn: Function, options?: ApiOptions) {
  return (args: Record<string, any>) => {
    const callbackId = createAsyncApiCallback(name, args, options)
    const res = fn.apply(null, [
      args,
      (res: unknown) => {
        invokeCallback(callbackId, res)
      },
    ])
    if (res) {
      invokeCallback(callbackId, res)
    }
  }
}

function wrapperApi<T extends Function>(
  fn: Function,
  name?: string,
  protocol?: ApiProtocols,
  options?: ApiOptions
) {
  return (function (...args: any[]) {
    if (__DEV__) {
      const errMsg = validateProtocols(name!, args, protocol)
      if (errMsg) {
        return errMsg
      }
    }
    return fn.apply(null, formatApiArgs(args, options))
  } as unknown) as T
}

export function defineOnApi<T extends Function>(
  name: string,
  fn: T,
  options?: ApiOptions
) {
  return defineApi(
    API_TYPE_ON,
    name,
    fn,
    __DEV__ ? API_TYPE_ON_PROTOCOLS : undefined,
    options
  )
}

export function defineTaskApi<T extends Function>(
  name: string,
  fn: T,
  protocol?: ApiProtocols,
  options?: ApiOptions
) {
  return defineApi(
    API_TYPE_TASK,
    name,
    fn,
    __DEV__ ? protocol : undefined,
    options
  )
}

export function defineSyncApi<T extends Function>(
  name: string,
  fn: T,
  protocol?: ApiProtocols,
  options?: ApiOptions
) {
  return defineApi(
    API_TYPE_SYNC,
    name,
    fn,
    __DEV__ ? protocol : undefined,
    options
  )
}

export function defineAsyncApi<T extends Function>(
  name: string,
  fn: T,
  protocol?: ApiProtocols,
  options?: ApiOptions
) {
  return promisify(
    defineApi(API_TYPE_ASYNC, name, fn, __DEV__ ? protocol : undefined, options)
  )
}

function defineApi<T extends Function>(
  type: API_TYPES,
  name: string,
  fn: T,
  protocol?: ApiProtocols,
  options?: ApiOptions
) {
  switch (type) {
    case API_TYPE_ON:
      return wrapperApi<T>(wrapperOnApi(name, fn), name, protocol, options)
    case API_TYPE_TASK:
      return wrapperApi<T>(wrapperTaskApi(name, fn), name, protocol, options)
    case API_TYPE_SYNC:
      return wrapperApi<T>(wrapperSyncApi(fn), name, protocol, options)
    case API_TYPE_ASYNC:
      return wrapperApi<T>(
        wrapperAsyncApi(name, fn, options),
        name,
        protocol,
        options
      )
  }
}
