import { useEffect, useRef, type ReactNode } from 'react'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
  Minus,
  Heading2,
  Heading3,
  Code2,
} from 'lucide-react'
import { adminBtnSecondary, adminLabel } from '@/admin/adminClassNames'
import { cn } from '@/lib/utils'

export type RichTextSnippet = {
  label: string
  value: string
}

type RichTextEditorProps = {
  label?: string
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
  className?: string
  snippets?: RichTextSnippet[]
}

function normalizeHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed || trimmed === '<p></p>' || trimmed === '<p><br></p>') return ''
  return html
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean
  disabled?: boolean
  onClick: () => void
  title: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md border text-[var(--admin-text)] transition-colors',
        active
          ? 'border-[var(--admin-primary)] bg-[var(--admin-primary-muted)] text-[var(--admin-primary)]'
          : 'border-transparent hover:border-[var(--admin-border)] hover:bg-[var(--admin-primary-muted)]/60',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder = 'Write your content…',
  minHeight = 180,
  className,
  snippets,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'rich-text-editor__content focus:outline-none',
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current(normalizeHtml(ed.getHTML()))
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = normalizeHtml(editor.getHTML())
    const next = normalizeHtml(value || '')
    if (current !== next) {
      editor.commands.setContent(value || '', { emitUpdate: false })
    }
  }, [editor, value])

  function setLink() {
    if (!editor) return
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL', previous ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  function insertSnippet(snippet: string) {
    if (!editor) return
    editor.chain().focus().insertContent(snippet).run()
  }

  return (
    <div className={cn('rich-text-editor space-y-2', className)}>
      {label ? <label className={adminLabel}>{label}</label> : null}

      <div className="overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-white">
        <div className="rich-text-editor__toolbar flex flex-wrap items-center gap-0.5 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-1.5">
          <ToolbarButton
            title="Bold"
            active={editor?.isActive('bold')}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            active={editor?.isActive('italic')}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Strikethrough"
            active={editor?.isActive('strike')}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-[var(--admin-border)]" />

          <ToolbarButton
            title="Heading 2"
            active={editor?.isActive('heading', { level: 2 })}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 3"
            active={editor?.isActive('heading', { level: 3 })}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-[var(--admin-border)]" />

          <ToolbarButton
            title="Bullet list"
            active={editor?.isActive('bulletList')}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            active={editor?.isActive('orderedList')}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Blockquote"
            active={editor?.isActive('blockquote')}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Horizontal rule" disabled={!editor} onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
            <Minus className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Link" active={editor?.isActive('link')} disabled={!editor} onClick={setLink}>
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Inline code" active={editor?.isActive('code')} disabled={!editor} onClick={() => editor?.chain().focus().toggleCode().run()}>
            <Code2 className="h-4 w-4" />
          </ToolbarButton>

          <span className="mx-1 h-5 w-px bg-[var(--admin-border)]" />

          <ToolbarButton title="Undo" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}>
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Redo" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}>
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="px-3 py-2">
          <EditorContent editor={editor} />
        </div>
      </div>

      {snippets && snippets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-[var(--admin-muted)]">Insert variable:</span>
          {snippets.map((snippet) => (
            <button
              key={snippet.value}
              type="button"
              className={cn(adminBtnSecondary, 'h-7 px-2 text-xs')}
              onClick={() => insertSnippet(snippet.value)}
            >
              {snippet.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
