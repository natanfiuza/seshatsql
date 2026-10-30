import { contextBridge } from 'electron'

import { PRODUCT_NAME } from '../domain/app-info'
import type { SeshatApi } from './api'

const api: SeshatApi = Object.freeze({ productName: PRODUCT_NAME })

contextBridge.exposeInMainWorld('seshat', api)
