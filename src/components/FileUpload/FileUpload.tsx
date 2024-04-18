import {Paperclip} from 'lucide-react'
import {ChangeEvent} from 'react'

import {cn} from '@/lib/utils'

const ALLOWED_FILE_TYPES = ['.md', '.txt']

type Props = {
  id: string
  onChange?: (event?: ChangeEvent<HTMLInputElement>) => void
  label?: string
  allowedTypes?: string[]
  className?: string
}

const FileUpload = ({id, onChange, label, allowedTypes, className}: Props) => {
  return (
    <>
      <div className={cn('flex items-center gap-2', className)}>
        <label
          htmlFor={id}
          className={cn('cursor-pointer')}>
          <Paperclip size={20} />
        </label>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'line-clamp-1 cursor-pointer'
            )}>
            {label}
          </label>
        )}
      </div>
      <input
        type="file"
        id={id}
        accept={(allowedTypes || ALLOWED_FILE_TYPES).join(',')}
        className="sr-only"
        onChange={onChange}
        multiple
      />
    </>
  )
}

export default FileUpload
