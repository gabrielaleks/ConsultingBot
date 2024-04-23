'use client'

import {useCompletion} from 'ai/react'
import {Trash} from 'lucide-react'
import {ChangeEvent, FormEvent, useEffect, useState} from 'react'

import Chat from '@/components/Chat'
import {Separator} from '@/components/ui/separator'
import {useFile, useMessages} from '@/lib/store'

async function uploadFile(file: File) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch('/api/ai/embed', {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      console.log('Embedding successful: ' + file.name)
    } else {
      const errorResponse = await response.text()
      throw new Error(`Embedding failed: ${errorResponse}`)
    }
  } catch (error) {
    throw new Error(`Error during embedding: ${error}`)
  }
}

const Home = () => {
  const {messages, setMessages, clearMessages} = useMessages()
  const {clear: clearFile} = useFile()
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelected = async (event?: ChangeEvent<HTMLInputElement>) => {
    if (!event) { 
	    return clearFile()
    }

    setIsUploading(true)

    const {files} = event.currentTarget

    if (!files?.length) {
      setIsUploading(false)
      return
    }

    for (var i = 0; i < files.length; i++) {
      await uploadFile(files[i]);
    }
    
    setIsUploading(false)
    event.target.value = ''
  }

  const {input, setInput, handleInputChange, handleSubmit, completion, isLoading} = useCompletion({
    api: `/api/ai`,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    if (!input) {
      e.preventDefault()
      return
    }
    Promise.all([handleSubmit(e)])

    setMessages('USER', input)
    setInput('')
  }

  useEffect(() => {
    if (!completion || !isLoading) return
    setMessages('AI', completion)
  }, [setMessages, completion, isLoading])

  return (
    <div className="z-10 flex h-screen flex-col gap-5 p-5">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-xl font-bold">Chat App</h1>
      </header>
      <Chat messages={messages} />
      <Separator />
      <Chat.Input
        onChange={handleInputChange}
        value={input}
        onSubmit={onSubmit}
        disabled={isLoading}
        onFileSelected={handleFileSelected}
        isUploading={isUploading}
      />
      <div
        className="flex cursor-pointer items-center gap-2 text-xs text-red-500 mr-auto"
        onClick={clearMessages}>
        <Trash className="h-4 w-4" /> Clear Chat
      </div>
    </div>
  )
}

export default Home
