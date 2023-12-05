import git, { Errors } from 'isomorphic-git'
import { InjectedArweaveSigner } from 'warp-contracts-plugin-signature'

import { CONTRACT_TX_ID } from '@/helpers/constants'
import getWarpContract from '@/helpers/getWrapContract'
import { trackGoogleAnalyticsEvent } from '@/helpers/google-analytics'
import { waitFor } from '@/helpers/waitFor'
import { withAsync } from '@/helpers/withAsync'
import { useGlobalStore } from '@/stores/globalStore'

import { postPRStatDataTxToArweave } from '../user'
import { postUpdatedRepo } from '.'
import { checkoutBranch, deleteBranch } from './branch'
import { FSType, fsWithName } from './helpers/fsWithName'

export async function compareBranches({
  baseFS,
  compareFS,
  baseDir,
  compareDir,
  baseBranch,
  compareBranch
}: CompareBranchesOptions) {
  const baseCommits = await git.log({ fs: baseFS, dir: baseDir, ref: baseBranch })
  const compareCommits = await git.log({ fs: compareFS, dir: compareDir, ref: compareBranch })

  const filteredCommits = compareCommits.filter((compareCommit) => {
    return !baseCommits.some((baseCommit) => baseCommit.oid === compareCommit.oid)
  })

  return filteredCommits
}

export async function postNewPullRequest({
  title,
  description,
  baseBranch,
  compareBranch,
  repoId,
  baseRepo,
  compareRepo
}: PostNewPROptions) {
  const address = useGlobalStore.getState().authState.address

  const baseFS = fsWithName(baseRepo.repoId)
  const baseDir = `/${baseRepo.repoName}`

  const oid = await git.resolveRef({ fs: baseFS, dir: baseDir, ref: baseBranch })

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
      compareBranch,
      baseBranchOid: oid,
      baseRepo,
      compareRepo
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

  if (!PR || !PR.id) return

  if (address) {
    await postPRStatDataTxToArweave(address, baseRepo.repoName, PR)
  }

  trackGoogleAnalyticsEvent('Repository', 'Successfully create a new PR', 'Create PR', {
    repo_name: baseRepo.repoName,
    repo_id: repoId,
    pr_id: PR.id,
    pr_title: PR.title
  })

  return PR
}

export async function getStatusMatrixOfTwoBranches({ base, compare, fs, dir }: GetStatusMatrixOfTwoBranchesOptions) {
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

export async function mergePullRequest({
  fs,
  dir,
  base,
  compare,
  author,
  dryRun,
  repoId,
  prId,
  fork
}: MergePullRequestOptions) {
  const { error } = await withAsync(() =>
    git.merge({
      fs,
      dir,
      ours: base,
      theirs: compare,
      abortOnConflict: true,
      dryRun,
      author: {
        email: author,
        name: author
      }
    })
  )

  await waitFor(500)

  if (error instanceof Errors.MergeNotSupportedError) {
    //
    console.log(
      'Automatic merge failed for the following files: ' +
        `${error.data}. ` +
        'Resolve these conflicts and then commit your changes.'
    )
  }

  if (!error) {
    if (fork) {
      await deleteBranch({ fs, dir, name: compare })
    }
    await postUpdatedRepo({ fs, dir, owner: author, id: repoId })

    await waitFor(1000)

    const userSigner = new InjectedArweaveSigner(window.arweaveWallet)
    await userSigner.setPublicKey()

    const contract = getWarpContract(CONTRACT_TX_ID, userSigner)

    await contract.writeInteraction({
      function: 'updatePullRequestStatus',
      payload: {
        repoId,
        prId,
        status: 'MERGED'
      }
    })
  } else {
    throw error
  }
}

export async function closePullRequest({ repoId, prId }: { repoId: string; prId: number }) {
  const userSigner = new InjectedArweaveSigner(window.arweaveWallet)
  await userSigner.setPublicKey()

  const contract = getWarpContract(CONTRACT_TX_ID, userSigner)

  await contract.writeInteraction({
    function: 'updatePullRequestStatus',
    payload: {
      repoId,
      prId,
      status: 'CLOSED'
    }
  })
}

export async function addReviewersToPR({ reviewers, repoId, prId }: AddReviewersToPROptions) {
  const userSigner = new InjectedArweaveSigner(window.arweaveWallet)
  await userSigner.setPublicKey()

  const contract = getWarpContract(CONTRACT_TX_ID, userSigner)

  await contract.writeInteraction({
    function: 'addReviewersToPR',
    payload: {
      repoId,
      prId,
      reviewers
    }
  })
}

export async function approvePR({ repoId, prId }: ApprovePROptions) {
  const userSigner = new InjectedArweaveSigner(window.arweaveWallet)
  await userSigner.setPublicKey()

  const contract = getWarpContract(CONTRACT_TX_ID, userSigner)

  await contract.writeInteraction({
    function: 'approvePR',
    payload: {
      repoId,
      prId
    }
  })
}

type ApprovePROptions = {
  repoId: string
  prId: number
}

type AddReviewersToPROptions = {
  reviewers: string[]
  repoId: string
  prId: number
}

type PostNewPROptions = {
  baseRepo: PRSide
  compareRepo: PRSide
  title: string
  description: string
  baseBranch: string
  compareBranch: string
  repoId: string
}

type PRSide = {
  repoName: string
  repoId: string
}

type CompareBranchesOptions = {
  baseFS: FSType
  compareFS: FSType
  baseDir: string
  compareDir: string
  baseBranch: string
  compareBranch: string
}

type ReadFileFromRefOptions = {
  fs: FSType
  dir: string
  ref: string
  filePath: string
}

type MergePullRequestOptions = {
  fs: FSType
  dir: string
  base: string
  compare: string
  author: string
  dryRun?: boolean
  repoId: string
  prId: number
  fork: boolean
}

type GetStatusMatrixOfTwoBranchesOptions = {
  fs: FSType
  dir: string
  base: string
  compare: string
}
