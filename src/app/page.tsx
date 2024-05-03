'use client'

import { useCompletion } from 'ai/react'
import { Trash, Bomb } from 'lucide-react'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import Chat from '@/components/Chat'
import { Separator } from '@/components/ui/separator'
import { generateSessionId, getSessionId, saveSessionId, useFile, useMessages } from '@/lib/store'
import Alert from '@mui/material/Alert';
import PurgeHistory from '@/components/PurgeHistory'

async function uploadFile(file: File) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch('/api/ai/embed', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorResponse = await response.text()
      throw new Error(`Embedding failed: ${errorResponse}`)
    }
  } catch (error) {
    throw new Error(`Error during embedding: ${error}`)
  }
}

const Home = () => {
  const { messages, setMessages, clearMessages } = useMessages()
  const { clear: clearFile } = useFile()
  const [isUploading, setIsUploading] = useState(false)
  const [filesInserted, setFilesInserted] = useState(false)
  const [purgeAlertOpen, setPurgeAlertOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');

  const handlePurgeAlertOpen = () => {
    setPurgeAlertOpen(!purgeAlertOpen);
  };

  const handlePurgeComplete = () => {
    setPurgeAlertOpen(false);
    clearMessages();
  };

  const handleFileSelected = async (event?: ChangeEvent<HTMLInputElement>) => {
    if (!event) {
      return clearFile()
    }

    setIsUploading(true)

    const { files } = event.currentTarget

    if (!files?.length) {
      setIsUploading(false)
      return
    }

    try {
      for (var i = 0; i < files.length; i++) {
        await uploadFile(files[i]);
      }

      event.target.value = ''
      setFilesInserted(true)
    } catch (error) {
      throw new Error(`${error}`)
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    let timeoutId: number;
    if (filesInserted) {
      timeoutId = window.setTimeout(() => {
        setFilesInserted(false);
      }, 5000);
    }

    return () => clearTimeout(timeoutId);
  }, [filesInserted]);

  useEffect(() => {
    let sessionId = getSessionId()
    if (!sessionId) {
      sessionId = generateSessionId()
      saveSessionId(sessionId)
    }
    setSessionId(sessionId)
  }, [sessionId])

  const { input, setInput, handleInputChange, handleSubmit, isLoading } = useCompletion({
    api: `/api/ai`,
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      sessionId: sessionId
    },
    onResponse: async (res) => {
      if (res.status !== 200) throw new Error(res.statusText)

      const data = res.body;
      if (!data) return;

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedContent = '';
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        accumulatedContent += chunkValue;
        setMessages('AI', accumulatedContent)
      }
    }
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
      <div className="flex items-center text-xs gap-5">
        <div
          className="flex cursor-pointer gap-1 text-xs text-red-500 hover:text-red-700"
          onClick={clearMessages}>
          <Trash className="h-4 w-4" /> Clear Chat
        </div>
        <div
          className="flex cursor-pointer gap-1 text-xs text-blue-500 hover:text-blue-700"
          onClick={handlePurgeAlertOpen}>
          <Bomb className="h-4 w-4" /> Purge History
        </div>
      </div>
      {filesInserted && (<Alert className="absolute right-5" severity="success" variant="filled" onClose={() => { setFilesInserted(false) }}>File(s) uploaded!</Alert>
      )}
      {purgeAlertOpen && <PurgeHistory purgeAlertOpen={purgeAlertOpen} setPurgeAlertOpen={setPurgeAlertOpen} onPurgeComplete={handlePurgeComplete} />}
    </div>
  )
}

export default Home
