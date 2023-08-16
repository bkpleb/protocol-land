import { Dialog, Transition } from '@headlessui/react'
import { yupResolver } from '@hookform/resolvers/yup'
import clsx from 'clsx'
import { Fragment } from 'react'
import { useForm } from 'react-hook-form'
import { AiFillCloseCircle } from 'react-icons/ai'
import * as yup from 'yup'

import { Button } from '@/components/common/buttons'
import { useGlobalStore } from '@/stores/globalStore'

import { createNewRepo, postNewRepo } from '../services/createRepo'

type NewRepoModalProps = {
  setIsOpen: (val: boolean) => void
  isOpen: boolean
}

const schema = yup
  .object({
    title: yup
      .string()
      .matches(/^[a-z]+(-[a-z]+)*$/, 'Invalid title format')
      .required('Title is required'),
    description: yup.string().required('Description is required')
  })
  .required()

export default function NewRepoModal({ setIsOpen, isOpen }: NewRepoModalProps) {
  const [userAddress] = useGlobalStore((state) => [state.auth.address])
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  })

  function closeModal() {
    setIsOpen(false)
  }

  async function handleCreateBtnClick(data: yup.InferType<typeof schema>) {
    const { title, description } = data

    const repoBlob = await createNewRepo(title)

    if (repoBlob) {
      const result = await postNewRepo({ title, description, file: repoBlob, owner: userAddress })
      console.log({ result })
    }
  }
  console.log({ errors })
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="w-full flex justify-between align-middle">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-liberty-dark-100">
                    Create a new Repository
                  </Dialog.Title>
                  <AiFillCloseCircle onClick={closeModal} className="h-6 w-6 text-liberty-dark-100 cursor-pointer" />
                </div>
                <div className="mt-2 flex flex-col gap-2.5">
                  <div>
                    <label htmlFor="title" className="block mb-1 text-md font-medium text-liberty-dark-100">
                      Title
                    </label>
                    <input
                      type="text"
                      {...register('title')}
                      className={clsx(
                        'bg-gray-50 border  text-liberty-dark-100 text-md rounded-lg focus:ring-liberty-dark-50 focus:border-liberty-dark-50 block w-full p-2.5',
                        errors.title ? 'border-red-500' : 'border-gray-300'
                      )}
                      placeholder="my-cool-repo"
                    />
                    {errors.title && <p className="text-red-500 text-sm italic mt-2">{errors.title?.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="description" className="block mb-1 text-md font-medium text-liberty-dark-100">
                      Description
                    </label>
                    <input
                      type="text"
                      {...register('description')}
                      className={clsx(
                        'bg-gray-50 border text-liberty-dark-100 text-md rounded-lg focus:ring-liberty-dark-50 focus:border-liberty-dark-50 block w-full p-2.5',
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      )}
                      placeholder="A really cool repo fully decentralized"
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm italic mt-2">{errors.description?.message}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    disabled={Object.keys(errors).length > 0}
                    className="rounded-md disabled:bg-opacity-[0.7]"
                    onClick={handleSubmit(handleCreateBtnClick)}
                    variant="solid"
                  >
                    Create
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}