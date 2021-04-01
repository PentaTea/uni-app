import { ProtocolOptions } from '../type'
export const API_UPX2PX = 'upx2px'
export const Upx2pxProtocol: ProtocolOptions<Number | String>[] = [
  {
    name: 'upx',
    type: [Number, String],
    required: true,
  },
]
