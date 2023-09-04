import git from 'isomorphic-git'
import { InjectedArweaveSigner } from 'warp-contracts-plugin-signature'

import { CONTRACT_TX_ID } from '@/helpers/constants'
import getWarpContract from '@/helpers/getWrapContract'

import { checkoutBranch } from './branch'
import { FSType } from './helpers/fsWithName'

export async function compareBranches({ fs, dir, base, compare }: CompareBranchesOptions) {
  const baseCommits = await git.log({ fs, dir, ref: base })
  const compareCommits = await git.log({ fs, dir, ref: compare })

  const filteredCommits = compareCommits.filter((compareCommit) => {
    return !baseCommits.some((baseCommit) => baseCommit.oid === compareCommit.oid)
  })

  return filteredCommits
}

export async function postNewPullRequest({ title, description, baseBranch, compareBranch, repoId }: PostNewPROptions) {
  const userSigner = new InjectedArweaveSigner(window.arweaveWallet)
  await userSigner.setPublicKey()

  const contract = getWarpContract(CONTRACT_TX_ID, userSigner)

  await contract.writeInteraction({
    function: 'createPullRequest',
    payload: {
      title,
      description,
      repoId,
      baseBranch,
      compareBranch
    }
  })

  const {
    cachedValue: {
      state: { repos }
    }
  } = await contract.readState()

  const repo = repos[repoId]

  if (!repo) return

  const PRs = repo.pullRequests
  const PR = PRs[PRs.length - 1]

  if (!PR) return

  return PR
}

export async function getStatusMatrixOfTwoBranches({ base, compare, fs, dir }: CompareBranchesOptions) {
  const currentBranch = await git.currentBranch({ fs, dir, fullname: false })

  if (currentBranch !== compare) {
    await checkoutBranch({ fs, dir, name: compare })
  }

  const status = await git.statusMatrix({
    fs,
    dir,
    ref: base
  })

  return status.filter((row) => {
    const headStatus = row[1]
    const workDirStatus = row[2]
    const stageStatus = row[3]

    const unmodified = headStatus === 1 && workDirStatus === 1 && stageStatus === 1

    return !unmodified
  })
}

export async function readFileFromRef({ ref, fs, dir, filePath }: ReadFileFromRefOptions) {
  const commitOid = await git.resolveRef({ fs, dir, ref })

  const { blob } = await git.readBlob({
    fs,
    dir,
    oid: commitOid,
    filepath: filePath
  })

  return Buffer.from(blob).toString('utf8')
}

type PostNewPROptions = {
  title: string
  description: string
  baseBranch: string
  compareBranch: string
  repoId: string
}

type CompareBranchesOptions = {
  fs: FSType
  dir: string
  base: string
  compare: string
}

type ReadFileFromRefOptions = {
  fs: FSType
  dir: string
  ref: string
  filePath: string
}
