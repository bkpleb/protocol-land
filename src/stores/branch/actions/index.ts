import { checkoutBranch, createNewBranch, getAllBranches, getCurrentBranch } from '@/lib/git/branch'
import { fsWithName } from '@/lib/git/helpers/fsWithName'

export async function getBranchList(id: string) {
  const fs = fsWithName(id)
  const dir = `/${id}`

  return getAllBranches({ fs, dir })
}

export async function getCurrentActiveBranch(id: string) {
  const fs = fsWithName(id)
  const dir = `/${id}`

  return getCurrentBranch({ fs, dir })
}

export async function addNewBranch(id: string, branchName: string) {
  const fs = fsWithName(id)
  const dir = `/${id}`

  return createNewBranch({
    fs,
    dir,
    name: branchName
  })
}

export async function changeBranch(id: string, branchName: string) {
  const fs = fsWithName(id)
  const dir = `/${id}`

  return checkoutBranch({ fs, dir, name: branchName })
}
