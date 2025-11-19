import { Button, Group, Loader, Modal, Stack } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { showNotification } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { JSX } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import type { Flag } from './Flag'
import { FlagForm } from './FlagForm'

/**
 * @returns component for the page to edit a flag
 */
export function EditFlagPage() {
  const params = useParams()
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const flagKey = params.key!
  const { isPending, isError, data: flag } = useQuery({
    queryKey: ['flags', 'get', flagKey],
    queryFn: async () => {
      const response = await fetch(`/api/flags/${encodeURIComponent(flagKey)}`)
      if (response.status === 404) {
        return null
      } else if (!response.ok) {
        throw new Error(await response.text())
      } else {
        return await response.json() as Flag
      }
    },
  })

  let content: JSX.Element
  if (isPending) {
    content = <Loader role="progressbar" />
  } else if (isError) {
    content = <div>An error occurred when fetching the flag</div>
  } else if (flag === null) {
    content = <div>Flag not found</div>
  } else {
    content = (
      <Stack>
        <FlagForm flag={flag} />
        <DeleteButton flag={flag} />
      </Stack>
    )
  }

  return (
    <div>
      <h2>
        <Link to="/flags">Flags</Link>
        &nbsp;/&nbsp;
        {flagKey}
      </h2>
      {content}
    </div>
  )
}

function DeleteButton({ flag }: { flag: Flag }) {
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/flags/${encodeURIComponent(flag.key)}`,
        { method: 'DELETE' },
      )
      if (!response.ok) {
        throw new Error(await response.text())
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['flags', 'get', flag.key],
        refetchType: 'none',
      })
      await queryClient.invalidateQueries({ queryKey: ['flags', 'list'] })
      showNotification({ message: `Flag deleted: ${flag.key}` })
      await navigate('/flags')
    },
    onError: () => {
      showNotification({ color: 'red', message: 'An error occurred when deleting the flag' })
    },
  })

  return (
    <>
      <Modal opened={modalOpened} onClose={closeModal} centered>
        <Stack>
          <div>Are you sure you want to delete this flag?</div>
          <Group justify="end">
            <Button onClick={closeModal}>No</Button>
            <Button
              onClick={() => { deleteMutation.mutate() }}
              loading={deleteMutation.isPending}
              color="red"
            >
              Yes
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Button onClick={openModal} color="red" w="6em">Delete</Button>
    </>
  )
}
