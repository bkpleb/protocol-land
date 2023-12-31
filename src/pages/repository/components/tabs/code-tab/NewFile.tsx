import { langs } from '@uiw/codemirror-extensions-langs'
import { githubLight } from '@uiw/codemirror-theme-github'
import CodeMirror from '@uiw/react-codemirror'
import MDEditor from '@uiw/react-md-editor'
import clsx from 'clsx'
import mime from 'mime'
import React, { useMemo } from 'react'
import { FileWithPath } from 'react-dropzone'
import toast from 'react-hot-toast'
import { FiArrowLeft } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/common/buttons'
import { rootTabConfig } from '@/pages/repository/config/rootTabConfig'
import { isMarkdown } from '@/pages/repository/helpers/filenameHelper'
import { useGlobalStore } from '@/stores/globalStore'

import CommitFilesModal from './CommitFilesModal'

export default function NewFile() {
  const [fileContent, setFileContent] = React.useState('')
  const [filename, setFilename] = React.useState('')
  const [files, setFiles] = React.useState<FileWithPath[]>([])
  const [isCommitModalOpen, setIsCommitModalOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isFileCommited, setIsFileCommitted] = React.useState(false)

  const isMarkdownFile = useMemo(() => isMarkdown(filename), [filename])

  const [isContributor, git, gitActions, loadFilesFromRepo, getCurrentFolderPath, currentBranch, selectedRepo] =
    useGlobalStore((state) => [
      state.repoCoreActions.isContributor,
      state.repoCoreState.git,
      state.repoCoreActions.git,
      state.repoCoreActions.loadFilesFromRepo,
      state.repoCoreActions.git.getCurrentFolderPath,
      state.branchState.currentBranch,
      state.repoCoreState.selectedRepo.repo
    ])

  const filePath = useMemo(() => joinPaths(getCurrentFolderPath(), filename), [filename])
  const navigate = useNavigate()
  const contributor = isContributor()

  React.useEffect(() => {
    if (isFileCommited) {
      onGoBackClick()
      loadFilesFromRepo()
    }
  }, [isFileCommited])

  async function onGoBackClick() {
    setFileContent('')
    setFilename('')
    setIsSubmitting(false)
    setIsFileCommitted(false)
    gitActions.setIsCreateNewFile(false)
  }

  async function handleCommitChangesClick() {
    if (git.fileObjects.findIndex((fileObject) => fileObject.path === filename) > -1) {
      toast.error(`File ${filename} already exists in the same directory`)
      return
    }
    const mimeType = mime.getType(filePath) ?? 'text/plain'
    const blob = new Blob([fileContent], { type: mimeType })
    const file = new File([blob], filename, { type: mimeType })
    Object.defineProperty(file, 'path', { value: filePath })
    setFiles([file])
    setIsCommitModalOpen(true)
  }

  function getBasePath() {
    const prefix = getCurrentFolderPath()
    return prefix ? `${prefix}/` : ''
  }

  function joinPaths(...paths: string[]) {
    return '/' + paths.join('/').split('/').filter(Boolean).join('/')
  }

  function gotoBranch() {
    if (selectedRepo) {
      navigate(rootTabConfig[0].getPath(selectedRepo?.id, currentBranch))
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full h-full">
      <div className="flex w-full justify-between h-10">
        <div className="flex gap-3">
          <Button onClick={onGoBackClick} className="gap-2 font-medium" variant="primary-outline">
            <FiArrowLeft className="w-5 h-5 text-[inherit]" /> Go back
          </Button>
          <div className="flex items-center gap-1">
            <span>{getBasePath()}</span>
            <input
              type="text"
              placeholder="Name your file..."
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="bg-white border-[1px] text-gray-900 text-base rounded-lg hover:shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] focus:border-primary-500 focus:border-[1.5px] block w-full px-3 py-1 outline-none border-gray-300"
            />
            <span>in</span>{' '}
            <span
              onClick={gotoBranch}
              className="bg-primary-200 px-1 rounded-md text-primary-700 hover:underline cursor-pointer"
            >
              {currentBranch}
            </span>
          </div>
        </div>
        {contributor && (
          <div className="flex gap-2">
            <Button onClick={onGoBackClick} variant="primary-outline">
              Cancel changes
            </Button>
            <Button
              isLoading={isSubmitting}
              onClick={handleCommitChangesClick}
              variant="primary-solid"
              disabled={!filename}
            >
              Commit changes
            </Button>
            <CommitFilesModal
              setIsCommited={setIsFileCommitted}
              setIsOpen={setIsCommitModalOpen}
              isOpen={isCommitModalOpen}
              files={files}
            />
          </div>
        )}
      </div>
      <div className="flex w-full h-full mb-4">
        <div className="w-full flex flex-col border-gray-300 border-[1px] rounded-lg bg-white overflow-hidden">
          <div className="rounded-t-lg flex justify-between bg-gray-200 border-b-[1px] border-gray-300 items-center gap-2 py-2 px-4 text-gray-900 font-medium h-10">
            <span className={clsx(!filename && 'py-10')}>{filename}</span>
          </div>
          {isMarkdownFile ? (
            <MDEditor minHeight={200} preview="edit" value={fileContent} onChange={(value) => setFileContent(value)} />
          ) : (
            <CodeMirror
              className="min-h-[100%] w-full"
              value={fileContent}
              minHeight="200px"
              height="100%"
              theme={githubLight}
              extensions={[langs.javascript({ jsx: true })]}
              onChange={(value) => setFileContent(value)}
              editable={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}
