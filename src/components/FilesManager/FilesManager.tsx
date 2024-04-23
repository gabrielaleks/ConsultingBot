import { useState } from 'react'
import { FolderCog } from 'lucide-react'
import Modal from './Modal'

const FilesManager = () => {
  const [openModal, setOpenModal] = useState(false);

  return (
    <div className='flex items-center'>
      <FolderCog
        className='cursor-pointer'
        size={20}
        onClick={() => { setOpenModal(true) }}
      />
      {openModal && <Modal open={openModal} setOpenModal={setOpenModal} />}
    </div>
  )
}

export default FilesManager
