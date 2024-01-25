import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { Link } from 'react-router-dom'

import { shortenAddress } from '@/helpers/shortenAddress'
import { ActivityProps, IssueActivityType } from '@/types/explore'

import ActivityHeader from './ActivityHeader'

export default function IssueActivity({ activity, setIsForkModalOpen, setRepo }: ActivityProps<IssueActivityType>) {
  const issue = activity.issue!
  const isOpen = issue.status === 'OPEN'
  const commentsCount = issue.activities.filter((act) => act.type === 'COMMENT').length

  return (
    <div className="w-full flex justify-between items-start border border-primary-500 rounded-md p-4">
      <div className="flex w-full flex-col gap-1">
        <ActivityHeader activity={activity} setIsForkModalOpen={setIsForkModalOpen} setRepo={setRepo} />

        <Link
          to={`/repository/${activity.repo.id}/${issue?.id ? `issue/${issue.id}` : `issues`}`}
          className="text-base font-medium flex gap-2"
        >
          <span>{issue?.title ?? ''}</span>
          {issue?.id && <span className="text-gray-400">#{issue?.id}</span>}
        </Link>
        <div className="flex gap-3 flex-shrink-0 items-center text-sm justify-between">
          <div className="flex gap-1 items-center">
            <div className={clsx('h-2 w-2 rounded-full', isOpen ? 'bg-[#38a457]' : 'bg-purple-700')}></div>
            <div>
              Issue {isOpen ? <span>{activity.created ? 'opened ' : 'reopened '}</span> : <span>was closed</span>}
              <span>
                by{' '}
                <Link className="text-primary-600 hover:text-primary-700" to={`/user/${issue.author}`}>
                  {shortenAddress(issue.author)}{' '}
                </Link>
              </span>
              {isOpen && issue.timestamp && (
                <span>{formatDistanceToNow(new Date(issue.timestamp), { addSuffix: true })}</span>
              )}
              {!isOpen && issue.completedTimestamp && (
                <span>{formatDistanceToNow(new Date(issue.completedTimestamp), { addSuffix: true })}</span>
              )}
            </div>
          </div>
          <div>{commentsCount} Comments</div>
        </div>
      </div>
    </div>
  )
}