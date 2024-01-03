import { WarpFactory } from 'warp-contracts/web'
import { DeployPlugin } from 'warp-contracts-plugin-deploy'

const warp = WarpFactory.forMainnet().use(new DeployPlugin())

export default function getWarpContract(contractTxId: string, signer?: any) {
  if (signer) {
    return warp.contract(contractTxId).connect(signer)
  }

  return warp.contract(contractTxId)
}
