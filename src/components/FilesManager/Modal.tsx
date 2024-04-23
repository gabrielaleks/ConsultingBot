import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { X, Trash2, Loader, SquarePen } from 'lucide-react'

interface Props {
  setOpenModal: Dispatch<SetStateAction<boolean>>
  open: boolean
}

interface File {
  text: string;
  embedding: number[];
}

interface FileEntry {
  [key: string]: File[]
}

interface Files {
  [key: string]: FileEntry;
}

async function deleteFile(fileId: string) {
  try {
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Error during deletion: ${errorMessage}`);
    }
  } catch (error) {
    throw new Error(`Error during deletion: ${error}`);
  }
}

const Modal = ({ setOpenModal, open }: Props) => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [deletingFileIds, setDeletingFileIds] = useState<string[]>([]);
  const [files, setFiles] = useState<Files>({})

  useEffect(() => {
    setIsLoading(true)
    fetch('/api/files')
      .then((res) => res.json())
      .then((data) => {
        const dataFiles: Files = data.files
        setFiles(dataFiles)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching files:', error);
        setIsLoading(false)
      });
  }, [])

  // Handle alternate ways to close the modal
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (open && !(event.target as HTMLElement).closest('.modal-container')) {
        setOpenModal(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (open && event.key === 'Escape') {
        setOpenModal(false);
      }
    };

    document.body.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.body.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [setOpenModal, open]);

  const handleDeleteButton = async (fileId: string) => {
    setDeletingFileIds(prevState => [...prevState, fileId])
    try {
      await deleteFile(fileId)
    
      const updatedFiles = { ...files }
      delete updatedFiles[fileId]
      setFiles(updatedFiles)
    } catch (error) {
      throw new Error(`Error: ${error}`)
    } finally {
      setDeletingFileIds(prevState => prevState.filter(id => id !== fileId))
    }
  }

  return (
    <div className={`
      modal-background fixed inset-0 flex justify-center items-center transition-colors
      ${open ? "visible bg-black/20" : "invisible"}
    `}>
      <div
        className="modal-container"
      >
        <div className={`
          bg-gray-800 rounded-md shadow p-8 transition-all
          ${open ? "scale-100 opacity-100" : "scale-125 opacity-0"}
        `}
        >
          <X size={20} className="absolute top-2 right-0 w-10 cursor-pointer" onClick={() => setOpenModal(false)} />
          <div className='modal-title text-center font-bold text-2xl mb-6'>Files Manager</div>
          {isLoading ?
            <div className="flex justify-center">
              <Loader className="animate-spin" />
            </div> : (
              Object.keys(files).length > 0 ? (
                <div className='overflow-auto max-h-[600px]'>
                  <table className="w-full border-collapse border">
                    <thead>
                      <tr>
                        <th className="text-left border border-gray-400 px-4 py-2">File Name</th>
                        <th className="text-left border border-gray-400 px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(files).map(fileKey => (
                        Object.keys(files[fileKey] || {}).map((fileName) => (
                          <tr key={fileKey}>
                            <td className="border border-gray-400 px-4 py-2">{fileName}</td>
                            <td className="space-x-2 border border-gray-400 px-4 py-2">
                              <button
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-2 rounded"
                                onClick={() => handleDeleteButton(fileKey)}
                                disabled={deletingFileIds.includes(fileKey)}
                              >
                                {deletingFileIds.includes(fileKey) ? <Loader size={15} className='animate-spin' /> : <Trash2 size={15} />}
                              </button>
                              <button
                                className="bg-blue-500 text-white font-bold py-2 px-2 rounded disabled:opacity-50" disabled
                              >
                                <SquarePen size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : 'No file available!'
            )}
        </div>
      </div>
    </div>
  )
}

export default Modal
